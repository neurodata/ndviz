import { SegmentationUserLayer as NeuroglancerSegmentationUserLayer } from "neuroglancer/segmentation_user_layer";
import {VolumeType} from 'neuroglancer/sliceview/volume/base';
import {LayerListSpecification, registerLayerType, registerVolumeLayerType} from 'ndviz/layer_specification';
import { PickState } from 'neuroglancer/layer';
import { AraAtlas } from 'ndviz/ara_atlas';

export class SegmentationUserLayer extends NeuroglancerSegmentationUserLayer {

    /**
     * Atlas to use for id lookup.
     */
  atlas: AraAtlas|null|undefined = null;


    constructor(manager: LayerListSpecification, x: any) {
        super(manager, x);

        this.atlas = new AraAtlas();
    }


  /* Kludge to catch changes to the voxel state (e.g., mouse movement).
   * A better solution would tap directly into LayerSelectedValues.values and update on render only.
   */
  ontfield: HTMLElement | null = document.getElementById('onttext');
  oldvalue: any|null|undefined;
  getValueAt(position: Float32Array, pickState: PickState) {
    let newvalue = super.getValueAt(position, pickState);
    if (newvalue !== null && (+newvalue !== +this.oldvalue)) {
      console.log('I got a new value! ' + newvalue + ' vs ' + this.oldvalue);
      if (! (typeof this.atlas === 'undefined' || this.atlas === null) && (this.ontfield != null)) {
                this.ontfield.innerHTML = '' + this.atlas.getNameForId(+newvalue.toString());
      }
    }
    this.oldvalue = newvalue;
    return newvalue;
  }

}

registerLayerType('segmentation', SegmentationUserLayer)
registerVolumeLayerType(VolumeType.SEGMENTATION, SegmentationUserLayer);