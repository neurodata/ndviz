import { registerLayerType } from "neuroglancer/layer_specification";
import { VectorGraphicsUserLayer as NeuroglancerVectorGraphicsUserLayer } from "neuroglancer/vector_graphics_user_layer";
import { LayerListSpecification } from "ndviz/layer_specification";

class VectorGraphicsUserLayer extends NeuroglancerVectorGraphicsUserLayer {
    constructor(manager: LayerListSpecification, x: any) {
        super(manager, x);
    }
}

registerLayerType('line', VectorGraphicsUserLayer);