var fs = require("fs");
var OutOfContextCache = (function () {
    function OutOfContextCache() {
        this.files = {};
    }
    OutOfContextCache.prototype.setFileOutOfContext = function (fileName) {
        var timestamp = this.files[fileName];
        if (!timestamp) {
            console.log("Marking file " + fileName + " as out of context.");
            this.files[fileName] = OutOfContextCache.getCurrentMS() + OutOfContextCache.OutOfContextTimeoutInMS;
        }
    };
    OutOfContextCache.prototype.setFileOutOfContextIfExists = function (fileName) {
        if (fs.existsSync(fileName)) {
            this.setFileOutOfContext(fileName);
            return true;
        }
        return false;
    };
    OutOfContextCache.prototype.isOutOfContext = function (fileName) {
        try {
            var timestamp = this.files[fileName];
            return (timestamp && !OutOfContextCache.shouldRecheck(timestamp));
        }
        catch (ex) {
            return false;
        }
    };
    OutOfContextCache.getCurrentMS = function () {
        return new Date().getTime();
    };
    OutOfContextCache.shouldRecheck = function (timestamp) {
        return (timestamp + OutOfContextCache.OutOfContextTimeoutInMS < OutOfContextCache.getCurrentMS());
    };
    OutOfContextCache.OutOfContextTimeoutInMS = 30000;
    return OutOfContextCache;
})();
exports.OutOfContextCache = OutOfContextCache;
