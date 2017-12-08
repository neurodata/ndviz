import { SegmentationUserLayer as NeuroglancerSegmentationUserLayer } from "neuroglancer/segmentation_user_layer";
import {VolumeType} from 'neuroglancer/sliceview/volume/base';
import {LayerListSpecification, registerLayerType, registerVolumeLayerType} from 'ndviz/layer_specification';

export class SegmentationUserLayer extends NeuroglancerSegmentationUserLayer {
    constructor(manager: LayerListSpecification, x: any) {
        super(manager, x);
    }
}

registerLayerType('segmentation', SegmentationUserLayer)
registerVolumeLayerType(VolumeType.SEGMENTATION, SegmentationUserLayer);