/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceNode = require("source-map").SourceNode;
var SourceMapConsumer = require("source-map").SourceMapConsumer;

function Source() {
	this._result = null;
}
module.exports = Source;

Source.prototype.source = function() {
	if(!this._result)
		this._result = this._bake();
	return this._result.source;
};
Source.prototype.size = function() {
	if(!this._result)
		this._result = this._bake();
	return this._result.source.length;
};
Source.prototype.map = function() {
	if(!this._result)
		this._result = this._bake();
	return this._result.map;
};
Source.prototype.node = function() {
	if(!this._result)
		this._result = this._bake();
	if(this._result.node)
		return this._result.node;
	if(this._result.map)
		return SourceNode.fromStringWithSourceMap(this._result.source, new SourceMapConsumer(this._result.map));
	return new SourceNode(null, null, null, this._result.source);
};
Source.prototype.updateHash = function(hash) {
	if(!this._result)
		this._result = this._bake();
	hash.update(this._result.source || "");
	if(this._result.map)
		hash.update(JSON.stringify(this._result.map));
};
