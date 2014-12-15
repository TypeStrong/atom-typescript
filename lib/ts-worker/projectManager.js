'use strict';
var Promise = require('bluebird');
var path = require('path');
var PromiseQueue = require('../commons/promiseQueue');
var collections = require('../commons/collections');
var tsUtils = require('../commons/typeScriptUtils');
var utils = require('../commons/utils');
var logger = require('../commons/logger');
var TypeScriptProject = require('./project');
var TypeScriptProjectManager = (function () {
    function TypeScriptProjectManager() {
        var _this = this;
        this.projectMap = new collections.StringMap();
        this.queue = new PromiseQueue();
        this.configChangeHandler = function () {
            _this.queue.then(function () {
                _this.preferenceManager.getProjectsConfig().then(function (configs) {
                    var promises = [];
                    _this.projectMap.entries.forEach(function (entry) {
                        var projectId = entry.key, project = entry.value, config = configs[projectId];
                        if (!config) {
                            project.dispose();
                            _this.projectMap.delete(projectId);
                        }
                        else {
                            promises.push(project.update(config));
                        }
                    });
                    Object.keys(configs).forEach(function (projectId) {
                        if (!_this.projectMap.has(projectId)) {
                            promises.push(_this.createProjectFromConfig(projectId, configs[projectId]));
                        }
                    });
                });
            });
        };
    }
    TypeScriptProjectManager.prototype.init = function (defaultTypeScriptLocation, preferenceManager, fileSystem, workingSet, projectFactory) {
        var _this = this;
        this.defaultTypeScriptLocation = defaultTypeScriptLocation;
        this.preferenceManager = preferenceManager;
        this.workingSet = workingSet;
        this.fileSystem = fileSystem;
        this.projectFactory = projectFactory;
        this.preferenceManager.configChanged.add(this.configChangeHandler);
        return this.queue.init(this.fileSystem.getProjectRoot().then(function (projectRootDir) {
            _this.projectRootDir = projectRootDir;
            return _this.createProjects();
        }));
    };
    TypeScriptProjectManager.prototype.dispose = function () {
        var _this = this;
        this.preferenceManager.configChanged.remove(this.configChangeHandler);
        this.queue.then(function () { return _this.disposeProjects(); });
    };
    TypeScriptProjectManager.prototype.getProjectForFile = function (fileName) {
        var _this = this;
        return this.queue.then(function () {
            var projects = _this.projectMap.values, project = null;
            projects.some(function (tsProject) {
                if (tsProject.getProjectFileKind(fileName) === 1 /* SOURCE */) {
                    project = tsProject;
                    return true;
                }
            });
            if (!project) {
                projects.some(function (tsProject) {
                    if (tsProject.getProjectFileKind(fileName) === 2 /* REFERENCE */) {
                        project = tsProject;
                        return true;
                    }
                });
            }
            if (!project) {
                if (_this.tempProject && _this.tempProject.getProjectFilesSet().has(fileName)) {
                    project = _this.tempProject;
                }
                else if (_this.tempProject) {
                    _this.tempProject.dispose();
                    _this.tempProject = null;
                }
            }
            if (!project) {
                var config = utils.clone(tsUtils.typeScriptProjectConfigDefault);
                config.target = 'es5';
                config.sources = [fileName];
                _this.tempProject = project = _this.projectFactory(_this.projectRootDir, config, _this.fileSystem, _this.workingSet, path.join(_this.defaultTypeScriptLocation, 'lib.d.ts'));
                return _this.tempProject.init().then(function () { return _this.tempProject; });
            }
            return project;
        });
    };
    TypeScriptProjectManager.prototype.createProjects = function () {
        var _this = this;
        return this.preferenceManager.getProjectsConfig().then(function (configs) {
            return Promise.all(Object.keys(configs).map(function (projectId) { return _this.createProjectFromConfig(projectId, configs[projectId]); }));
        });
    };
    TypeScriptProjectManager.prototype.disposeProjects = function () {
        var projectMap = this.projectMap;
        projectMap.keys.forEach(function (path) {
            projectMap.get(path).dispose();
        });
        this.projectMap.clear();
        if (this.tempProject) {
            this.tempProject.dispose();
            this.tempProject = null;
        }
    };
    TypeScriptProjectManager.prototype.createProjectFromConfig = function (projectId, config) {
        var _this = this;
        var project = this.projectFactory(this.projectRootDir, config, this.fileSystem, this.workingSet, path.join(this.defaultTypeScriptLocation, 'lib.d.ts'));
        return project.init().then(function () {
            _this.projectMap.set(projectId, project);
        }, function () {
            if (logger.fatal()) {
                logger.log('could not create project:' + projectId);
            }
        });
    };
    return TypeScriptProjectManager;
})();
module.exports = TypeScriptProjectManager;
