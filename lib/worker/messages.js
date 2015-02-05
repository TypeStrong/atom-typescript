var BufferedBySeperatorHandler = (function () {
    function BufferedBySeperatorHandler(callback) {
        this.callback = callback;
        this.totalTrailing = [];
        this.incompleteEnding = '';
    }
    BufferedBySeperatorHandler.prototype.handle = function (data) {
        var m = data.toString();
        if (!m && this.totalTrailing.length) {
            m = this.totalTrailing.shift();
            if (this.totalTrailing.length == 1 && this.incompleteEnding) {
                m = m + this.incompleteEnding;
                this.incompleteEnding = '';
                this.handle(m);
                return;
            }
        }
        else {
            m = m.toString();
            var parts = m.split(BufferedBySeperatorHandler.seperator);
            if (parts.length == 2 && parts[1] == '') {
            }
            else if (parts.length > 1) {
                var more = parts.slice(1, parts.length - 1);
                this.totalTrailing = this.totalTrailing.concat(more);
                this.incompleteEnding = parts[parts.length - 1];
            }
            m = parts[0];
        }
        this.callback(m);
        if (this.totalTrailing.length) {
            this.handle('');
        }
    };
    BufferedBySeperatorHandler.seperator = new Buffer('fHxhdG9tdHN8fA==', 'base64').toString();
    return BufferedBySeperatorHandler;
})();
exports.BufferedBySeperatorHandler = BufferedBySeperatorHandler;
exports.orphanExitCode = 100;
exports.echo = 'echo';
exports.updateText = 'updateText';
exports.getErrorsForFile = 'getErrorsForFile';
exports.getCompletionsAtPosition = 'getCompletionsAtPosition';
