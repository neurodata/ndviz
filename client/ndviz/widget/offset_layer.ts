import {TrackableValue} from 'neuroglancer/trackable_value';
import {RefCounted} from 'neuroglancer/util/disposable';
import {ImageUserLayer} from 'ndviz/image_user_layer';
import {removeFromParent} from 'neuroglancer/util/dom';

import {RangeWidget} from 'neuroglancer/widget/range';
import {ColorPickerWidget} from 'ndviz/widget/color_widget';

require('./offset_layer.css');

export class OffsetLayerWidget extends RefCounted {
    element = document.createElement('div');

    opacityWidget = this.registerDisposer(new RangeWidget(this.layer.secondaryOpacity));
    colorWidget = this.registerDisposer(new ColorPickerWidget(this.layer.secondaryColor));

    constructor(public layer: ImageUserLayer) {
        super(); 

        let {element, colorWidget, opacityWidget} = this; 
        element.className = 'offset-layer-container';
        
        opacityWidget.promptElement.textContent = 'Opacity';
        element.appendChild(opacityWidget.element);

        let lineBreak = document.createElement('br');
        element.appendChild(lineBreak);
        element.appendChild(colorWidget.element);
        
        // Start hidden 
        this.hide();
    }

    toggle() {
        if (this.layer.secondaryLayerEnabled.value === true) {
            // hide and remove layer 
            this.hide();
            this.layer.secondaryLayerEnabled.value = false; 
        } else {
            // show and add layer 
            this.show();
            this.layer.secondaryLayerEnabled.value = true; 
        }
    }

    show() { this.element.setAttribute('style', 'display: flex;'); }

    hide() { this.element.setAttribute('style', 'display: none;'); }

    disposed() {
        removeFromParent(this.element);
        super.disposed();
    }
}