import {RefCounted} from 'neuroglancer/util/disposable';
import {COLOR_CODES, TrackableColorValue} from 'ndviz/trackable_color';

type ItemElement = HTMLButtonElement; 

export class ColorPickerWidget extends RefCounted {
    element = document.createElement('div');
    private clearButton = document.createElement('button');
    private itemContainer = document.createElement('span');
    // private items = new Map<string, ItemElement>(); 

    constructor(public colorValue: TrackableColorValue) {
        super(); 

        let {element, clearButton, itemContainer} = this; 
        element.className = 'segment-set-widget neuroglancer-noselect';
        clearButton.className = 'clear-button';
        clearButton.title = 'Remove Color';
        this.registerEventListener(clearButton, 'click', () => { colorValue.value =  COLOR_CODES.NONE });

        itemContainer.className = 'item-container';
        element.appendChild(itemContainer);

        itemContainer.appendChild(clearButton); 

        this.addElement('red', COLOR_CODES.RED);
        this.addElement('green', COLOR_CODES.GREEN);
        this.addElement('blue', COLOR_CODES.BLUE);
        this.addElement('cyan', COLOR_CODES.CYAN);
        this.addElement('magenta', COLOR_CODES.MAGENTA);
        this.addElement('yellow', COLOR_CODES.YELLOW);

    }

    private addElement(s: string, c: number) {
        let itemElement = document.createElement('button');
        itemElement.className = 'segment-button';
        itemElement.textContent = s;
        itemElement.title = `Set color to ${s}`;
        let widget = this; 

        itemElement.addEventListener('click', function(this: ItemElement) {
            widget.colorValue.value = c; 
        });

        itemElement.style.backgroundColor = `${s}`;

        this.itemContainer.appendChild(itemElement);
    }
}