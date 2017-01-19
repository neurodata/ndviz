import {TrackableValue} from 'neuroglancer/trackable_value';
import {verifyFloat01} from 'neuroglancer/util/json';

export type TrackableThresholdValue = TrackableValue<number>;

export function trackableMinValue(initialValue = 0.) {
    return new TrackableValue<number>(initialValue, verifyFloat01);
}

export function trackableMaxValue(initialValue = 1.) {
    return new TrackableValue<number>(initialValue, verifyFloat01);
}