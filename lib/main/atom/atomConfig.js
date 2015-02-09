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
            }
        };
    }
    Object.defineProperty(Config.prototype, "compileOnSave", {
        get: function () {
            return getConfig('compileOnSave');
        },
        enumerable: true,
        configurable: true
    });
    return Config;
})();
var config = new Config();
module.exports = config;
