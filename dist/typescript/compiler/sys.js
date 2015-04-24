/// <reference path="core.ts"/>
var ts;
(function (ts) {
    ts.sys = (function () {
        function getWScriptSystem() {
            var fso = new ActiveXObject("Scripting.FileSystemObject");
            var fileStream = new ActiveXObject("ADODB.Stream");
            fileStream.Type = 2;
            var binaryStream = new ActiveXObject("ADODB.Stream");
            binaryStream.Type = 1;
            var args = [];
            for (var i = 0; i < WScript.Arguments.length; i++) {
                args[i] = WScript.Arguments.Item(i);
            }
            function readFile(fileName, encoding) {
                if (!fso.FileExists(fileName)) {
                    return undefined;
                }
                fileStream.Open();
                try {
                    if (encoding) {
                        fileStream.Charset = encoding;
                        fileStream.LoadFromFile(fileName);
                    }
                    else {
                        fileStream.Charset = "x-ansi";
                        fileStream.LoadFromFile(fileName);
                        var bom = fileStream.ReadText(2) || "";
                        fileStream.Position = 0;
                        fileStream.Charset = bom.length >= 2 && (bom.charCodeAt(0) === 0xFF && bom.charCodeAt(1) === 0xFE || bom.charCodeAt(0) === 0xFE && bom.charCodeAt(1) === 0xFF) ? "unicode" : "utf-8";
                    }
                    return fileStream.ReadText();
                }
                catch (e) {
                    throw e;
                }
                finally {
                    fileStream.Close();
                }
            }
            function writeFile(fileName, data, writeByteOrderMark) {
                fileStream.Open();
                binaryStream.Open();
                try {
                    fileStream.Charset = "utf-8";
                    fileStream.WriteText(data);
                    if (writeByteOrderMark) {
                        fileStream.Position = 0;
                    }
                    else {
                        fileStream.Position = 3;
                    }
                    fileStream.CopyTo(binaryStream);
                    binaryStream.SaveToFile(fileName, 2);
                }
                finally {
                    binaryStream.Close();
                    fileStream.Close();
                }
            }
            function getNames(collection) {
                var result = [];
                for (var e = new Enumerator(collection); !e.atEnd(); e.moveNext()) {
                    result.push(e.item().Name);
                }
                return result.sort();
            }
            function readDirectory(path, extension) {
                var result = [];
                visitDirectory(path);
                return result;
                function visitDirectory(path) {
                    var folder = fso.GetFolder(path || ".");
                    var files = getNames(folder.files);
                    for (var _i = 0; _i < files.length; _i++) {
                        var name_1 = files[_i];
                        if (!extension || ts.fileExtensionIs(name_1, extension)) {
                            result.push(ts.combinePaths(path, name_1));
                        }
                    }
                    var subfolders = getNames(folder.subfolders);
                    for (var _a = 0; _a < subfolders.length; _a++) {
                        var current = subfolders[_a];
                        visitDirectory(ts.combinePaths(path, current));
                    }
                }
            }
            return {
                args: args,
                newLine: "\r\n",
                useCaseSensitiveFileNames: false,
                write: function (s) {
                    WScript.StdOut.Write(s);
                },
                readFile: readFile,
                writeFile: writeFile,
                resolvePath: function (path) {
                    return fso.GetAbsolutePathName(path);
                },
                fileExists: function (path) {
                    return fso.FileExists(path);
                },
                directoryExists: function (path) {
                    return fso.FolderExists(path);
                },
                createDirectory: function (directoryName) {
                    if (!this.directoryExists(directoryName)) {
                        fso.CreateFolder(directoryName);
                    }
                },
                getExecutingFilePath: function () {
                    return WScript.ScriptFullName;
                },
                getCurrentDirectory: function () {
                    return new ActiveXObject("WScript.Shell").CurrentDirectory;
                },
                readDirectory: readDirectory,
                exit: function (exitCode) {
                    try {
                        WScript.Quit(exitCode);
                    }
                    catch (e) {
                    }
                }
            };
        }
        function getNodeSystem() {
            var _fs = require("fs");
            var _path = require("path");
            var _os = require('os');
            var platform = _os.platform();
            var useCaseSensitiveFileNames = platform !== "win32" && platform !== "win64" && platform !== "darwin";
            function readFile(fileName, encoding) {
                if (!_fs.existsSync(fileName)) {
                    return undefined;
                }
                var buffer = _fs.readFileSync(fileName);
                var len = buffer.length;
                if (len >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
                    len &= ~1;
                    for (var i = 0; i < len; i += 2) {
                        var temp = buffer[i];
                        buffer[i] = buffer[i + 1];
                        buffer[i + 1] = temp;
                    }
                    return buffer.toString("utf16le", 2);
                }
                if (len >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
                    return buffer.toString("utf16le", 2);
                }
                if (len >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
                    return buffer.toString("utf8", 3);
                }
                return buffer.toString("utf8");
            }
            function writeFile(fileName, data, writeByteOrderMark) {
                if (writeByteOrderMark) {
                    data = '\uFEFF' + data;
                }
                _fs.writeFileSync(fileName, data, "utf8");
            }
            function readDirectory(path, extension) {
                var result = [];
                visitDirectory(path);
                return result;
                function visitDirectory(path) {
                    var files = _fs.readdirSync(path || ".").sort();
                    var directories = [];
                    for (var _i = 0; _i < files.length; _i++) {
                        var current = files[_i];
                        var name = ts.combinePaths(path, current);
                        var stat = _fs.lstatSync(name);
                        if (stat.isFile()) {
                            if (!extension || ts.fileExtensionIs(name, extension)) {
                                result.push(name);
                            }
                        }
                        else if (stat.isDirectory()) {
                            directories.push(name);
                        }
                    }
                    for (var _a = 0; _a < directories.length; _a++) {
                        var current = directories[_a];
                        visitDirectory(current);
                    }
                }
            }
            return {
                args: process.argv.slice(2),
                newLine: _os.EOL,
                useCaseSensitiveFileNames: useCaseSensitiveFileNames,
                write: function (s) {
                    _fs.writeSync(1, s);
                },
                readFile: readFile,
                writeFile: writeFile,
                watchFile: function (fileName, callback) {
                    _fs.watchFile(fileName, { persistent: true, interval: 250 }, fileChanged);
                    return {
                        close: function () { _fs.unwatchFile(fileName, fileChanged); }
                    };
                    function fileChanged(curr, prev) {
                        if (+curr.mtime <= +prev.mtime) {
                            return;
                        }
                        callback(fileName);
                    }
                    ;
                },
                resolvePath: function (path) {
                    return _path.resolve(path);
                },
                fileExists: function (path) {
                    return _fs.existsSync(path);
                },
                directoryExists: function (path) {
                    return _fs.existsSync(path) && _fs.statSync(path).isDirectory();
                },
                createDirectory: function (directoryName) {
                    if (!this.directoryExists(directoryName)) {
                        _fs.mkdirSync(directoryName);
                    }
                },
                getExecutingFilePath: function () {
                    return __filename;
                },
                getCurrentDirectory: function () {
                    return process.cwd();
                },
                readDirectory: readDirectory,
                getMemoryUsage: function () {
                    if (global.gc) {
                        global.gc();
                    }
                    return process.memoryUsage().heapUsed;
                },
                exit: function (exitCode) {
                    process.exit(exitCode);
                }
            };
        }
        if (typeof WScript !== "undefined" && typeof ActiveXObject === "function") {
            return getWScriptSystem();
        }
        else if (typeof module !== "undefined" && module.exports) {
            return getNodeSystem();
        }
        else {
            return undefined;
        }
    })();
})(ts || (ts = {}));
