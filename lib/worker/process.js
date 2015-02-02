setInterval(function () {
}, 1000);
function subscribeMessage(message, callback) {
    process.stdin.on('data', function (m) {
        m = m.toString();
        var parsed = JSON.parse(m);
        if (parsed.message === message) {
            callback(parsed.data);
        }
    });
}
exports.subscribeMessage = subscribeMessage;
function sendData(data) {
    console.log(JSON.stringify(data));
}
exports.sendData = sendData;
subscribeMessage('echo', function (data) {
    sendData({ message: 'echo', data: data });
});
