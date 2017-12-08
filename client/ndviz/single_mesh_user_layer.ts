import { SingleMeshUserLayer as NeuroglancerSingleMeshUserLayer } from 'neuroglancer/single_mesh_user_layer';
import { registerLayerType, LayerListSpecification } from "ndviz/layer_specification";

export class SingleMeshUserLayer extends NeuroglancerSingleMeshUserLayer {
    constructor(manager: LayerListSpecification, x: any) {
        super(manager, x);
    }
}

registerLayerType('mesh', SingleMeshUserLayer);