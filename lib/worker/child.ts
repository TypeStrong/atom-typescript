///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import messages = require('./workerLib');

// Keepalive
messages.keepAlive();

var responders: { [message: string]: (query: any) => any } = {};

// Note: child doesn't care about 'id'
function processData(m: any) {
    var parsed: messages.Message<any> = m;
    if (!parsed.message || !responders[parsed.message]) {
        // TODO: handle this error scenario. Either the message is invalid or we do not have a registered responder
        return;
    }
    var message = parsed.message;
    try {
        var response = responders[message](parsed.data);
    } catch (err) {
        var error = { method: message, message: err.message, stack: err.stack, details: err.details || {} };
    }

    process.send({
        message: message,
        id: parsed.id,
        data: response,
        error: error
    });
}

process.on('message',(data) => {
    // console.log('child got:', data.toString());
    processData(data)
});

///////////////// END INFRASTRUCTURE /////////////////////////////////////

///ts:import=projectService
import projectService = require('../main/lang/projectService'); ///ts:import:generated

function addToResponders<Query, Response>(func: (query: Query) => Response) {
    responders[func.name] = func;
}
// Automatically include all functions from "projectService" as a responder
Object.keys(projectService)
    .filter((funcName) => typeof projectService[funcName] == 'function')
    .forEach((funcName) => addToResponders(projectService[funcName]));
