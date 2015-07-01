/// Functions that the parent allows the child to query

var resolve: typeof Promise.resolve = Promise.resolve.bind(Promise);

// safe imports
// stuff that exists in both Worker and Parent
import tsconfig = require('../main/tsconfig/tsconfig');
import project = require('../main/lang/core/project');

// UI Imports
import _atomUtils = require('../main/atom/atomUtils');
var atomUtils: typeof _atomUtils;
import _mainPanelView = require('../main/atom/views/mainPanelView');
var mainPanelView: typeof _mainPanelView;

try {
    require('atom');
    // We are in a safe context:
    atomUtils = require('../main/atom/atomUtils');
    mainPanelView = require('../main/atom/views/mainPanelView');
}
catch (ex) {
    // We just need to type information for this context
}

// TODO: move into globals
export interface Position {
    line: number;
    col: number;
}
export interface TSError {
    filePath: string;
    startPos: Position;
    endPos: Position;
    message: string;
    preview: string;
}

export function echoNumWithModification(query: { num: number }): Promise<{ num: number }> {
    return Promise.resolve({ num: query.num + 10 });
}

export function getUpdatedTextForUnsavedEditors(query: {}): Promise<{ editors: { filePath: string; text: string }[] }> {
    var editors = atomUtils.getTypeScriptEditorsWithPaths().filter(editor => editor.isModified());
    return resolve({
        editors: editors.map(e=> {
            return { filePath: e.getPath(), text: e.getText() }
        })
    });
}

export function getOpenEditorPaths(query: {}): Promise<{ filePaths: string[] }> {
    var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
    return resolve({
        filePaths: paths
    });
}

export function setConfigurationError(query: { projectFilePath: string; error: { message: string; details: any } }): Promise<{}> {
    var errors: TSError[] = [];
    if (query.error) {
        if (query.error.message == tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED) {
            let details: tsconfig.GET_PROJECT_JSON_PARSE_FAILED_Details = query.error.details;
            errors = [
                {
                    filePath: details.projectFilePath,
                    startPos: { line: 0, col: 0 },
                    endPos: { line: 0, col: 0 },
                    message: "The project file contains invalid JSON",
                    preview: details.projectFilePath,
                }
            ]
        }
        if (query.error.message == tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS) {
            let details: tsconfig.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS_Details = query.error.details;
            errors = [
                {
                    filePath: details.projectFilePath,
                    startPos: { line: 0, col: 0 },
                    endPos: { line: 0, col: 0 },
                    message: "The project file contains invalid options",
                    preview: details.errorMessage,
                }
            ]
        }
        if (query.error.message == tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
            let details: tsconfig.GET_PROJECT_GLOB_EXPAND_FAILED_Details = query.error.details;
            errors = [
                {
                    filePath: details.projectFilePath,
                    startPos: { line: 0, col: 0 },
                    endPos: { line: 0, col: 0 },
                    message: "Failed to expand the glob for the project file",
                    preview: details.errorMessage,
                }
            ]
        }
        if (query.error.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            let details: tsconfig.GET_PROJECT_NO_PROJECT_FOUND_Details = query.error.details;
            errors = [
                {
                    filePath: details.projectFilePath,
                    startPos: { line: 0, col: 0 },
                    endPos: { line: 0, col: 0 },
                    message: "No project file found. Please use the 'Create tsconfig.json project file' command",
                    preview: '',
                }
            ]
        }
    }
    mainPanelView.errorView.setErrors(query.projectFilePath, errors);
    return resolve({});
}

export function notifySuccess(query: { message: string }): Promise<{}> {
    atom.notifications.addSuccess(query.message);
    return resolve({});
}

export function buildUpdate(query: BuildUpdate): Promise<{}> {
    mainPanelView.panelView.setBuildProgress(query);
    return resolve({});
}

export interface Test { }
