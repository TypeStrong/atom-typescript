/**
 * Interfaces for quick fixes
 */
import ts = require("typescript");
import project = require("../core/project");



export interface Refactoring extends ts.TextChange {
    filePath: string;
}


/** Note this interface has a few redundant stuff. This is intentional to precompute once */
export interface QuickFixQueryInformation {
    project: project.Project;
    service: ts.LanguageService;
    program: ts.Program;
    srcFile: ts.SourceFile;
    fileErrors: ts.Diagnostic[];
    positionErrors: ts.Diagnostic[];
    position: number;
    positionNode: ts.Node;
}

export interface QuickFix {
    /** Some unique key. Classname works best ;) */
    key: string;

    /**
      * Return '' if you can't provide a fix
      * return 'Some string to display' if you can provide a string
      */
    canProvideFix(info: QuickFixQueryInformation): string;


    provideFix(info: QuickFixQueryInformation): Refactoring[];
}


/** You don't need to create this manually. Just use the util function */
export interface RefactoringsByFilePath {
    [filePath: string]: Refactoring[];
}

/** Utility method. Reason is we want to transact by file path */
export function getRefactoringsByFilePath(refactorings: Refactoring[]) {
    var loc: RefactoringsByFilePath = {};
    for (let refac of refactorings) {
        if (!loc[refac.filePath]) loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }

    // TODO: sort each of these in descending by start location
    return loc;
}
