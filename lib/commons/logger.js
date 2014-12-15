'use strict';
var currentLogLevel = 1 /* error */;
function information() {
    return currentLogLevel >= 4 /* information */;
}
exports.information = information;
function debug() {
    return currentLogLevel >= 3 /* debug */;
}
exports.debug = debug;
function warning() {
    return currentLogLevel >= 2 /* warning */;
}
exports.warning = warning;
function error() {
    return currentLogLevel >= 1 /* error */;
}
exports.error = error;
function fatal() {
    return currentLogLevel >= 0 /* fatal */;
}
exports.fatal = fatal;
function log(s) {
    console.log(s);
}
exports.log = log;
(function (Level) {
    Level[Level["fatal"] = 0] = "fatal";
    Level[Level["error"] = 1] = "error";
    Level[Level["warning"] = 2] = "warning";
    Level[Level["debug"] = 3] = "debug";
    Level[Level["information"] = 4] = "information";
})(exports.Level || (exports.Level = {}));
var Level = exports.Level;
function setLogLevel(level) {
    currentLogLevel = Level[level];
}
exports.setLogLevel = setLogLevel;
var LogingClass = (function () {
    function LogingClass() {
        this.information = information;
        this.debug = debug;
        this.warning = warning;
        this.error = error;
        this.fatal = fatal;
        this.log = log;
    }
    return LogingClass;
})();
exports.LogingClass = LogingClass;
