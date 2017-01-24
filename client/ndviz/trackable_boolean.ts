import {TrackableValue} from 'neuroglancer/trackable_value';

export type TrackableBooleanValue = TrackableValue<boolean>;

export function trackableBooleanValue(initialValue = false) {
    return new TrackableValue<boolean>(initialValue, value => {
        if (value !instanceof Boolean) return false; 
        else                           return true; 
    });
}