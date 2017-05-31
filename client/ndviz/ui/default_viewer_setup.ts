import {makeDefaultKeyBindings} from 'neuroglancer/default_key_bindings';
import {makeDefaultViewer} from 'ndviz/default_viewer';
import {bindDefaultCopyHandler, bindDefaultPasteHandler} from 'neuroglancer/ui/default_clipboard_handling';
import {UrlHashBinding, parseHashFromQueryString} from 'neuroglancer/ui/url_hash_binding';

export function setupDefaultViewer() {
    let viewer = (<any>window)['viewer'] = makeDefaultViewer(); 
    makeDefaultKeyBindings(viewer.keyMap);

    parseHashFromQueryString();

    const hashBinding = new UrlHashBinding(viewer.state);
    hashBinding.updateFromUrlHash();

    bindDefaultCopyHandler(viewer);
    bindDefaultPasteHandler(viewer);

    return viewer; 
}