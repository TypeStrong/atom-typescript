var addClassMember_1 = require("./addClassMember");
var addImportStatement_1 = require("./addImportStatement");
var equalsToEquals_1 = require("./equalsToEquals");
var quotesToQuotes_1 = require("./quotesToQuotes");
var quoteToTemplate_1 = require("./quoteToTemplate");
var stringConcatToTemplate_1 = require("./stringConcatToTemplate");
exports.allQuickFixes = [
    new addClassMember_1.default(),
    new addImportStatement_1.default(),
    new equalsToEquals_1.default(),
    new stringConcatToTemplate_1.default(),
    new quotesToQuotes_1.default(),
    new quoteToTemplate_1.default(),
];
