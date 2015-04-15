/**
 * Interfaces for quick fixes
 */
import ts = require("typescript");
import project = require("../core/project");

export interface Refactoring extends ts.RenameLocation { }

/** Note this interface has a few redundant stuff. This is intentional to precompute once */
export interface QuickFixQueryInformation {
    project: project.Project;
    program: ts.Program;
    srcFile: ts.SourceFile;
    fileErrors: ts.Diagnostic[];
    positionErrors: ts.Diagnostic[];
    position: number;
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
