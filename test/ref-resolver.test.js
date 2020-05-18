'use strict'

const { test } = require('tap')
const clone = require('rfdc')({ proto: true, circles: false })

const RefResolver = require('../ref-resolver')
const factory = require('./schema-factory')

// eslint-disable-next-line
const save = (out) => require('fs').writeFileSync(`./out-${Date.now()}.json`, JSON.stringify(out, null, 2))

// https://json-schema.org/draft/2019-09/json-schema-core.html#idExamples

test('wrong params', t => {
  t.plan(2)
  t.throws(() => RefResolver({ target: 'draft-1000' }))
  t.throws(() => RefResolver({ externalSchemas: [] }), 'need application uri')
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
  t.deepEquals(schema, originalSchema, 'the param schema should not be changed')
  t.equals(schema, out, 'the output schema is the same (LINK) of the input one')
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
  t.deepEquals(schema, out, 'the output is the same input - modified')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
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
  t.deepEquals(schema, originalSchema, 'the input is unchanged')
  t.notMatch(schema, out, 'the input is unchanged')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
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
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
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
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), [opts.externalSchemas[1]], 'only used schema are added')
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
  t.deepEquals(schema, out, 'the output is the same input modified')
  // TODO build a graph to track is an external schema is referenced by the root
  t.equals(Object.values(out.definitions).length, 1, 'no external schema added')
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
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.equals(Object.values(out.definitions).length, 1, 'no external schema added')
})

test('dont resolve external schema missing', t => {
  t.plan(1)
  const schema = factory('absoluteId-externalRef')

  const resolver = RefResolver({ clone: true })
  const out = resolver.resolve(schema)
  t.deepEquals(schema, out, 'the output is the same input not modified')
})

test('dont resolve external schema missing #2', t => {
  t.plan(1)
  const schema = factory('absoluteId-absoluteRef')

  const resolver = RefResolver({ clone: true })
  const out = resolver.resolve(schema)
  t.deepEquals(schema, out, 'the output is the same input not modified')
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
  save(out)
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})
