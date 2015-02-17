/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Source = require("./Source");

function SourceMapNodeSource(node, name) {
	Source.call(this);
	this._node = node;
	this._name = name;
}
module.exports = SourceMapNodeSource;

SourceMapNodeSource.prototype = Object.create(Source.prototype);
SourceMapNodeSource.prototype._bake = function() {
	throw new Error("Overwrite or pass valid SourceNode to constructor");
};
SourceMapNodeSource.prototype.source = function() {
	if(!this._node) this._node = this._bake();
	if(!this._sourceResult) {
		this._sourceResult = this._node.toString();
	}
	return this._sourceResult;
};
SourceMapNodeSource.prototype.map = function() {
	if(!this._node) this._node = this._bake();
	if(!this._mapResult) {
		this._mapResult = this._node.toStringWithSourceMap({
			file: this._name
		}).map.toJSON();
	}
	return this._mapResult;
};
SourceMapNodeSource.prototype.size = function() {
	if(!this._node) this._node = this._bake();
	if(!this._sizeResult) {
		this._sizeResult = sizeOfNode(this._node);
	}
	return this._sizeResult;
};
SourceMapNodeSource.prototype.node = function() {
	if(!this._node) this._node = this._bake();
	return this._node;
};
SourceMapNodeSource.prototype.updateHash = function(hash) {
	if(!this._node) this._node = this._bake();
	updateHashForNode(this._node, hash);
};
function updateHashForNode(node, hash) {
	hash.update(node.source + "");
	hash.update(node.line + "");
	hash.update(node.column + "");
	hash.update(node.name + "");
	var c = node.children;
	for(var i = 0; i < c.length; i++) {
		var x = c[i];
		if(typeof x === "string") hash.update(x);
		else updateHashForNode(x, hash);
	}
}
function sizeOfNode(node) {
	var c = node.children;
	var s = 0;
	for(var i = 0; i < c.length; i++) {
		var x = c[i];
		if(typeof x === "string") s += x.length;
		else s += sizeOfNode(x);
	}
	return s;
}
