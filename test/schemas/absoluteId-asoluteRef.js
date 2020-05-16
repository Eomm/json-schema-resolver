module.exports = {
  $id: 'http://example.com/SimplePerson',
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { $ref: 'http://other-site.com/relativeAddress#' },
    houses: { type: 'array', items: { $ref: 'http://other-site.com/relativeAddress#' } },
    votes: { type: 'integer', minimum: 1 }
  }
}
