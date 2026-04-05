(function(){
    if(window.__pageScreenshotShortcutInitialized) return;
    window.__pageScreenshotShortcutInitialized = true;

    const DOWNLOAD_PREFIX = 'page-screenshot';
    let captureInProgress = false;
    const boundWindows = new WeakSet();
    const observedIframes = new WeakSet();

    function getDisplayName(){
        const path = (window.location.pathname || '/').replace(/\/$/, '').split('/').filter(Boolean).join('-') || 'home';
        return path;
    }

    function formatTimestamp(date){
        const pad = (value) => String(value).padStart(2, '0');
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('-') + '_' + [
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds())
        ].join('-');
    }

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

    async function saveCurrentTabScreenshot(){
        if(captureInProgress) return;
        if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){
            console.warn('Tab screenshot shortcut is not supported in this browser.');
            return;
        }

        captureInProgress = true;
        let stream;

        try{
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    preferCurrentTab: true,
                    displaySurface: 'browser',
                    surfaceSwitching: 'exclude'
                },
                audio: false
            });

            const video = document.createElement('video');
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;

            await video.play();
            await new Promise((resolve) => {
                if(video.readyState >= 2){
                    resolve();
                    return;
                }
                video.addEventListener('loadeddata', resolve, { once: true });
            });
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const track = stream.getVideoTracks()[0];
            const settings = track ? track.getSettings() : {};
            const width = settings.width || video.videoWidth || window.innerWidth;
            const height = settings.height || video.videoHeight || window.innerHeight;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext('2d', { alpha: false });
            context.drawImage(video, 0, 0, width, height);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `${DOWNLOAD_PREFIX}-${getDisplayName()}-${formatTimestamp(new Date())}.png`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            video.pause();
            video.srcObject = null;
        }catch(error){
            console.error('Page screenshot shortcut failed:', error);
        }finally{
            if(stream){
                stream.getTracks().forEach((track) => track.stop());
            }
            captureInProgress = false;
        }
    }

    function handleShortcut(event){
        const key = (event.key || '').toLowerCase();
        if(!(event.ctrlKey && event.shiftKey && key === 's')) return;
        if(event.metaKey || event.altKey) return;
        if(shouldIgnoreShortcut(event)) return;
        event.preventDefault();
        event.stopPropagation();
        saveCurrentTabScreenshot();
    }

    function bindWindow(targetWindow){
        if(!targetWindow || boundWindows.has(targetWindow)) return;
        try{
            targetWindow.addEventListener('keydown', handleShortcut, true);
            boundWindows.add(targetWindow);
            bindIframeDescendants(targetWindow.document);
        }catch(error){
            console.warn('Unable to bind screenshot shortcut to window:', error);
        }
    }

    function watchIframe(iframe){
        if(!iframe || observedIframes.has(iframe)) return;
        observedIframes.add(iframe);
        iframe.addEventListener('load', () => {
            try{
                bindWindow(iframe.contentWindow);
            }catch(error){
                console.warn('Unable to bind screenshot shortcut to iframe:', error);
            }
        });
        try{
            if(iframe.contentWindow && iframe.contentDocument && iframe.contentDocument.readyState !== 'loading'){
                bindWindow(iframe.contentWindow);
            }
        }catch(error){
            console.warn('Unable to inspect iframe for screenshot shortcut:', error);
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
