document.addEventListener('DOMContentLoaded', () => {
    // PDF.js Worker Initialization
    if (typeof pdfjsLib !== 'undefined') {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.178/pdf.worker.mjs';
        }
    } else {
        console.error("pdfjsLib is not defined. Check the import or script loading order.");
        alert("PDF 程式庫載入失敗，請刷新頁面或檢查網路連線。");
        return;
    }

    // Global Variables
    let pdfDocs = [];
    let pageMap = [];
    let globalTotalPages = 0;
    let currentPage = 1;
    let pageRendering = false;

    // DOM Element Selections
    const appContainer = document.getElementById('app-container');
    const toolbar = document.getElementById('toolbar');
    const toolbarToggle = document.getElementById('toolbar-toggle-tab'); // The new tab button
    const pdfContainer = document.getElementById('pdf-container');
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const textLayerDivGlobal = document.getElementById('text-layer');
    const drawingCanvas = document.getElementById('drawing-canvas');
    const drawingCtx = drawingCanvas.getContext('2d');

    const fileInput = document.getElementById('fileInput');
    const searchInputElem = document.getElementById('searchInput');
    const searchActionButton = document.getElementById('search-action-button');

    // Page Navigation Elements
    const goToFirstPageBtn = document.getElementById('go-to-first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumDisplay = document.getElementById('page-num-display');
    const pageToGoInput = document.getElementById('page-to-go');
    const goToPageBtn = document.getElementById('go-to-page-btn');
    const pageSlider = document.getElementById('page-slider');
    
    // Bottom Bar Elements
    const bottomResultsBar = document.getElementById('bottom-results-bar');
    const resultsDropdown = document.getElementById('resultsDropdown');
    const prevResultBtn = document.getElementById('prev-result-btn');
    const nextResultBtn = document.getElementById('next-result-btn');
    
    // Other controls
    const qualitySelector = document.getElementById('quality-selector');
    const fabButtons = document.getElementById('floating-action-buttons');
    const toggleUnderlineBtn = document.getElementById('toggle-underline-btn');
    // ... (Add all other FABs if needed)

    // State Variables
    let showSearchResultsHighlights = true;
    let highlighterEnabled = false;
    let textSelectionModeActive = false;
    let localMagnifierEnabled = false;

    // --- Event Listeners ---
    
    // New Tab-style menu toggle
    if (toolbarToggle && appContainer) {
        toolbarToggle.addEventListener('click', () => {
            appContainer.classList.toggle('menu-active');
        });
    }

    // Close menu when clicking outside
    if (pdfContainer && appContainer) {
        pdfContainer.addEventListener('click', (e) => {
            if (e.target === pdfContainer && window.innerWidth <= 768 && appContainer.classList.contains('menu-active')) {
                appContainer.classList.remove('menu-active');
            }
        });
    }

    fileInput.addEventListener('change', handleFileSelect);
    searchActionButton.addEventListener('click', searchKeyword);

    // New Bottom bar listeners
    prevResultBtn.addEventListener('click', () => navigateResults(-1));
    nextResultBtn.addEventListener('click', () => navigateResults(1));
    resultsDropdown.addEventListener('change', () => goToPageDropdown(resultsDropdown.value));

    // Original Page Navigation Listeners
    goToFirstPageBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) goToPage(currentPage - 1); });
    nextPageBtn.addEventListener('click', () => { if (currentPage < globalTotalPages) goToPage(currentPage + 1); });
    goToPageBtn.addEventListener('click', handleGoToPage);
    pageToGoInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleGoToPage(); });
    pageSlider.addEventListener('input', () => goToPage(parseInt(pageSlider.value, 10)));
    qualitySelector.addEventListener('change', () => { if (pdfDocs.length > 0) renderPage(currentPage); });
    toggleUnderlineBtn.addEventListener('click', () => {
        showSearchResultsHighlights = !showSearchResultsHighlights;
        renderPage(currentPage);
    });
    
    // --- Core Functions ---

    function getDocAndLocalPage(globalPage) {
        if (globalPage < 1 || globalPage > globalTotalPages || pageMap.length < globalPage) return null;
        return pageMap[globalPage - 1];
    }

    function updatePageControls() {
        const hasDocs = pdfDocs.length > 0;
        document.querySelectorAll('#page-navigation button, #page-navigation input, #floating-action-buttons button, #quality-selector').forEach(el => el.disabled = !hasDocs);
        if (fabButtons) fabButtons.style.display = hasDocs ? 'flex' : 'none';

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
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        pdfDocs = [];
        pageMap = [];
        globalTotalPages = 0;
        currentPage = 1;

        resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        updateResultsNav();
        searchInputElem.value = '';

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

    // **FIX**: Restored original renderPage function logic
    function renderPage(globalPageNum, highlightPattern = null) {
        if (pdfDocs.length === 0 || pageRendering) return;
        
        const pageInfo = getDocAndLocalPage(globalPageNum);
        if (!pageInfo) return;
        
        pageRendering = true;
        updatePageControls();
        const { doc, localPage } = pageInfo;
        const patternToUse = highlightPattern || getPatternFromSearchInput();

        doc.getPage(localPage).then(page => {
            const containerWidth = pdfContainer.clientWidth;
            // Use the scaling logic from your original file
            const scale = (containerWidth / page.getViewport({scale: 1.0}).width) * parseFloat(qualitySelector.value);
            const viewport = page.getViewport({ scale });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Set canvas display style
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
                    textDivs: [],
                }).promise;
            }).then(() => {
                // Apply highlights after rendering
                if (showSearchResultsHighlights && patternToUse) {
                    Array.from(textLayerDivGlobal.querySelectorAll('span')).forEach(span => {
                         if (patternToUse.test(span.textContent)) {
                            span.classList.add('wavy-underline');
                         }
                    });
                }
            }).catch(err => {
                 console.error("Error during page rendering or text layer: ", err);
            }).finally(() => {
                pageRendering = false;
                updatePageControls();
            });
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
        if (!pattern) { alert("正則表達式格式錯誤"); return; }
        
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

    function getPatternFromSearchInput() {
        const input = searchInputElem.value.trim();
        if (!input) return null;
        try {
            if (input.startsWith('/') && input.endsWith('/')) {
                const lastSlash = input.lastIndexOf('/');
                const pattern = input.slice(1, lastSlash);
                const flags = input.slice(lastSlash + 1) || 'gi';
                return new RegExp(pattern, flags);
            }
            return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        } catch (e) { return null; }
    }

    function goToPage(pageNum, highlightPattern = null) {
        if (isNaN(pageNum) || pageNum < 1 || pageNum > globalTotalPages) return;
        currentPage = pageNum;
        renderPage(currentPage, highlightPattern);
    }
    
    // --- New/Modified UI control functions ---
    
    function goToPageDropdown(pageNumStr) {
        if (pageNumStr) {
            goToPage(parseInt(pageNumStr, 10));
        }
        updateResultsNav();
    }

    function handleGoToPage() {
        const pageNum = parseInt(pageToGoInput.value, 10);
        goToPage(pageNum);
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

    function updateResultsNav() {
        const hasResults = resultsDropdown.options.length > 0 && resultsDropdown.options[0].value !== '' && resultsDropdown.options[0].textContent !== '找不到關鍵字';
        document.body.classList.toggle('results-bar-visible', hasResults);
        if (!hasResults) return;

        const currentIndex = resultsDropdown.selectedIndex;
        const totalOptions = resultsDropdown.options.length;
        prevResultBtn.disabled = currentIndex <= 0;
        nextResultBtn.disabled = currentIndex >= totalOptions - 1;
    }
    
    // --- All other functions (from original file) can be added here if needed ---
    // For now, this covers the main functionality.
    
    // Initial setup call
    updatePageControls();
    updateResultsNav();
});
