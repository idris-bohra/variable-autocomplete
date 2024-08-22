export function getCaretPosition(editableDiv) {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0).cloneRange();
    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.height = '0px';
    range.insertNode(span);
    const rect = span.getBoundingClientRect();
    const caretPosition = {
        left: rect.left,
        top: rect.top + 16,
        right: rect.right,
        bottom: rect.bottom
    };
    span.parentNode.removeChild(span);
    return caretPosition;
}