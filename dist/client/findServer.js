"use strict";
var fs = require("fs");
var path = require("path");
function findTypescriptServers(root) {
    var results = [];
    if (!path.isAbsolute(root)) {
        throw new Error("Argument should be an absolute path");
    }
    return new Promise(function (resolve) {
        walk(root, function () {
            resolve(results);
        });
    });
    function walk(dir, done) {
        fs.readdir(dir, function (err, files) {
            if (err || files.length === 0)
                return done();
            var doneEntry = after(files.length, function () {
                done();
            });
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var entry = files_1[_i];
                if (entry === "node_modules") {
                    fs.stat(path.join(dir, entry, "typescript"), function (err) {
                        if (err) {
                            doneEntry();
                        }
                        else {
                            getServerInfo(dir, function (err, info) {
                                if (info)
                                    results.push(info);
                                doneEntry();
                            });
                        }
                    });
                }
                else if (entry === ".git" || entry === "bower_components") {
                    doneEntry();
                }
                else {
                    walk(path.join(dir, entry), doneEntry);
                }
            }
        });
    }
}
exports.findTypescriptServers = findTypescriptServers;
function getServerInfo(prefix, callback) {
    var tsDir = path.join(prefix, "node_modules", "typescript");
    fs.readFile(path.join(tsDir, "package.json"), "utf8", function (err, pkg) {
        if (err)
            return callback(err, null);
        try {
            var version_1 = JSON.parse(pkg).version;
            var tsServerPath_1 = path.join(tsDir, "bin", "tsserver");
            fs.stat(tsServerPath_1, function (err, stat) {
                if (err)
                    return callback(err, null);
                callback(null, {
                    binPath: tsServerPath_1,
                    prefix: prefix,
                    version: version_1
                });
            });
        }
        catch (error) {
            callback(error, null);
        }
    });
}
function after(count, callback) {
    var called = 0;
    return function () {
        called++;
        if (called >= count) {
            callback.apply(this, arguments);
        }
    };
}
