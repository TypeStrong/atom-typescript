import { QuickFix, QuickFixQueryInformation, Refactoring} from "./quickFix";
import * as ast from "./astUtils";
import {EOL } from "os";
var { displayPartsToString, typeToDisplayParts } = ts;

import {getExternalModuleNames } from "../modules/getExternalModules";

function getIdentifierAndFileNames(error: ts.Diagnostic, getRelativePathsInProject: Function) {

    var errorText: string = <any>error.messageText;
    
    // We don't support error chains yet
    if (typeof errorText !== 'string') {        
        return undefined;
    };

    var match = errorText.match(/Cannot find name \'(\w+)\'./);

    // If for whatever reason the error message doesn't match
    if (!match) return;
    
    var [, identifierName] = match;
    var {files} = getRelativePathsInProject({ filePath: error.file.fileName, prefix: identifierName, includeExternalModules: false });
    var file = files.length > 0 ? files[0].relativePath : undefined;
    var basename = files.length > 0 ? files[0].name : undefined;
    return { identifierName, file, basename };
}

class AddImportStatement implements QuickFix {
    key = AddImportStatement.name;
    
    constructor(private getRelativePathsInProject: Function) {
    }
    
    canProvideFix(info: QuickFixQueryInformation): string {
        var relevantError = info.positionErrors.filter(x=> x.code == 2304)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        var { identifierName, file} = getIdentifierAndFileNames(relevantError, this.getRelativePathsInProject);
        return file ? `import ${identifierName}= require(\"${file}\")` : undefined;
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        var relevantError = info.positionErrors.filter(x=> x.code == 2304)[0];
        var identifier = <ts.Identifier>info.positionNode;

        var identifierName = identifier.text;
        var fileNameforFix = getIdentifierAndFileNames(relevantError, this.getRelativePathsInProject);

        if (fileNameforFix.basename !== identifierName) {
            atom.notifications.addError('AtomTS: QuickFix failed, text under cursor does not match filename');
            return [];
        }

        // And add stuff after the first brace
        let refactoring: Refactoring = {
            span: {
                start: 0,
                length: 0
            },
            newText: `import ${identifierName} = require(\"${fileNameforFix.file}\");${EOL}`,
            filePath: info.srcFile.fileName
        };

        return [refactoring];
    }
}

export default AddImportStatement;