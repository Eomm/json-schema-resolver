module.exports = {
  $id: 'http://example.com/SimplePerson',
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { $ref: 'relativeAddress#' },
    houses: { type: 'array', items: { $ref: 'relativeAddress#' } },
    votes: { type: 'integer', minimum: 1 }
  }
}
