var alt = require('./alt')

function TestActions() {
  this.generateActions('testsComplete')
}

module.exports = alt.createActions(TestActions)
