import {TrackableValue} from 'neuroglancer/trackable_value';
import {verifyInt} from 'neuroglancer/util/json';

export type TrackableIntValue = TrackableValue<number>;

export function trackableIntValue(initialValue = 1) {
  return new TrackableValue<number>(initialValue, verifyInt);
}
