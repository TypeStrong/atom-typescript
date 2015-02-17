/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceMapNodeSource = require("./SourceMapNodeSource");
var SourceNode = require("source-map").SourceNode;

function ConcatSource() {
	var node = new SourceNode(null, null, null, []);
	SourceMapNodeSource.call(this, node);
	Array.prototype.slice.call(arguments).forEach(function(item) {
		this.add(item);
	}, this);
}
module.exports = ConcatSource;

ConcatSource.prototype = Object.create(SourceMapNodeSource.prototype);
ConcatSource.prototype.add = function(item) {
	if(typeof item === "string")
		this._node.add(item);
	else
		this._node.add(item.node());
};
