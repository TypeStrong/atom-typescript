import {Project} from "../core/project";
import {getPathCompletions} from "../modules/getPathCompletions";

export function getIdentifierAndFileNames(error: ts.Diagnostic, project: Project) {

    var errorText: string = <any>error.messageText;

    // We don't support error chains yet
    if (typeof errorText !== 'string') {
        return undefined;
    };

    var match = errorText.match(/Cannot find name \'(\w+)\'./);

    // If for whatever reason the error message doesn't match
    if (!match) return;

    var [, identifierName] = match;
    var {files} = getPathCompletions({
        project,
        filePath: error.file.fileName,
        prefix: identifierName,
        includeExternalModules: false
    });
    var file = files.length > 0 ? files[0].relativePath : undefined;
    var basename = files.length > 0 ? files[0].name : undefined;
    return { identifierName, file, basename };
}
