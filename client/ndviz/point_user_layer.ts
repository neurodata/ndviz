import {CoordinateTransform} from 'neuroglancer/coordinate_transform';
import {UserLayer, UserLayerDropdown} from 'neuroglancer/layer';
import {LayerListSpecification, registerLayerType, registerVolumeLayerType} from 'neuroglancer/layer_specification';
import {getVolumeWithStatusMessage} from 'neuroglancer/layer_specification';
import {Overlay} from 'neuroglancer/overlay';
import {trackableAlphaValue} from 'neuroglancer/trackable_alpha';
import {vec3, mat4, identityMat4} from 'neuroglancer/util/geom';
import {makeWatchableShaderError} from 'neuroglancer/webgl/dynamic_shader';
import {RangeWidget} from 'neuroglancer/widget/range';
import {ShaderCodeWidget} from 'neuroglancer/widget/shader_code_widget';
import {PointRenderLayer} from 'ndviz/sliceview/point_renderlayer';
import {verifyOptionalString} from 'neuroglancer/util/json';
import {trackableColorValue, COLOR_CODES} from 'ndviz/trackable_color';
import {getPointsWithStatusMessage} from 'neuroglancer/point_user_layer';
import {ColorPickerWidget} from 'ndviz/widget/color_widget';


export class PointUserLayer extends UserLayer {
    pointsPath: string|undefined; 
    opacity = trackableAlphaValue();
    color = trackableColorValue();

    renderLayer: PointRenderLayer; 

    constructor(manager: LayerListSpecification, x: any) {
        super();

        let pointPath = x['point'];
        
        this.opacity.restoreState(x['opacity']);
        this.color.restoreState(COLOR_CODES[x['color']]);


        let pointsPath = this.pointsPath = verifyOptionalString(x['point']);
        if (pointsPath !== undefined) {
            getPointsWithStatusMessage(manager.chunkManager, pointsPath).then(points => {
                if (!this.wasDisposed) {
                    let renderLayer = this.renderLayer =
                        new PointRenderLayer(points, {opacity: this.opacity, color: this.color, sourceOptions: {}});
                    this.addRenderLayer(renderLayer);
                }
            });
        }
    
        this.registerDisposer(
        this.opacity.changed.add(() => { this.layersChanged.dispatch() }));
        this.registerDisposer(
        this.color.changed.add(() => { this.layersChanged.dispatch() }));
    }

    toJSON() {
        let x: any = {'type': 'point'};
        x['point'] = this.pointsPath;
        x['opacity'] = this.opacity.toJSON();
        x['color'] = this.color.toJSON();
        return x;
    }

    makeDropdown(element: HTMLDivElement) { return new PointDropdown(element, this); }
}

class PointDropdown extends UserLayerDropdown {
    opacityWidget = this.registerDisposer(new RangeWidget(this.layer.opacity));
    colorWidget = this.registerDisposer(new ColorPickerWidget(this.layer.color));

    constructor(public element: HTMLDivElement, public layer: PointUserLayer) {
        super();
            element.classList.add('image-dropdown');
            let {opacityWidget} = this;
            let topRow = document.createElement('div');
            topRow.className = 'image-dropdown-top-row';
            opacityWidget.promptElement.textContent = 'Opacity';   
        
            let spacer = document.createElement('div');
            spacer.style.flex = '1';
            let helpLink = document.createElement('a');
            let helpButton = document.createElement('button');
            helpButton.type = 'button';
            helpButton.textContent = '?';
            helpButton.className = 'help-link';
            helpLink.appendChild(helpButton);
            helpLink.title = 'Documentation on point layer rendering';
            helpLink.target = '_blank';
            helpLink.href =
                '#';


            topRow.appendChild(helpLink);

            element.appendChild(topRow);
            element.appendChild(this.opacityWidget.element);

            element.appendChild(this.colorWidget.element); 
    }
};

registerLayerType('point', PointUserLayer);
