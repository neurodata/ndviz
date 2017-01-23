import * as Neuroglancer from 'neuroglancer/viewer'; 
import {DisplayContext} from 'neuroglancer/display_context';
import {TrackableValue} from 'neuroglancer/trackable_value';
import {LAYOUTS} from 'neuroglancer/viewer_layouts';
import {registerTrackable, unregisterTrackable} from 'neuroglancer/url_hash_state';


export class Viewer extends Neuroglancer.Viewer {
    // Make the xy layout default 
    layoutName = new TrackableValue<string>(LAYOUTS[2][0], Neuroglancer.validateLayoutName);
    
    constructor(public display: DisplayContext) {
        super(display);

        // Unregister existing layout and register new layout 
        unregisterTrackable('layout');
        registerTrackable('layout', this.layoutName);
        this.layoutName.changed.add(() => {
            if (this.dataDisplayLayout !== undefined) {
                let element = this.dataDisplayLayout.rootElement;
                this.dataDisplayLayout.dispose();
                this.createDataDisplayLayout(element);
            }
        });
    }

    toggleLayout() {
        let existingLayout = Neuroglancer.getLayoutByName(this.layoutName.value);
        let layoutIndex = LAYOUTS.indexOf(existingLayout);
        let newLayout = LAYOUTS[(layoutIndex + 1) % LAYOUTS.length];
        this.layoutName.value = newLayout[0];
    }
}