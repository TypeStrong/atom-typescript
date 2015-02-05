var parent = require('../../worker/parent');
var fs = require('fs');
var atomUtils = require('./atomUtils');
var fuzzaldrin = require('fuzzaldrin');
function kindToColor(kind) {
    switch (kind) {
        case 'interface':
            return 'rgb(16, 255, 0)';
        case 'keyword':
            return 'rgb(0, 207, 255)';
        case 'class':
            return 'rgb(255, 0, 194)';
        default:
            return 'white';
    }
}
var provider = {
    selector: '.source.ts',
    requestHandler: function (options) {
        var filePath = options.editor.getPath();
        if (!filePath)
            return Promise.resolve([]);
        if (!fs.existsSync(filePath))
            return Promise.resolve([]);
        var position = atomUtils.getEditorPositionForBufferPosition(options.editor, options.position);
        var promisedSuggestions = parent.updateText({ filePath: filePath, text: options.editor.getText() }).then(function () { return parent.getCompletionsAtPosition({
            filePath: filePath,
            position: position,
            prefix: options.prefix
        }); }).then(function (resp) {
            var completionList = resp.completions;
            var suggestions = completionList.map(function (c) {
                return {
                    word: c.name,
                    prefix: options.prefix == '.' ? '' : options.prefix,
                    label: '<span style="color: ' + kindToColor(c.kind) + '">' + c.display + '</span>',
                    renderLabelAsHtml: true,
                };
            });
            return suggestions;
        });
        return promisedSuggestions;
    }
};
module.exports = provider;
