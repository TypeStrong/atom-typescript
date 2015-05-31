import {QuickFix} from "./quickFix";
/**
 * This exists to register the quick fixes
 */
import {AddClassMember} from "./quickFixes/addClassMember";
import {AddImportStatement} from "./quickFixes/addImportStatement";
import {EqualsToEquals} from "./quickFixes/equalsToEquals";
import {QuotesToQuotes} from "./quickFixes/quotesToQuotes";
import {QuoteToTemplate} from "./quickFixes/quoteToTemplate";
import {StringConcatToTemplate} from "./quickFixes/stringConcatToTemplate";
import {TypeAssertPropertyAccessToAny} from "./quickFixes/typeAssertPropertyAccessToAny";
import {TypeAssertPropertyAccessToType} from "./quickFixes/typeAssertPropertyAccessToType";
import {ImplementInterface} from "./quickFixes/implementInterface";
export var allQuickFixes: QuickFix[] = [
    new AddClassMember(),
    new AddImportStatement(),
    new EqualsToEquals(),
    new StringConcatToTemplate(),
    new QuotesToQuotes(),
    new QuoteToTemplate(),
    new TypeAssertPropertyAccessToAny(),
    new TypeAssertPropertyAccessToType(),
    new ImplementInterface()
];
