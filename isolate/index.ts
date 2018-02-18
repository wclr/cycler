import cycleIsolate from '@cycle/isolate'

export interface Isolate {
  <Sources, Sinks>(component: (sources: Sources) => Sinks, scope?: any):
    (sources: Sources) => Sinks
  <IsolatedComponent extends Function>(component: IsolatedComponent, scope?: any): IsolatedComponent
}

export default cycleIsolate as Isolate
