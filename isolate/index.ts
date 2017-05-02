import cycleIsolate from '@cycle/isolate'

export interface Isolate {
  <Sources, Sinks>(component: (sources: Sources) => Sinks):
    (sources: Sources) => Sinks
  <IsolatedComponent>(component: Function): IsolatedComponent
}

export default cycleIsolate as Isolate

