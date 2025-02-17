'use strict'

const { test } = require('node:test')
const clone = require('rfdc')({ proto: true, circles: false })

const RefResolver = require('../ref-resolver')
const factory = require('./schema-factory')

// eslint-disable-next-line
const save = (out) => require('fs').writeFileSync(`./out-${Date.now()}.json`, JSON.stringify(out, null, 2))

// https://json-schema.org/draft/2019-09/json-schema-core.html#idExamples

test('wrong params', t => {
  t.plan(2)
  t.assert.throws(() => RefResolver({ target: 'draft-1000' }))
  t.assert.throws(() => RefResolver({ externalSchemas: [] }), 'need application uri')
})

test('$ref to root', t => {
  t.plan(2)

  const schema = factory('absoluteId-localRef')

  const opts = {
    externalSchemas: [
      factory('relativeId-noRef')
    ]
  }
  const resolver = RefResolver()

  const originalSchema = clone(schema)
  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, originalSchema, 'the param schema should not be changed')
  t.assert.strictEqual(schema, out, 'the output schema is the same (LINK) of the input one')
})

test('$ref to an external schema', t => {
  t.plan(3)
  const schema = factory('absoluteId-externalRef')

  const opts = {
    externalSchemas: [
      factory('relativeId-noRef')
    ]
  }

  const resolver = RefResolver()

  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input - modified')
  t.assert.ok(out.definitions, 'definitions has been added')
  t.assert.deepStrictEqual(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})

test('$ref to an external schema without changes', t => {
  t.plan(4)
  const schema = factory('absoluteId-externalRef')

  const opts = {
    externalSchemas: [
      factory('relativeId-noRef')
    ]
  }

  const resolver = RefResolver({ clone: true })

  const originalSchema = clone(schema)
  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, originalSchema, 'the input is unchanged')
  t.assert.notDeepStrictEqual(schema, out, 'the input is unchanged')
  t.assert.ok(out.definitions, 'definitions has been added')
  t.assert.deepStrictEqual(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})

test('$ref circular', t => {
  t.plan(3)
  const schema = {
    $id: 'http://example.com/',
    $ref: 'relativePerson'
  }

  const opts = {
    externalSchemas: [
      factory('relativeId-externalAndLocalRef'),
      factory('relativeId-noRef')
    ]
  }

  const resolver = RefResolver()
  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input modified')
  t.assert.ok(out.definitions, 'definitions has been added')
  t.assert.deepStrictEqual(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})

test('$ref circular', t => {
  t.plan(3)
  const schema = {
    $id: 'http://example.com/',
    $ref: 'relativeAddress'
  }

  const opts = {
    externalSchemas: [
      factory('relativeId-externalAndLocalRef'), // this is not used
      factory('relativeId-noRef')
    ]
  }

  const resolver = RefResolver()
  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input modified')
  t.assert.ok(out.definitions, 'definitions has been added')
  t.assert.deepStrictEqual(Object.values(out.definitions), [opts.externalSchemas[1]], 'only used schema are added')
})

test('$ref local ids', { skip: true }, t => {
  t.plan(2)
  const schema = factory('multipleLocalId')

  const opts = {
    externalSchemas: [
      factory('relativeId-externalAndLocalRef'), // this is not used
      factory('relativeId-noRef') // this is not used
    ]
  }

  const resolver = RefResolver()
  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input modified')
  // TODO build a graph to track is an external schema is referenced by the root
  t.assert.strictEqual(Object.values(out.definitions).length, 1, 'no external schema added')
})

test('skip duplicated ids', t => {
  t.plan(2)
  const schema = factory('multipleLocalId')

  const opts = {
    externalSchemas: [
      factory('multipleLocalId')
    ]
  }

  const resolver = RefResolver()
  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input modified')
  t.assert.strictEqual(Object.values(out.definitions).length, 1, 'no external schema added')
})

test('dont resolve external schema missing', t => {
  t.plan(1)
  const schema = factory('absoluteId-externalRef')

  const resolver = RefResolver({ clone: true })
  const out = resolver.resolve(schema)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input not modified')
})

test('dont resolve external schema missing #2', t => {
  t.plan(1)
  const schema = factory('absoluteId-absoluteRef')

  const resolver = RefResolver({ clone: true })
  const out = resolver.resolve(schema)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input not modified')
})

test('missing id in root schema', t => {
  t.plan(3)
  const schema = {
    $ref: 'relativePerson'
  }

  const opts = {
    externalSchemas: [
      factory('relativeId-externalAndLocalRef'),
      factory('relativeId-noRef')
    ]
  }

  const resolver = RefResolver()
  const out = resolver.resolve(schema, opts)
  t.assert.deepStrictEqual(schema, out, 'the output is the same input modified')
  t.assert.ok(out.definitions, 'definitions has been added')
  t.assert.deepStrictEqual(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})

test('absolute $ref', t => {
  t.plan(2)
  const schema = { $ref: 'http://example.com/#/definitions/idParam' }

  const absSchemaId = {
    $id: 'http://example.com/',
    definitions: {
      uuid: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      },
      idParam: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { $ref: '#/definitions/uuid' }
        },
        additionalProperties: false
      }
    }
  }

  const externalSchemas = [absSchemaId]

  const resolver = RefResolver({ clone: true, applicationUri: 'todo.com', externalSchemas })
  const out = resolver.resolve(schema)

  t.assert.notEqual(out.$ref, 'http://example.com/#/definitions/idParam')
  t.assert.deepStrictEqual(resolver.definitions(), {
    definitions: {
      'def-0': absSchemaId
    }
  })
})

test('absolute $ref #2', t => {
  t.plan(2)
  const schema = factory('absoluteId-absoluteRef')

  const absSchemaId = {
    $id: 'http://other-site.com/relativeAddress',
    type: 'object',
    properties: {
      uuid: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      }
    }
  }

  const externalSchemas = [absSchemaId]

  const resolver = RefResolver({ clone: true })
  const out = resolver.resolve(schema, { externalSchemas })
  t.assert.strictEqual(out.properties.address.$ref, '#/definitions/def-0')
  t.assert.strictEqual(out.properties.houses.items.$ref, '#/definitions/def-0')
})
