document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // PDF.js Worker Initialization
    // -------------------------------------------------------------------------
    if (typeof pdfjsLib !== 'undefined') {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdfjs/pdf.worker.mjs';
        }
    } else {
        console.error("pdfjsLib is not defined. Check the import or script loading order.");
        alert("PDF 程式庫載入失敗，請刷新頁面或檢查網路連線。");
        return;
    }
    
    // -------------------------------------------------------------------------
    // Global Variables
    // -------------------------------------------------------------------------
    let pdfDocs = [];
    let pageMap = [];
    let globalTotalPages = 0;
    let currentPage = 1;
    let pageRendering = false;

    let showSearchResultsHighlights = true;
    let highlighterEnabled = false;
    let textSelectionModeActive = false;
    let localMagnifierEnabled = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let LOCAL_MAGNIFIER_SIZE = 120;
    let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

    // -------------------------------------------------------------------------
    // DOM Element Selections
    // -------------------------------------------------------------------------
    const appContainer = document.getElementById('app-container');
    const toolbar = document.getElementById('toolbar');
    const toolbarToggle = document.getElementById('toolbar-toggle-tab');
    const pdfContainer = document.getElementById('pdf-container');
    
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const textLayerDivGlobal = document.getElementById('text-layer');
    const drawingCanvas = document.getElementById('drawing-canvas');
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
    const toggleHighlighterBtn = document.getElementById('toggle-highlighter-btn');
    const clearHighlighterBtn = document.getElementById('clear-highlighter-btn');
    const toggleTextSelectionBtn = document.getElementById('toggle-text-selection-btn');
    const exportPageBtn = document.getElementById('export-page-btn');
    const sharePageBtn = document.getElementById('share-page-btn');

    const magnifierGlass = document.getElementById('magnifier-glass');
    const magnifierCanvas = document.getElementById('magnifier-canvas');
    const localMagnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
    const toggleLocalMagnifierBtn = document.getElementById('toggle-local-magnifier-btn');
    const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
    const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');

    // -------------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------------

    // Toolbar Toggle (Tab Style)
    if (toolbarToggle && appContainer) {
        toolbarToggle.addEventListener('click', () => {
            appContainer.classList.toggle('menu-active');
        });
    }

    // Close menu when clicking on the PDF container area
    if (pdfContainer && appContainer) {
        pdfContainer.addEventListener('click', (e) => {
            if (e.target === pdfContainer && window.innerWidth <= 768 && appContainer.classList.contains('menu-active')) {
                appContainer.classList.remove('menu-active');
            }
        });
    }

    // File Input
    fileInput.addEventListener('change', handleFileSelect);

    // Search
    searchActionButton.addEventListener('click', searchKeyword);
    searchInputElem.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchActionButton.click();
        }
    });
    
    // Result Navigation (Bottom Bar)
    prevResultBtn.addEventListener('click', () => navigateResults(-1));
    nextResultBtn.addEventListener('click', () => navigateResults(1));
    resultsDropdown.addEventListener('change', () => {
        goToPageDropdown(resultsDropdown.value);
        updateResultsNav();
    });

    // Page Navigation
    goToFirstPageBtn.addEventListener('click', () => goToPage(1, getPatternFromSearchInput()));
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) goToPage(currentPage - 1, getPatternFromSearchInput());
    });
    nextPageBtn.addEventListener('click', () => {
        if (pdfDocs.length > 0 && currentPage < globalTotalPages) goToPage(currentPage + 1, getPatternFromSearchInput());
    });
    goToPageBtn.addEventListener('click', handleGoToPage);
    pageToGoInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            goToPageBtn.click();
        }
    });
    pageSlider.addEventListener('input', () => {
        const newPage = parseInt(pageSlider.value);
        if (pageToGoInput.value !== newPage.toString()) {
            pageToGoInput.value = newPage;
        }
        if (currentPage !== newPage) {
            goToPage(newPage, getPatternFromSearchInput());
        }
    });

    // Quality Control
    qualitySelector.addEventListener('change', () => {
        if (pdfDocs.length > 0) renderPage(currentPage, getPatternFromSearchInput());
    });

    // Floating Action Buttons (FABs)
    toggleUnderlineBtn.addEventListener('click', toggleUnderline);
    toggleTextSelectionBtn.addEventListener('click', toggleTextSelection);
    toggleHighlighterBtn.addEventListener('click', toggleHighlighter);
    clearHighlighterBtn.addEventListener('click', () => {
        if (pdfDocs.length > 0) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    });
    toggleLocalMagnifierBtn.addEventListener('click', toggleLocalMagnifier);
    exportPageBtn.addEventListener('click', exportPageAsImage);
    sharePageBtn.addEventListener('click', sharePage);

    // Magnifier Controls
    localMagnifierZoomSelector.addEventListener('change', (e) => {
        LOCAL_MAGNIFIER_ZOOM_LEVEL = parseFloat(e.target.value);
    });

    // Drawing Canvas Events
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);
    drawingCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    drawingCanvas.addEventListener('touchmove', draw, { passive: false });
    drawingCanvas.addEventListener('touchend', stopDrawing);
    drawingCanvas.addEventListener('touchcancel', stopDrawing);

    // Magnifier Glass Events
    pdfContainer.addEventListener('mousemove', handlePointerMoveForLocalMagnifier);
    pdfContainer.addEventListener('mouseleave', handlePointerLeaveForLocalMagnifier);
    pdfContainer.addEventListener('touchstart', handlePointerMoveForLocalMagnifier, { passive: false });
    pdfContainer.addEventListener('touchmove', handlePointerMoveForLocalMagnifier, { passive: false });
    pdfContainer.addEventListener('touchend', handlePointerLeaveForLocalMagnifier);
    pdfContainer.addEventListener('touchcancel', handlePointerLeaveForLocalMagnifier);

    // Window Resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (pdfDocs.length > 0) {
                renderPage(currentPage, getPatternFromSearchInput());
            }
        }, 250);
    });


    // -------------------------------------------------------------------------
    // Core Functions
    // -------------------------------------------------------------------------
    
    function handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        pdfDocs = [];
        pageMap = [];
        globalTotalPages = 0;
        currentPage = 1;

        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        updateResultsNav();
        if (searchInputElem) searchInputElem.value = '';
        showSearchResultsHighlights = true;
        
        resetModes();

        const loadingPromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                if (file.type !== 'application/pdf') {
                    console.warn(`Skipping non-PDF file: ${file.name}`);
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = function() {
                    const typedarray = new Uint8Array(this.result);
                    pdfjsLib.getDocument({
                        data: typedarray,
                        isEvalSupported: false,
                        enableXfa: false
                    }).promise.then(pdf => {
                        resolve({ pdf: pdf, name: file.name });
                    }).catch(reason => {
                        console.error(`Error loading ${file.name}:`, reason);
                        reject(`無法載入檔案 ${file.name}`);
                    });
                };
                reader.readAsArrayBuffer(file);
            });
        });

        Promise.all(loadingPromises).then(results => {
            const loadedPdfs = results.filter(r => r !== null);
            if (loadedPdfs.length === 0) {
                alert("未選擇任何有效的PDF檔案。");
                pdfDocs = [];
                updatePageControls();
                return;
            }
            loadedPdfs.forEach((result, docIndex) => {
                pdfDocs.push(result.pdf);
                for (let i = 1; i <= result.pdf.numPages; i++) {
                    pageMap.push({ docIndex: docIndex, localPage: i, docName: result.name });
                }
            });
            globalTotalPages = pageMap.length;
            renderPage(1);
        }).catch(error => {
            alert("讀取PDF文件時發生錯誤: " + error);
            pdfDocs = [];
            updatePageControls();
        });
    }

    function renderPage(globalPageNum, highlightPattern = null) {
        if (pdfDocs.length === 0) return;

        pageRendering = true;
        updatePageControls();
        
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        const pageInfo = getDocAndLocalPage(globalPageNum);
        if (!pageInfo) {
            console.error(`Could not find page info for global page ${globalPageNum}`);
            pageRendering = false;
            updatePageControls();
            return;
        }

        const { doc, localPage, docName } = pageInfo;

        doc.getPage(localPage).then(page => {
            const viewportOriginal = page.getViewport({ scale: 1 });
            let availableWidth = pdfContainer.clientWidth - 20; // some padding
            if (availableWidth <= 0) availableWidth = window.innerWidth > 40 ? window.innerWidth - 40 : 300;
            
            const baseScale = availableWidth / viewportOriginal.width;
            const viewportCss = page.getViewport({ scale: baseScale });
            
            const devicePixelRatio = window.devicePixelRatio || 1;
            const qualityMultiplier = parseFloat(qualitySelector.value) || 1.5;
            const renderScale = baseScale * devicePixelRatio * qualityMultiplier;
            const viewportRender = page.getViewport({ scale: renderScale });

            canvas.width = viewportRender.width;
            canvas.height = viewportRender.height;
            canvas.style.width = `${viewportCss.width}px`;
            canvas.style.height = `${viewportCss.height}px`;

            const renderContext = { canvasContext: ctx, viewport: viewportRender };

            page.render(renderContext).promise.then(() => {
                pageRendering = false;
                updatePageControls();
                setupOverlayLayers(viewportCss);
                return renderTextLayer(page, viewportCss, highlightPattern);
            }).catch(reason => {
                console.error(`Error rendering page ${localPage} from doc ${docName}: `, reason);
                pageRendering = false;
                updatePageControls();
            });
        }).catch(reason => {
            console.error(`Error getting page ${localPage} from doc ${docName}: `, reason);
            pageRendering = false;
            updatePageControls();
        });
    }

    function renderTextLayer(page, viewport, highlightPattern) {
        return page.getTextContent().then(textContent => {
            textLayerDivGlobal.innerHTML = '';
            textContent.items.forEach(item => {
                const textDiv = document.createElement("div");
                const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                const style = textDiv.style;
                style.left = `${tx[4]}px`;
                style.top = `${tx[5]}px`;
                style.height = `${item.height}px`;
                style.width = `${item.width}px`;
                style.transform = `scale(${viewport.scale})`;
                style.fontFamily = item.fontName;
                
                textDiv.textContent = item.str;
                if (highlightPattern && highlightPattern.test(item.str)) {
                    textDiv.classList.add("wavy-underline");
                }
                textLayerDivGlobal.appendChild(textDiv);
            });
        }).catch(reason => console.error("Error rendering text layer: " + reason));
    }
    
    function searchKeyword() {
        const input = searchInputElem.value.trim();
        resultsDropdown.innerHTML = '<option value="">搜尋中，請稍候...</option>';
        updateResultsNav();

        if (pdfDocs.length === 0 || !input) {
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav();
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            return;
        }

        let pattern;
        try {
            pattern = input.startsWith('/') && input.endsWith('/')
                ? new RegExp(input.slice(1, -1), 'gi')
                : new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(/\s+|\|/).filter(k => k).join('|'), 'gi');
        } catch (e) {
            alert('正則表達式格式錯誤: ' + e.message);
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav();
            return;
        }

        resultsDropdown.disabled = true;
        const promises = pageMap.map((pageInfo, index) => {
            const globalPageNum = index + 1;
            return pdfDocs[pageInfo.docIndex].getPage(pageInfo.localPage).then(page => {
                return page.getTextContent().then(textContent => {
                    const pageText = textContent.items.map(item => item.str).join('');
                    if (pattern.test(pageText)) {
                        const match = pageText.match(pattern)[0];
                        const contextIndex = pageText.indexOf(match);
                        const start = Math.max(0, contextIndex - 20);
                        const end = Math.min(pageText.length, contextIndex + match.length + 20);
                        const summary = `${pageText.substring(start, contextIndex)}<span class="wavy-underline">${match}</span>${pageText.substring(contextIndex + match.length, end)}`;
                        return { page: globalPageNum, summary: summary, docName: pageInfo.docName };
                    }
                    return null;
                });
            }).catch(err => {
                console.warn(`Error processing page for search: Doc ${pageInfo.docName}, Page ${pageInfo.localPage}`, err);
                return null;
            });
        });

        Promise.all(promises).then(allPageResults => {
            const results = allPageResults.filter(r => r !== null);
            resultsDropdown.innerHTML = '';
            resultsDropdown.disabled = false;

            if (results.length === 0) {
                resultsDropdown.innerHTML = '<option>找不到關鍵字</option>';
            } else {
                let lastDocName = null;
                results.forEach(r => {
                    if (r.docName !== lastDocName) {
                        const header = document.createElement('option');
                        header.disabled = true;
                        header.style.cssText = 'color: #ccc; font-style: italic; background-color: #222;';
                        header.textContent = `--- ${r.docName} ---`;
                        resultsDropdown.appendChild(header);
                        lastDocName = r.docName;
                    }
                    const option = document.createElement('option');
                    option.value = r.page;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = `第 ${r.page} 頁: ${r.summary}`;
                    option.textContent = tempDiv.textContent || tempDiv.innerText || "";
                    option.title = `檔案: ${r.docName}`;
                    resultsDropdown.appendChild(option);
                });
                goToPage(results[0].page, pattern);
            }
            updateResultsNav();
        }).catch(err => {
            console.error("Search process failed unexpectedly:", err);
            resultsDropdown.innerHTML = '<option>搜尋錯誤</option>';
            updateResultsNav();
        });
    }

    // -------------------------------------------------------------------------
    // UI Update and Control Functions
    // -------------------------------------------------------------------------

    function updatePageControls() {
        const hasDocs = pdfDocs.length > 0;
        document.querySelectorAll('#page-navigation button, #page-navigation input, #floating-action-buttons button, #quality-selector').forEach(el => el.disabled = !hasDocs);

        if (!hasDocs) {
            pageNumDisplay.textContent = '- / -';
            pageSlider.max = 1;
            pageSlider.value = 1;
            document.getElementById('floating-action-buttons').style.display = 'none';
            return;
        }
        
        document.getElementById('floating-action-buttons').style.display = 'flex';
        const docInfo = getDocAndLocalPage(currentPage);
        pageNumDisplay.textContent = `第 ${currentPage} / ${globalTotalPages} 頁 (${docInfo.docName})`;
        pageToGoInput.value = currentPage;
        pageToGoInput.max = globalTotalPages;
        pageSlider.max = globalTotalPages;
        pageSlider.value = currentPage;

        goToFirstPageBtn.disabled = currentPage <= 1;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= globalTotalPages;
        
        sharePageBtn.disabled = !navigator.share;
        
        // Update button active states
        toggleUnderlineBtn.classList.toggle('active', showSearchResultsHighlights);
        toggleHighlighterBtn.classList.toggle('active', highlighterEnabled);
        toggleTextSelectionBtn.classList.toggle('active', textSelectionModeActive);
        toggleLocalMagnifierBtn.classList.toggle('active', localMagnifierEnabled);
        localMagnifierZoomControlsDiv.style.display = localMagnifierEnabled ? 'flex' : 'none';
    }
    
    function updateResultsNav() {
        const validOptions = Array.from(resultsDropdown.options).filter(opt => !opt.disabled && opt.value);
        const hasResults = validOptions.length > 0;

        bottomResultsBar.classList.toggle('hidden', !hasResults);
        document.body.classList.toggle('results-bar-visible', hasResults);

        if (!hasResults) {
            prevResultBtn.disabled = true;
            nextResultBtn.disabled = true;
            return;
        }

        const currentValidIndex = validOptions.findIndex(opt => opt.value === resultsDropdown.value);
        prevResultBtn.disabled = currentValidIndex <= 0;
        nextResultBtn.disabled = currentValidIndex >= validOptions.length - 1;
    }

    function navigateResults(direction) {
        const validOptions = Array.from(resultsDropdown.options).filter(opt => !opt.disabled && opt.value);
        if (validOptions.length === 0) return;
        
        const currentValidIndex = validOptions.findIndex(opt => opt.value === resultsDropdown.value);
        const nextValidIndex = currentValidIndex + direction;

        if (nextValidIndex >= 0 && nextValidIndex < validOptions.length) {
            resultsDropdown.value = validOptions[nextValidIndex].value;
            resultsDropdown.dispatchEvent(new Event('change'));
        }
    }

    function goToPage(globalPageNum, highlightPattern = null) {
        if (pageRendering || pdfDocs.length === 0 || isNaN(globalPageNum)) return;
        currentPage = Math.max(1, Math.min(globalPageNum, globalTotalPages));
        renderPage(currentPage, highlightPattern || getPatternFromSearchInput());
    }

    function goToPageDropdown(pageNumStr) {
        if (pageNumStr) goToPage(parseInt(pageNumStr));
    }

    function handleGoToPage() {
        const pageNum = parseInt(pageToGoInput.value);
        if (!isNaN(pageNum)) {
            goToPage(pageNum);
        } else {
            alert(pdfDocs.length > 0 ? `請輸入 1 到 ${globalTotalPages} 的頁碼` : '請先載入PDF檔案');
            if(pdfDocs.length > 0) pageToGoInput.value = currentPage;
        }
    }

    function getPatternFromSearchInput() {
        const input = searchInputElem.value.trim();
        if (!input) return null;
        try {
            return input.startsWith('/') && input.endsWith('/')
                ? new RegExp(input.slice(1, -1), 'gi')
                : new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(/\s+|\|/).filter(k => k).join('|'), 'gi');
        } catch (e) {
            return null;
        }
    }
    
    // -------------------------------------------------------------------------
    // Helper & Mode Functions
    // -------------------------------------------------------------------------

    function resetModes() {
        highlighterEnabled = false;
        textSelectionModeActive = false;
        localMagnifierEnabled = false;
        
        if (textLayerDivGlobal) {
            textLayerDivGlobal.classList.remove('text-selection-active');
            textLayerDivGlobal.style.pointerEvents = 'none';
        }
        if (drawingCanvas) drawingCanvas.style.pointerEvents = 'none';
        if (canvas) canvas.style.visibility = 'visible';
        if (drawingCtx && drawingCanvas) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        if (magnifierGlass) magnifierGlass.style.display = 'none';
        updatePageControls();
    }

    function toggleUnderline() {
        if (pdfDocs.length === 0) return;
        showSearchResultsHighlights = !showSearchResultsHighlights;
        textLayerDivGlobal.classList.toggle('highlights-hidden', !showSearchResultsHighlights);
        updatePageControls();
    }

    function toggleTextSelection() {
        if (pdfDocs.length === 0) return;
        textSelectionModeActive = !textSelectionModeActive;
        
        if (textSelectionModeActive) {
            highlighterEnabled = false;
            localMagnifierEnabled = false;
            textLayerDivGlobal.style.pointerEvents = 'auto';
            textLayerDivGlobal.classList.add('text-selection-active');
            canvas.style.visibility = 'hidden';
            drawingCanvas.style.pointerEvents = 'none';
        } else {
            textLayerDivGlobal.style.pointerEvents = 'none';
            textLayerDivGlobal.classList.remove('text-selection-active');
            canvas.style.visibility = 'visible';
        }
        updatePageControls();
    }

    function toggleHighlighter() {
        if (pdfDocs.length === 0) return;
        highlighterEnabled = !highlighterEnabled;

        if (highlighterEnabled) {
            textSelectionModeActive = false;
            localMagnifierEnabled = false;
            textLayerDivGlobal.style.pointerEvents = 'none';
            textLayerDivGlobal.classList.remove('text-selection-active');
            canvas.style.visibility = 'visible';
            drawingCanvas.style.pointerEvents = 'auto';
        } else {
            drawingCanvas.style.pointerEvents = 'none';
        }
        updatePageControls();
    }

    function toggleLocalMagnifier() {
        if (pdfDocs.length === 0) return;
        localMagnifierEnabled = !localMagnifierEnabled;

        if (localMagnifierEnabled) {
            highlighterEnabled = false;
            textSelectionModeActive = false;
            resetModes(); // Simplest way to ensure other modes are off
            localMagnifierEnabled = true; // Re-enable it
        } else {
            magnifierGlass.style.display = 'none';
        }
        updatePageControls();
    }

    function setupOverlayLayers(viewport) {
        const layers = [textLayerDivGlobal, drawingCanvas];
        layers.forEach(layer => {
            layer.style.width = `${viewport.width}px`;
            layer.style.height = `${viewport.height}px`;
            layer.style.top = `${canvas.offsetTop}px`;
            layer.style.left = `${canvas.offsetLeft}px`;
        });
        drawingCanvas.width = viewport.width;
        drawingCanvas.height = viewport.height;
    }

    function getDocAndLocalPage(globalPage) {
        if (globalPage < 1 || globalPage > globalTotalPages) return null;
        return pageMap[globalPage - 1];
    }
    
    // Drawing functions
    function getEventPosition(e) {
        const rect = drawingCanvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    function startDrawing(e) {
        if (!highlighterEnabled) return;
        isDrawing = true;
        [lastX, lastY] = [getEventPosition(e).x, getEventPosition(e).y];
        if (e.type === 'touchstart') e.preventDefault();
    }
    function draw(e) {
        if (!isDrawing) return;
        const { x, y } = getEventPosition(e);
        drawingCtx.beginPath();
        drawingCtx.moveTo(lastX, lastY);
        drawingCtx.lineTo(x, y);
        drawingCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        drawingCtx.lineWidth = 15;
        drawingCtx.lineCap = 'round';
        drawingCtx.stroke();
        [lastX, lastY] = [x, y];
        if (e.type === 'touchmove') e.preventDefault();
    }
    function stopDrawing() { isDrawing = false; }
    
    // Magnifier functions
    function initLocalMagnifier() {
        magnifierGlass.style.width = `${LOCAL_MAGNIFIER_SIZE}px`;
        magnifierGlass.style.height = `${LOCAL_MAGNIFIER_SIZE}px`;
        magnifierCanvas.width = LOCAL_MAGNIFIER_SIZE;
        magnifierCanvas.height = LOCAL_MAGNIFIER_SIZE;
    }
    function handlePointerMoveForLocalMagnifier(e) {
        if (!localMagnifierEnabled) return;
        if (e.type.startsWith('touch')) e.preventDefault();
        const touch = e.touches ? e.touches[0] : e;
        updateLocalMagnifier(touch.clientX, touch.clientY);
    }
    function handlePointerLeaveForLocalMagnifier() {
        if (localMagnifierEnabled) magnifierGlass.style.display = 'none';
    }
    function updateLocalMagnifier(clientX, clientY) {
        const canvasRect = canvas.getBoundingClientRect();
        if (clientX < canvasRect.left || clientX > canvasRect.right || clientY < canvasRect.top || clientY > canvasRect.bottom) {
            magnifierGlass.style.display = 'none';
            return;
        }
        
        magnifierGlass.style.display = 'block';
        const cssX = clientX - canvasRect.left;
        const cssY = clientY - canvasRect.top;
        
        const scaleX = canvas.width / canvas.offsetWidth;
        const scaleY = canvas.height / canvas.offsetHeight;
        
        const srcSize = LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL;
        const srcX = (cssX * scaleX) - (srcSize * scaleX / 2);
        const srcY = (cssY * scaleY) - (srcSize * scaleY / 2);
        
        localMagnifierCtx.fillStyle = 'white';
        localMagnifierCtx.fillRect(0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
        localMagnifierCtx.drawImage(canvas, srcX, srcY, srcSize * scaleX, srcSize * scaleY, 0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
        if (drawingCanvas.width > 0) {
             localMagnifierCtx.drawImage(drawingCanvas, srcX/scaleX, srcY/scaleY, srcSize, srcSize, 0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
        }

        magnifierGlass.style.left = `${clientX - canvasRect.left - LOCAL_MAGNIFIER_SIZE / 2}px`;
        magnifierGlass.style.top = `${clientY - canvasRect.top - LOCAL_MAGNIFIER_SIZE - 20}px`;
    }

    // Export and Share functions
    async function getAnnotatedPageAsBlob(type = 'image/png') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);
        if(drawingCanvas.width > 0) tempCtx.drawImage(drawingCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
        
        return new Promise(resolve => tempCanvas.toBlob(resolve, type, 0.9));
    }
    async function exportPageAsImage() {
        if (pdfDocs.length === 0 || pageRendering) return;
        const blob = await getAnnotatedPageAsBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const pageInfo = getDocAndLocalPage(currentPage);
        a.href = url;
        a.download = `page_${currentPage}_(${pageInfo.docName}-p${pageInfo.localPage}).png`;
        a.click();
        URL.revokeObjectURL(url);
    }
    async function sharePage() {
        if (pdfDocs.length === 0 || pageRendering || !navigator.share) return;
        const blob = await getAnnotatedPageAsBlob();
        if (!blob) return;

        const pageInfo = getDocAndLocalPage(currentPage);
        const filename = `page_${currentPage}_(${pageInfo.docName}-p${pageInfo.localPage}).png`;
        const file = new File([blob], filename, { type: blob.type });

        const shareData = {
            title: `PDF 頁面 ${currentPage}`,
            text: `來自 ${pageInfo.docName} 的第 ${pageInfo.localPage} 頁`,
            files: [file]
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            alert('您的瀏覽器不支援分享檔案。');
        }
    }


    // -------------------------------------------------------------------------
    // Initial Setup Calls
    // -------------------------------------------------------------------------
    initLocalMagnifier();
    updatePageControls();
    updateResultsNav();

});
