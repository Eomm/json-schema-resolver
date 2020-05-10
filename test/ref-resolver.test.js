'use strict'

const { test } = require('tap')
const refResolver = require('../ref-resolver')

// https://json-schema.org/draft/2019-09/json-schema-core.html#idExamples

test('', t => {
  const schema = {
    $id: 'http://example.com/root.json',
    definitions: {
      A: { $id: '#foo' },
      B: {
        $id: 'other.json',
        definitions: {
          X: { $id: '#bar' },
          Z: { $ref: 'commonSchema#' },
          Y: { $id: 't/inner.json' }
        }
      },
      C: {
        $id: 'urn:uuid:ee564b8a-7a87-4125-8c96-e9f123d6766f'
      }
    }
  }

  const opts = {
    externalSchemas: [
      {
        $id: 'commonSchema',
        type: 'object',
        properties: {
          hello: { type: 'string' }
        }
      }
    ]
  }
  refResolver(schema, opts)
  t.end()
})
