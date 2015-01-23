/**
 * Unfortunatly, there seems to be a bug in `View`
 * that prevents it from working with util.inherits
 * from Node.js. So we'll have to do with this
 * version of inherits, because it's what CS uses.
 * See: http://discuss.atom.io/t/-/2536
 */
var inherits = function (child, parent) {
    for (var key in parent) {
        if ({}.hasOwnProperty.call(parent, key)) child[key] = parent[key];
    }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
};

module.exports = {
  inherits: inherits
};
