'use strict';
var Promise = require('bluebird');

var tsUtils = require('../commons/typeScriptUtils');
var utils = require('../commons/utils');
var logger = require('../commons/logger');
var collections = require('../commons/collections');
var signal = require('../commons/signal');

var TypescriptPreferenceManager = (function () {
    function TypescriptPreferenceManager(prefManager) {
        var _this = this;
        this.prefManager = prefManager;
        this.configChanged = new signal.Signal();
        this.preferenceChangedHandler = function (e, data) {
            if (data && Array.isArray(data.ids) && data.ids.indexOf('typescript') !== -1) {
                _this.projectConfigs = null;
                _this.configChanged.dispatch();
            }
        };
        this.prefManager.on('change', this.preferenceChangedHandler);
    }
    TypescriptPreferenceManager.prototype.getProjectsConfig = function () {
        if (!this.projectConfigs) {
            this.projectConfigs = this.retriveProjectsConfig();
        }
        return Promise.cast(this.projectConfigs.toObject());
    };

    TypescriptPreferenceManager.prototype.dispose = function () {
        this.configChanged.clear();
    };

    TypescriptPreferenceManager.prototype.retriveProjectsConfig = function () {
        var result = new collections.StringMap();

        var data = this.prefManager.get('typescript', this.prefManager.CURRENT_PROJECT);
        if (!data) {
            return result;
        }

        var configs;

        if (data.hasOwnProperty('projects')) {
            var projects = data.projects;
            delete data.projects;
            if (typeof projects !== 'object') {
                return result;
            }
            configs = Object.keys(projects).reduce(function (configs, id) {
                var project = projects[id];
                if (typeof project === 'object') {
                    configs[id] = utils.assign({}, data, project);
                }
                return configs;
            }, {});
        } else {
            configs = {
                default: data
            };
        }

        Object.keys(configs).forEach(function (projectId) {
            var config = utils.assign({}, tsUtils.typeScriptProjectConfigDefault, configs[projectId]);
            if (!tsUtils.validateTypeScriptProjectConfig(config)) {
                if (logger.warning()) {
                    logger.log('invalid config file for brackets-typescript config file');
                }
            } else {
                result.set(projectId, config);
            }
        });

        return result;
    };
    return TypescriptPreferenceManager;
})();

module.exports = TypescriptPreferenceManager;
