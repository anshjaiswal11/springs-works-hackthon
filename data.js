function makeSeed() {
  return {
    checksCatalog: [
      { id: 'IDENTITY', name: 'Identity Check', price: 299, vendorCost: 120 },
      { id: 'EDUCATION', name: 'Education Check', price: 499, vendorCost: 210 },
      { id: 'EMPLOYMENT', name: 'Employment Check', price: 999, vendorCost: 450 },
      { id: 'ADDRESS', name: 'Address Check', price: 349, vendorCost: 150 },
      { id: 'CRIMINAL', name: 'Criminal Record Check', price: 599, vendorCost: 260 },
      { id: 'CREDIT', name: 'Credit Check', price: 249, vendorCost: 90 }
    ]
  };
}

module.exports = { makeSeed };
