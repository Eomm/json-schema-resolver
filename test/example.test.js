'use strict'

const { test } = require('tap')

const RefResolver = require('../ref-resolver')

test('readme example', t => {
  t.plan(1)

  const ref = RefResolver({
    clone: true // Clone the input schema without changing it. Default: false
  })

  const inputSchema = {
    $id: 'http://example.com/SimplePerson',
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: { $ref: 'relativeAddress#' },
      houses: { type: 'array', items: { $ref: 'relativeAddress#' } }
    }
  }

  const addresSchema = {
    $id: 'relativeAddress',
    type: 'object',
    properties: {
      zip: { type: 'string' },
      city: { type: 'string' }
    }
  }

  const singleSchema = ref.resolve(inputSchema, { externalSchemas: [addresSchema] })

  t.deepEqual(singleSchema, {
    $id: 'http://example.com/SimplePerson',
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      address: {
        $ref: '#/definitions/def-0'
      },
      houses: {
        type: 'array',
        items: {
          $ref: '#/definitions/def-0'
        }
      }
    },
    definitions: {
      'def-0': {
        $id: 'relativeAddress',
        type: 'object',
        properties: {
          zip: {
            type: 'string'
          },
          city: {
            type: 'string'
          }
        }
      }
    }
  })
})
