import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import caller from 'grpc-caller'
import pify from 'pify'

const fs = pify(require('fs'))

import Mali from 'mali'
import rid from '../'

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getHostport (port) {
  return '0.0.0.0:'.concat(port || getRandomInt(1000, 60000))
}

const PROTO_PATH = path.resolve(__dirname, './rid.proto')
const DYNAMIC_HOST = getHostport()
const apps = []
let client

test.before('should dynamically create service', t => {
  const app = new Mali(PROTO_PATH, 'HelloService')
  t.truthy(app)
  apps.push(app)

  function gen () {
    return '1234'
  }

  const actions = {
    'sayHello1': [
      rid(),
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata['requestid'],
          message2: ctx.requestId
        }
      }
    ],
    'sayHello2': [
      rid({ name: 'rid' }),
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata.rid,
          message2: ctx.rid
        }
      }
    ],
    'sayHello3': [
      rid({ target: 'rid' }),
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata['requestid'],
          message2: ctx.rid
        }
      }
    ],
    'sayHello4': [
      rid({ target: false }),
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata['requestid'],
          message2: ctx.requestId
        }
      }
    ],
    'sayHello5': [
      rid({ name: 'rid', target: false }),
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata['rid'],
          message2: ctx.rid || ctx.requestId
        }
      }
    ],
    'sayHello6': [
      rid({ name: 'rid', target: 'rid2' }),
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata['rid'],
          message2: ctx.rid2
        }
      }
    ],
    'sayHello7': [
      rid({ generator: gen }),
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata['requestid'],
          message2: ctx.requestId
        }
      }
    ],
    'sayHello8': [
      rid({ generator: gen, target: false }),
      async(ctx, next) => {
        const fstr = await fs.readFile(path.resolve(__dirname, '../package.json'), 'utf8')
        const fc = JSON.parse(fstr)
        ctx.name = fc.name
        await next()
      },
      async(ctx) => {
        ctx.res = {
          message1: ctx.metadata['requestid'] + ':' + ctx.name,
          message2: ctx.requestId
        }
      }
    ]
  }

  app.use(actions)
  const server = app.start(DYNAMIC_HOST)
  t.truthy(server)
  client = caller(DYNAMIC_HOST, PROTO_PATH, 'HelloService')
})

test('should work default behaviour when no metadata', async t => {
  t.plan(4)
  const response = await client.sayHello1({ name: 'Bob' })
  t.truthy(response)
  t.truthy(response.message1)
  t.truthy(response.message2)
  t.is(response.message1, response.message2)
})

test('should work default behaviour when request id is not there', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello1({ name: 'Bob' }, meta)
  t.truthy(response)
  t.truthy(response.message1)
  t.truthy(response.message2)
  t.is(response.message1, response.message2)
})

test('should work default behaviour when request id provided in metadata', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('requestId', 'asdf')
  const response = await client.sayHello1({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, 'asdf')
  t.is(response.message1, response.message2)
})

test('should work custom name behaviour when no metadata', async t => {
  t.plan(4)
  const response = await client.sayHello2({ name: 'Bob' })
  t.truthy(response)
  t.truthy(response.message1)
  t.truthy(response.message2)
  t.is(response.message1, response.message2)
})

test('should work custom name behaviour when request id is not there', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello2({ name: 'Bob' }, meta)
  t.truthy(response)
  t.truthy(response.message1)
  t.truthy(response.message2)
  t.is(response.message1, response.message2)
})

test('should work custom name behaviour when request id provided in metadata', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('rid', 'ASDF')
  const response = await client.sayHello2({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, 'ASDF')
  t.is(response.message1, response.message2)
})

test('should work custom target behaviour when no metadata', async t => {
  t.plan(4)
  const response = await client.sayHello3({ name: 'Bob' })
  t.truthy(response)
  t.truthy(response.message1)
  t.truthy(response.message2)
  t.is(response.message1, response.message2)
})

