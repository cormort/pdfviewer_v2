// This inline script in index.html MUST run first to configure the worker:
// <script type="module">
//    import { GlobalWorkerOptions } from './lib/pdfjs/pdf.mjs';
//    GlobalWorkerOptions.workerSrc = './lib/pdfjs/pdf.worker.mjs';
// </script>
// This main script then runs.

document.addEventListener('DOMContentLoaded', () => {
    // 1. SETUP & CONFIGURATION
    // =========================================================================
    if (typeof pdfjsLib === 'undefined') {
        console.error("pdfjsLib is not defined. Check script loading order in index.html.");
        alert("PDF 程式庫載入失敗，請刷新頁面或檢查網路連線。");
        return;
    }

    // 2. GLOBAL VARIABLES & STATE
    // =========================================================================
    let pdfDocs = [], pageMap = [], globalTotalPages = 0, currentPage = 1, pageRendering = false;
    let showSearchResultsHighlights = true, highlighterEnabled = false, textSelectionModeActive = false, localMagnifierEnabled = false;
    let isDrawing = false, lastX = 0, lastY = 0;
    let LOCAL_MAGNIFIER_SIZE = 120, LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;
    let resizeTimeout; // Declare resizeTimeout here as a global variable within this scope

    // 3. DOM ELEMENT SELECTIONS
    // =========================================================================
    const appContainer = document.getElementById('app-container');
    const toolbar = document.getElementById('toolbar');
    const toolbarToggle = document.getElementById('toolbar-toggle-tab');
    const pdfContainer = document.getElementById('pdf-container');
    const canvas = document.getElementById('pdf-canvas');
    // Add null checks for getContext to prevent errors if canvas isn't found
    const ctx = canvas ? canvas.getContext('2d') : null;
    const textLayerDivGlobal = document.getElementById('text-layer');
    const drawingCanvas = document.getElementById('drawing-canvas');
    // Add null checks for getContext
    const drawingCtx = drawingCanvas ? drawingCanvas.getContext('2d') : null;
    const fileInput = document.getElementById('fileInput');
    const searchInputElem = document.getElementById('searchInput');
    const searchActionButton = document.getElementById('search-action-button');
    const goToFirstPageBtn = document.getElementById('go-to-first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumDisplay = document.getElementById('page-num-display');
    const pageToGoInput = document.getElementById('page-to-go');
    const goToPageBtn = document.getElementById('go-to-page-btn');
    const pageSlider = document.getElementById('page-slider');
    const qualitySelector = document.getElementById('quality-selector');
    const bottomResultsBar = document.getElementById('bottom-results-bar');
    const resultsDropdown = document.getElementById('resultsDropdown');
    const prevResultBtn = document.getElementById('prev-result-btn');
    const nextResultBtn = document.getElementById('next-result-btn');
    const toggleUnderlineBtn = document.getElementById('toggle-underline-btn');
    const toggleTextSelectionBtn = document.getElementById('toggle-text-selection-btn');
    const toggleHighlighterBtn = document.getElementById('toggle-highlighter-btn');
    const clearHighlighterBtn = document.getElementById('clear-highlighter-btn');
    const toggleLocalMagnifierBtn = document.getElementById('toggle-local-magnifier-btn');
    const exportPageBtn = document.getElementById('export-page-btn');
    const sharePageBtn = document.getElementById('share-page-btn');
    const magnifierGlass = document.getElementById('magnifier-glass');
    const magnifierCanvas = document.getElementById('magnifier-canvas');
    // Add null checks for getContext
    const localMagnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
    const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
    const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');

    // 4. FUNCTION DEFINITIONS
    // =========================================================================

    function getDocAndLocalPage(globalPage) {
        if (globalPage < 1 || globalPage > globalTotalPages || pageMap.length < globalPage) return null;
        return pageMap[globalPage - 1];
    }

    function updatePageControls() {
        const hasDocs = pdfDocs.length > 0;
        const allControls = document.querySelectorAll('#page-navigation button, #page-navigation input, #floating-action-buttons button, #quality-selector');
        allControls.forEach(el => el.disabled = !hasDocs);
        if (document.getElementById('floating-action-buttons')) {
            document.getElementById('floating-action-buttons').style.display = hasDocs ? 'flex' : 'none';
        }
        if (!hasDocs) {
            pageNumDisplay.textContent = '- / -';
            pageSlider.max = 1;
            pageSlider.value = 1;
            return;
        }
        const docInfo = getDocAndLocalPage(currentPage);
        pageNumDisplay.textContent = docInfo ? `第 ${currentPage} / ${globalTotalPages} 頁 (${docInfo.docName})` : `第 ${currentPage} / ${globalTotalPages} 頁`;
        pageToGoInput.value = currentPage;
        pageToGoInput.max = globalTotalPages;
        pageSlider.max = globalTotalPages;
        pageSlider.value = currentPage;
        goToFirstPageBtn.disabled = currentPage <= 1;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= globalTotalPages;
        sharePageBtn.disabled = !navigator.share;
        toggleUnderlineBtn.classList.toggle('active', showSearchResultsHighlights);
        toggleHighlighterBtn.classList.toggle('active', highlighterEnabled);
        toggleTextSelectionBtn.classList.toggle('active', textSelectionModeActive);
        toggleLocalMagnifierBtn.classList.toggle('active', localMagnifierEnabled);
        localMagnifierZoomControlsDiv.style.display = localMagnifierEnabled ? 'flex' : 'none';
    }

    function renderPage(globalPageNum) {
        if (pdfDocs.length === 0 || pageRendering) return;
        pageRendering = true;
        updatePageControls(); // This call is now safe
        const pageInfo = getDocAndLocalPage(globalPageNum);
        if (!pageInfo) { pageRendering = false; updatePageControls(); return; }
        const { doc, localPage } = pageInfo;
        doc.getPage(localPage).then(page => {
            const patternToUse = getPatternFromSearchInput();
            const containerWidth = pdfContainer.clientWidth;
            const scale = (containerWidth / page.getViewport({scale: 1.0}).width) * parseFloat(qualitySelector.value);
            const viewport = page.getViewport({ scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                return page.getTextContent();
            }).then(textContent => {
                const textLayerViewport = page.getViewport({ scale: canvas.offsetWidth / page.getViewport({scale: 1.0}).width });
                textLayerDivGlobal.style.width = `${canvas.offsetWidth}px`;
                textLayerDivGlobal.style.height = `${canvas.offsetHeight}px`;
                textLayerDivGlobal.style.left = `${canvas.offsetLeft}px`;
                textLayerDivGlobal.style.top = `${canvas.offsetTop}px`;
                return pdfjsLib.renderTextLayer({
                    textContentSource: textContent,
                    container: textLayerDivGlobal,
                    viewport: textLayerViewport,
                }).promise;
            }).then(() => {
                if (showSearchResultsHighlights && patternToUse) {
                    Array.from(textLayerDivGlobal.querySelectorAll('span')).forEach(span => {
                           if (patternToUse.test(span.textContent)) span.classList.add('wavy-underline');
                    });
                }
                drawingCanvas.width = canvas.offsetWidth;
                drawingCanvas.height = canvas.offsetHeight;
                drawingCanvas.style.left = `${canvas.offsetLeft}px`;
                drawingCanvas.style.top = `${canvas.offsetTop}px`;
                drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            }).catch(err => console.error("Error during page rendering:", err))
            .finally(() => {
                pageRendering = false;
                updatePageControls();
            });
        });
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        resetApplicationState();
        const loadingPromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                if (file.type !== 'application/pdf') { resolve(null); return; }
                const reader = new FileReader();
                reader.onload = function() {
                    const typedarray = new Uint8Array(this.result);
                    pdfjsLib.getDocument({ data: typedarray, isEvalSupported: false, enableXfa: false })
                        .promise.then(pdf => resolve({ pdf, name: file.name }))
                        .catch(reason => reject(reason));
                };
                reader.readAsArrayBuffer(file);
            });
        });
        Promise.all(loadingPromises).then(results => {
            const loadedPdfs = results.filter(r => r !== null);
            if (loadedPdfs.length === 0) { alert("未選擇任何有效的PDF檔案。"); return; }
            loadedPdfs.forEach((result, docIndex) => {
                pdfDocs.push(result.pdf);
                for (let i = 1; i <= result.pdf.numPages; i++) {
                    pageMap.push({ docIndex, localPage: i, docName: result.name });
                }
            });
            globalTotalPages = pageMap.length;
            renderPage(1);
        }).catch(error => {
            alert(`讀取PDF文件時發生錯誤: ${error.message || error}`);
        });
    }

    function searchKeyword() {
        const input = searchInputElem.value.trim();
        resultsDropdown.innerHTML = '<option value="">搜尋中...</option>';
        updateResultsNav();
        if (pdfDocs.length === 0 || !input) {
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav(); return;
        }
        const pattern = getPatternFromSearchInput();
        if (!pattern) { alert("正則表達式格式錯誤"); resultsDropdown.innerHTML = ''; updateResultsNav(); return; }
        resultsDropdown.disabled = true;
        const promises = pageMap.map((pageInfo, index) => {
            const doc = pdfDocs[pageInfo.docIndex];
            if (!doc) return Promise.resolve(null);
            return doc.getPage(pageInfo.localPage).then(page =>
                page.getTextContent().then(textContent =>
                    pattern.test(textContent.items.map(it => it.str).join(''))
                        ? { page: index + 1, docName: pageInfo.docName }
                        : null
                )
            );
        });
        Promise.all(promises).then(results => {
            const foundPages = results.filter(r => r !== null);
            resultsDropdown.innerHTML = '';
            if (foundPages.length === 0) {
                resultsDropdown.innerHTML = '<option>找不到關鍵字</option>';
            } else {
                foundPages.forEach(result => {
                    const option = document.createElement('option');
                    option.value = result.page;
                    option.textContent = `第 ${result.page} 頁 (${result.docName})`;
                    resultsDropdown.appendChild(option);
                });
                goToPage(foundPages[0].page);
            }
        }).finally(() => {
            resultsDropdown.disabled = false;
            updateResultsNav();
        });
    }

    function updateResultsNav() {
        const hasResults = resultsDropdown.options.length > 0 && resultsDropdown.options[0].value !== '' && resultsDropdown.options[0].textContent !== '找不到關鍵字';
        document.body.classList.toggle('results-bar-visible', hasResults);
        if (!hasResults) return;
        const currentIndex = resultsDropdown.selectedIndex;
        prevResultBtn.disabled = currentIndex <= 0;
        nextResultBtn.disabled = currentIndex >= resultsDropdown.options.length - 1;
    }

    function navigateResults(direction) {
        const options = Array.from(resultsDropdown.options).filter(opt => opt.value);
        if (options.length === 0) return;
        const currentIndex = options.findIndex(opt => opt.selected);
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < options.length) {
            options[newIndex].selected = true;
            goToPageDropdown(options[newIndex].value);
        }
    }

    function goToPage(pageNum) {
        if (isNaN(pageNum) || pageNum < 1 || pageNum > globalTotalPages) return;
        currentPage = pageNum;
        renderPage(currentPage);
    }

    function goToPageDropdown(pageNumStr) { if (pageNumStr) goToPage(parseInt(pageNumStr, 10)); updateResultsNav(); }
    function handleGoToPage() { goToPage(parseInt(pageToGoInput.value, 10)); }
    
    function getPatternFromSearchInput() {
        const input = searchInputElem.value.trim();
        if (!input) return null;
        try {
            if (input.startsWith('/') && input.endsWith('/')) {
                const lastSlash = input.lastIndexOf('/');
                if (lastSlash > 0) {
                    return new RegExp(input.slice(1, lastSlash), input.slice(lastSlash + 1) || 'gi');
                }
            }
            return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        } catch (e) { return null; }
    }

    function resetApplicationState() {
        pdfDocs = []; pageMap = []; globalTotalPages = 0; currentPage = 1;
        resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        updateResultsNav(); resetModes(); updatePageControls();
    }
    
    function resetModes() {
        highlighterEnabled = textSelectionModeActive = localMagnifierEnabled = false;
        textLayerDivGlobal.classList.remove('text-selection-active');
        textLayerDivGlobal.style.pointerEvents = 'none';
        drawingCanvas.style.pointerEvents = 'none';
        // Only attempt to set visibility if canvas exists
        if (canvas) canvas.style.visibility = 'visible'; 
        if (drawingCtx) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        if (magnifierGlass) magnifierGlass.style.display = 'none';
        updatePageControls();
    }
    
    function setMode(mode) {
        textSelectionModeActive = (mode === 'text');
        highlighterEnabled = (mode === 'highlighter');
        localMagnifierEnabled = (mode === 'magnifier');
        textLayerDivGlobal.classList.toggle('text-selection-active', textSelectionModeActive);
        textLayerDivGlobal.style.pointerEvents = textSelectionModeActive ? 'auto' : 'none';
        drawingCanvas.style.pointerEvents = highlighterEnabled ? 'auto' : 'none';
        // Only attempt to set visibility if canvas exists
        if (canvas) canvas.style.visibility = textSelectionModeActive ? 'hidden' : 'visible'; 
        if (!localMagnifierEnabled && magnifierGlass) magnifierGlass.style.display = 'none';
        updatePageControls();
    }
    
    // --- Other helper functions ---
    function toggleTextSelection() { if (pdfDocs.length > 0) setMode(textSelectionModeActive ? null : 'text'); }
    function toggleHighlighter() { if (pdfDocs.length > 0) setMode(highlighterEnabled ? null : 'highlighter'); }
    function toggleLocalMagnifier() { if (pdfDocs.length > 0) setMode(localMagnifierEnabled ? null : 'magnifier'); }
    function startDrawing(e) { if (!highlighterEnabled) return; isDrawing = true; [lastX, lastY] = [e.offsetX, e.offsetY]; }
    function draw(e) { if (!isDrawing) return; drawingCtx.beginPath(); drawingCtx.moveTo(lastX, lastY); drawingCtx.lineTo(e.offsetX, e.offsetY); drawingCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; drawingCtx.lineWidth = 20; drawingCtx.lineCap = 'round'; drawingCtx.stroke(); [lastX, lastY] = [e.offsetX, e.offsetY]; }
    function stopDrawing() { isDrawing = false; }
    function handlePointerMoveForLocalMagnifier(e) { if (!localMagnifierEnabled) return; const touch = e.touches ? e.touches[0] : e; updateLocalMagnifier(touch.clientX, touch.clientY); }
    function handlePointerLeaveForLocalMagnifier() { if (localMagnifierEnabled && magnifierGlass) magnifierGlass.style.display = 'none'; }
    // You need to provide the actual implementation for updateLocalMagnifier
    function updateLocalMagnifier(clientX, clientY) {
        if (!magnifierGlass || !magnifierCanvas || !localMagnifierCtx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        if (canvasX < 0 || canvasX > rect.width || canvasY < 0 || canvasY > rect.height) {
            magnifierGlass.style.display = 'none';
            return;
        }

        magnifierGlass.style.display = 'block';
        magnifierGlass.style.left = `${clientX - LOCAL_MAGNIFIER_SIZE / 2}px`;
        magnifierGlass.style.top = `${clientY - LOCAL_MAGNIFIER_SIZE / 2}px`;
        magnifierCanvas.width = LOCAL_MAGNIFIER_SIZE;
        magnifierCanvas.height = LOCAL_MAGNIFIER_SIZE;

        const sourceX = canvasX - (LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL / 2);
        const sourceY = canvasY - (LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL / 2);

        localMagnifierCtx.drawImage(
            canvas,
            sourceX,
            sourceY,
            LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL,
            LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL,
            0,
            0,
            LOCAL_MAGNIFIER_SIZE,
            LOCAL_MAGNIFIER_SIZE
        );
    }
    async function getAnnotatedPageAsBlob(type = 'image/png') {
        if (!pdfDocs.length || !canvas || !drawingCanvas) return null;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // Draw PDF content
        tempCtx.drawImage(canvas, 0, 0);

        // Draw highlighter markings
        tempCtx.drawImage(drawingCanvas, 0, 0);

        return new Promise(resolve => {
            tempCanvas.toBlob(resolve, type);
        });
    }

    async function exportPageAsImage() {
        const blob = await getAnnotatedPageAsBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const docInfo = getDocAndLocalPage(currentPage);
            const filename = docInfo ? `page_${currentPage}_${docInfo.docName.replace(/\.pdf$/, '')}.png` : `page_${currentPage}.png`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('無法匯出頁面，請確認已載入PDF。');
        }
    }

    async function sharePage() {
        if (!navigator.share) {
            alert('您的瀏覽器不支持分享功能。');
            return;
        }

        const blob = await getAnnotatedPageAsBlob();
        if (blob) {
            try {
                const file = new File([blob], `page_${currentPage}.png`, { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: `PDF Viewer - Page ${currentPage}`,
                    text: `Check out page ${currentPage} from this PDF!`,
                });
            } catch (error) {
                console.error('分享失敗:', error);
                alert('分享失敗。');
            }
        } else {
            alert('無法分享頁面，請確認已載入PDF。');
        }
    }


    // 5. EVENT LISTENERS & INITIALIZATION
    // =========================================================================
    if (toolbarToggle) toolbarToggle.addEventListener('click', () => appContainer.classList.toggle('menu-active'));
    if (pdfContainer) pdfContainer.addEventListener('click', (e) => { if (e.target === pdfContainer && window.innerWidth <= 768) appContainer.classList.remove('menu-active'); });
    fileInput.addEventListener('change', handleFileSelect);
    searchActionButton.addEventListener('click', searchKeyword);
    searchInputElem.addEventListener('keypress', e => { if (e.key === 'Enter') searchActionButton.click(); });
    prevResultBtn.addEventListener('click', () => navigateResults(-1));
    nextResultBtn.addEventListener('click', () => navigateResults(1));
    resultsDropdown.addEventListener('change', () => goToPageDropdown(resultsDropdown.value));
    goToFirstPageBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) goToPage(currentPage - 1); });
    nextPageBtn.addEventListener('click', () => { if (currentPage < globalTotalPages) goToPage(currentPage + 1); });
    goToPageBtn.addEventListener('click', handleGoToPage);
    pageToGoInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleGoToPage(); });
    pageSlider.addEventListener('input', () => goToPage(parseInt(pageSlider.value)));
    qualitySelector.addEventListener('change', () => { if (pdfDocs.length > 0) renderPage(currentPage); });
    toggleUnderlineBtn.addEventListener('click', () => { showSearchResultsHighlights = !showSearchResultsHighlights; renderPage(currentPage); });
    toggleTextSelectionBtn.addEventListener('click', () => setMode(textSelectionModeActive ? null : 'text'));
    toggleHighlighterBtn.addEventListener('click', () => setMode(highlighterEnabled ? null : 'highlighter'));
    clearHighlighterBtn.addEventListener('click', () => { if (drawingCtx) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); });
    toggleLocalMagnifierBtn.addEventListener('click', () => setMode(localMagnifierEnabled ? null : 'magnifier'));
    localMagnifierZoomSelector.addEventListener('change', (e) => { LOCAL_MAGNIFIER_ZOOM_LEVEL = parseFloat(e.target.value); });
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    drawingCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    drawingCanvas.addEventListener('touchmove', draw, { passive: false });
    drawingCanvas.addEventListener('touchend', stopDrawing);
    drawingCanvas.addEventListener('touchcancel', stopDrawing);
    pdfContainer.addEventListener('mousemove', handlePointerMoveForLocalMagnifier);
    pdfContainer.addEventListener('mouseleave', handlePointerLeaveForLocalMagnifier);
    pdfContainer.addEventListener('touchstart', handlePointerMoveForLocalMagnifier, { passive: false });
    pdfContainer.addEventListener('touchmove', handlePointerMoveForLocalMagnifier, { passive: false });
    pdfContainer.addEventListener('touchend', handlePointerLeaveForLocalMagnifier);
    pdfContainer.addEventListener('touchcancel', handlePointerLeaveForLocalMagnifier);
    window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(() => { if (pdfDocs.length > 0) renderPage(currentPage); }, 250); });

    // Initial call to set up the UI correctly on page load
    updatePageControls(); // This is now safe as updatePageControls is defined above.
    updateResultsNav();
});
