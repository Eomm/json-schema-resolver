'use strict'

const { test } = require('tap')
const refResolver = require('../ref-resolver')
const clone = require('rfdc')({ circles: false })

// https://json-schema.org/draft/2019-09/json-schema-core.html#idExamples

test('$ref to root', t => {
  t.plan(2)

  const schema = {
    $id: 'http://example.com/root.json',
    properties: {
      person: { $ref: '#/definitions/person' },
      children: {
        type: 'array',
        items: { $ref: '#/definitions/person' }
      }
    },
    definitions: {
      person: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' }
        }
      }
    }
  }

  const opts = {
    externalSchemas: [
      {
        $id: 'commonSchema',
        type: 'object',
        definitions: {
          hello: { type: 'string' }
        }
      }
    ]
  }
  const resolver = refResolver()
  const originalSchema = clone(schema)
  const out = resolver.resolve(schema, opts)
  t.deepEquals(schema, originalSchema, 'the param schema should not be changed')
  t.equals(schema, out, 'the output schema is the same (LINK) of the input one')
})

test('$ref to an external schema', t => {
  t.plan(3)
  const schema = {
    $id: 'http://example.com/SimplePerson',
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: { $ref: '/SimpleAddress' },
      votes: { type: 'integer', minimum: 1 }
    }
  }

  const opts = {
    externalSchemas: [
      {
        $id: '/SimpleAddress',
        type: 'object',
        properties: {
          lines: {
            type: 'array',
            items: { type: 'string' }
          },
          zip: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' }
        },
        required: ['country']
      }
    ]
  }

  const resolver = refResolver()
  const out = resolver.resolve(schema, opts)
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})

test('$ref circular', t => {
  t.plan(3)
  const schema = {
    $id: 'http://example.com/',
    $ref: 'SimplePerson'
  }

  const opts = {
    externalSchemas: [
      {
        $id: 'SimplePerson',
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: { $ref: 'SimpleAddress#' },
          friends: { type: 'array', items: { $ref: '#' } },
          votes: { type: 'integer', minimum: 1 }
        }
      },
      {
        $id: 'SimpleAddress',
        type: 'object',
        properties: {
          lines: {
            type: 'array',
            items: { type: 'string' }
          },
          zip: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' }
        },
        required: ['country']
      }
    ]
  }

  const resolver = refResolver()
  const out = resolver.resolve(schema, opts)
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.ok(out.definitions, 'definitions has been added')
  require('fs').writeFileSync('./out.json', JSON.stringify(out, null, 2))
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})
