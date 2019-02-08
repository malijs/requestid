# @malijs/requestid

Mali request ID metadata middleware sources request ID into context

[![npm version](https://img.shields.io/npm/v/@malijs/requestid.svg?style=flat-square)](https://www.npmjs.com/package/@malijs/requestid)
[![build status](https://img.shields.io/travis/malijs/requestid/master.svg?style=flat-square)](https://travis-ci.org/malijs/requestid)

## API

<a name="module_@malijs/requestid"></a>

### @malijs/requestid
Mali request ID metadata middleware. If the call has metadata with the request ID
(or specified property) sets it into the context into target property. If request ID
is not present creates one using UUID and sets it into metadata and context.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> |  |
| options.name | <code>String</code> | Optional name of the metadata object property. Default: <code>'requestId'</code> |
| options.target | <code>String</code> \| <code>Boolean</code> | Optional name of the <code>ctx</code> property to set request id into.                                         If not provided it is equal to <code>options.name</code>. |
| options.generator | <code>function</code> | Synchronous function to generate the request id if not present.                                      Has to return a string. Default: <code>uuid</code> library. |

**Example**  
```js
const rid = require('@malijs/requestid')

app.use(rid())
app.use('myFn', async (ctx, next) => {
  console.log(ctx.requestId) // request ID from metadata
  await next()
})
```
## License

  Apache-2.0
