'use strict';
var path = require('path');
function assign(target) {
    var items = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        items[_i - 1] = arguments[_i];
    }
    return items.reduce(function (target, source) {
        return Object.keys(source).reduce(function (target, key) {
            target[key] = source[key];
            return target;
        }, target);
    }, target);
}
exports.assign = assign;
function clone(target) {
    return assign(Array.isArray(target) ? [] : {}, target);
}
exports.clone = clone;
function deepClone(target) {
    return Object.keys(target).reduce(function (result, key) {
        var value = target[key];
        if (typeof value === 'object') {
            value = deepClone(value);
        }
        result[key] = value;
        return result;
    }, Array.isArray(target) ? [] : {});
}
exports.deepClone = deepClone;
function getEnumerablePropertyNames(target) {
    var result = [];
    for (var key in target) {
        result.push(key);
    }
    return result;
}
exports.getEnumerablePropertyNames = getEnumerablePropertyNames;
function mergeAll(array) {
    var results = [];
    array.forEach(function (subArray) {
        Array.prototype.push.apply(results, subArray);
    });
    return results;
}
exports.mergeAll = mergeAll;
;
function pathResolve(from, to) {
    var result = path.resolve(from, to);
    var index = result.indexOf(from[0]);
    return result.slice(index);
}
exports.pathResolve = pathResolve;
