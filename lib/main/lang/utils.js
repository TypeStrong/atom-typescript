'use strict';
var path = require('path');
function mapValues(map) {
    return Object.keys(map).reduce(function (result, key) {
        result.push(map[key]);
        return result;
    }, []);
}
exports.mapValues = mapValues;
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
function createMap(arr) {
    return arr.reduce(function (result, key) {
        result[key] = true;
        return result;
    }, {});
}
exports.createMap = createMap;
function pathResolve(from, to) {
    var result = path.resolve(from, to);
    var index = result.indexOf(from[0]);
    return result.slice(index);
}
exports.pathResolve = pathResolve;
var Signal = (function () {
    function Signal() {
        this.listeners = [];
        this.priorities = [];
    }
    Signal.prototype.add = function (listener, priority) {
        if (priority === void 0) { priority = 0; }
        var index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.priorities[index] = priority;
            return;
        }
        for (var i = 0, l = this.priorities.length; i < l; i++) {
            if (this.priorities[i] < priority) {
                this.priorities.splice(i, 0, priority);
                this.listeners.splice(i, 0, listener);
                return;
            }
        }
        this.priorities.push(priority);
        this.listeners.push(listener);
    };
    Signal.prototype.remove = function (listener) {
        var index = this.listeners.indexOf(listener);
        if (index >= 0) {
            this.priorities.splice(index, 1);
            this.listeners.splice(index, 1);
        }
    };
    Signal.prototype.dispatch = function (parameter) {
        var hasBeenCanceled = this.listeners.every(function (listener) {
            var result = listener(parameter);
            return result !== false;
        });
        return hasBeenCanceled;
    };
    Signal.prototype.clear = function () {
        this.listeners = [];
        this.priorities = [];
    };
    Signal.prototype.hasListeners = function () {
        return this.listeners.length > 0;
    };
    return Signal;
})();
exports.Signal = Signal;
function binarySearch(array, value) {
    var low = 0;
    var high = array.length - 1;
    while (low <= high) {
        var middle = low + ((high - low) >> 1);
        var midValue = array[middle];
        if (midValue === value) {
            return middle;
        }
        else if (midValue > value) {
            high = middle - 1;
        }
        else {
            low = middle + 1;
        }
    }
    return ~low;
}
exports.binarySearch = binarySearch;
function selectMany(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            result.push(arr[i][j]);
        }
    }
    return result;
}
exports.selectMany = selectMany;
function pathIsRelative(str) {
    if (!str.length)
        return false;
    return str[0] == '.' || str.substring(0, 2) == "./" || str.substring(0, 3) == "../";
}
exports.pathIsRelative = pathIsRelative;
var Dict = (function () {
    function Dict() {
        this.table = Object.create(null);
    }
    Dict.prototype.setValue = function (key, item) {
        this.table[key] = item;
    };
    Dict.prototype.getValue = function (key) {
        return this.table[key];
    };
    Dict.prototype.clearValue = function (key) {
        delete this.table[key];
    };
    Dict.prototype.clearAll = function () {
        this.table = Object.create(null);
    };
    Dict.prototype.keys = function () {
        return Object.keys(this.table);
    };
    Dict.prototype.values = function () {
        var array = [];
        for (var key in this.table) {
            array.push(this.table[key]);
        }
        return array;
    };
    return Dict;
})();
exports.Dict = Dict;
