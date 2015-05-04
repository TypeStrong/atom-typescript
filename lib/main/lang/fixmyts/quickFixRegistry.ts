import {QuickFix} from "./quickFix";
/**
 * This exists to register the quick fixes
 */
import AddClassMember from "./quickFixes/addClassMember";
import AddImportStatement from "./quickFixes/addImportStatement";
import EqualsToEquals from "./quickFixes/equalsToEquals";
import QuotesToQuotes from "./quickFixes/quotesToQuotes";
import QuotesToTemplate from "./quickFixes/quoteToTemplate";
import StringConcatToTemplate from "./quickFixes/stringConcatToTemplate";
import TypeAssertPropertyAccessToAny from "./quickFixes/typeAssertPropertyAccessToAny";
import TypeAssertPropertyAccessToType from "./quickFixes/typeAssertPropertyAccessToType";
export var allQuickFixes: QuickFix[] = [
    new AddClassMember(),
    new AddImportStatement(),
    new EqualsToEquals(),
    new StringConcatToTemplate(),
    new QuotesToQuotes(),
    new QuotesToTemplate(),
    new TypeAssertPropertyAccessToAny(),
    new TypeAssertPropertyAccessToType(),
];
