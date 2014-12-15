'use strict';
var StringSet = (function () {
    function StringSet(array) {
        this.map = Object.create(null);
        if (array) {
            for (var i = 0, l = array.length; i < l; i++) {
                this.add(array[i]);
            }
        }
    }
    StringSet.prototype.add = function (value) {
        this.map[value] = true;
    };
    StringSet.prototype.remove = function (value) {
        delete this.map[value];
    };
    StringSet.prototype.has = function (value) {
        return !!this.map[value];
    };
    Object.defineProperty(StringSet.prototype, "values", {
        get: function () {
            return Object.keys(this.map);
        },
        enumerable: true,
        configurable: true
    });
    return StringSet;
})();
exports.StringSet = StringSet;
;
var StringMap = (function () {
    function StringMap(obj) {
        var _this = this;
        this.map = Object.create(null);
        this.mascot = {};
        if (obj) {
            Object.keys(obj).forEach(function (key) { return _this.map[key] = obj[key]; });
        }
    }
    StringMap.prototype.set = function (key, value) {
        this.map[key] = (typeof value === 'undefined' ? this.mascot : value);
    };
    StringMap.prototype.get = function (key) {
        var value = this.map[key];
        return value === this.mascot ? undefined : value;
    };
    StringMap.prototype.delete = function (key) {
        return delete this.map[key];
    };
    StringMap.prototype.has = function (key) {
        return typeof this.map[key] !== 'undefined';
    };
    StringMap.prototype.clear = function () {
        this.map = Object.create(null);
    };
    Object.defineProperty(StringMap.prototype, "keys", {
        get: function () {
            return Object.keys(this.map);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StringMap.prototype, "values", {
        get: function () {
            var _this = this;
            return Object.keys(this.map).map(function (key) { return _this.map[key]; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StringMap.prototype, "entries", {
        get: function () {
            var _this = this;
            return Object.keys(this.map).map(function (key) {
                return {
                    key: key,
                    value: _this.map[key]
                };
            });
        },
        enumerable: true,
        configurable: true
    });
    StringMap.prototype.toObject = function () {
        var _this = this;
        return Object.keys(this.map).reduce(function (obj, key) {
            obj[key] = _this.map[key];
            return obj;
        }, {});
    };
    StringMap.prototype.clone = function () {
        return new StringMap(this.toObject());
    };
    return StringMap;
})();
exports.StringMap = StringMap;
