import {TrackableValue} from 'neuroglancer/trackable_value';
import {verifyEnumString} from 'neuroglancer/util/json';
import {vec3} from 'neuroglancer/util/geom';

export enum COLOR_CODES {
    NONE = 0,
    RED = 1,
    GREEN = 2,
    BLUE = 3,
    CYAN = 4,
    MAGENTA = 5,
    YELLOW = 6
}

export const COLOR_VECTORS = new Map<number,vec3>();
COLOR_VECTORS.set(COLOR_CODES.NONE, vec3.fromValues(1,1,1));
COLOR_VECTORS.set(COLOR_CODES.RED, vec3.fromValues(1,0,0));
COLOR_VECTORS.set(COLOR_CODES.GREEN, vec3.fromValues(0,1,0));
COLOR_VECTORS.set(COLOR_CODES.BLUE, vec3.fromValues(0,0,1));
COLOR_VECTORS.set(COLOR_CODES.CYAN, vec3.fromValues(0,1,1));
COLOR_VECTORS.set(COLOR_CODES.MAGENTA, vec3.fromValues(1,0,1));
COLOR_VECTORS.set(COLOR_CODES.YELLOW, vec3.fromValues(1,1,0));

export type TrackableColorValue = TrackableValue<number>;

export function trackableColorValue(initialValue = COLOR_CODES.NONE) {
    return new TrackableValue<number>(initialValue, (value) => {return verifyEnumString(value, COLOR_CODES)});
}