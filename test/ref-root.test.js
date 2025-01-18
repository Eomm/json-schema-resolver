'use strict'

const { test } = require('node:test')
const clone = require('rfdc')({ proto: true, circles: false })

const RefResolver = require('../ref-resolver')
const factory = require('./schema-factory')

// eslint-disable-next-line
const save = (out) => require('fs').writeFileSync(`./out-${Date.now()}.json`, JSON.stringify(out, null, 2))

test('application uri priority', t => {
  t.plan(3)

  const schema = {
    $id: 'http://example.com/SimplePerson',
    type: 'object',
    properties: { name: { type: 'string' } }
  }

  const opts = {
    applicationUri: 'one-single-uri.to'
  }

  const resolver = RefResolver(opts)

  resolver.resolve(schema)
  t.assert.notEqual(schema.$id, 'http://example.com/SimplePerson')
  t.assert.strictEqual(schema.$id, 'one-single-uri.to')

  const externalDef = resolver.definitions()
  t.assert.deepStrictEqual(externalDef.definitions, {})
})

test('multiple resolve over same externals', t => {
  t.plan(7)

  const schema1 = factory('absoluteId-externalRef')
  const originalSchema1 = clone(schema1)

  const schema2 = factory('absoluteId-externalRef2')
  const originalSchema2 = clone(schema2)

  const opts = {
    applicationUri: 'one-single-uri.to',
    externalSchemas: [
      factory('relativeId-noRef')
    ]
  }
  const resolver = RefResolver(opts)

  const out1 = resolver.resolve(schema1)
  t.assert.notDeepStrictEqual(schema1, originalSchema1, 'the refs has been changed')
  t.assert.deepStrictEqual(out1, schema1)
  t.assert.ok(!schema1.definitions, 'definition has not been added')

  const out2 = resolver.resolve(schema2)
  t.assert.notDeepStrictEqual(schema2, originalSchema2, 'the refs has been changed')
  t.assert.deepStrictEqual(out2, schema2)
  t.assert.ok(!schema2.definitions, 'definition has not been added')

  const externalDef = resolver.definitions()
  t.assert.deepStrictEqual(externalDef.definitions['def-0'], factory('relativeId-noRef'))
})
