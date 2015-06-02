var allTransformers = [];
function add(transformer) {
    transformer.regex = (new RegExp("transform:" + transformer.name + "{[.\\s]*}transform:" + transformer.name, 'g'));
    allTransformers.push(transformer);
}
exports.add = add;
function getNames() {
    return allTransformers.map(function (at) { return at.name; });
}
exports.getNames = getNames;
function getRegexes() {
    return allTransformers.map(function (at) { return at.regex; });
}
exports.getRegexes = getRegexes;
var transformFinderRegex = /transform:(.*){/g;
var transformEndFinderRegexGenerator = function (name) { return new RegExp("}transform:" + name); };
function getInitialTransformation(code) {
    var transforms = [];
    var processedSrcUpto = 0;
    var srcCode = code;
    var destCode = '';
    var destDelta = 0;
    while (true) {
        var remainingCode = code.substr(processedSrcUpto);
        var matches = transformFinderRegex.exec(remainingCode);
        if (!matches || !matches.length || matches.length < 2)
            return { transforms: transforms };
        var nextTransformName = matches.slice[1];
    }
    return { transforms: transforms };
}
exports.getInitialTransformation = getInitialTransformation;
function transform(name, code) {
    var transformer = allTransformers.filter(function (at) { return at.name == name; })[0];
    if (!transformer) {
        console.error('No transformer registered with name: ', name);
        return { code: '' };
    }
    return transformer.transform(code);
}
exports.transform = transform;
var expand = require('glob-expand');
var files = expand({ filter: 'isFile', cwd: __dirname }, [
    "./implementations/*.js"
]);
files = files.map(function (f) { return require(f); });
