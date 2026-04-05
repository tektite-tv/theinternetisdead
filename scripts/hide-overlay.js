(function(){
    if(window.__hideOverlayShortcutInitialized) return;
    window.__hideOverlayShortcutInitialized = true;

    const boundWindows = new WeakSet();
    const observedIframes = new WeakSet();
    const overlayState = new WeakMap();

    function shouldIgnoreShortcut(event){
        const view = event.view || window;
        const doc = view.document || document;
        const activeElement = doc.activeElement;
        if(!activeElement) return false;
        const tag = activeElement.tagName ? activeElement.tagName.toUpperCase() : '';
        return (
            tag === 'INPUT' ||
            tag === 'TEXTAREA' ||
            tag === 'SELECT' ||
            activeElement.isContentEditable
        );
    }

    function getOverlayElement(doc){
        if(!doc) return null;
        return doc.getElementById('overlay-container');
    }

    function notifyLayoutChange(targetWindow){
        try{
            targetWindow.dispatchEvent(new Event('resize'));
            targetWindow.dispatchEvent(new Event('orientationchange'));
        }catch(error){
            console.warn('Unable to notify layout change after overlay toggle:', error);
        }
    }

    function toggleOverlay(targetWindow){
        const doc = targetWindow.document;
        const overlay = getOverlayElement(doc);
        if(!overlay) return;

        const currentlyHidden = overlay.dataset.overlayHidden === 'true';
        if(currentlyHidden){
            const previousDisplay = overlayState.get(overlay);
            overlay.style.display = typeof previousDisplay === 'string' ? previousDisplay : '';
        }else{
            overlayState.set(overlay, overlay.style.display);
            overlay.style.display = 'none';
        }

        overlay.dataset.overlayHidden = currentlyHidden ? 'false' : 'true';
        doc.documentElement.classList.toggle('overlay-hidden', !currentlyHidden);
        if(doc.body){
            doc.body.classList.toggle('overlay-hidden', !currentlyHidden);
        }
        notifyLayoutChange(targetWindow);
    }

    function handleShortcut(event){
        const key = (event.key || '').toLowerCase();
        if(!(event.ctrlKey && event.shiftKey && key === 'o')) return;
        if(event.metaKey || event.altKey) return;
        if(shouldIgnoreShortcut(event)) return;
        event.preventDefault();
        event.stopPropagation();
        toggleOverlay(window.top || window);
    }

    function bindWindow(targetWindow){
        if(!targetWindow || boundWindows.has(targetWindow)) return;
        try{
            targetWindow.addEventListener('keydown', handleShortcut, true);
            boundWindows.add(targetWindow);
            bindIframeDescendants(targetWindow.document);
        }catch(error){
            console.warn('Unable to bind overlay shortcut to window:', error);
        }
    }

    function watchIframe(iframe){
        if(!iframe || observedIframes.has(iframe)) return;
        observedIframes.add(iframe);
        iframe.addEventListener('load', () => {
            try{
                bindWindow(iframe.contentWindow);
            }catch(error){
                console.warn('Unable to bind overlay shortcut to iframe:', error);
            }
        });
        try{
            if(iframe.contentWindow && iframe.contentDocument && iframe.contentDocument.readyState !== 'loading'){
                bindWindow(iframe.contentWindow);
            }
        }catch(error){
            console.warn('Unable to inspect iframe for overlay shortcut:', error);
        }
    }

    function bindIframeDescendants(rootDocument){
        if(!rootDocument) return;
        rootDocument.querySelectorAll('iframe').forEach(watchIframe);
    }

    const mutationObserver = new MutationObserver(() => bindIframeDescendants(document));
    mutationObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });

    bindWindow(window);
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', () => bindIframeDescendants(document), { once: true });
    }else{
        bindIframeDescendants(document);
    }
})();
