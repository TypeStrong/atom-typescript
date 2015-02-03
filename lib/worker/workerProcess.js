var messages = require('./messages');
setInterval(function () {
}, 1000);
var responders = {};
process.stdin.on('data', function (m) {
    m = m.toString();
    var parsed = JSON.parse(m);
    if (!parsed.message || !responders[parsed.message])
        return;
    var message = parsed.message;
    console.log(JSON.stringify({
        message: message,
        id: parsed.id,
        data: responders[message](parsed.data)
    }));
});
responders[messages.echo] = function (data) {
    return { echo: data.echo };
};
