'use strict';
const path = require("path");
function mapValues(map) {
    return Object.keys(map).reduce((result, key) => {
        result.push(map[key]);
        return result;
    }, []);
}
exports.mapValues = mapValues;
function assign(target, ...items) {
    return items.reduce(function (target, source) {
        return Object.keys(source).reduce((target, key) => {
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
    return arr.reduce((result, key) => {
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
class Signal {
    constructor() {
        this.listeners = [];
        this.priorities = [];
    }
    add(listener, priority = 0) {
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
    }
    remove(listener) {
        var index = this.listeners.indexOf(listener);
        if (index >= 0) {
            this.priorities.splice(index, 1);
            this.listeners.splice(index, 1);
        }
    }
    dispatch(parameter) {
        var hasBeenCanceled = this.listeners.every((listener) => {
            var result = listener(parameter);
            return result !== false;
        });
        return hasBeenCanceled;
    }
    clear() {
        this.listeners = [];
        this.priorities = [];
    }
    hasListeners() {
        return this.listeners.length > 0;
    }
}
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
class Dict {
    constructor() {
        this.table = Object.create(null);
    }
    setValue(key, item) {
        this.table[key] = item;
    }
    getValue(key) { return this.table[key]; }
    clearValue(key) {
        delete this.table[key];
    }
    clearAll() { this.table = Object.create(null); }
    keys() { return Object.keys(this.table); }
    values() {
        var array = [];
        for (var key in this.table) {
            array.push(this.table[key]);
        }
        return array;
    }
}
exports.Dict = Dict;
function delay(seconds = 2) {
    delayMilliseconds(seconds * 1000);
}
exports.delay = delay;
;
function delayMilliseconds(milliseconds = 100) {
    var d1 = new Date();
    var d2 = new Date();
    while (d2.valueOf() < d1.valueOf() + milliseconds) {
        d2 = new Date();
    }
}
exports.delayMilliseconds = delayMilliseconds;
;
var now = () => new Date().getTime();
function debounce(func, milliseconds, immediate = false) {
    var timeout, args, context, timestamp, result;
    var wait = milliseconds;
    var later = function () {
        var last = now() - timestamp;
        if (last < wait && last > 0) {
            timeout = setTimeout(later, wait - last);
        }
        else {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
                if (!timeout)
                    context = args = null;
            }
        }
    };
    return function () {
        context = this;
        args = arguments;
        timestamp = now();
        var callNow = immediate && !timeout;
        if (!timeout)
            timeout = setTimeout(later, wait);
        if (callNow) {
            result = func.apply(context, args);
            context = args = null;
        }
        return result;
    };
}
exports.debounce = debounce;
;
var punctuations = createMap([';', '{', '}', '(', ')', '.', ':', '<', '>', "'", '"']);
exports.prefixEndsInPunctuation = (prefix) => prefix.length && prefix.trim().length && punctuations[prefix.trim()[prefix.trim().length - 1]];
var nameExtractorRegex = /return (.*);/;
function getName(nameLambda) {
    var m = nameExtractorRegex.exec(nameLambda + "");
    if (m == null)
        throw new Error("The function does not contain a statement matching 'return variableName;'");
    var access = m[1].split('.');
    return access[access.length - 1];
}
exports.getName = getName;
function distinct(arr) {
    var map = createMap(arr);
    return Object.keys(map);
}
exports.distinct = distinct;
