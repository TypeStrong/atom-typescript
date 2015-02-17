/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function LoadersList(list) {
	this.list = list || [];
	this.list.forEach(function(element) {
		if(element === null || typeof element !== "object")
			throw new Error("Each element of the loaders list must be an object");
	});
}
module.exports = LoadersList;

/*

# matchRegExpObject(obj, str)

tests if "str" matches "obj" with the following format:

{
	test: PART,
	include: PART,
	exclude: PART
}

PART can be
* string -> new RegExp(string)
* RegExp
* array of string of RegExp
  array is OR

*/

function asRegExp(test) {
	if(typeof test == "string") test = new RegExp("^"+test.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
	return test;
}

LoadersList.prototype.matchPart = function matchPart(str, test) {
	if(!test) return true;
	test = asRegExp(test);
	if(Array.isArray(test)) {
		return test.map(asRegExp).filter(function(regExp) {
			return regExp.test(str);
		}).length > 0;
	} else {
		return test.test(str);
	}
};

LoadersList.prototype.match = function match(str) {
	return this.list.filter(this.matchObject.bind(this, str)).map(function(element) {
		if(element.query) {
			if(!element.loader || element.loader.indexOf("!") >= 0) throw new Error("Cannot define 'query' and multiple loaders in loaders list");
			if(typeof element.query === "string") return [element.loader + "?" + element.query];
			return [element.loader + "?" + JSON.stringify(element.query)];
		}
		if(element.loader) return element.loader.split("!");
		if(element.loaders) return element.loaders;
		throw new Error("Element from loaders list should have one of the fields 'loader' or 'loaders'");
	}).reduce(function(array, r) {
		r.forEach(function(r) {
			array.push(r);
		});
		return array;
	}, []) || [];
};

LoadersList.prototype.matchObject = function matchObject(str, obj) {
	if(obj.test)
		if(!this.matchPart(str, obj.test)) return false;
	if(obj.include)
		if(!this.matchPart(str, obj.include)) return false;
	if(obj.exclude)
		if(this.matchPart(str, obj.exclude)) return false;
	return true;
};