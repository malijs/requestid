const uuid = require('uuid')

/**
 * Mali request ID metadata middleware. If the call has metadata with the request ID
 * (or specified property) sets it into the context into target property. If request ID
 * is not present creates one using UUID and sets it into metadata and context.
 * @module mali-requestid
 *
 * @param  {Options} options
 * @param  {String} options.name Optional name of the metadata object property. Default: <code>'requestid'</code>
 * @param  {String|Boolean} options.target Optional name of the <code>ctx</code> property to set request id into.
 *                                         If not provided it is equal to <code>options.name</code>.
 * @param  {Function} options.generator Synchronous function to generate the request id if not present.
 *                                      Has to return a string. Default: <code>uuid</code> library.
 *
 * @example
 * const rid = require('mali-requestid')
 *
 * app.use(rid())
 * app.use('myFn', async (ctx) {
 *   console.log(ctx.requestId) // request ID from metadata
 * })
 */
module.exports = function requestId (options = {}) {
  const opts = Object.assign({
    name: 'requestId',
    generator: uuid
  }, options)

  if (typeof opts.target !== 'string' && typeof opts.target !== 'boolean') {
    opts.target = opts.name
  }

  return function rid (ctx, next) {
    const mn = opts.name.toLowerCase()
    if (!ctx.metadata[mn]) {
      ctx.metadata[mn] = (opts.generator)()
    }

    if (typeof opts.target === 'string' && opts.target) {
      ctx[opts.target] = ctx.metadata[mn]
    }

    return next()
  }
}
