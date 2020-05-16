module.exports = {
  $id: 'relativeAddress',
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: { type: 'string' }
    },
    zip: { type: 'string' },
    city: { type: 'string' },
    country: { type: 'string' }
  },
  required: ['country']
}
