import * as React from 'react';
import * as ReactDOM from 'react-dom';

import $ from 'jquery';
import 'jqueryui';
//import * as JQueryUI from 'jqueryui';

require('./image_controls.css');

interface ImageControlsProps {
    blendMode?: number
}

interface ImageControlsState {
    blendMode: number
}

export class ImageControlsTest extends React.Component<undefined, undefined> {
    constructor(props: undefined) {
        super(props);

        this.handleTestChange.bind(this);
    }

    handleTestChange(value: number) {
        console.log(value);
    }

    render() {
        return (
            <div id="slider">
                <ImageControlsSlider 
                    defaultValue={100}
                    handleChange={this.handleTestChange}
                    className="minslider"
                    maxValue={255}
                    divisor={255}
                />
            </div>
        )
    }
}

interface ImageControlsSliderProps {
    defaultValue: number, 
    handleChange: any, 
    className: string, 
    minValue?: number,
    maxValue?: number,
    step?: number,
    divisor?: number
}

interface ImageControlsSliderState {
    value: number
}

class ImageControlsSlider extends React.Component<ImageControlsSliderProps, ImageControlsSliderState> {
    constructor(props: ImageControlsSliderProps) {
        super(props);
        this.handleValueChange = this.handleValueChange.bind(this);

        this.state = {
            value: this.props.defaultValue
        }
    }

    static defaultProps = {
        minValue: 0,
        maxValue: 1,
        step: 1,
        divisor: 1
    };

    handleValueChange(event: Event, ui: any) {
        // TODO set value 
        this.setState({ value: ui.value/this.props.divisor });
        this.props.handleChange(ui.value/this.props.divisor); 
        console.log(event);
    }

    componentDidMount() {
        var span = ReactDOM.findDOMNode(this);
        $( span ).slider({
            min: this.props.minValue,
            max: this.props.maxValue,
            value: this.state.value*this.props.divisor,
            slide: this.handleValueChange,
            step: this.props.step,
            start: () => {},
            stop: () => { console.log('slide!!'); }
        });
    }

    render() {
        return <span className={this.props.className}></span>;
    }
}

