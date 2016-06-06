import escapeHtml = require('escape-html');

export function create(type, comment) {
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
