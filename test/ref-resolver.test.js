'use strict'

const { test } = require('tap')
const clone = require('rfdc')({ proto: true, circles: false })

const refResolver = require('../ref-resolver')
const factory = require('./schema-factory')

// eslint-disable-next-line
const save = (out) => require('fs').writeFileSync(`./out-${Date.now()}.json`, JSON.stringify(out, null, 2))

// https://json-schema.org/draft/2019-09/json-schema-core.html#idExamples

test('wrong params', t => {
  t.plan(1)
  t.throws(() => refResolver({ target: 'draft-1000' }))
})

test('$ref to root', t => {
  t.plan(2)

  const schema = factory('absoluteId-localRef')

  const opts = {
    externalSchemas: [
      factory('relativeId-noRef')
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
  const schema = factory('absoluteId-externalRef')

  const opts = {
    externalSchemas: [
      factory('relativeId-noRef')
    ]
  }

  const resolver = refResolver()

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

  const resolver = refResolver({ clone: true })

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

  const resolver = refResolver()
  const out = resolver.resolve(schema, opts)
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas, 'external schema has been added to definitions')
})

test('$ref circular', { skip: true }, t => {
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

  const resolver = refResolver()
  const out = resolver.resolve(schema, opts)
  t.deepEquals(schema, out, 'the output is the same input modified')
  t.ok(out.definitions, 'definitions has been added')
  t.deepEquals(Object.values(out.definitions), opts.externalSchemas[1], 'only used schema are added')
})
