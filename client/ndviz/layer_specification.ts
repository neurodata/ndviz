import {TopLevelLayerListSpecification as NeuroglancerTopLevelLayerListSpecification, LayerListSpecification as NeuroglancerLayerListSpecification, ManagedUserLayerWithSpecification, getVolumeWithStatusMessage} from 'neuroglancer/layer_specification';
import {DataSourceProvider} from 'neuroglancer/datasource';
import {ChunkManager} from 'neuroglancer/chunk_manager/frontend';
import {VolumeType} from 'neuroglancer/sliceview/volume/base';
import {LayerManager, LayerSelectedValues, UserLayer} from 'neuroglancer/layer';
import {VoxelSize} from 'neuroglancer/navigation_state';
import { TrackableBlendModeValue } from 'neuroglancer/trackable_blend';
import {verifyObject, verifyObjectProperty, verifyOptionalString} from 'neuroglancer/util/json';

export interface LayerListSpecification extends NeuroglancerLayerListSpecification {
    globalBlendMode: TrackableBlendModeValue;
}

export class TopLevelLayerListSpecification extends NeuroglancerTopLevelLayerListSpecification implements LayerListSpecification {
    constructor(dataSourceProvider: DataSourceProvider, layerManager: LayerManager,
        chunkManager: ChunkManager, layerSelectedValues: LayerSelectedValues,
        voxelSize: VoxelSize, public globalBlendMode: TrackableBlendModeValue) {
            super(dataSourceProvider, layerManager, chunkManager, layerSelectedValues, voxelSize);
            // this.registerDisposer(globalBlendMode.changed.add(this.changed.dispatch));            
    }

    // Override this method to read the new volumeLayerTypes from ndviz
    initializeLayerFromSpec(managedLayer: ManagedUserLayerWithSpecification, spec: any) {
        managedLayer.initialSpecification = spec;
        if (typeof spec === 'string') {
          spec = {'source': spec};
        }
        verifyObject(spec);
        let layerType = verifyObjectProperty(spec, 'type', verifyOptionalString);
        managedLayer.visible = verifyObjectProperty(spec, 'visible', x => {
          if (x === undefined || x === true) {
            return true;
          }
          if (x === false) {
            return false;
          }
          throw new Error(`Expected boolean, but received: ${JSON.stringify(x)}.`);
        });
        let sourceUrl = managedLayer.sourceUrl =
            verifyObjectProperty(spec, 'source', verifyOptionalString);
        if (layerType === undefined) {
          if (sourceUrl === undefined) {
            throw new Error(`Either layer 'type' or 'source' URL must be specified.`);
          }
          let volumeSourcePromise =
              getVolumeWithStatusMessage(this.dataSourceProvider, this.chunkManager, sourceUrl);
          volumeSourcePromise.then(source => {
            if (this.layerManager.managedLayers.indexOf(managedLayer) === -1) {
              // Layer was removed before promise became ready.
              return;
            }
            let layerConstructor = volumeLayerTypes.get(source.volumeType);
            if (layerConstructor !== undefined) {
              managedLayer.layer = new layerConstructor(this, spec);
            } else {
              throw new Error(`Unsupported volume type: ${VolumeType[source.volumeType]}.`);
            }
          });
        } else {
          let layerConstructor = layerTypes.get(layerType);
          if (layerConstructor !== undefined) {
            managedLayer.layer = new layerConstructor(this, spec);
          } else {
            throw new Error(`Unsupported layer type: ${JSON.stringify(layerType)}.`);
          }
        }
    }

}

interface UserLayerConstructor {
    new(manager: LayerListSpecification, x: any): UserLayer;
  }
  
  const layerTypes = new Map<string, UserLayerConstructor>();
  const volumeLayerTypes = new Map<VolumeType, UserLayerConstructor>();
  
  export function registerLayerType(name: string, layerConstructor: UserLayerConstructor) {
    layerTypes.set(name, layerConstructor);
  }
  
  export function registerVolumeLayerType(
      volumeType: VolumeType, layerConstructor: UserLayerConstructor) {
    volumeLayerTypes.set(volumeType, layerConstructor);
  }