import * as Neuroglancer from 'neuroglancer/viewer'; 
import {DisplayContext} from 'neuroglancer/display_context';
import {LAYOUTS} from 'neuroglancer/viewer_layouts'; 
import {TrackableValue} from 'neuroglancer/trackable_value';

export class Viewer extends Neuroglancer.Viewer {

  constructor(public display: DisplayContext) {
    super(display); 

    this.layoutName.defaultValue = LAYOUTS[2][0];
  }
}