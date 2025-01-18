'use strict'

const { test } = require('node:test')

const RefResolver = require('../ref-resolver')

test('Resolve absolute refs in schema', t => {
  t.plan(1)
  const opts = {
    externalSchemas: [
      {
        $id: 'ObjectA',
        type: 'object',
        properties: {
          example: {
            type: 'string'
          }
        }
      },
      {
        $id: 'ObjectC',
        type: 'object',
        properties: {
          referencedObjA: {
            $ref: 'ObjectA#'
          },
          referencedObjC: {
            $ref: 'ObjectC#/properties/ObjectD'
          },
          ObjectD: {
            type: 'object',
            properties: {
              d: {
                type: 'string'
              }
            }
          }
        }
      }
    ]
  }
  const resolver = RefResolver()

  const out = resolver.resolve({
    $ref: 'ObjectC#'
  }, opts)

  t.assert.deepStrictEqual(out, {
    $ref: '#/definitions/def-1',
    definitions: {
      'def-0': {
        $id: 'ObjectA',
        type: 'object',
        properties: {
          example: {
            type: 'string'
          }
        }
      },
      'def-1': {
        $id: 'ObjectC',
        type: 'object',
        properties: {
          referencedObjA: {
            $ref: '#/definitions/def-0'
          },
          referencedObjC: {
            $ref: '#/definitions/def-1/properties/ObjectD'
          },
          ObjectD: {
            type: 'object',
            properties: {
              d: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  })
})

test('Resolve relative refs in schema', t => {
  t.plan(1)
  const opts = {
    externalSchemas: [
      {
        $id: 'ObjectA',
        type: 'object',
        properties: {
          sample: {
            type: 'object',
            properties: {
              a: { type: 'string' },
              b: { type: 'object', properties: { d: { type: 'string' } } }
            }
          },
          someValue: { type: 'string' },
          relativeExample: {
            $ref: '#/properties/sample'
          }
        }
      }
    ]
  }
  const resolver = RefResolver()

  const out = resolver.resolve({
    $ref: 'ObjectA#/properties/relativeExample'
  }, opts)

  t.assert.deepStrictEqual(out, {
    $ref: '#/definitions/def-0/properties/relativeExample',
    definitions: {
      'def-0': {
        $id: 'ObjectA',
        type: 'object',
        properties: {
          sample: {
            type: 'object',
            properties: {
              a: {
                type: 'string'
              },
              b: {
                type: 'object',
                properties: {
                  d: {
                    type: 'string'
                  }
                }
              }
            }
          },
          someValue: {
            type: 'string'
          },
          relativeExample: {
            $ref: '#/properties/sample'
          }
        }
      }
    }
  })
})
