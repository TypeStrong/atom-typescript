var addClassMember_1 = require("./quickFixes/addClassMember");
var addImportStatement_1 = require("./quickFixes/addImportStatement");
var equalsToEquals_1 = require("./quickFixes/equalsToEquals");
var wrapInProperty_1 = require("./quickFixes/wrapInProperty");
var quotesToQuotes_1 = require("./quickFixes/quotesToQuotes");
var quoteToTemplate_1 = require("./quickFixes/quoteToTemplate");
var stringConcatToTemplate_1 = require("./quickFixes/stringConcatToTemplate");
var typeAssertPropertyAccessToAny_1 = require("./quickFixes/typeAssertPropertyAccessToAny");
var typeAssertPropertyAccessToType_1 = require("./quickFixes/typeAssertPropertyAccessToType");
var implementInterface_1 = require("./quickFixes/implementInterface");
exports.allQuickFixes = [
    new addClassMember_1.AddClassMember(),
    new addImportStatement_1.AddImportStatement(),
    new wrapInProperty_1.WrapInProperty(),
    new equalsToEquals_1.EqualsToEquals(),
    new stringConcatToTemplate_1.StringConcatToTemplate(),
    new quotesToQuotes_1.QuotesToQuotes(),
    new quoteToTemplate_1.QuoteToTemplate(),
    new typeAssertPropertyAccessToAny_1.TypeAssertPropertyAccessToAny(),
    new typeAssertPropertyAccessToType_1.TypeAssertPropertyAccessToType(),
    new implementInterface_1.ImplementInterface()
];
