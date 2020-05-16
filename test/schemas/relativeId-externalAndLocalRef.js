module.exports = {
  $id: 'relativePerson',
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: { $ref: 'relativeAddress#' },
    friends: { type: 'array', items: { $ref: '#' } },
    votes: { type: 'integer', minimum: 1 }
  }
}
