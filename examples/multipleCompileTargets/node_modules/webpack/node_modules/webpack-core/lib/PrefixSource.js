/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceMapNodeSource = require("./SourceMapNodeSource");
var SourceNode = require("source-map").SourceNode;

function PrefixSource(prefix, source) {
	var node = source.node();
	var append = [prefix];
	node = new SourceNode(null, null, null, [
		this._cloneAndPrefix(node, prefix, append)
	]);
	SourceMapNodeSource.call(this, node);
}
module.exports = PrefixSource;

PrefixSource.prototype = Object.create(SourceMapNodeSource.prototype);
PrefixSource.prototype._cloneAndPrefix = function cloneAndPrefix(node, prefix, append) {
	if(typeof node === "string") {
		var result = node.replace(/\n(.)/g, "\n" + prefix + "$1");
		if(append.length > 0) result = append.pop() + result;
		if(/\n$/.test(node)) append.push(prefix);
		return result;
	} else {
		var newNode = new SourceNode(
			node.line,
			node.column,
			node.source,
			node.children.map(function(node) {
				return cloneAndPrefix(node, prefix, append);
			}),
			node.name
		);
		newNode.sourceContents = node.sourceContents;
		return newNode;
	}
};
