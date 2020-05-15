'use strict'

const debug = require('debug')('json-schema-resolver')
const URI = require('uri-js')
const { EventEmitter } = require('events')

const kRefToDef = Symbol('json-schema-resolver.refToDef')
const kConsumed = Symbol('json-schema-resolver.consumed')
const kIgnore = Symbol('json-schema-resolver.ignore')

// ! Target: DRAFT-07
// https://tools.ietf.org/html/draft-handrews-json-schema-01

// ? Open to DRAFT 08
// https://json-schema.org/draft/2019-09/json-schema-core.html

// TODO logic: https://json-schema.org/draft/2019-09/json-schema-core.html#rfc.appendix.B.1
function jsonSchemaResolver () {
  const ee = new EventEmitter()

  const allIds = new Map()
  let rolling = 0
  ee.on('$id', collectIds)

  const allRefs = []
  ee.on('$ref', collectRefs)

  return {
    resolve
  }

  function resolve (rootSchema, opts) {
    const { externalSchemas } = opts || {}

    // If present, the value for this keyword MUST be a string, and MUST
    // represent a valid URI-reference [RFC3986].  This value SHOULD be
    // normalized, and SHOULD NOT be an empty fragment <#> or an empty
    // string <>.
    const appUri = URI.parse(rootSchema.$id)
    appUri.fragment = undefined // remove fragment
    debug('Found app URI %o', appUri)

    if (externalSchemas) {
      for (const es of externalSchemas) { mapIds(ee, appUri, es) }
    }
    debug('Processed external schemas')

    const baseUri = URI.serialize(appUri) // canonical absolute-URI
    rootSchema.$id = baseUri // fix the schema $id value
    rootSchema[kIgnore] = true

    mapIds(ee, appUri, rootSchema)
    debug('Processed root schema')

    debug('Generating %d refs', allRefs.length)
    allRefs.forEach(({ baseUri, ref, json }) => {
      debug('Evaluating $ref %s', ref)
      if (ref[0] === '#') { return }

      const evaluatedJson = allIds.get(baseUri)
      evaluatedJson[kConsumed] = true
      json.$ref = `#/definitions/${evaluatedJson[kRefToDef]}`
    })

    // TODO $def instead of definitions
    allIds.forEach((json, baseUri) => {
      if (json[kConsumed] === true) {
        if (!rootSchema.definitions) {
          rootSchema.definitions = {}
        }

        rootSchema.definitions[json[kRefToDef]] = json
      }
    })

    return rootSchema
  }

  function collectIds (json, baseUri, relative) {
    if (json[kIgnore]) { return }

    const rel = (relative && URI.serialize(relative)) || ''
    const id = URI.serialize(baseUri) + rel
    if (allIds.has(id)) {
      debug('WARN duplicated id %s .. IGNORED - ', id) // TODO
    } else {
      debug('Collected $id %s', id)
      json[kRefToDef] = `def-${rolling++}`
      allIds.set(id, json)
    }
  }

  function collectRefs (json, baseUri, refVal) {
    const refUri = URI.parse(refVal)
    debug('Pre enqueue $ref %o', refUri)
    if (refUri.reference === 'same-document') {

    } else if (refUri.reference !== 'absolute') {
      refUri.scheme = baseUri.scheme
      refUri.userinfo = baseUri.userinfo
      refUri.host = baseUri.host
      refUri.port = baseUri.port

      if (refUri.reference === 'relative') {
        const newBaseUri = Object.assign({}, baseUri)
        newBaseUri.path = refUri.path
        baseUri = newBaseUri
      }
    }

    const ref = URI.serialize(refUri)
    allRefs.push({
      baseUri: URI.serialize(baseUri),
      ref,
      json
    })
    debug('Enqueue $ref %s', ref)
  }
}

/**
   *
   * @param {URI} baseUri
   * @param {*} json
   */
function mapIds (ee, baseUri, json) {
  if (!(json instanceof Object)) return

  if (json.$id) { // TODO the $id should manage $anchor to support draft 08
    const $idUri = URI.parse(json.$id)
    let fragment = null

    if ($idUri.reference === 'absolute') {
      // "$id": "http://example.com/root.json"
      baseUri = $idUri // a new baseURI for children
    } else if ($idUri.reference === 'relative') {
      // "$id": "other.json",
      const newBaseUri = Object.assign({}, baseUri)
      newBaseUri.path = $idUri.path
      newBaseUri.fragment = $idUri.fragment
      baseUri = newBaseUri
    } else {
      // { "$id": "#bar" }
      fragment = $idUri
    }
    ee.emit('$id', json, baseUri, fragment)
  }

  const fields = Object.keys(json)
  for (const prop of fields) {
    if (prop === '$ref') {
      ee.emit('$ref', json, baseUri, json[prop])
    }
    mapIds(ee, baseUri, json[prop])
  }
}

module.exports = jsonSchemaResolver
