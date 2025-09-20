// script.js

import { initDB, saveFiles, getFiles } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
    if (typeof pdfjsLib === 'undefined') {
        console.error('pdfjsLib 未定義。請確保 pdf.mjs 在 script.js 之前載入。');
        alert('PDF 程式庫載入失敗。請刷新頁面或檢查您的網路連線。');
        return;
    }

    let pdfDocs = [];
    let pageMap = [];
    let globalTotalPages = 0;
    let currentPage = 1;
    let pageRendering = false;
    let searchResults = [];

    let currentZoomMode = 'height';
    let currentScale = 1.0;

    let paragraphSelectionModeActive = false;
    let currentPageTextContent = null;
    let currentViewport = null;

    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const toolbar = document.getElementById('toolbar');
    const toolbarToggleTab = document.getElementById('toolbar-toggle-tab');
    const appContainer = document.getElementById('app-container');
    const pdfContainer = document.getElementById('pdf-container');
    const textLayerDivGlobal = document.getElementById('text-layer');
    const goToFirstPageBtn = document.getElementById('go-to-first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumDisplay = document.getElementById('page-num-display');
    const pageToGoInput = document.getElementById('page-to-go');
    const goToPageBtn = document.getElementById('go-to-page-btn');
    const pageSlider = document.getElementById('page-slider');
    
    const resultsDropdown = document.getElementById('resultsDropdown');
    const panelResultsDropdown = document.getElementById('panelResultsDropdown');

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

    const searchResultsPanel = document.getElementById('search-results-panel');
    const resultsList = document.getElementById('results-list');
    const copyPageTextBtn = document.getElementById('copy-page-text-btn');

    const desktopZoomControls = {
        zoomOutBtn: document.getElementById('zoom-out-btn'),
        zoomInBtn: document.getElementById('zoom-in-btn'),
        fitWidthBtn: document.getElementById('fit-width-btn'),
        fitHeightBtn: document.getElementById('fit-height-btn'),
    };
    const mobileZoomControls = {
        zoomOutBtn: document.getElementById('mobile-zoom-out-btn'),
        zoomInBtn: document.getElementById('mobile-zoom-in-btn'),
        fitWidthBtn: document.getElementById('mobile-fit-width-btn'),
        fitHeightBtn: document.getElementById('mobile-fit-height-btn'),
    };

    const toggleParagraphSelectionBtn = document.getElementById('toggle-paragraph-selection-btn');

    let localMagnifierEnabled = false;
    let LOCAL_MAGNIFIER_SIZE = 120;
    let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

    let showSearchResultsHighlights = true;
    let highlighterEnabled = false;
    let textSelectionModeActive = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    async function loadAndProcessFiles(files) {
        if (!files || files.length === 0) return;
        if (typeof pdfjsLib === 'undefined') {
            alert('PDF 程式庫未能正確載入，無法開啟檔案。');
            return;
        }

        pdfDocs = [];
        pageMap = [];
        globalTotalPages = 0;
        currentPage = 1;
        searchResults = [];
        currentZoomMode = 'height';

        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        if (panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        if (resultsList) resultsList.innerHTML = '';
        updateResultsNav();

        if (searchInputElem) searchInputElem.value = '';
        showSearchResultsHighlights = true;
        if (textLayerDivGlobal) textLayerDivGlobal.classList.remove('highlights-hidden');
        
        deactivateAllModes();

        if (textLayerDivGlobal) {
            textLayerDivGlobal.classList.remove('text-selection-active');
            textLayerDivGlobal.style.pointerEvents = 'none';
        }
        if (drawingCanvas) drawingCanvas.style.pointerEvents = 'none';
        if (canvas) canvas.style.visibility = 'visible';
        if (drawingCtx && drawingCanvas) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        if (magnifierGlass) magnifierGlass.style.display = 'none';
        if (pdfContainer) pdfContainer.classList.remove('paragraph-selection-mode');

        const loadingPromises = Array.from(files).map(file => {
            return new Promise((resolve) => {
                if (!file || file.type !== 'application/pdf') {
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = function() {
                    const typedarray = new Uint8Array(this.result);
                    pdfjsLib.getDocument({ data: typedarray, isEvalSupported: false, enableXfa: false }).promise.then(pdf => {
                        resolve({ pdf: pdf, name: file.name });
                    }).catch(reason => {
                        console.error(`讀取 ${file.name} 失敗:`, reason);
                        resolve(null);
                    });
                };
                reader.readAsArrayBuffer(file);
            });
        });

        try {
            const results = await Promise.all(loadingPromises);
            const loadedPdfs = results.filter(r => r !== null);

            if (loadedPdfs.length === 0) {
                alert('未選擇任何有效的 PDF 檔案。');
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
        } catch (error) {
            alert('讀取 PDF 檔案時發生錯誤: ' + error);
            console.error('檔案處理時發生錯誤:', error);
            pdfDocs = [];
            updatePageControls();
        }
    }

    function renderPage(globalPageNum, highlightPattern = null) {
        if (pdfDocs.length === 0 || !pdfContainer || !canvas || !ctx) return;
        pageRendering = true;
        currentPageTextContent = null;
        currentViewport = null;
        updatePageControls();
        if (drawingCtx && drawingCanvas) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        clearParagraphHighlights();

        const pageInfo = getDocAndLocalPage(globalPageNum);
        if (!pageInfo) {
            pageRendering = false;
            updatePageControls();
            return;
        }

        const { doc, localPage } = pageInfo;

        doc.getPage(localPage).then(function(page) {
            const viewportOriginal = page.getViewport({ scale: 1 });
            let scaleToFit;

            if (currentZoomMode === 'width') {
                scaleToFit = (pdfContainer.clientWidth - 20) / viewportOriginal.width;
            } else if (currentZoomMode === 'height') {
                const availableHeight = pdfContainer.clientHeight - 20; 
                scaleToFit = availableHeight / viewportOriginal.height;
            } else { // 'custom' mode
                scaleToFit = currentScale;
            }
            currentScale = scaleToFit;

            textLayerDivGlobal.classList.toggle('highlights-hidden', !showSearchResultsHighlights);

            const viewportCss = page.getViewport({ scale: scaleToFit });
            currentViewport = viewportCss;
            const devicePixelRatio = window.devicePixelRatio || 1;
            const qualityMultiplier = 1.5;

            const renderScale = scaleToFit * devicePixelRatio * qualityMultiplier;
            const viewportRender = page.getViewport({ scale: renderScale });

            canvas.width = viewportRender.width; canvas.height = viewportRender.height;
            canvas.style.width = `${viewportCss.width}px`; canvas.style.height = `${viewportCss.height}px`;

            const renderContext = { canvasContext: ctx, viewport: viewportRender };

            page.render(renderContext).promise.then(() => {
                pageRendering = false;
                updatePageControls();
                
                // Position layers relative to the canvas
                const canvasRect = canvas.getBoundingClientRect();
                const containerRect = pdfContainer.getBoundingClientRect();
                const top = canvasRect.top - containerRect.top + pdfContainer.scrollTop;
                const left = canvasRect.left - containerRect.left + pdfContainer.scrollLeft;

                Object.assign(textLayerDivGlobal.style, { width: `${viewportCss.width}px`, height: `${viewportCss.height}px`, top: `${top}px`, left: `${left}px` });
                Object.assign(drawingCanvas.style, { width: `${viewportCss.width}px`, height: `${viewportCss.height}px`, top: `${top}px`, left: `${left}px` });
                drawingCanvas.width = viewportCss.width; drawingCanvas.height = viewportCss.height;
                
                drawingCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                drawingCtx.lineWidth = 15;
                drawingCtx.lineJoin = 'round'; drawingCtx.lineCap = 'round';

                return renderTextLayer(page, viewportCss, highlightPattern);
            }).catch(reason => {
                console.error(`渲染頁面失敗 ${localPage} (檔案 ${pageInfo.docName}): ` + reason);
                pageRendering = false;
                updatePageControls();
            });
        }).catch(reason => {
            console.error(`取得頁面失敗 ${localPage} (檔案 ${pageInfo.docName}): ` + reason);
            pageRendering = false;
            updatePageControls();
        });
    }

    async function renderThumbnail(docIndex, localPageNum, canvasEl) {
        try {
            const doc = pdfDocs[docIndex];
            if (!doc || !canvasEl || !canvasEl.parentElement) return;
            const page = await doc.getPage(localPageNum);
            const viewport = page.getViewport({ scale: 1 });
            
            const targetWidth = canvasEl.parentElement.clientWidth > 0 ? canvasEl.parentElement.clientWidth - 20 : 100;
            const scale = targetWidth / viewport.width;
            const scaledViewport = page.getViewport({ scale: scale });
            
            const thumbnailCtx = canvasEl.getContext('2d');
            canvasEl.height = scaledViewport.height;
            canvasEl.width = scaledViewport.width;
            
            const renderContext = { canvasContext: thumbnailCtx, viewport: scaledViewport };
            await page.render(renderContext).promise;
        } catch (error) {
            console.error(`渲染縮圖失敗 (檔案 ${docIndex}, 頁 ${localPageNum}):`, error);
        }
    }

    function searchKeyword() {
        const input = searchInputElem.value.trim();
        searchResults = [];
        if(resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋中...</option>';
        if(panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">搜尋中...</option>';
        if(resultsList) resultsList.innerHTML = '<p style="padding: 10px;">搜尋中，請稍候...</p>';
        updateResultsNav();

        if (pdfDocs.length === 0 || !input) {
            if(resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            if(panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            if(resultsList) resultsList.innerHTML = '';
            updateResultsNav();
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            return;
        }

        let pattern;
        try {
            if (input.startsWith('/') && input.lastIndexOf('/') > 0) {
                const lastSlashIndex = input.lastIndexOf('/');
                pattern = new RegExp(input.slice(1, lastSlashIndex), input.slice(lastSlashIndex + 1));
            } else {
                const escapedInput = input.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
                const keywords = escapedInput.split(/\s+/).filter(k => k.length > 0);
                if (keywords.length === 0) { throw new Error("無效的搜尋查詢。"); }
                pattern = new RegExp(keywords.join('.*?'), 'gi');
            }
        } catch (e) {
            alert('無效的正規表示式: ' + e.message);
            if(resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            if(panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            if(resultsList) resultsList.innerHTML = '';
            updateResultsNav();
            return;
        }

        let promises = [];
        pageMap.forEach((pageInfo, index) => {
            const globalPageNum = index + 1;
            promises.push(
                pdfDocs[pageInfo.docIndex].getPage(pageInfo.localPage).then(p => p.getTextContent().then(textContent => {
                    const pageText = textContent.items.map(item => item.str).join('');
                    pattern.lastIndex = 0; 
                    if (pattern.test(pageText)) {
                        pattern.lastIndex = 0;
                        const matchResult = pattern.exec(pageText);
                        let foundMatchSummary = '找到匹配';
                        if (matchResult) {
                            const matchedText = matchResult[0];
                            const matchIndex = matchResult.index;
                            const contextLength = 40;
                            const startIndex = Math.max(0, matchIndex - contextLength);
                            const endIndex = Math.min(pageText.length, matchIndex + matchedText.length + contextLength);
                            const preMatch = pageText.substring(startIndex, matchIndex).replace(/\n/g, ' ');
                            const highlightedMatch = matchedText.replace(/\n/g, ' ');
                            const postMatch = pageText.substring(matchIndex + matchedText.length, endIndex).replace(/\n/g, ' ');
                            foundMatchSummary = `${startIndex > 0 ? '... ' : ''}${preMatch}<span class="wavy-underline">${highlightedMatch}</span>${postMatch}${endIndex < pageText.length ? ' ...' : ''}`;
                        }
                        return { page: globalPageNum, summary: foundMatchSummary, docName: pageInfo.docName, docIndex: pageInfo.docIndex, localPage: pageInfo.localPage };
                    }
                    return null;
                })).catch(err => {
                    console.warn(`搜尋頁面時發生錯誤: 檔案 ${pageInfo.docName}, 頁 ${pageInfo.localPage}`, err);
                    return null;
                })
            );
        });

        Promise.all(promises).then((allPageResults) => {
            searchResults = allPageResults.filter(r => r !== null);
            
            if(resultsDropdown) resultsDropdown.innerHTML = '';
            if(panelResultsDropdown) panelResultsDropdown.innerHTML = '';
            if(resultsList) resultsList.innerHTML = '';

            if (searchResults.length === 0) {
                const notFoundMsg = '<option>找不到關鍵字</option>';
                if(resultsDropdown) resultsDropdown.innerHTML = notFoundMsg;
                if(panelResultsDropdown) panelResultsDropdown.innerHTML = notFoundMsg;
                if(resultsList) resultsList.innerHTML = '<p style="padding: 10px;">找不到關鍵字。</p>';
                renderPage(currentPage, null);
            } else {
                searchResults.forEach(result => {
                    const optionHTML = `第 ${result.page} 頁: ${result.summary}`;
                    
                    const option1 = document.createElement('option');
                    option1.value = result.page;
                    option1.innerHTML = optionHTML;
                    if(resultsDropdown) resultsDropdown.appendChild(option1);

                    const option2 = document.createElement('option');
                    option2.value = result.page;
                    option2.innerHTML = optionHTML;
                    if(panelResultsDropdown) panelResultsDropdown.appendChild(option2);

                    const resultItem = document.createElement('div');
                    resultItem.className = 'result-item';
                    resultItem.innerHTML = `<canvas class="thumbnail-canvas"></canvas><div class="page-info">第 ${result.page} 頁 (檔案: ${result.docName})</div><div class="context-snippet">${result.summary}</div>`;
                    resultItem.addEventListener('click', () => goToPage(result.page, pattern));
                    if(resultsList) resultsList.appendChild(resultItem);
                    
                    const thumbnailCanvas = resultItem.querySelector('.thumbnail-canvas');
                    requestAnimationFrame(() => {
                        renderThumbnail(result.docIndex, result.localPage, thumbnailCanvas);
                    });
                });

                if (searchResults.length > 0) {
                    goToPage(searchResults[0].page, pattern);
                }
            }
            updateResultsNav();

            if (window.innerWidth <= 768 && appContainer.classList.contains('menu-active')) {
                appContainer.classList.remove('menu-active');
            }
        }).catch(err => {
            console.error('搜尋時發生未預期的錯誤:', err);
            const errorMsg = '<option value="">搜尋錯誤</option>';
            if(resultsDropdown) resultsDropdown.innerHTML = errorMsg;
            if(panelResultsDropdown) panelResultsDropdown.innerHTML = errorMsg;
            if(resultsList) resultsList.innerHTML = '<p style="padding: 10px;">搜尋時發生錯誤。</p>';
            renderPage(currentPage, null);
            updateResultsNav();
        });
    }

    function updateResultsNav() {
        const hasResults = searchResults.length > 0;
        document.body.classList.toggle('results-bar-visible', hasResults);
        if (appContainer) appContainer.classList.toggle('results-panel-visible', hasResults);
    }
    
    // ... (Your other functions like goToPage, event listeners, etc.)
    // All other functions from your provided script remain, with minor translation fixes where needed.
    // The main fixes are above and in the new event listeners below.

    // ===================================================================
    //  EVENT LISTENERS & HANDLERS
    // ===================================================================
    
    // -- Initialization and File Handling --
    document.getElementById('fileInput').addEventListener('change', async function(e) {
        await loadAndProcessFiles(Array.from(e.target.files));
    });

    async function initializeApp() {
        try {
            await initDB();
            const storedFiles = await getFiles();
            if (storedFiles.length > 0) {
                const restoreContainer = document.getElementById('restore-session-container');
                const restoreBtn = document.getElementById('restore-session-btn');
                if(restoreContainer) restoreContainer.style.display = 'block';
                if(restoreBtn) {
                    restoreBtn.onclick = async () => {
                        await loadAndProcessFiles(storedFiles);
                        restoreContainer.style.display = 'none';
                    };
                }
            }
        } catch (error) {
            console.error("無法從 IndexedDB 初始化應用程式:", error);
        }
    }
    
    // -- Search --
    if (searchActionButton) searchActionButton.addEventListener('click', searchKeyword);
    if (searchInputElem) searchInputElem.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchActionButton.click(); } });
    
    // -- Page Navigation --
    function goToPage(globalPageNum, highlightPatternForPage = null) {
        if (pdfDocs.length === 0 || isNaN(globalPageNum)) return;
        const n = Math.max(1, Math.min(globalPageNum, globalTotalPages));
        if (pageRendering && currentPage === n) return;
        
        currentPage = n;
        const finalHighlightPattern = highlightPatternForPage !== null ? highlightPatternForPage : getPatternFromSearchInput();
        renderPage(currentPage, finalHighlightPattern);
        
        if (pageToGoInput) pageToGoInput.value = currentPage;
        if (pageSlider) pageSlider.value = currentPage;
        if (resultsDropdown) resultsDropdown.value = currentPage;
        if (panelResultsDropdown) panelResultsDropdown.value = currentPage;
    }

    if (goToFirstPageBtn) goToFirstPageBtn.addEventListener('click', () => { if (pdfDocs.length > 0) goToPage(1); });
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) goToPage(currentPage - 1); });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => { if (pdfDocs.length > 0 && currentPage < globalTotalPages) goToPage(currentPage + 1); });
    
    if (goToPageBtn && pageToGoInput) {
        goToPageBtn.addEventListener('click', () => {
            const pn = parseInt(pageToGoInput.value);
            if (!isNaN(pn)) goToPage(pn);
        });
        pageToGoInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); goToPageBtn.click(); } });
    }
    if (pageSlider) pageSlider.addEventListener('input', () => {
        const newPage = parseInt(pageSlider.value);
        if (pageToGoInput) pageToGoInput.value = newPage;
        if (currentPage !== newPage) goToPage(newPage);
    });

    // -- Zoom Controls --
    function handleZoom(mode, scaleChange = 0) {
        if (pdfDocs.length === 0) return;
        currentZoomMode = mode;
        if (mode === 'custom') {
            currentScale = Math.max(0.1, currentScale + scaleChange);
        }
        renderPage(currentPage, getPatternFromSearchInput());
    }

    Object.values(desktopZoomControls).concat(Object.values(mobileZoomControls)).forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.id;
                if (id.includes('fit-width')) handleZoom('width');
                else if (id.includes('fit-height')) handleZoom('height');
                else if (id.includes('zoom-in')) handleZoom('custom', 0.2);
                else if (id.includes('zoom-out')) handleZoom('custom', -0.2);
            });
        }
    });

    // --- Final Setup ---
    initLocalMagnifier();
    updatePageControls();
    initializeApp();
});
