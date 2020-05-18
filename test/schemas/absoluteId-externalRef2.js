module.exports = {
  $id: 'http://example.com/ComplexPerson',
  type: 'object',
  properties: {
    surname: { type: 'string' },
    garage: { $ref: 'relativeAddress#' },
    votes: { type: 'integer', minimum: 1 }
  }
}
