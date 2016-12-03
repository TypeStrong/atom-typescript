"use strict";
const fs = require("fs");
const path = require("path");
function findTypescriptServers(root) {
    const results = [];
    if (!path.isAbsolute(root)) {
        throw new Error("Argument should be an absolute path");
    }
    return new Promise(resolve => {
        walk(root, () => {
            resolve(results);
        });
    });
    function walk(dir, done) {
        fs.readdir(dir, (err, files) => {
            if (err || files.length === 0)
                return done();
            const doneEntry = after(files.length, () => {
                done();
            });
            for (const entry of files) {
                if (entry === "node_modules") {
                    fs.stat(path.join(dir, entry, "typescript"), err => {
                        if (err) {
                            doneEntry();
                        }
                        else {
                            getServerInfo(dir, (err, info) => {
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
    const tsDir = path.join(prefix, "node_modules", "typescript");
    fs.readFile(path.join(tsDir, "package.json"), "utf8", (err, pkg) => {
        if (err)
            return callback(err, null);
        try {
            const version = JSON.parse(pkg).version;
            const tsServerPath = path.join(tsDir, "bin", "tsserver");
            fs.stat(tsServerPath, (err, stat) => {
                if (err)
                    return callback(err, null);
                callback(null, {
                    binPath: tsServerPath,
                    prefix,
                    version
                });
            });
        }
        catch (error) {
            callback(error, null);
        }
    });
}
function after(count, callback) {
    let called = 0;
    return function () {
        called++;
        if (called >= count) {
            callback.apply(this, arguments);
        }
    };
}
