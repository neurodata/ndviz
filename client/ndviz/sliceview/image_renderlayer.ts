import * as NeuroglancerImageRenderLayer from 'neuroglancer/sliceview/volume/image_renderlayer';

import {TrackableAlphaValue, trackableAlphaValue} from 'neuroglancer/trackable_alpha';
import {trackableMinValue, trackableMaxValue, TrackableThresholdValue} from 'ndviz/trackable_threshold';
import {MultiscaleVolumeChunkSource} from 'neuroglancer/sliceview/volume/frontend';
import {SliceView} from 'neuroglancer/sliceview/frontend';
import {VolumeSourceOptions} from 'neuroglancer/sliceview/volume/base';
import {makeTrackableFragmentMain, makeWatchableShaderError, TrackableFragmentMain} from 'neuroglancer/webgl/dynamic_shader';
import {ShaderBuilder} from 'neuroglancer/webgl/shader';
import {vec3} from 'neuroglancer/util/geom';

import {TrackableColorValue, trackableColorValue, COLOR_CODES, COLOR_VECTORS} from 'ndviz/trackable_color.ts';

const DEFAULT_FRAGMENT_MAIN = `void main() {
  emitThresholdColorRGB(
    vec3(
    toNormalized(getDataValue(0)),
    toNormalized(getDataValue(1)),
    toNormalized(getDataValue(2))
      )
   );
 }
`

const glsl_COLORMAPS = require<string>('neuroglancer/webgl/colormaps.glsl');

export function getTrackableFragmentMain(value = DEFAULT_FRAGMENT_MAIN) {
  return makeTrackableFragmentMain(value);
}

export class ImageRenderLayer extends NeuroglancerImageRenderLayer.ImageRenderLayer {
    color: TrackableColorValue;
    min: TrackableThresholdValue;
    max: TrackableThresholdValue;
    constructor(multiscaleSource: MultiscaleVolumeChunkSource, {
        opacity = trackableAlphaValue(0.5),
        color = trackableColorValue(COLOR_CODES.NONE),
        min = trackableMinValue(0.),
        max = trackableMaxValue(1.),
        fragmentMain = getTrackableFragmentMain(),
        shaderError = makeWatchableShaderError(),
        sourceOptions = <VolumeSourceOptions>{},
    } = {}) {
        super(multiscaleSource, {shaderError, sourceOptions});
        this.fragmentMain = fragmentMain;
        this.opacity = opacity;
        this.color = color;
        this.min = min;
        this.max = max;
        this.registerDisposer(opacity.changed.add(() => { this.redrawNeeded.dispatch(); }));
        this.registerDisposer(color.changed.add(() => { 
            this.redrawNeeded.dispatch(); 
        }));
        this.registerDisposer(min.changed.add(() => { this.redrawNeeded.dispatch(); }));
        this.registerDisposer(max.changed.add(() => { this.redrawNeeded.dispatch(); }));
        this.registerDisposer(fragmentMain.changed.add(() => {
            this.shaderUpdated = true;
            this.redrawNeeded.dispatch();
        }));
    }

    defineShader(builder: ShaderBuilder) {
        super.defineShader(builder); 

        builder.addUniform('highp float', 'uMin');
        builder.addUniform('highp float', 'uMax');
        builder.addUniform('vec3', 'uColor');
        
        builder.addFragmentCode(`
void emitThresholdRGB(vec3 rgb) {  
    emit(
        vec4(
            min( max( (rgb.r - uMin) / uMax, 0.0) , 1.0 ),
            min( max( (rgb.g - uMin) / uMax, 0.0) , 1.0 ),
            min( max( (rgb.b - uMin) / uMax, 0.0) , 1.0 ),
            uOpacity
        )
    );
}
void emitThresholdColorRGB(vec3 rgb) {  
    rgb = rgb * uColor; 
    emit(
        vec4(
            min( max( (rgb.r - uMin) / uMax, 0.0) , 1.0 ),
            min( max( (rgb.g - uMin) / uMax, 0.0) , 1.0 ),
            min( max( (rgb.b - uMin) / uMax, 0.0) , 1.0 ),
            uOpacity
        )
    );
}
        `);
        
        builder.setFragmentMainFunction(NeuroglancerImageRenderLayer.FRAGMENT_MAIN_START + '\n' + this.fragmentMain.value);
    }

    beginSlice(sliceView: SliceView) {
        let shader = super.beginSlice(sliceView);
        let {gl} = this;
        gl.uniform1f(shader.uniform('uOpacity'), this.opacity.value);
        gl.uniform1f(shader.uniform('uMin'), this.min.value);
        gl.uniform1f(shader.uniform('uMax'), this.max.value);
        gl.uniform3f(shader.uniform('uColor'), COLOR_VECTORS.get(this.color.value)![0], COLOR_VECTORS.get(this.color.value)![1], COLOR_VECTORS.get(this.color.value)![2]);
        return shader;
    }
}
