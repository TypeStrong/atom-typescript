///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import messages = require('./messages');

// Keepalive
var gotMessageDate = new Date();
var maxTimeBetweenMesssages = 1000 * /* second */ 60 * /* min */ 20;
setInterval(() => {
    if ((new Date().getTime() - gotMessageDate.getTime()) > maxTimeBetweenMesssages) {
        // We have been orphaned
        process.exit(messages.orphanExitCode);
    }
}, 1000);

var responders: { [message: string]: (query: any) => any } = {};

// Note: child doesn't care about 'id'
function processData(m: any) {
    var parsed: messages.Message<any> = JSON.parse(m);
    if (!parsed.message || !responders[parsed.message]) return; // TODO: handle this error scenario
    var message = parsed.message;

    process.stdout.write(JSON.stringify({
        message: message,
        id: parsed.id,
        data: responders[message](parsed.data)
    }) + messages.BufferedBySeperatorHandler.seperator);
}

var bufferedHandler = new messages.BufferedBySeperatorHandler(processData)
process.stdin.on('data',(data) => {
    gotMessageDate = new Date();
    // console.log('child got:', data.toString());
    bufferedHandler.handle(data)
});

///////////////// END INFRASTRUCTURE /////////////////////////////////////

///ts:import=programManager
import programManager = require('../main/lang/programManager'); ///ts:import:generated

responders[messages.echo] = (data: messages.EchoQuery): messages.EchoResponse => {
    return { echo: data.echo };
};

responders[messages.updateText] = (data: messages.UpdateTextQuery): messages.UpdateTextResponse => {
    var program = programManager.getOrCreateProgram(data.filePath);
    program.languageServiceHost.updateScript(data.filePath, data.text);
    return {};
}

responders[messages.getErrorsForFile] = (data: messages.GetErrorsForFileQuery): messages.GetErrorsForFileResponse => {
    return {
        errors: programManager.getErrorsForFile(data.filePath)
    };
}

responders[messages.getCompletionsAtPosition] = (data: messages.GetCompletionsAtPositionQuery): messages.GetCompletionsAtPositionResponse => {
    return {
        completions: programManager.getCompletionsAtPosition(data.filePath,data.position,data.prefix)
    };
}
