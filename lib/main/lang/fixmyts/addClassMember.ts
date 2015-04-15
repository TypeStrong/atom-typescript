import {QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ts from "typescript";

export default class AddClassMember implements QuickFix {
    key = AddClassMember.name;

    canProvideFix(info: QuickFixQueryInformation): string {
        var relevantError = info.positionErrors.filter(x=> x.code == 2339);
        if (relevantError.length) {
            return "Add Member to Class";
        }

        return '';
    }
    
    /** TODO */
    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        return [];
    }
}