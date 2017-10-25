import {makeDefaultViewer} from 'ndviz/ui/default_viewer';
import {bindDefaultCopyHandler, bindDefaultPasteHandler} from 'neuroglancer/ui/default_clipboard_handling';
import {setDefaultInputEventBindings} from 'neuroglancer/ui/default_input_event_bindings';
import {UrlHashBinding, parseHashFromQueryString} from 'neuroglancer/ui/url_hash_binding';

export function setupDefaultViewer() {
    let viewer = (<any>window)['viewer'] = makeDefaultViewer(); 
    setDefaultInputEventBindings(viewer.inputEventBindings);
    
    parseHashFromQueryString();

    const hashBinding = new UrlHashBinding(viewer.state);
    hashBinding.updateFromUrlHash();

    bindDefaultCopyHandler(viewer);
    bindDefaultPasteHandler(viewer);

    return viewer; 
}