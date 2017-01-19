import {TrackableValue} from 'neuroglancer/trackable_value';
import {verifyEnumString} from 'neuroglancer/util/json';

export enum COLOR_CODES {
    NONE = 0,
    RED = 1,
    GREEN = 2,
    BLUE = 3,
    CYAN = 4,
    MAGENTA = 5,
    YELLOW = 6
}

export type TrackableColorValue = TrackableValue<number>;

export function trackableColorValue(initialValue = COLOR_CODES.NONE) {
    return new TrackableValue<number>(initialValue, (value) => {return verifyEnumString(value, COLOR_CODES)});
}