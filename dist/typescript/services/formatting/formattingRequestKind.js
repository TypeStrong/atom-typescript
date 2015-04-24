/// <reference path="references.ts"/>
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        (function (FormattingRequestKind) {
            FormattingRequestKind[FormattingRequestKind["FormatDocument"] = 0] = "FormatDocument";
            FormattingRequestKind[FormattingRequestKind["FormatSelection"] = 1] = "FormatSelection";
            FormattingRequestKind[FormattingRequestKind["FormatOnEnter"] = 2] = "FormatOnEnter";
            FormattingRequestKind[FormattingRequestKind["FormatOnSemicolon"] = 3] = "FormatOnSemicolon";
            FormattingRequestKind[FormattingRequestKind["FormatOnClosingCurlyBrace"] = 4] = "FormatOnClosingCurlyBrace";
        })(formatting.FormattingRequestKind || (formatting.FormattingRequestKind = {}));
        var FormattingRequestKind = formatting.FormattingRequestKind;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
