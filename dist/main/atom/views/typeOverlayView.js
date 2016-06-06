"use strict";
var escapeHtml = require('escape-html');
function create(type, comment) {
    var overlayHTML = "\n    <strong>" + escapeHtml(type) + "</strong>\n  ";
    if (comment) {
        overlayHTML += "\n      <br/>\n      <div class='comment'>\n        " + escapeHtml(comment).replace(/(?:\r\n|\r|\n)/g, '<br/>') + "\n      </div>\n    ";
    }
    var overlay = document.createElement('div');
    overlay.className = 'atomts-show-type-view';
    overlay.innerHTML = overlayHTML;
    return overlay;
}
exports.create = create;
