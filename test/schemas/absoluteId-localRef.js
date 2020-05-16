module.exports = {
  $id: 'http://example.com/root.json',
  properties: {
    person: { $ref: '#/definitions/person' },
    children: {
      type: 'array',
      items: { $ref: '#/definitions/person' }
    }
  },
  definitions: {
    person: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' }
      }
    }
  }
}
