'use strict';
var path = require('path');
var minimatch = require('minimatch');
var Promise = require('bluebird');
var PromiseQueue = require('../commons/promiseQueue');
var Services = TypeScript.Services;

var collections = require('../commons/collections');
var fs = require('../commons/fileSystem');
var ws = require('../commons/workingSet');
var logger = require('../commons/logger');

var utils = require('../commons/utils');

var LanguageServiceHost = require('./languageServiceHost');

var TypeScriptProject = (function () {
    function TypeScriptProject(baseDirectory, config, fileSystem, workingSet, defaultLibLocation) {
        var _this = this;
        this.baseDirectory = baseDirectory;
        this.config = config;
        this.fileSystem = fileSystem;
        this.workingSet = workingSet;
        this.defaultLibLocation = defaultLibLocation;
        this.queue = new PromiseQueue();
        this.filesChangeHandler = function (changeRecords) {
            _this.queue.then(function () {
                changeRecords.forEach(function (record) {
                    switch (record.kind) {
                        case 0 /* ADD */:
                            if (_this.isProjectSourceFile(record.fileName) || _this.references.has(record.fileName)) {
                                _this.addFile(record.fileName);
                            }
                            break;
                        case 2 /* DELETE */:
                            if (_this.projectFilesSet.has(record.fileName)) {
                                _this.removeFile(record.fileName);
                            }
                            break;
                        case 1 /* UPDATE */:
                            if (_this.projectFilesSet.has(record.fileName)) {
                                _this.updateFile(record.fileName);
                            }
                            break;
                    }
                });
            });
        };
        this.workingSetChangedHandler = function (changeRecord) {
            _this.queue.then(function () {
                switch (changeRecord.kind) {
                    case 0 /* ADD */:
                        changeRecord.paths.forEach(function (fileName) {
                            if (_this.projectFilesSet.has(fileName)) {
                                _this.languageServiceHost.setScriptIsOpen(fileName, true);
                            }
                        });
                        break;
                    case 1 /* REMOVE */:
                        changeRecord.paths.forEach(function (fileName) {
                            if (_this.projectFilesSet.has(fileName)) {
                                _this.languageServiceHost.setScriptIsOpen(fileName, false);
                                _this.updateFile(fileName);
                            }
                        });
                        break;
                }
            });
        };
        this.documentEditedHandler = function (record) {
            _this.queue.then(function () {
                if (_this.projectFilesSet.has(record.path)) {
                    var mustUpdate = false, oldPaths = new collections.StringSet(_this.getReferencedOrImportedFiles(record.path)), lastChange;
                    record.changeList.some(function (change) {
                        lastChange = change;
                        if (!change.from || !change.to) {
                            mustUpdate = true;
                        } else {
                            var minChar = _this.languageServiceHost.getIndexFromPos(record.path, change.from), limChar = _this.languageServiceHost.getIndexFromPos(record.path, change.to);

                            _this.languageServiceHost.editScript(record.path, minChar, limChar, change.text);
                        }
                        return mustUpdate;
                    });
                    if (mustUpdate || _this.languageServiceHost.getScriptContent(record.path) !== record.documentText) {
                        if (logger.warning()) {
                            if (mustUpdate) {
                                logger.log('TypeScriptProject: inconsistent change descriptor: ' + JSON.stringify(lastChange));
                            } else {
                                logger.log('TypeScriptProject: text different before and after change');
                            }
                        }
                        _this.languageServiceHost.updateScript(record.path, record.documentText);
                    }

                    _this.updateReferences(record.path, oldPaths);
                }
            });
        };
    }
    TypeScriptProject.prototype.init = function () {
        var _this = this;
        this.projectFilesSet = new collections.StringSet();
        this.references = new collections.StringMap();
        this.workingSet.workingSetChanged.add(this.workingSetChangedHandler);
        this.workingSet.documentEdited.add(this.documentEditedHandler);
        this.fileSystem.projectFilesChanged.add(this.filesChangeHandler);

        return this.queue.init(this.getTypeScriptInfosForPath(this.config.typescriptPath).then(function (typeScriptInfo) {
            _this.libLocation = typeScriptInfo.libLocation;
            _this.coreService = typeScriptInfo.factory.createCoreServices({ logger: new logger.LogingClass() });
            _this.languageServiceHost = new LanguageServiceHost();
            _this.languageServiceHost.setCompilationSettings(_this.createCompilationSettings());
            _this.languageService = typeScriptInfo.factory.createPullLanguageService(_this.languageServiceHost);

            return _this.collectFiles();
        }).then(function () {
            _this.updateWorkingSet();
        }));
    };

    TypeScriptProject.prototype.update = function (config) {
        var _this = this;
        if (this.config.typescriptPath !== config.typescriptPath) {
            return this.init();
        }

        if (!this.config.noLib && config.noLib) {
            this.removeFile(this.libLocation);
        }

        var pojectSources = this.projectFilesSet.values.filter(function (fileName) {
            return _this.isProjectSourceFile(fileName);
        });
        this.config = config;
        return this.queue.then(function () {
            _this.languageServiceHost.setCompilationSettings(_this.createCompilationSettings());
            var promises = [];
            pojectSources.forEach(function (fileName) {
                if (!_this.isProjectSourceFile(fileName)) {
                    _this.removeFile(fileName);
                }
            });

            return Promise.all(promises).then(function () {
                return _this.collectFiles();
            }).then(function () {
                return _this.updateWorkingSet();
            });
        });
    };

    TypeScriptProject.prototype.dispose = function () {
        this.workingSet.workingSetChanged.remove(this.workingSetChangedHandler);
        this.workingSet.documentEdited.remove(this.documentEditedHandler);
        this.fileSystem.projectFilesChanged.remove(this.filesChangeHandler);
    };

    TypeScriptProject.prototype.getLanguageServiceHost = function () {
        return this.languageServiceHost;
    };

    TypeScriptProject.prototype.getCoreService = function () {
        return this.coreService;
    };

    TypeScriptProject.prototype.getLanguageService = function () {
        return this.languageService;
    };

    TypeScriptProject.prototype.getProjectFilesSet = function () {
        return new collections.StringSet(this.projectFilesSet.values);
    };

    TypeScriptProject.prototype.getProjectFileKind = function (fileName) {
        if (this.projectFilesSet.has(fileName)) {
            return this.isProjectSourceFile(fileName) ? 1 /* SOURCE */ : 2 /* REFERENCE */;
        } else {
            return 0 /* NONE */;
        }
    };

    TypeScriptProject.prototype.getTypeScriptInfosForPath = function (typescriptPath) {
        var _this = this;
        if (!typescriptPath) {
            return Promise.cast({
                factory: new Services.TypeScriptServicesFactory(),
                libLocation: this.defaultLibLocation
            });
        } else {
            var typescriptServicesFile = path.join(typescriptPath, 'typescriptServices.js');

            return this.fileSystem.readFile(typescriptServicesFile).then(function (code) {
                var func = new Function('var TypeScript;' + code + ';return TypeScript;'), typeScript = func();

                return {
                    factory: new typeScript.Services.TypeScriptServicesFactory(),
                    libLocation: path.join(typescriptPath, 'lib.d.ts')
                };
            }).catch(function () {
                if (logger.error()) {
                    logger.log('could not retrieve typescript compiler at path: ' + typescriptPath);
                }
                return {
                    factory: new Services.TypeScriptServicesFactory(),
                    libLocation: _this.defaultLibLocation
                };
            });
        }
    };

    TypeScriptProject.prototype.createCompilationSettings = function () {
        var compilationSettings = new TypeScript.CompilationSettings(), moduleType = this.config.module.toLowerCase();

        compilationSettings.noLib = this.config.noLib;
        compilationSettings.noImplicitAny = this.config.noImplicitAny;
        compilationSettings.sourceRoot = this.config.sourceRoot;

        compilationSettings.codeGenTarget = this.config.target.toLowerCase() === 'es3' ? 0 /* EcmaScript3 */ : 1 /* EcmaScript5 */;

        compilationSettings.moduleGenTarget = moduleType === 'none' ? 0 /* Unspecified */ : moduleType === 'amd' ? 2 /* Asynchronous */ : 1 /* Synchronous */;

        return compilationSettings;
    };

    TypeScriptProject.prototype.updateWorkingSet = function () {
        var _this = this;
        this.workingSet.getFiles().then(function (files) {
            return files.forEach(function (fileName) {
                if (_this.projectFilesSet.has(fileName)) {
                    _this.languageServiceHost.setScriptIsOpen(fileName, true);
                }
            });
        });
    };

    TypeScriptProject.prototype.collectFiles = function () {
        var _this = this;
        return this.fileSystem.getProjectFiles().then(function (files) {
            var promises = [];
            files.forEach(function (fileName) {
                if (_this.isProjectSourceFile(fileName) && !_this.projectFilesSet.has(fileName)) {
                    console.log(fileName);
                    promises.push(_this.addFile(fileName, false));
                }
            });

            if (!_this.config.noLib && !_this.projectFilesSet.has(_this.libLocation)) {
                promises.push(_this.addFile(_this.libLocation));
            }

            return Promise.all(promises);
        });
    };

    TypeScriptProject.prototype.isProjectSourceFile = function (fileName) {
        var relativeFileName = path.relative(this.baseDirectory, fileName);
        return this.config.sources.some(function (pattern) {
            return minimatch(relativeFileName, pattern) || minimatch(fileName, pattern);
        });
    };

    TypeScriptProject.prototype.addFile = function (fileName, notify) {
        var _this = this;
        if (typeof notify === "undefined") { notify = true; }
        if (!this.projectFilesSet.has(fileName)) {
            this.projectFilesSet.add(fileName);
            return this.fileSystem.readFile(fileName).then(function (content) {
                var promises = [];
                _this.languageServiceHost.addScript(fileName, content);
                _this.getReferencedOrImportedFiles(fileName).forEach(function (referencedFile) {
                    promises.push(_this.addFile(referencedFile));
                    _this.addReference(fileName, referencedFile);
                });
                return Promise.all(promises);
            }, function () {
                _this.projectFilesSet.remove(fileName);
            });
        }
        return null;
    };

    TypeScriptProject.prototype.removeFile = function (fileName) {
        var _this = this;
        if (this.projectFilesSet.has(fileName)) {
            this.getReferencedOrImportedFiles(fileName).forEach(function (referencedPath) {
                _this.removeReference(fileName, referencedPath);
            });
            this.projectFilesSet.remove(fileName);
            this.languageServiceHost.removeScript(fileName);
        }
    };

    TypeScriptProject.prototype.updateFile = function (fileName) {
        var _this = this;
        this.fileSystem.readFile(fileName).then(function (content) {
            var oldPaths = new collections.StringSet(_this.getReferencedOrImportedFiles(fileName));
            _this.languageServiceHost.updateScript(fileName, content);
            _this.updateReferences(fileName, oldPaths);
        });
    };

    TypeScriptProject.prototype.getReferencedOrImportedFiles = function (fileName) {
        if (!this.projectFilesSet.has(fileName)) {
            return [];
        }
        var script = this.languageServiceHost.getScriptSnapshot(fileName), preProcessedFileInfo = this.coreService.getPreProcessedFileInfo(fileName, script), dir = path.dirname(fileName);

        return preProcessedFileInfo.referencedFiles.map(function (fileReference) {
            return utils.pathResolve(dir, fileReference.path);
        }).concat(preProcessedFileInfo.importedFiles.map(function (fileReference) {
            return utils.pathResolve(dir, fileReference.path + '.ts');
        }));
    };

    TypeScriptProject.prototype.addReference = function (fileName, referencedPath) {
        if (!this.references.has(referencedPath)) {
            this.references.set(referencedPath, new collections.StringSet());
        }
        this.references.get(referencedPath).add(fileName);
    };

    TypeScriptProject.prototype.removeReference = function (fileName, referencedPath) {
        var fileRefs = this.references.get(referencedPath);
        if (!fileRefs) {
            this.removeFile(referencedPath);
        }
        fileRefs.remove(fileName);
        if (fileRefs.values.length === 0) {
            this.references.delete(referencedPath);
            this.removeFile(referencedPath);
        }
    };

    TypeScriptProject.prototype.updateReferences = function (fileName, oldFileReferences) {
        var _this = this;
        this.getReferencedOrImportedFiles(fileName).forEach(function (referencedPath) {
            oldFileReferences.remove(referencedPath);
            if (!_this.projectFilesSet.has(referencedPath)) {
                _this.addFile(referencedPath);
                _this.addReference(fileName, referencedPath);
            }
        });

        oldFileReferences.values.forEach(function (referencedPath) {
            return _this.removeReference(fileName, referencedPath);
        });
    };
    return TypeScriptProject;
})();

var TypeScriptProject;
(function (TypeScriptProject) {
    (function (ProjectFileKind) {
        ProjectFileKind[ProjectFileKind["NONE"] = 0] = "NONE";

        ProjectFileKind[ProjectFileKind["SOURCE"] = 1] = "SOURCE";

        ProjectFileKind[ProjectFileKind["REFERENCE"] = 2] = "REFERENCE";
    })(TypeScriptProject.ProjectFileKind || (TypeScriptProject.ProjectFileKind = {}));
    var ProjectFileKind = TypeScriptProject.ProjectFileKind;

    function newProject(baseDirectory, config, fileSystem, workingSet, defaultLibLocation) {
        return new TypeScriptProject(baseDirectory, config, fileSystem, workingSet, defaultLibLocation);
    }
    TypeScriptProject.newProject = newProject;
})(TypeScriptProject || (TypeScriptProject = {}));

module.exports = TypeScriptProject;
