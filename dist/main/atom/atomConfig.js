var packageName = 'atom-typescript';
function getConfig(name) {
    return atom.config.get(packageName + '.' + name);
}
var Config = (function () {
    function Config() {
        this.schema = {
            compileOnSave: {
                title: 'Compile on save',
                type: 'boolean',
                default: true
            },
            debugAtomTs: {
                title: 'Debug: Atom-TypeScript. Please do not use.',
                type: 'boolean',
                default: false
            }
        };
    }
    Object.defineProperty(Config.prototype, "compileOnSave", {
        get: function () { return getConfig('compileOnSave'); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "debugAtomTs", {
        get: function () { return getConfig('debugAtomTs'); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "maxSuggestions", {
        get: function () { return atom.config.get('autocomplete-plus.maxSuggestions'); },
        enumerable: true,
        configurable: true
    });
    return Config;
})();
var config = new Config();
module.exports = config;
//# sourceMappingURL=atomConfig.js.map