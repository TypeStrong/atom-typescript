var utils = require("../../utils");
var SingleLineCommentToJsdoc = (function () {
    function SingleLineCommentToJsdoc() {
        this.key = SingleLineCommentToJsdoc.name;
        this.validNodes = utils.createMap([
            ts.SyntaxKind.ExportKeyword,
            ts.SyntaxKind.VarKeyword,
            ts.SyntaxKind.LetKeyword,
            ts.SyntaxKind.ConstKeyword,
            ts.SyntaxKind.FunctionKeyword,
        ]);
    }
    SingleLineCommentToJsdoc.prototype.canProvideFix = function (info) {
        if (this.validNodes[info.positionNode.kind]) {
            var comments = ts.getLeadingCommentRangesOfNode(info.positionNode, info.sourceFile);
            if (!comments)
                return;
            var mapped = comments.map(function (c) { return info.sourceFileText.substring(c.pos, c.end); });
            if (!mapped.length)
                return;
            var relevantComment = mapped[mapped.length - 1];
            if (relevantComment.startsWith('//'))
                return { display: 'Convert comment to jsDoc' };
        }
    };
    SingleLineCommentToJsdoc.prototype.provideFix = function (info) {
        var comments = ts.getLeadingCommentRangesOfNode(info.positionNode, info.sourceFile);
        var relevantComment = comments[comments.length - 1];
        var oldText = info.sourceFileText.substring(relevantComment.pos, relevantComment.end);
        var newText = "/** " + oldText.substr(2).trim() + " */";
        var refactoring = {
            span: {
                start: relevantComment.pos,
                length: relevantComment.end - relevantComment.pos
            },
            newText: newText,
            filePath: info.filePath
        };
        return [refactoring];
    };
    return SingleLineCommentToJsdoc;
})();
exports.SingleLineCommentToJsdoc = SingleLineCommentToJsdoc;
