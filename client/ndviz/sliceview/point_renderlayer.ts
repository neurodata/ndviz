import * as NeuroglancerPointRenderLayer from 'neuroglancer/point/point_renderlayer';

import {PointSourceOptions} from 'neuroglancer/point/base';
import {MultiscalePointChunkSource} from 'neuroglancer/point/frontend';
import {RenderLayer} from 'neuroglancer/point/frontend';
import {SliceView} from 'neuroglancer/sliceview/frontend';
import {TrackableAlphaValue, trackableAlphaValue} from 'neuroglancer/trackable_alpha';
import {TrackableIntValue, trackableIntValue} from 'ndviz/trackable_int';
import {TrackableColorValue, trackableColorValue, COLOR_CODES, COLOR_VECTORS} from 'ndviz/trackable_color.ts';
import {vec3} from 'neuroglancer/util/geom';
import {makeTrackableFragmentMain, makeWatchableShaderError, TrackableFragmentMain} from 'neuroglancer/webgl/dynamic_shader';
import {ShaderBuilder} from 'neuroglancer/webgl/shader';

const glsl_COLORMAPS = require<string>('neuroglancer/webgl/colormaps.glsl');

export class PointRenderLayer extends NeuroglancerPointRenderLayer.PointRenderLayer {
  opacity: TrackableAlphaValue;
  color: TrackableColorValue;
  lineWidth: TrackableIntValue;
  constructor(multiscaleSource: MultiscalePointChunkSource, {
    opacity = trackableAlphaValue(1.0),
    color = trackableColorValue(COLOR_CODES.NONE),
    lineWidth = trackableIntValue(1.0),
    shaderError = makeWatchableShaderError(),
    sourceOptions = <PointSourceOptions>{},
  } = {}) {
    super(multiscaleSource, {opacity, shaderError, sourceOptions});
    
    this.color = color;
    this.registerDisposer(color.changed.add(() => { 
        this.redrawNeeded.dispatch(); 
    }));
    this.lineWidth = lineWidth;
    this.registerDisposer(lineWidth.changed.add(() => { 
        this.redrawNeeded.dispatch(); 
    }));

  }

  defineShader(builder: ShaderBuilder) {
    super.defineShader(builder);
  }

  beginSlice(sliceView: SliceView) {
    let shader = super.beginSlice(sliceView);
    let {gl} = this;
    gl.uniform1f(shader.uniform('uOpacity'), this.opacity.value);
    gl.uniform3f(
        shader.uniform('uColor'), COLOR_VECTORS.get(this.color.value)![0], COLOR_VECTORS.get(this.color.value)![1], COLOR_VECTORS.get(this.color.value)![2]);
    gl.uniform1f(shader.uniform('uLineWidth'), this.lineWidth.value);
    return shader;
  }
};
