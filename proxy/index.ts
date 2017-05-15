import { FantasyObservable } from '@cycle/run'
import { adapt } from '@cycle/run/lib/adapt'
import xs from 'xstream'

export interface ProxyFn<Stream extends FantasyObservable> {
  (originalStream: Stream): Stream
}

export const proxy = <GenericStream extends FantasyObservable>
  (composeFn = (_: GenericStream) => _):
  GenericStream & { proxy: ProxyFn<GenericStream> } => {
  const subject = xs.create()
  let proxySub: any
  let targetStream: GenericStream
  const proxyStream = adapt(subject) as any
  //as GenericStream & { proxy: ProxyFn<GenericStream> }
  //const proxyObserver = subject
  let __proxyRefs = 0
  proxyStream.proxy = (target: GenericStream) => {
    if (targetStream) {
      throw new Error('You may provide only one target stream to proxy')
    }
    targetStream = composeFn(target)

    return adapt(xs.create({
      start: function (this: any, observer) {
        // just thoughpass target stream for new subscriber
        this.sub = target.subscribe(observer)
        // subscribe proxy on new start
        if (__proxyRefs++ === 0) {          
          proxySub = targetStream.subscribe({
            next: (value) => { subject.shamefullySendNext(value) },
            error: (error) => { subject.shamefullySendError(error) },
            complete: () => { subject.shamefullySendComplete() }
          })
        }
      },
      stop: function (this: any) {
        // when stoped unsubscribe from target
        this.sub.unsubscribe()
        if (--__proxyRefs === 0) {
          proxySub.unsubscribe()
          subject.shamefullySendComplete()
          if (proxyStream.__onProxyDispose) {
            proxyStream.__onProxyDispose()
          }
        }
      }
    }))
  }
  return proxyStream
}

export default proxy
