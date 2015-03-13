var getParameterNames = require('get-parameter-names')

function DI(registers) {
  this._registers = registers || {}
}

DI.prototype.register = function (name, fn) {
  if (typeof name === 'object') {
    Object.keys(name).forEach(function (key) {
      this._registers[key] = name[key]
    }.bind(this))
  } else {
    this._registers[name] = fn
  }
  return this
}

DI.prototype.getParameterNames = getParameterNames

DI.prototype.inject = function (fn, additionalDependencies) {
  var params = getParameterNames(fn)

  if (additionalDependencies) {
    Object.keys(additionalDependencies).forEach(function (dependency) {
      this.register(dependency, additionalDependencies[dependency])
    }.bind(this))
  }

  var dependencies = params.map(function (param) {
    if (this._registers.hasOwnProperty(param)) {
      return this._registers[param]
    }

    throw new ReferenceError(
      '`' + param + '` was defined but ' +
      'not registered with dependency-injector'
    )
  }.bind(this))

  return function () {
    return fn.apply(fn, dependencies)
  }
}

DI.prototype.clone = function () {
  return new DI(this._registers)
}

module.exports = DI
