import { registerLayerType, LayerListSpecification } from "ndviz/layer_specification";
import {AnnotationPointListUserLayer as NeuroglancerAnnotationPointListUserLayer} from 'neuroglancer/annotation/user_layer';

export class AnnotationPointListUserLayer extends NeuroglancerAnnotationPointListUserLayer {
    constructor(manager: LayerListSpecification, x: any) {
        super(manager, x);
    }
}

registerLayerType('pointAnnotation', AnnotationPointListUserLayer);