/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceNode = require("source-map").SourceNode;
var SourceMapConsumer = require("source-map").SourceMapConsumer;
var SourceMapGenerator = require("source-map").SourceMapGenerator;
var SourceMapNodeSource = require("./SourceMapNodeSource");

function SourceMapSource(value, name, sourceMap, originalSource, innerSourceMap) {
	if(innerSourceMap) {
		innerSourceMap = new SourceMapConsumer(innerSourceMap);
		sourceMap = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(sourceMap));
		sourceMap.setSourceContent(name, originalSource);
		sourceMap.applySourceMap(innerSourceMap, name);
		sourceMap = sourceMap.toJSON();
	}
	var node = SourceNode.fromStringWithSourceMap(value, new SourceMapConsumer(sourceMap));
	SourceMapNodeSource.call(this, node);
	this._value = value;
	this._name = name;
}
module.exports = SourceMapSource;

SourceMapSource.prototype = Object.create(SourceMapNodeSource.prototype);
SourceMapSource.prototype.source = function() {
	return this._value;
};
SourceMapSource.prototype.updateHash = function(hash) {
	hash.update(this._value);
	hash.update(this._name);
};
