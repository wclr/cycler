// import { Stream, MemoryStream } from 'xstream'

// declare module 'xstream' {
//   interface MemoryStream<T> {
//     // make MemoryStream distinctive from Stream
//     __withMemory: true
//   }

//   interface Stream<T> {
//     flatten<R>(this: Stream<Stream<R>> | Stream<MemoryStream<R>>): Stream<R>
//   }
// }

// declare module 'xstream/extra/flattenConcurrently' {
//   export default function flattenConcurrently<T>(
//     ins: Stream<Stream<T>> | Stream<MemoryStream<T>>
//   ): Stream<T>
// }

// declare module 'xstream/extra/flattenSequentially' {
//   export default function flattenSequentially<T>(
//     ins: Stream<Stream<T>> | Stream<MemoryStream<T>>
//   ): Stream<T>
// }
