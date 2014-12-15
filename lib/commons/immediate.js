'use strict';
var immediateImpl;
if (typeof window.setImmediate !== 'undefined') {
    immediateImpl = window;
}
else {
    var setImmediateQueue = [], canceledImmediate = {}, sentinel = 'immediate' + String(Math.random()), uidHelper = 0;
    window.addEventListener('message', function (event) {
        if (event.data === sentinel) {
            var queue = setImmediateQueue, canceled = canceledImmediate;
            setImmediateQueue = [];
            canceledImmediate = {};
            queue.forEach(function (task) {
                if (!canceled[task.handle]) {
                    task.callBack.apply(null, task.parameters);
                }
            });
        }
    });
    immediateImpl = {
        setImmediate: function (expression) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            uidHelper++;
            setImmediateQueue.push({
                handle: uidHelper,
                callBack: typeof expression === 'string' ? new Function(expression) : expression,
                parameters: args
            });
            window.postMessage(sentinel, '*');
            return uidHelper;
        },
        clearImmediate: function (handle) {
            canceledImmediate[handle] = true;
        }
    };
    Object.freeze(immediateImpl);
}
module.exports = immediateImpl;
