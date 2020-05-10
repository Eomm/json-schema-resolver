'use strict'

const URI = require('uri-js')
const { EventEmitter } = require('events')

// Target: DRAFT-07
// https://tools.ietf.org/html/draft-handrews-json-schema-01

// Open to DRAFT 08
// https://json-schema.org/draft/2019-09/json-schema-core.html

// TODO logic: https://json-schema.org/draft/2019-09/json-schema-core.html#rfc.appendix.B.1
function jschemaResolver (rootSchema, options) {
  const opts = options || {}
  const { externalSchemas } = opts

  // If present, the value for this keyword MUST be a string, and MUST
  // represent a valid URI-reference [RFC3986].  This value SHOULD be
  // normalized, and SHOULD NOT be an empty fragment <#> or an empty
  // string <>.
  const idExploded = URI.parse(rootSchema.$id)
  idExploded.fragment = undefined // remove fragment

  const baseUri = URI.serialize(idExploded) // canonical absolute-URI
  rootSchema.$id = baseUri // fix the schema $id value

  const allIds = new Map()
  const allRefs = []

  if (externalSchemas) {
    externalSchemas.forEach(_ => {
      const ids = mapIds(idExploded, _)
      ids.on('$id', collectIds)
      ids.on('$ref', collectRefs)
    })
  }
  const ids = mapIds(idExploded, rootSchema)
  ids.on('$id', collectIds)
  ids.on('$ref', collectRefs)

  // TODO attach every external schema to rootSchema/definition (or $defs for draft 08)
  // TODO rewrite all the $ref pointing to /definitions

  return {

  }

  function collectIds (json, baseUri, relative) {
    const rel = (relative && URI.serialize(relative)) || ''
    const id = URI.serialize(baseUri) + rel
    console.log(id)
    if (allIds.has(id)) {
      console.log('WARN duplicated id .. IGNORED - ' + id)
    } else {
      allIds.set(id, json)
    }
  }

  function collectRefs (json, baseUri, refVal) {
    const refUri = URI.parse(refVal)
    console.log('Ref: ' + URI.serialize(refUri))

    if (refUri.reference !== 'absolute') {
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

    allRefs.push({
      baseUri: URI.serialize(baseUri),
      ref: URI.serialize(refUri),
      json
    })
  }
}

function mapIds (baseUri, schema) {
  const ee = new EventEmitter()
  process.nextTick(() => { search(baseUri, schema) })
  return ee

  /**
   *
   * @param {URI} baseUri
   * @param {*} json
   */
  function search (baseUri, json) {
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
      search(baseUri, json[prop])
    }
  }
}

module.exports = jschemaResolver
