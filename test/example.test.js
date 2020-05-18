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

test('readme example #2', t => {
  t.plan(2)

  const addresSchema = {
    $id: 'relativeAddress',
    type: 'object',
    properties: {
      zip: { type: 'string' },
      city: { type: 'string' }
    }
  }

  const ref = RefResolver({
    clone: true, // Clone the input schema without changing it. Default: false
    applicationUri: 'my-application.org', // You need to provide an unique URI to resolve relative `$id`s
    externalSchemas: [addresSchema] // The schemas provided at the creation of the resolver, will be used evvery time `.resolve` will be called
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

  const singleSchema = ref.resolve(inputSchema)
  // the resolved schema DOES NOT have definitions added

  // to get the definition you need only to call:
  const sharedDefinitions = ref.definitions()

  t.deepEqual(sharedDefinitions, {
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

  t.deepEqual(singleSchema, {
    $id: 'my-application.org',
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
    }
  })
})
