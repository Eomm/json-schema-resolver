
const { test } = require('tap')
const RefResolver = require('../ref-resolver')

test('resolving schema within the $id', t => {
  t.plan(2)

  const schema = {
    description: 'Succesful response',
    type: 'object',
    properties: {
      greetings: { $ref: 'greetings#' }
    }
  }

  const opts = {
    applicationUri: 'one-single-uri.to',
    externalSchemas: [
      {
        $id: 'greetings',
        type: 'object',
        properties: {
          hello: { type: 'string' }
        }
      }
    ],
    buildLocalReference (json, baseUri, fragment, i) {
      return baseUri.path
    }
  }

  const resolver = RefResolver(opts)
  const out = resolver.resolve(schema)
  const externalDef = resolver.definitions()
  t.equal(out.properties.greetings.$ref, '#/definitions/greetings')
  t.same(externalDef.definitions.greetings, opts.externalSchemas[0])
})

test('resolving schema within the $id case #2', t => {
  t.plan(3)

  const schema = {
    $id: 'urn:schema:ref',
    type: 'object',
    properties: {
      hello: { $ref: 'urn:schema:base#/definitions/hello' }
    }
  }

  const opts = {
    applicationUri: schema.$id,
    externalSchemas: [
      {
        $id: 'urn:schema:base',
        definitions: { hello: { type: 'string' } },
        type: 'object',
        properties: { hello: { $ref: '#/definitions/hello' } }
      },
      schema
    ],
    buildLocalReference (json, baseUri, fragment, i) {
      return escape(json.$id)
    }
  }

  const resolver = RefResolver(opts)
  const out = resolver.resolve(schema)
  t.equal(out.properties.hello.$ref, '#/definitions/urn%3Aschema%3Abase/definitions/hello')

  const externalDef = resolver.definitions()
  t.ok(externalDef.definitions['urn%3Aschema%3Abase'], 'buildLocalReference result')
  t.ok(externalDef.definitions['urn%3Aschema%3Aref'], 'buildLocalReference result')
})
