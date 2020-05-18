'use strict'

const { test } = require('tap')
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
  t.notEqual(schema.$id, 'http://example.com/SimplePerson')
  t.equal(schema.$id, 'one-single-uri.to')

  const externalDef = resolver.definitions()
  t.deepEqual(externalDef.definitions, {})
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
  t.notMatch(schema1, originalSchema1, 'the refs has been changed')
  t.deepEquals(out1, schema1)
  t.notOk(schema1.definitions, 'definition has not been added')

  const out2 = resolver.resolve(schema2)
  t.notMatch(schema2, originalSchema2, 'the refs has been changed')
  t.deepEquals(out2, schema2)
  t.notOk(schema2.definitions, 'definition has not been added')

  const externalDef = resolver.definitions()
  t.deepEqual(externalDef.definitions['def-0'], factory('relativeId-noRef'))
})
