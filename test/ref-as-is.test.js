
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
