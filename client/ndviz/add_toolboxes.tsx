import {Viewer} from 'neuroglancer/viewer';
import {ToolboxMenu} from 'ndviz/ui/toolbox';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

require('./add_toolboxes.css');

export function addToolboxes(viewer: Viewer) {
    let visualizer: Object = {}; 
    let viewerState: Object = {};
    let container = document.getElementById('toolbox')!;
    ReactDOM.render(
        <ToolboxMenu visualizer={visualizer} />,
        container
    );

    console.log(viewer.dataDisplayLayout.rootElement); 
}