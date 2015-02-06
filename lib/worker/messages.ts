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
