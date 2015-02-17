/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var SourceMapNodeSource = require("./SourceMapNodeSource");
var SourceNode = require("source-map").SourceNode;
var SourceMapConsumer = require("source-map").SourceMapConsumer;

function ReplaceSource(source, name) {
	SourceMapNodeSource.call(this, null, name);
	this._source = source;
	this.replacements = [];
}
module.exports = ReplaceSource;

ReplaceSource.prototype = Object.create(SourceMapNodeSource.prototype);

ReplaceSource.prototype.replace = function(start, end, newValue) {
	this.replacements.push([start, end, newValue]);
};

ReplaceSource.prototype.insert = function(pos, newValue) {
	this.replacements.push([pos, pos-1, newValue]);
};

ReplaceSource.prototype._bake = function() {
	this.replacements.sort(function(a, b) {
		return b[1] - a[1];
	});
	var result = [this._source.node()];
	this.replacements.forEach(function(repl) {
		var remSource = result.pop();
		var splitted1 = this._splitSourceNode(remSource, Math.floor(repl[1]+1));
		if(Array.isArray(splitted1)) {
			var splitted2 = this._splitSourceNode(splitted1[0], Math.floor(repl[0]));
			if(Array.isArray(splitted2)) {
				result.push(splitted1[1], this._replacementToSourceNode(splitted2[1], repl[2]), splitted2[0]);
			} else {
				result.push(splitted1[1], this._replacementToSourceNode(splitted1[1], repl[2]), splitted1[0]);
			}
		} else {
			var splitted2 = this._splitSourceNode(remSource, Math.floor(repl[0]));
			if(Array.isArray(splitted2)) {
				result.push(this._replacementToSourceNode(splitted2[1], repl[2]), splitted2[0]);
			} else {
				result.push(repl[2], remSource);
			}
		}
	}, this);
	result = result.reverse();
	return new SourceNode(null, null, null, result);
};

ReplaceSource.prototype._replacementToSourceNode = function(oldNode, newString) {
	var map = oldNode.toStringWithSourceMap({ file: "?" }).map;
	var original = new SourceMapConsumer(map.toJSON()).originalPositionFor({ line: 1, column: 0 });
	if(original) {
		return new SourceNode(original.line, original.column, original.source, newString);
	} else {
		return newString;
	}
};

ReplaceSource.prototype._splitSourceNode = function(node, position) {
	if(typeof node === "string") {
		if(node.length <= position) return position - node.length;
		return [node.substr(0, position), node.substr(position)];
	} else {
		for(var i = 0; i < node.children.length; i++) {
			position = this._splitSourceNode(node.children[i], position);
			if(Array.isArray(position)) {
				var leftNode = new SourceNode(
					node.line,
					node.column,
					node.source,
					node.children.slice(0, i).concat([position[0]]),
					node.name
				);
				var rightNode = new SourceNode(
					node.line,
					node.column,
					node.source,
					[position[1]].concat(node.children.slice(i+1)),
					node.name
				);
				leftNode.sourceContents = node.sourceContents;
				return [leftNode, rightNode];
			}
		}
		return position;
	}
};