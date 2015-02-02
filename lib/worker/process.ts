// Much code courtesy : https://github.com/park9140/atom-typescript-tools/blob/master/lib/typescript-tools/process.ts

///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

///ts:import=workerCommon
import workerCommon = require('./workerCommon'); ///ts:import:generated

// Keepalive
setInterval(() => { }, 1000);

export function subscribeMessage(message, callback) {
    process.stdin.on('data',(m) => {
        m = m.toString();
        var parsed: workerCommon.Message = JSON.parse(m);
        if (parsed.message === message) {
            callback(parsed.data);
        }
    });
}

export function sendData(data: any) {
    console.log(JSON.stringify(data));
}

subscribeMessage('echo',(data) => {
    sendData({ message: 'echo', data: data });
});
