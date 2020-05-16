'use strict'

const URI = require('uri-js')
const cloner = require('rfdc')({ proto: true, circles: false })
const { EventEmitter } = require('events')
const debug = require('debug')('json-schema-resolver')

const kIgnore = Symbol('json-schema-resolver.ignore') // untrack a schema (usually the root one)
const kRefToDef = Symbol('json-schema-resolver.refToDef') // assign to an external json a new reference
const kConsumed = Symbol('json-schema-resolver.consumed') // when an external json has been referenced

// ! Target: DRAFT-07
// https://tools.ietf.org/html/draft-handrews-json-schema-01

// ? Open to DRAFT 08
// https://json-schema.org/draft/2019-09/json-schema-core.html

const defaultOpts = {
  target: 'draft-07',
  clone: false
}

const targetSupported = ['draft-07'] // TODO , 'draft-08'
const targetCfg = {
  'draft-07': {
    def: 'definitions'
  },
  'draft-08': {
    def: '$defs'
  }
}

// logic: https://json-schema.org/draft/2019-09/json-schema-core.html#rfc.appendix.B.1
function jsonSchemaResolver (options) {
  const ee = new EventEmitter()
  const { clone, target } = Object.assign({}, defaultOpts, options)

  if (!targetSupported.includes(target)) {
    throw new Error(`Unsupported JSON schema version ${target}`)
  }

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

    allIds.clear()
    allRefs.length = 0

    if (clone) {
      rootSchema = cloner(rootSchema)
    }

    // If present, the value for this keyword MUST be a string, and MUST
    // represent a valid URI-reference [RFC3986].  This value SHOULD be
    // normalized, and SHOULD NOT be an empty fragment <#> or an empty
    // string <>.
    const appUri = URI.parse(rootSchema.$id)
    appUri.fragment = undefined // remove fragment
    debug('Found app URI %o', appUri)

    if (externalSchemas) {
      for (const es of externalSchemas) { mapIds(ee, appUri, es) }
      debug('Processed external schemas')
    }

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
      if (!evaluatedJson) {
        debug('External $ref %s not provided', ref)
        return
      }
      evaluatedJson[kConsumed] = true
      json.$ref = `#/definitions/${evaluatedJson[kRefToDef]}`
    })

    const defKey = targetCfg[target].def
    allIds.forEach((json, baseUri) => {
      if (json[kConsumed] === true) {
        if (!rootSchema[defKey]) {
          rootSchema[defKey] = {}
        }

        rootSchema[defKey][json[kRefToDef]] = json
      }
    })

    return rootSchema
  }

  function collectIds (json, baseUri, relative) {
    if (json[kIgnore]) { return }

    const rel = (relative && URI.serialize(relative)) || ''
    const id = URI.serialize(baseUri) + rel
    if (!allIds.has(id)) {
      debug('Collected $id %s', id)
      json[kRefToDef] = `def-${rolling++}`
      allIds.set(id, json)
    } else {
      debug('WARN duplicated id %s .. IGNORED - ', id)
    }
  }

  function collectRefs (json, baseUri, refVal) {
    const refUri = URI.parse(refVal)
    debug('Pre enqueue $ref %o', refUri)

    // "same-document";
    // "relative";
    // "absolute";
    // "uri";
    if (refUri.reference === 'relative') {
      refUri.scheme = baseUri.scheme
      refUri.userinfo = baseUri.userinfo
      refUri.host = baseUri.host
      refUri.port = baseUri.port

      const newBaseUri = Object.assign({}, baseUri)
      newBaseUri.path = refUri.path
      baseUri = newBaseUri
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

  if (json.$id) {
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
  // else if (json.$anchor) {
  // TODO the $id should manage $anchor to support draft 08
  // }

  const fields = Object.keys(json)
  for (const prop of fields) {
    if (prop === '$ref') {
      ee.emit('$ref', json, baseUri, json[prop])
    }
    mapIds(ee, baseUri, json[prop])
  }
}

module.exports = jsonSchemaResolver
