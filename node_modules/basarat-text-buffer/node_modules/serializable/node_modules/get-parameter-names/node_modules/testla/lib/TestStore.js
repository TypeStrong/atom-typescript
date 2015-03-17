var alt = require('./alt')
var TestActions = require('./TestActions')

function TestStore() {
  this.bindActions(TestActions)
  this.results = []
}
TestStore.prototype.onTestsComplete = function (results) {
  this.results = results
}

module.exports = alt.createStore(TestStore)
