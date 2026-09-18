/* =============================== Инициализация изображений ============================== */

const PLACEHOLDER = '/images/ui/gradient.gif';
const ERRORHOLDER = '/images/teachers/nophoto.jpg';
const processedImages = new WeakSet();

function loadImageWithPlaceholder(img) {
    if (processedImages.has(img)) return;
    processedImages.add(img);
    const originalSrc = img.dataset.original || img.getAttribute('src');
    if (!originalSrc || originalSrc === PLACEHOLDER) return;

    img.dataset.original = originalSrc;
    img.src = PLACEHOLDER;
    const preload = new Image();
    preload.onload = function () { img.src = originalSrc; }
    preload.onerror = function () { img.src = ERRORHOLDER; };
    preload.src = originalSrc;
}

function processImages(root = document) {
    if (root.matches && root.matches('img')) loadImageWithPlaceholder(root);
    root.querySelectorAll?.('img').forEach(loadImageWithPlaceholder);
}
processImages();

// Отслеживаем картинки, добавленные позже, в том числе через innerHTML
const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                processImages(node);
            }
        }
    }
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});
