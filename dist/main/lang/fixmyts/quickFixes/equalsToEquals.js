var EqualsToEquals = (function () {
    function EqualsToEquals() {
        this.key = EqualsToEquals.name;
    }
    EqualsToEquals.prototype.canProvideFix = function (info) {
        if (info.positionNode.kind === 29) {
            return { display: "Convert == to ===" };
        }
        if (info.positionNode.kind === 30) {
            return { display: "Convert != to !==" };
        }
    };
    EqualsToEquals.prototype.provideFix = function (info) {
        if (info.positionNode.kind === 29) {
            var newText = '===';
        }
        if (info.positionNode.kind === 30) {
            var newText = '!==';
        }
        var refactoring = {
            span: {
                start: info.positionNode.end - 2,
                length: 2
            },
            newText: newText,
            filePath: info.filePath
        };
        return [refactoring];
    };
    return EqualsToEquals;
})();
exports.EqualsToEquals = EqualsToEquals;
