var messages = require('./messages');
var gotMessageDate = new Date();
var maxTimeBetweenMesssages = 1000 * 60 * 20;
setInterval(function () {
    if ((new Date().getTime() - gotMessageDate.getTime()) > maxTimeBetweenMesssages) {
        process.exit(messages.orphanExitCode);
    }
}, 1000);
var responders = {};
function processData(m) {
    var parsed = JSON.parse(m);
    if (!parsed.message || !responders[parsed.message])
        return;
    var message = parsed.message;
    process.stdout.write(JSON.stringify({
        message: message,
        id: parsed.id,
        data: responders[message](parsed.data)
    }) + messages.BufferedBySeperatorHandler.seperator);
}
var bufferedHandler = new messages.BufferedBySeperatorHandler(processData);
process.stdin.on('data', function (data) {
    gotMessageDate = new Date();
    bufferedHandler.handle(data);
});
responders[messages.echo] = function (data) {
    return { echo: data.echo };
};
