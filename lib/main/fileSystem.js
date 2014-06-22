'use strict';
var collections = require('../commons/collections');
var signal = require('../commons/signal');
var Promise = require('bluebird');
var fs = require('../commons/fileSystem');

var FileSystem = (function () {
    function FileSystem(nativeFileSystem, projectManager) {
        var _this = this;
        this.nativeFileSystem = nativeFileSystem;
        this.projectManager = projectManager;
        this.filesContent = new collections.StringMap();
        this.filesPath = [];
        this.initialized = false;
        this.initializationStack = [];
        this._projectFilesChanged = new signal.Signal();
        this.changesHandler = function (event, file) {
            if (!file) {
                var oldPathsSet = new collections.StringSet(), oldFilesContent = _this.filesContent.clone(), oldPaths = _this.filesPath.map(function (path) {
                    oldPathsSet.add(path);
                    return path;
                });

                _this.initialized = false;
                _this.filesContent.clear();
                _this.filesPath.length = 0;

                _this.projectManager.getAllFiles().then(function (files) {
                    var fileAdded = [], fileDeleted = [], fileUpdated = [], newPathsSet = new collections.StringSet(), promises = [];

                    _this.filesPath = (files || []).map(function (file) {
                        if (!oldPathsSet.has(file.fullPath)) {
                            fileAdded.push(file.fullPath);
                        }
                        if (oldFilesContent.has(file.fullPath)) {
                            promises.push(new Promise(function (resolve, reject) {
                                file.read({}, function (err, content) {
                                    if (!err) {
                                        _this.filesContent.set(file.fullPath, content);
                                    }
                                    if (err || content !== oldFilesContent.get(file.fullPath)) {
                                        fileUpdated.push(file.fullPath);
                                    }
                                    resolve(true);
                                });
                            }));
                        }
                        newPathsSet.add(file.fullPath);
                        return file.fullPath;
                    });

                    oldPaths.forEach(function (path) {
                        if (!newPathsSet.has(path)) {
                            fileDeleted.push(path);
                        }
                    });

                    Promise.all(promises).then(function () {
                        var changes = [];

                        fileDeleted.forEach(function (path) {
                            changes.push({
                                kind: 2 /* DELETE */,
                                fileName: path
                            });
                        });

                        fileAdded.forEach(function (path) {
                            changes.push({
                                kind: 0 /* ADD */,
                                fileName: path
                            });
                        });

                        fileUpdated.forEach(function (path) {
                            changes.push({
                                kind: 1 /* UPDATE */,
                                fileName: path
                            });
                        });

                        if (changes.length > 0) {
                            _this._projectFilesChanged.dispatch(changes);
                        }
                        _this.initialized = true;
                        _this.resolveInitializationStack();
                    });
                }, function () {
                    _this.reset();
                });
            } else if (file.isFile) {
                var dispatchUpdate = function () {
                    _this._projectFilesChanged.dispatch([{
                            kind: 1 /* UPDATE */,
                            fileName: file.fullPath
                        }]);
                };

                if (_this.filesContent.has(file.fullPath)) {
                    _this.filesContent.delete(file.fullPath);
                    _this.readFile(file.fullPath).then(function (content) {
                        _this.filesContent.set(file.fullPath, content);
                    }).catch().then(dispatchUpdate);
                } else {
                    dispatchUpdate();
                }
            } else if (file.isDirectory) {
                var directory = file;

                directory.getContents(function (err, files) {
                    if (err) {
                        _this.reset();
                    }
                    var oldFiles = {}, newFiles = {};

                    _this.filesPath.forEach(function (path) {
                        var index = path.indexOf(directory.fullPath);
                        if (index !== -1) {
                            var index2 = path.indexOf('/', index + directory.fullPath.length);
                            if (index2 === -1) {
                                oldFiles[path] = [path];
                            } else {
                                var dirPath = path.substring(0, index2 + 1);
                                if (!oldFiles[dirPath]) {
                                    oldFiles[dirPath] = [path];
                                } else {
                                    oldFiles[dirPath].push(path);
                                }
                            }
                        }
                    });

                    files.forEach(function (file) {
                        newFiles[file.fullPath] = file;
                    });

                    var changes = [], path;
                    for (path in oldFiles) {
                        if (!newFiles.hasOwnProperty(path) && oldFiles.hasOwnProperty(path)) {
                            oldFiles[path].forEach(function (path) {
                                var index = _this.filesPath.indexOf(path);
                                if (index !== -1) {
                                    _this.filesPath.splice(index, 1);
                                    _this.filesContent.delete(path);
                                    changes.push({
                                        kind: 2 /* DELETE */,
                                        fileName: path
                                    });
                                }
                            });
                        }
                    }

                    var promises = [];
                    for (path in newFiles) {
                        if (newFiles.hasOwnProperty(path) && !oldFiles.hasOwnProperty(path)) {
                            if (newFiles[path].isFile) {
                                _this.filesPath.push(path);
                                changes.push({
                                    kind: 0 /* ADD */,
                                    fileName: path
                                });
                            } else {
                                var newDir = newFiles[path];

                                promises.push(_this.getDirectoryFiles(newDir).then(function (files) {
                                    files.forEach(function (file) {
                                        _this.filesPath.push(file.fullPath);
                                        changes.push({
                                            kind: 0 /* ADD */,
                                            fileName: file.fullPath
                                        });
                                    });
                                }));
                            }
                        }
                    }
                    ;

                    Promise.all(promises).then(function () {
                        if (changes.length > 0) {
                            _this._projectFilesChanged.dispatch(changes);
                        }
                    }, function () {
                        _this.reset();
                    });
                });
            }
        };
        this.renameHandler = function (event, oldPath, newPath) {
            var isDirectory = oldPath[oldPath.length - 1] === '/';
            var changes;
            if (isDirectory) {
                changes = [];
                _this.filesPath.concat().forEach(function (path) {
                    var index = path.indexOf(oldPath);
                    if (index === 0) {
                        changes = changes.concat(_this.fileRenamedHandler(path, path.replace(oldPath, newPath)));
                    }
                });
            } else {
                changes = _this.fileRenamedHandler(oldPath, newPath);
            }
            if (changes.length > 0) {
                _this._projectFilesChanged.dispatch(changes);
            }
        };
        nativeFileSystem.on('change', this.changesHandler);
        nativeFileSystem.on('rename', this.renameHandler);
        this.init();
    }
    FileSystem.prototype.getProjectRoot = function () {
        return Promise.cast(this.projectManager.getProjectRoot().fullPath);
    };

    Object.defineProperty(FileSystem.prototype, "projectFilesChanged", {
        get: function () {
            return this._projectFilesChanged;
        },
        enumerable: true,
        configurable: true
    });

    FileSystem.prototype.getProjectFiles = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.addToInitializatioStack(function () {
                return resolve(_this.filesPath);
            });
        });
    };

    FileSystem.prototype.readFile = function (path) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.addToInitializatioStack(function () {
                if (_this.filesContent.has(path)) {
                    resolve(_this.filesContent.get(path));
                } else {
                    var file = _this.nativeFileSystem.getFileForPath(path);
                    if (file.isDirectory) {
                        reject('not found');
                        return;
                    }
                    file.read({}, function (err, content) {
                        if (err) {
                            reject(err);
                        } else {
                            content = content && _this.normalizeText(content);
                            _this.filesContent.set(path, content);
                            resolve(content);
                        }
                    });
                }
            });
        });
    };

    FileSystem.prototype.reset = function () {
        this.initialized = false;
        this.filesContent.clear();
        this.filesPath.length = 0;
        this.init();
        this._projectFilesChanged.dispatch([{
                kind: 3 /* RESET */,
                fileName: null
            }]);
    };

    FileSystem.prototype.dispose = function () {
        this.nativeFileSystem.off('change', this.changesHandler);
        this.nativeFileSystem.off('rename', this.renameHandler);
        this._projectFilesChanged.clear();
    };

    FileSystem.prototype.init = function () {
        var _this = this;
        this.projectManager.getAllFiles().then(function (files) {
            _this.filesPath = files ? files.map(function (file) {
                return file.fullPath;
            }) : [];
            _this.initialized = true;
            _this.resolveInitializationStack();
        });
    };

    FileSystem.prototype.addToInitializatioStack = function (callback) {
        if (this.initialized) {
            callback();
        } else {
            this.initializationStack.push(callback);
        }
    };

    FileSystem.prototype.resolveInitializationStack = function () {
        this.initializationStack.forEach(function (callback) {
            return callback();
        });
        this.initializationStack.length = 0;
    };

    FileSystem.prototype.getDirectoryFiles = function (directory) {
        return new Promise(function (resolve, reject) {
            var files = [];
            directory.visit(function (entry) {
                if (entry.isFile) {
                    files.push(entry);
                }
                return true;
            }, {}, function (err) {
                resolve(files);
            });
        });
    };

    FileSystem.prototype.normalizeText = function (text) {
        return text.replace(/\r\n/g, '\n');
    };

    FileSystem.prototype.fileRenamedHandler = function (oldPath, newPath) {
        var index = this.filesPath.indexOf(oldPath);
        if (index !== -1) {
            this.filesPath.splice(index, 1);
            this.filesPath.push(newPath);
            if (this.filesContent.has(oldPath)) {
                var content = this.filesContent.get(oldPath);
                this.filesContent.delete(oldPath);
                this.filesContent.set(newPath, content);
            }
            return [
                {
                    kind: 2 /* DELETE */,
                    fileName: oldPath
                }, {
                    kind: 0 /* ADD */,
                    fileName: newPath
                }];
        }
        return [];
    };
    return FileSystem;
})();

module.exports = FileSystem;
