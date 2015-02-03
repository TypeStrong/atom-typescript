// Much code courtesy : https://github.com/park9140/atom-typescript-tools/blob/master/lib/typescript-tools/process.ts

// TO DEBUG simply console.log from here and change the handler in parent to log out responses.

///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import messages = require('./messages');

// Keepalive
setInterval(() => { }, 1000);

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
    // console.log('child got:', data.toString());
    bufferedHandler.handle(data)
});

///////////////// END INFRASTRUCTURE /////////////////////////////////////

responders[messages.echo] = (data: messages.EchoQuery): messages.EchoResponse => {
    return { echo: data.echo };
};
