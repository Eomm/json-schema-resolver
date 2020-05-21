'use strict'

const { test } = require('tap')

const RefResolver = require('../ref-resolver')

// eslint-disable-next-line
const save = (out) => require('fs').writeFileSync(`./out-${Date.now()}.json`, JSON.stringify(out, null, 2))

test('Preserve $ref fragment', t => {
  t.plan(1)
  const opts = {
    externalSchemas: [
      {
        $id: 'example',
        type: 'object',
        properties: {
          hello: { type: 'string' }
        }
      }
    ]
  }
  const resolver = RefResolver()

  const out = resolver.resolve({
    $id: 'my-schema',
    type: 'object',
    properties: {
      world: { $ref: 'example#/properties/hello' }
    }
  }, opts)

  t.deepEqual(out, {
    $id: 'my-schema',
    type: 'object',
    properties: {
      world: {
        $ref: '#/definitions/def-0/properties/hello'
      }
    },
    definitions: {
      'def-0': {
        $id: 'example',
        type: 'object',
        properties: {
          hello: {
            type: 'string'
          }
        }
      }
    }
  }, 'the $ref fragment has been preserved')
})