test('should work custom target behaviour when request id is not there', async t => {
  t.plan(4)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello3({ name: 'Bob' }, meta)
  t.truthy(response)
  t.truthy(response.message1)
  t.truthy(response.message2)
  t.is(response.message1, response.message2)
})

test('should work custom target behaviour when request id provided in metadata', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('requestId', '1234')
  const response = await client.sayHello3({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, '1234')
  t.is(response.message1, response.message2)
})

test('should work target = false behaviour when no metadata', async t => {
  t.plan(3)
  const response = await client.sayHello4({ name: 'Bob' })
  t.truthy(response)
  t.truthy(response.message1)
  t.falsy(response.message2)
})

test('should work target = false behaviour when request id is not there', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello4({ name: 'Bob' }, meta)
  t.truthy(response)
  t.truthy(response.message1)
  t.falsy(response.message2)
})

test('should work target = false behaviour when request id provided in metadata', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('requestId', 'asd123')
  const response = await client.sayHello4({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, 'asd123')
  t.falsy(response.message2)
})

test('should work custom name & target = false behaviour when no metadata', async t => {
  t.plan(3)
  const response = await client.sayHello5({ name: 'Bob' })
  t.truthy(response)
  t.truthy(response.message1)
  t.falsy(response.message2)
})

test('should work custom name & target = false behaviour when request id is not there', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello5({ name: 'Bob' }, meta)
  t.truthy(response)
  t.truthy(response.message1)
  t.falsy(response.message2)
})

test('should work custom name & target = false behaviour when request id provided in metadata', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('rid', 'asdf123')
  const response = await client.sayHello5({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, 'asdf123')
  t.falsy(response.message2)
})

test('should work custom name & custom target behaviour when no metadata', async t => {
  t.plan(3)
  const response = await client.sayHello6({ name: 'Bob' })
  t.truthy(response)
  t.truthy(response.message1)
  t.is(response.message1, response.message2)
})

test('should work custom name & custom target behaviour when request id is not there', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello6({ name: 'Bob' }, meta)
  t.truthy(response)
  t.truthy(response.message1)
  t.is(response.message1, response.message2)
})

test('should work custom name & custom target behaviour when request id provided in metadata', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('rid', 'foo')
  const response = await client.sayHello6({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, 'foo')
  t.is(response.message1, response.message2)
})

test('Should work with defualts & custom generator when no metadata', async t => {
  t.plan(3)
  const response = await client.sayHello7({ name: 'Bob' })
  t.truthy(response)
  t.is(response.message1, '1234')
  t.is(response.message1, response.message2)
})

test('Should work with defualts & custom generator when request id is not there', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello7({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, '1234')
  t.is(response.message1, response.message2)
})

test('Should work with defualts & custom generator when request id provided in metadata', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('requestId', 'foo')
  const response = await client.sayHello7({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, 'foo')
  t.is(response.message1, response.message2)
})

test('Should work custom generator & target = false when no metadata, + async middleware', async t => {
  t.plan(3)
  const response = await client.sayHello8({ name: 'Bob' })
  t.truthy(response)
  t.is(response.message1, '1234:@malijs/requestid')
  t.falsy(response.message2)
})

test('Should work custom generator & target = false when request id is not there, + async middleware', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('foo', 'bar')
  const response = await client.sayHello8({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, '1234:@malijs/requestid')
  t.falsy(response.message2)
})

test('Should work custom generator & target = false when request id provided in metadata, + async middleware', async t => {
  t.plan(3)
  const meta = new grpc.Metadata()
  meta.add('requestId', 'foo')
  const response = await client.sayHello8({ name: 'Bob' }, meta)
  t.truthy(response)
  t.is(response.message1, 'foo:@malijs/requestid')
  t.falsy(response.message2)
})

test.after.always('guaranteed cleanup', t => {
  apps.forEach(app => app.close())
})
