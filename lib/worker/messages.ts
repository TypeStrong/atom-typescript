export var orphanExitCode = 100;

// Parent makes queries
// Child responds
export interface Message<T> {
    message: string;
    id: string;
    data: T;
}

///////////////////////////////////////////// MESSAGES ///////////////////////////////////////////

///ts:import=programManager
import programManager = require('../main/lang/programManager'); ///ts:import:generated

export var echo = 'echo';
export interface EchoQuery {
    echo: any;
}
export interface EchoResponse {
    echo: any;
}


export var updateText = 'updateText';
export interface UpdateTextQuery {
    filePath: string;
    text: string;
}
export interface UpdateTextResponse { }


export var getErrorsForFile = 'getErrorsForFile';
export interface GetErrorsForFileQuery {
    filePath: string;
}
export interface GetErrorsForFileResponse {
    errors: programManager.TSError[];
}


export var getCompletionsAtPosition = 'getCompletionsAtPosition';
export interface GetCompletionsAtPositionQuery {
    filePath: string;
    position: number;
    prefix: string;
}
export interface GetCompletionsAtPositionResponse {
    completions: programManager.Completion[];
}

export var getErrorsForFileFiltered = 'getErrorsForFileFiltered';
export interface GetErrorsForFileFilteredQuery{
    filePath:string;
}
export interface GetErrorsForFileFilteredResponse{
    errors: programManager.TSError[];
}

export var build = 'build'
export interface BuildQuery{
    // The filepath of the current typescript file in view
    filePath:string;
}
export interface BuildResponse{
    outputs: programManager.BuildOutput;
}
