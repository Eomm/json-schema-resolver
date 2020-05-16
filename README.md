# json-schema-resolver

[![CI](https://github.com/Eomm/json-schema-resolver/workflows/ci/badge.svg)](https://github.com/Eomm/json-schema-resolver/actions?query=workflow%3Aci)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

Resolve all `$refs` in your [JSON schema](https://json-schema.org/specification.html)!


## Install

```sh
npm install json-schema-resolver
```

This plugin support Node.js >= 10

## Usage

```js
const RefResolver = require('json-schema-resolver')

const ref = RefResolver({
  clone: true // Clone the input schema without changing it. Default: false
})

const inputSchema = {
  $id: 'http://example.com/SimplePerson',
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { $ref: 'relativeAddress#' },
    houses: { type: 'array', items: { $ref: 'relativeAddress#' } }
  }
}

const addresSchema = {
  $id: 'relativeAddress', // Note: prefer always absolute URI like: http://mysite.com
  type: 'object',
  properties: {
    zip: { type: 'string' },
    city: { type: 'string' }
  }
}

const singleSchema = ref.resolve(inputSchema, { externalSchemas: [addresSchema] })
// mySchema is untouched thanks to clone:true
```

`singleSchema` will be like:

```json
{
  "$id": "http://example.com/SimplePerson",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "address": {
      "$ref": "#/definitions/def-0"
    },
    "houses": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/def-0"
      }
    }
  },
  "definitions": {
    "def-0": {
      "$id": "relativeAddress",
      "type": "object",
      "properties": {
        "zip": {
          "type": "string"
        },
        "city": {
          "type": "string"
        }
      }
    }
  }
}
```

## License

Licensed under [MIT](./LICENSE).
