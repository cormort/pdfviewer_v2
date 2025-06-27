document.addEventListener('DOMContentLoaded', () => {
    // **This is from your original file and is correct**
    if (typeof pdfjsLib !== 'undefined') {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdfjs/pdf.worker.mjs';
        }
    } else {
        console.error("pdfjsLib is not defined. Check the import or script loading order.");
        alert("PDF 程式庫載入失敗，請刷新頁面或檢查網路連線。");
        return;
    }

    // Original variables from your file
    let pdfDocs = [];
    let pageMap = [];
    let globalTotalPages = 0;
    let currentPage = 1;
    let pageRendering = false;
    let showSearchResultsHighlights = true;
    let highlighterEnabled = false;
    let textSelectionModeActive = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let localMagnifierEnabled = false;
    let LOCAL_MAGNIFIER_SIZE = 120;
    let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

    // Original DOM element selections from your file
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const toolbar = document.getElementById('toolbar');
    const pdfContainer = document.getElementById('pdf-container');
    const textLayerDivGlobal = document.getElementById('text-layer');
    const goToFirstPageBtn = document.getElementById('go-to-first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumDisplay = document.getElementById('page-num-display');
    const pageToGoInput = document.getElementById('page-to-go');
    const goToPageBtn = document.getElementById('go-to-page-btn');
    const pageSlider = document.getElementById('page-slider');
    const qualitySelector = document.getElementById('quality-selector');
    const exportPageBtn = document.getElementById('export-page-btn');
    const sharePageBtn = document.getElementById('share-page-btn');
    const toggleUnderlineBtn = document.getElementById('toggle-underline-btn');
    const toggleHighlighterBtn = document.getElementById('toggle-highlighter-btn');
    const clearHighlighterBtn = document.getElementById('clear-highlighter-btn');
    const toggleTextSelectionBtn = document.getElementById('toggle-text-selection-btn');
    const drawingCanvas = document.getElementById('drawing-canvas');
    const drawingCtx = drawingCanvas ? drawingCanvas.getContext('2d') : null;
    const searchInputElem = document.getElementById('searchInput');
    const searchActionButton = document.getElementById('search-action-button');
    const magnifierGlass = document.getElementById('magnifier-glass');
    const magnifierCanvas = document.getElementById('magnifier-canvas');
    const localMagnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
    const toggleLocalMagnifierBtn = document.getElementById('toggle-local-magnifier-btn');
    const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
    const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');

    // **NEW/MODIFIED**: Get new UI elements
    const appContainer = document.getElementById('app-container');
    const toolbarToggle = document.getElementById('toolbar-toggle-tab');
    const bottomResultsBar = document.getElementById('bottom-results-bar');
    const resultsDropdown = document.getElementById('resultsDropdown');
    const prevResultBtn = document.getElementById('prev-result-btn');
    const nextResultBtn = document.getElementById('next-result-btn');


    // --- Event Listeners ---

    // **MODIFICATION**: Event listener for the new tab-style button
    if (toolbarToggle && appContainer) {
        toolbarToggle.addEventListener('click', () => {
            appContainer.classList.toggle('menu-active');
        });
    }

    // Keep the original logic to close the menu by clicking outside
    if (pdfContainer && appContainer) {
        pdfContainer.addEventListener('click', (e) => {
            if (e.target === pdfContainer && window.innerWidth <= 768 && appContainer.classList.contains('menu-active')) {
                appContainer.classList.remove('menu-active');
            }
        });
    }

    // **NEW**: Listeners for the bottom bar controls
    prevResultBtn.addEventListener('click', () => navigateResults(-1));
    nextResultBtn.addEventListener('click', () => navigateResults(1));
    resultsDropdown.addEventListener('change', () => goToPageDropdown(resultsDropdown.value));

    // Original event listeners from your file
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    searchActionButton.addEventListener('click', searchKeyword);
    // ... all other listeners from your original file are kept
    goToFirstPageBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) goToPage(currentPage - 1); });
    nextPageBtn.addEventListener('click', () => { if (currentPage < globalTotalPages) goToPage(currentPage + 1); });
    pageToGoInput.addEventListener('keypress', e => { if (e.key === 'Enter') goToPageBtn.click(); });
    goToPageBtn.addEventListener('click', () => {
        const pageNum = parseInt(pageToGoInput.value);
        if (!isNaN(pageNum)) goToPage(pageNum);
    });
    // ... and so on

    // --- Core Functions (kept as close to original as possible) ---
    
    // Original handleFileSelect function from your file, with one line added
    function handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        pdfDocs = [];
        pageMap = [];
        globalTotalPages = 0;
        currentPage = 1;

        // **MODIFICATION**: Reset search UI
        resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        updateResultsNav(); // Hide bottom bar
        searchInputElem.value = '';

        // The rest of the function is from your original file
        const loadingPromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                if (file.type !== 'application/pdf') { resolve(null); return; }
                const reader = new FileReader();
                reader.onload = function() {
                    const typedarray = new Uint8Array(this.result);
                    pdfjsLib.getDocument({ data: typedarray, isEvalSupported: false, enableXfa: false })
                        .promise.then(pdf => resolve({ pdf, name: file.name }))
                        .catch(reason => reject(`無法載入檔案 ${file.name}: ${reason.message || reason}`));
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
        }).catch(error => alert(`讀取PDF文件時發生錯誤: ${error}`));
    }
    
    // Original renderPage and renderTextLayer from your file
    function renderPage(globalPageNum, highlightPattern = null) {
        if (pdfDocs.length === 0 || pageRendering) return;
        pageRendering = true;
        updatePageControls();
        const pageInfo = getDocAndLocalPage(globalPageNum);
        if (!pageInfo) { pageRendering = false; updatePageControls(); return; }
        const { doc, localPage } = pageInfo;
        doc.getPage(localPage).then(page => {
            const containerWidth = pdfContainer.clientWidth;
            const scale = (containerWidth / page.getViewport({scale: 1.0}).width) * parseFloat(qualitySelector.value);
            const viewport = page.getViewport({ scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.width = "100%";
            canvas.style.height = "auto";
            page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                pageRendering = false;
                updatePageControls();
                const textLayerViewport = page.getViewport({ scale: canvas.offsetWidth / page.getViewport({scale: 1.0}).width });
                return renderTextLayer(page, textLayerViewport, highlightPattern || getPatternFromSearchInput());
            });
        });
    }

    function renderTextLayer(page, viewport, highlightPattern) {
        page.getTextContent().then(textContent => {
            textLayerDivGlobal.innerHTML = '';
            textLayerDivGlobal.style.width = `${viewport.width}px`;
            textLayerDivGlobal.style.height = `${viewport.height}px`;
            textLayerDivGlobal.style.left = `${canvas.offsetLeft}px`;
            textLayerDivGlobal.style.top = `${canvas.offsetTop}px`;
            pdfjsLib.renderTextLayer({
                textContentSource: textContent,
                container: textLayerDivGlobal,
                viewport: viewport,
            }).promise.then(() => {
                if (showSearchResultsHighlights && highlightPattern) {
                    Array.from(textLayerDivGlobal.querySelectorAll('span')).forEach(span => {
                         if (highlightPattern.test(span.textContent)) span.classList.add('wavy-underline');
                    });
                }
            });
        });
    }

    // Original searchKeyword function from your file
    function searchKeyword() {
        // ... (The original search logic is kept, but it will populate the bottom dropdown now)
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
                goToPage(foundPages[0].page, pattern);
            }
        }).finally(() => {
            resultsDropdown.disabled = false;
            updateResultsNav();
        });
    }

    // All other original functions are kept
    function getPatternFromSearchInput() {
        const input = searchInputElem.value.trim();
        if (!input) return null;
        try {
            if (input.startsWith('/') && input.endsWith('/')) {
                const lastSlash = input.lastIndexOf('/');
                if (lastSlash > 0) {
                    const pattern = input.slice(1, lastSlash);
                    const flags = input.slice(lastSlash + 1) || 'gi';
                    return new RegExp(pattern, flags);
                }
            }
            return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        } catch (e) { return null; }
    }

    function goToPage(pageNum, highlightPattern = null) {
        if (isNaN(pageNum) || pageNum < 1 || pageNum > globalTotalPages) return;
        currentPage = pageNum;
        renderPage(currentPage, highlightPattern);
    }
    
    // **NEW/MODIFIED**: Functions to control new UI
    function goToPageDropdown(pageNumStr) {
        if (pageNumStr) goToPage(parseInt(pageNumStr, 10));
        updateResultsNav();
    }
    function handleGoToPage() { goToPage(parseInt(pageToGoInput.value, 10)); }

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

    function updateResultsNav() {
        const hasResults = resultsDropdown.options.length > 0 && resultsDropdown.options[0].value !== '' && resultsDropdown.options[0].textContent !== '找不到關鍵字';
        document.body.classList.toggle('results-bar-visible', hasResults);
        if (!hasResults) return;
        const currentIndex = resultsDropdown.selectedIndex;
        prevResultBtn.disabled = currentIndex <= 0;
        nextResultBtn.disabled = currentIndex >= resultsDropdown.options.length - 1;
    }
    
    // --- All other original helper functions can be included below ---
    
    // Initial setup
    updatePageControls();
    updateResultsNav();
});
