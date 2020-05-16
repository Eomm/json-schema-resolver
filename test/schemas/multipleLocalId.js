module.exports = {
  $id: 'http://example.com',
  type: 'object',
  properties: {
    home: { $ref: '#address' },
    work: { $ref: '#address' }
  },
  definitions: {
    foo: {
      $id: '#address',
      type: 'object',
      properties: {
        city: { type: 'string' }
      }
    }
  }
}
