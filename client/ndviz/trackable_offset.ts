import {TrackableValue} from 'neuroglancer/trackable_value';
import {verifyInt} from 'neuroglancer/util/json';

export type TrackableOffsetValue = TrackableValue<number>;

export function trackableOffsetValue(initialValue = 0.) {
    return new TrackableValue<number>(initialValue, verifyInt);
}