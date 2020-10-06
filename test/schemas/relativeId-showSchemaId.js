module.exports = {
  $id: 'personPhoneNumbers',
  type: 'object',
  properties: {
    personal: {
      type: 'object',
      homeNumber: {
        $ref: '#/definitions/phoneNumber'
      },
      mobilePhoneNumber: {
        $ref: '#/definitions/phoneNumber'
      }
    },
    work: {
      $ref: '#/definitions/phoneNumber'
    }
  }
}
