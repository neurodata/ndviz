import {RefCounted} from 'neuroglancer/util/disposable';
import {TrackableBlendModeValue} from 'neuroglancer/trackable_blend';

type ItemElement = HTMLButtonElement;

export class BlendModeWidget extends RefCounted {
    element = document.createElement('div');
    promptElement = document.createElement('span');    
    private itemContainer = document.createElement('span');

    constructor(public blendValue: TrackableBlendModeValue) {
        super();

        let {element, promptElement, itemContainer} = this;
        element.className = 'segment-set-widget neuroglancer-noselect';
        promptElement.className = 'range-prompt';
        element.appendChild(promptElement);
        itemContainer.className = 'item-container';
        element.appendChild(itemContainer);

        this.addElement('default', "default");
        this.addElement('additive', "additive");
    }

    private addElement(s: string, b: string) {
        let itemElement = document.createElement('button');
        itemElement.className = 'segment-button';
        itemElement.textContent = s;
        itemElement.title = `Set blend mode to ${s}`;
        let widget = this;

        itemElement.addEventListener('click', function(this: ItemElement) {
            widget.blendValue.value = b;
            console.log(widget.blendValue);
        });

        this.itemContainer.appendChild(itemElement);
    }

}