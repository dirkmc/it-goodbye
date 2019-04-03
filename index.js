const endable = require('./endable')

// Indicates if object can be converted to a Buffer
const isBufferCompatible = (o) => Buffer.isBuffer(o) || typeof o === 'string'

module.exports = (stream, goodbye) => {
  goodbye = goodbye || 'GOODBYE'
  const e = endable(goodbye)
  const token = isBufferCompatible(goodbye) ? Buffer.from(goodbye) : goodbye

  return {
    // when the source ends,
    // send the goodbye and then wait to recieve
    // the other goodbye.
    source: e(stream.source),
    sink: source => stream.sink((async function * () {
      // when the goodbye is received, allow the source to end.
      for await (const chunk of source) {
        if (isBufferCompatible(chunk)) {
          const buff = Buffer.from(chunk)
          const done = buff.slice(-token.length).equals(token)
          if (done) {
            const remaining = buff.length - token.length
            if (remaining > 0) {
              yield buff.slice(0, remaining)
            }
            e.end()
          } else {
            yield buff
          }
        } else {
          if (chunk === goodbye) {
            e.end()
          } else {
            yield chunk
          }
        }
      }
    })())
  }
}
