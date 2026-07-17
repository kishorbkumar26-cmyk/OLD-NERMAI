import EventEmitter from 'eventemitter3';
import { ClassEventPayloads } from './ClassEvents';
import { AttendanceEventPayloads } from './AttendanceEvents';

export * from './ClassEvents';
export * from './AttendanceEvents';

export interface AllEventPayloads extends ClassEventPayloads, AttendanceEventPayloads {}

export type EventMap = {
  [K in keyof AllEventPayloads]: (payload: AllEventPayloads[K]) => void;
};

class PlatformEventBus extends EventEmitter<EventMap> {}

export const platformEvents = new PlatformEventBus();
