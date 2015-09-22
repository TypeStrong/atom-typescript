exports.types = {
    string: 'string',
    boolean: 'boolean',
    number: 'number'
};
var SimpleValidator = (function () {
    function SimpleValidator(validationInfo) {
        var _this = this;
        this.validationInfo = validationInfo;
        this.potentialLowerCaseMatch = {};
        Object.keys(validationInfo).forEach(function (k) { return _this.potentialLowerCaseMatch[k.toLowerCase()] = k; });
    }
    SimpleValidator.prototype.validate = function (config) {
        var _this = this;
        var keys = Object.keys(config);
        var errors = { invalidValues: [], extraKeys: [], errorMessage: '' };
        keys.forEach(function (k) {
            if (!_this.validationInfo[k]) {
                if (_this.potentialLowerCaseMatch[k]) {
                    errors.extraKeys.push("Key: '" + k + "' is a potential lower case match for '" + _this.potentialLowerCaseMatch[k] + "'. Fix the casing.");
                }
                else {
                    errors.extraKeys.push("Unknown Option: " + k);
                }
            }
            else {
                var validationInfo = _this.validationInfo[k];
                var value = config[k];
                if (validationInfo.validValues && validationInfo.validValues.length) {
                    var validValues = validationInfo.validValues;
                    if (!validValues.some(function (valid) { return valid.toLowerCase() === value.toLowerCase(); })) {
                        errors.invalidValues.push("Key: '" + k + "' has an invalid value: " + value);
                    }
                }
                if (validationInfo.type && typeof value !== validationInfo.type) {
                    errors.invalidValues.push("Key: '" + k + "' has an invalid type: " + typeof value);
                }
            }
        });
        var total = errors.invalidValues.concat(errors.extraKeys);
        if (total.length) {
            errors.errorMessage = total.join("\n");
        }
        return errors;
    };
    return SimpleValidator;
})();
exports.SimpleValidator = SimpleValidator;
function createMap(arr) {
    return arr.reduce(function (result, key) {
        result[key] = true;
        return result;
    }, {});
}
exports.createMap = createMap;
