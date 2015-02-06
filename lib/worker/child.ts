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
    var parsed: messages.Message<any> = m;
    if (!parsed.message || !responders[parsed.message]) return; // TODO: handle this error scenario
    var message = parsed.message;

    process.send({
        message: message,
        id: parsed.id,
        data: responders[message](parsed.data)
    });
}

process.on('message',(data) => {
    gotMessageDate = new Date();
    // console.log('child got:', data.toString());
    processData(data)
});

///////////////// END INFRASTRUCTURE /////////////////////////////////////

///ts:import=programManager
import programManager = require('../main/lang/programManager'); ///ts:import:generated

function addToResponders<Query, Response>(func: (query: Query) => Response) {
    responders[func.name] = func;
}
// TODO: this can be automated by cleaning up *what* program manager exports
addToResponders(programManager.echo);
addToResponders(programManager.quickInfo);
addToResponders(programManager.build);
addToResponders(programManager.errorsForFileFiltered);
addToResponders(programManager.getCompletionsAtPosition);
addToResponders(programManager.emitFile);
addToResponders(programManager.formatDocument);
addToResponders(programManager.formatDocumentRange);
addToResponders(programManager.getDefinitionsAtPosition);
addToResponders(programManager.updateText);
addToResponders(programManager.errorsForFile);
