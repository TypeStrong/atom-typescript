"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escapeHtml = require("escape-html");
function create(type, comment) {
    let overlayHTML = `
    <strong>${escapeHtml(type)}</strong>
  `;
    if (comment) {
        overlayHTML += `
      <br/>
      <div class='comment'>
        ${escapeHtml(comment).replace(/(?:\r\n|\r|\n)/g, '<br/>')}
      </div>
    `;
    }
    const overlay = document.createElement('div');
    overlay.className = 'atomts-show-type-view';
    overlay.innerHTML = overlayHTML;
    return overlay;
}
exports.create = create;
