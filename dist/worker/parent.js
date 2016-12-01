"use strict";
var clientResolver_1 = require("../client/clientResolver");
var mainPanel = require("../main/atom/views/mainPanelView");
var tsconfig = require("tsconfig/dist/tsconfig");
exports.clients = new clientResolver_1.ClientResolver();
exports.clients.on("pendingRequestsChange", function () {
    if (!mainPanel.panelView)
        return;
    var pending = Object.keys(exports.clients.clients)
        .map(function (serverPath) { return exports.clients.clients[serverPath].pending; });
    mainPanel.panelView.updatePendingRequests([].concat.apply([], pending));
});
function loadProjectConfig(sourcePath) {
    return exports.clients.get(sourcePath).then(function (client) {
        return client.executeProjectInfo({ needFileNameList: false, file: sourcePath }).then(function (result) {
            return tsconfig.load(result.body.configFileName);
        });
    });
}
exports.loadProjectConfig = loadProjectConfig;
