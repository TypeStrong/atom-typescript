/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Source = require("./Source");

function RawSource(value) {
	Source.call(this);
	this._value = value;
}
module.exports = RawSource;

RawSource.prototype = Object.create(Source.prototype);
RawSource.prototype._bake = function() {
	return {
		source: this._value
	};
};