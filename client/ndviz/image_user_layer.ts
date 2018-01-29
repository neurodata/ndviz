/**
 * @license
 * Copyright 2016 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {CoordinateTransform} from 'neuroglancer/coordinate_transform';
import {DataSourceProvider} from 'neuroglancer/datasource';
import {UserLayer, UserLayerDropdown} from 'neuroglancer/layer';
import {getVolumeWithStatusMessage} from 'neuroglancer/layer_specification';
import {Overlay} from 'neuroglancer/overlay';
import {VolumeType} from 'neuroglancer/sliceview/volume/base';
import {FRAGMENT_MAIN_START} from 'neuroglancer/sliceview/volume/image_renderlayer';
import {trackableAlphaValue} from 'neuroglancer/trackable_alpha';
import {vec3, mat4} from 'neuroglancer/util/geom';
import {makeWatchableShaderError} from 'neuroglancer/webgl/dynamic_shader';
import {RangeWidget} from 'neuroglancer/widget/range';
import {ShaderCodeWidget} from 'neuroglancer/widget/shader_code_widget';
import {trackableBlendModeValue, TrackableBlendModeValue} from 'neuroglancer/trackable_blend';

import {trackableColorValue, COLOR_CODES} from 'ndviz/trackable_color';
import {trackableMinValue, trackableMaxValue} from 'ndviz/trackable_threshold';
import {trackableBooleanValue} from 'ndviz/trackable_boolean';
import {trackableOffsetValue} from 'ndviz/trackable_offset';
import {ImageRenderLayer, getTrackableFragmentMain} from 'ndviz/sliceview/volume/image_renderlayer';
import {ColorPickerWidget} from 'ndviz/widget/color_widget';
import {BlendModeWidget} from 'ndviz/widget/blend_mode_widget';
import {OffsetLayerWidget} from 'ndviz/widget/offset_layer';
import {LayerListSpecification, registerLayerType, registerVolumeLayerType} from 'ndviz/layer_specification';

require('neuroglancer/image_user_layer.css');
require('neuroglancer/maximize_button.css');

export class ImageUserLayer extends UserLayer {
  volumePath: string;
  opacity = trackableAlphaValue(1.0);
  blendMode: TrackableBlendModeValue;
  color = trackableColorValue(); 
  min = trackableMinValue();
  max = trackableMaxValue();

  secondaryOpacity = trackableAlphaValue(0.5);
  secondaryColor = trackableColorValue();
  secondaryOffset = trackableOffsetValue(1);
  secondaryLayerEnabled = trackableBooleanValue(false);

  fragmentMain = getTrackableFragmentMain();
  shaderError = makeWatchableShaderError();
  renderLayer: ImageRenderLayer;
  secondaryLayer: ImageRenderLayer; 
  transform = new CoordinateTransform();

  // Needed for adding secondary layer
  dataSourceProvider: DataSourceProvider;

  constructor(manager: LayerListSpecification, x: any) {
    super();
    let volumePath = x['source'];
    if (typeof volumePath !== 'string') {
      throw new Error('Invalid image layer specification');
    }

    this.blendMode = trackableBlendModeValue(manager.globalBlendMode.value);  

    this.opacity.restoreState(x['opacity']);
    this.blendMode.restoreState(x['blend']);              
    this.color.restoreState(COLOR_CODES[x['color']]);
    this.min.restoreState(x['min']);
    this.max.restoreState(x['max']);
    this.fragmentMain.restoreState(x['shader']);
    this.transform.restoreState(x['transform']);
    this.registerDisposer(
        this.fragmentMain.changed.add(() => { this.specificationChanged.dispatch(); }));
    this.volumePath = volumePath;
    this.dataSourceProvider = manager.dataSourceProvider;
    getVolumeWithStatusMessage(this.dataSourceProvider, manager.chunkManager, volumePath).then(volume => {
      if (!this.wasDisposed) {
        let renderLayer = this.renderLayer = new ImageRenderLayer(volume, {
          opacity: this.opacity,
          color: this.color,
          blendMode: this.blendMode,
          min: this.min,
          max: this.max,
          fragmentMain: this.fragmentMain,
          shaderError: this.shaderError,
          sourceOptions: {transform: mat4.clone(this.transform.transform)},
        });
        this.addRenderLayer(renderLayer);
        this.shaderError.changed.dispatch();
      }
    });

    this.registerDisposer(
      this.secondaryLayerEnabled.changed.add(() => {
        if (this.secondaryLayerEnabled.value === true) this.addSecondaryLayer();
        else                                           this.removeSecondaryLayer();
    }));

    this.registerDisposer(
      this.opacity.changed.add(() => { this.layersChanged.dispatch() }));
    this.registerDisposer(
      this.color.changed.add(() => { this.layersChanged.dispatch() }));
    this.registerDisposer(
      this.blendMode.changed.add(() => { this.layersChanged.dispatch() }));
    this.registerDisposer(
      this.min.changed.add(() => { this.layersChanged.dispatch() }));
    this.registerDisposer(
      this.max.changed.add(() => { this.layersChanged.dispatch() }));  

  }

  toJSON() {
    let x: any = {'type': 'image'};
    x['source'] = this.volumePath;
    x['opacity'] = this.opacity.toJSON();
    x['blend'] = this.blendMode.toJSON();    
    x['color'] = this.color.toJSON();
    x['min'] = this.min.toJSON();
    x['max'] = this.max.toJSON();
    x['shader'] = this.fragmentMain.toJSON();
    x['transform'] = this.transform.toJSON();
    return x;
  }
  makeDropdown(element: HTMLDivElement) { return new ImageDropdown(element, this); }

  addSecondaryLayer() {
    let localTransform = mat4.clone(this.transform.transform); 
    let translationVector = vec3.fromValues(0, 0, -this.secondaryOffset.value); 
    mat4.translate(localTransform, localTransform, translationVector);

    getVolumeWithStatusMessage(this.dataSourceProvider, this.renderLayer.chunkManager, this.volumePath).then(volume => {
      let secondaryLayer = this.secondaryLayer = new ImageRenderLayer(volume, {
        opacity: this.secondaryOpacity, 
        color: this.secondaryColor,
        min: this.min,
        max: this.max,
        fragmentMain: this.fragmentMain,
        shaderError: this.shaderError,
        sourceOptions: {transform: mat4.clone(localTransform)},
      });
      this.addRenderLayer(secondaryLayer);
      this.shaderError.changed.dispatch();
    });
  }

  removeSecondaryLayer() {
    this.renderLayers.map((value, index) => {
      if (value === this.secondaryLayer) {
        this.renderLayers.splice(index, 1);
      }});
    this.secondaryLayer.dispose();
    this.layersChanged.dispatch();
  }
}

function makeShaderCodeWidget(layer: ImageUserLayer) {
  return new ShaderCodeWidget({
    shaderError: layer.shaderError,
    fragmentMain: layer.fragmentMain,
    fragmentMainStartLine: FRAGMENT_MAIN_START,
  });
}

class ImageDropdown extends UserLayerDropdown {
  opacityWidget = this.registerDisposer(new RangeWidget(this.layer.opacity));
  minWidget = this.registerDisposer(new RangeWidget(this.layer.min));
  maxWidget = this.registerDisposer(new RangeWidget(this.layer.max));
  colorWidget = this.registerDisposer(new ColorPickerWidget(this.layer.color));
  blendWidget = this.registerDisposer(new BlendModeWidget(this.layer.blendMode))
  offsetLayerWidget = this.registerDisposer(new OffsetLayerWidget(this.layer));
  offsetSliderWidget = this.registerDisposer(new RangeWidget(this.layer.secondaryOffset, {min: 0, max: 25, step: 1}));


  codeWidget = this.registerDisposer(makeShaderCodeWidget(this.layer));
  constructor(public element: HTMLDivElement, public layer: ImageUserLayer) {
    super();
    element.classList.add('image-dropdown');
    let {opacityWidget, blendWidget, minWidget, maxWidget, offsetLayerWidget, offsetSliderWidget} = this;
    let topRow = document.createElement('div');
    topRow.className = 'image-dropdown-top-row';
    opacityWidget.promptElement.textContent = 'Opacity';  
    blendWidget.promptElement.textContent = 'Blend Mode'; 
    minWidget.promptElement.textContent = 'Min';
    maxWidget.promptElement.textContent = 'Max';
  
    // Add an offset layer 
    offsetSliderWidget.promptElement.textContent = `Z Offset Value: ${this.layer.secondaryOffset.value}`;
    this.layer.secondaryOffset.changed.add(() => {
      offsetSliderWidget.promptElement.textContent = `Z Offset Value: ${this.layer.secondaryOffset.value}`;
    });
    this.layer.secondaryLayerEnabled.changed.add(() => {
      if (this.layer.secondaryLayerEnabled.value === true) offsetSliderWidget.inputElement.disabled = true; 
      else                                                 offsetSliderWidget.inputElement.disabled = false;
    });

    let offsetLayerToggle = document.createElement('button');
    offsetLayerToggle.textContent = 'Offset Layer Toggle';
    offsetLayerToggle.className = 'offset-button';
    offsetLayerToggle.title = 'Add/remove a duplicate layer offset by a set distance in z.'
    this.registerEventListener(
      offsetLayerToggle, 'click', () => { 
        offsetLayerWidget.toggle(); 
      });

    let spacer = document.createElement('div');
    spacer.style.flex = '1';
    let helpLink = document.createElement('a');
    let helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.textContent = '?';
    helpButton.className = 'help-link';
    helpLink.appendChild(helpButton);
    helpLink.title = 'Documentation on image layer rendering';
    helpLink.target = '_blank';
    helpLink.href =
        'https://github.com/google/neuroglancer/blob/master/src/neuroglancer/sliceview/image_layer_rendering.md';

    let maximizeButton = document.createElement('button');
    maximizeButton.innerHTML = '&square;';
    maximizeButton.className = 'maximize-button';
    maximizeButton.title = 'Show larger editor view';
    this.registerEventListener(
        maximizeButton, 'click', () => { new ShaderCodeOverlay(this.layer); });

    topRow.appendChild(maximizeButton);
    topRow.appendChild(helpLink);

    element.appendChild(topRow);
    element.appendChild(this.opacityWidget.element);

    element.appendChild(this.minWidget.element);
    element.appendChild(this.maxWidget.element);

    element.appendChild(this.colorWidget.element); 
    element.appendChild(this.blendWidget.element);

    element.appendChild(offsetSliderWidget.element);
    element.appendChild(offsetLayerToggle); 
    element.appendChild(this.offsetLayerWidget.element);

    element.appendChild(this.codeWidget.element);
    this.codeWidget.textEditor.refresh();
  }

  onShow() { this.codeWidget.textEditor.refresh(); }
};

class ShaderCodeOverlay extends Overlay {
  codeWidget = this.registerDisposer(makeShaderCodeWidget(this.layer));
  constructor(public layer: ImageUserLayer) {
    super();
    this.content.classList.add('image-layer-shader-overlay');
    this.content.appendChild(this.codeWidget.element);
    this.codeWidget.textEditor.refresh();
  }
}

registerLayerType('image', ImageUserLayer);
registerVolumeLayerType(VolumeType.IMAGE, ImageUserLayer);
