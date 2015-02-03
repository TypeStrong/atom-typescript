// Much code courtesy : https://github.com/park9140/atom-typescript-tools/blob/master/lib/typescript-tools/process.ts

///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import messages = require('./messages');

// Keepalive
setInterval(() => { }, 1000);

var responders: { [message: string]: (query: any) => any } = {};

// Note: child doesn't care about 'id'
process.stdin.on('data',(m) => {
    m = m.toString();
    var parsed: messages.Message<any> = JSON.parse(m);
    if (!parsed.message || !responders[parsed.message]) return; // TODO: handle this error scenario
    var message = parsed.message;

    console.log(JSON.stringify({
        message: message,
        id: parsed.id,
        data: responders[message](parsed.data)
    }));
});

///////////////// END INFRASTRUCTURE /////////////////////////////////////


responders[messages.echo] = (data: messages.EchoQuery): messages.EchoResponse => {
    return { echo: data.echo };
};
