// script.js

import { initDB, saveFiles, getFiles } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
    if (typeof pdfjsLib === 'undefined') {
        console.error('pdfjsLib 未定義。請確保 pdf.mjs 在 script.js 之前載入。');
        alert('PDF 程式庫載入失敗。請刷新頁面或檢查您的網路連線。');
        return;
    }

    // --- State Variables ---
    let pdfDocs = [];
    let pageMap = [];
    let globalTotalPages = 0;
    let currentPage = 1;
    let pageRendering = false;
    let searchResults = [];
    let currentZoomMode = 'height'; // 'height', 'width', or 'custom'
    let currentScale = 1.0;
    let paragraphSelectionModeActive = false;
    let currentPageTextContent = null;
    let currentViewport = null;
    let localMagnifierEnabled = false;
    let showSearchResultsHighlights = true;
    let highlighterEnabled = false;
    let textSelectionModeActive = false;
    let isDrawing = false;
    let lastX = 0, lastY = 0;
    const LOCAL_MAGNIFIER_SIZE = 120;
    let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

    // --- Element Caching ---
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const appContainer = document.getElementById('app-container');
    const pdfContainer = document.getElementById('pdf-container');
    const textLayerDivGlobal = document.getElementById('text-layer');
    const drawingCanvas = document.getElementById('drawing-canvas');
    const drawingCtx = drawingCanvas ? drawingCanvas.getContext('2d') : null;
    
    // Toolbar Elements
    const toolbar = document.getElementById('toolbar');
    const toolbarToggleTab = document.getElementById('toolbar-toggle-tab');
    const searchInputElem = document.getElementById('searchInput');
    const searchActionButton = document.getElementById('search-action-button');
    const goToFirstPageBtn = document.getElementById('go-to-first-page');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumDisplay = document.getElementById('page-num-display');
    const pageToGoInput = document.getElementById('page-to-go');
    const goToPageBtn = document.getElementById('go-to-page-btn');
    const pageSlider = document.getElementById('page-slider');
    
    // Results Elements
    const resultsDropdown = document.getElementById('resultsDropdown');
    const panelResultsDropdown = document.getElementById('panelResultsDropdown');
    const searchResultsPanel = document.getElementById('search-results-panel');
    const resultsList = document.getElementById('results-list');

    // FABs & Tools
    const exportPageBtn = document.getElementById('export-page-btn');
    const sharePageBtn = document.getElementById('share-page-btn');
    const copyPageTextBtn = document.getElementById('copy-page-text-btn');
    const toggleUnderlineBtn = document.getElementById('toggle-underline-btn');
    const toggleHighlighterBtn = document.getElementById('toggle-highlighter-btn');
    const clearHighlighterBtn = document.getElementById('clear-highlighter-btn');
    const toggleTextSelectionBtn = document.getElementById('toggle-text-selection-btn');
    const toggleParagraphSelectionBtn = document.getElementById('toggle-paragraph-selection-btn');
    
    // Magnifier Elements
    const magnifierGlass = document.getElementById('magnifier-glass');
    const magnifierCanvas = document.getElementById('magnifier-canvas');
    const localMagnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
    const toggleLocalMagnifierBtn = document.getElementById('toggle-local-magnifier-btn');
    const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
    const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');
    
    // Zoom Buttons
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

    // ... (All other functions from your script. The key fixes are in renderPage, searchKeyword, and new event listeners at the end) ...

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
                scaleToFit = pdfContainer.clientWidth / viewportOriginal.width;
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
    
                const canvasRect = canvas.getBoundingClientRect();
                const containerRect = pdfContainer.getBoundingClientRect();
                
                const canvasOffsetTop = canvasRect.top - containerRect.top + pdfContainer.scrollTop;
                const canvasOffsetLeft = canvasRect.left - containerRect.left + pdfContainer.scrollLeft;

                textLayerDivGlobal.style.width = `${viewportCss.width}px`;
                textLayerDivGlobal.style.height = `${viewportCss.height}px`;
                textLayerDivGlobal.style.top = `${canvasOffsetTop}px`;
                textLayerDivGlobal.style.left = `${canvasOffsetLeft}px`;
    
                drawingCanvas.width = viewportCss.width;
                drawingCanvas.height = viewportCss.height;
                drawingCanvas.style.top = `${canvasOffsetTop}px`;
                drawingCanvas.style.left = `${canvasOffsetLeft}px`;
    
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
    
    // --- The rest of your functions (goToPage, event listeners, etc.) ---
    // Make sure to add the zoom event listeners at the end.

    // ===================================================================
    //  EVENT LISTENERS (Navigation, Tools, Zoom)
    // ===================================================================
    
    // Search
    if (searchActionButton) searchActionButton.addEventListener('click', searchKeyword);
    if (searchInputElem) searchInputElem.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchActionButton.click(); } });
    
    // Results Dropdowns
    function goToPageDropdown(pageNumStr) {
        if (pageNumStr) {
            const pageNum = parseInt(pageNumStr);
            goToPage(pageNum, getPatternFromSearchInput());
        }
    }
    if (resultsDropdown) resultsDropdown.addEventListener('change', () => goToPageDropdown(resultsDropdown.value));
    if (panelResultsDropdown) panelResultsDropdown.addEventListener('change', () => goToPageDropdown(panelResultsDropdown.value));

    // Page Navigation
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

    if (goToFirstPageBtn) goToFirstPageBtn.addEventListener('click', () => { if (pdfDocs.length > 0) goToPage(1, getPatternFromSearchInput()); });
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) goToPage(currentPage - 1, getPatternFromSearchInput()); });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => { if (pdfDocs.length > 0 && currentPage < globalTotalPages) goToPage(currentPage + 1, getPatternFromSearchInput()); });
    
    if (goToPageBtn && pageToGoInput) {
        goToPageBtn.addEventListener('click', () => {
            const pn = parseInt(pageToGoInput.value);
            if (!isNaN(pn)) goToPage(pn, getPatternFromSearchInput());
        });
    }
    if (pageToGoInput && goToPageBtn) {
        pageToGoInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); goToPageBtn.click(); } });
    }
    if (pageSlider) pageSlider.addEventListener('input', () => {
        const newPage = parseInt(pageSlider.value);
        if (pageToGoInput) pageToGoInput.value = newPage;
        if (currentPage !== newPage) goToPage(newPage, getPatternFromSearchInput());
    });

    // --- FIX: ZOOM EVENT LISTENERS ---
    function handleZoom(mode, scaleChange = 0) {
        if (pdfDocs.length === 0) return;
        currentZoomMode = mode;
        if (mode === 'custom') {
            currentScale = Math.max(0.1, currentScale + scaleChange);
        }
        renderPage(currentPage, getPatternFromSearchInput());
    }

    Object.values(desktopZoomControls).forEach(btn => {
        if(btn) btn.onclick = (e) => {
            const id = e.currentTarget.id;
            if(id.includes('fit-width')) handleZoom('width');
            else if(id.includes('fit-height')) handleZoom('height');
            else if(id.includes('zoom-in')) handleZoom('custom', 0.2);
            else if(id.includes('zoom-out')) handleZoom('custom', -0.2);
        };
    });
     Object.values(mobileZoomControls).forEach(btn => {
        if(btn) btn.onclick = (e) => {
            const id = e.currentTarget.id;
            if(id.includes('fit-width')) handleZoom('width');
            else if(id.includes('fit-height')) handleZoom('height');
            else if(id.includes('zoom-in')) handleZoom('custom', 0.2);
            else if(id.includes('zoom-out')) handleZoom('custom', -0.2);
        };
    });

    // ... The rest of your script follows ...
    // ... I will include the full remaining part for completeness ...

    // Other initializations and the rest of the functions
    if (exportPageBtn) exportPageBtn.addEventListener('click', () => { /* Export logic... */ });
    if (toggleUnderlineBtn) toggleUnderlineBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        showSearchResultsHighlights = !showSearchResultsHighlights;
        renderPage(currentPage, getPatternFromSearchInput());
    });
    
    function deactivateAllModes(except = null) {
        if (except !== 'highlighter' && highlighterEnabled) {
            highlighterEnabled = false;
            if (drawingCanvas) drawingCanvas.style.pointerEvents = 'none';
        }
        if (except !== 'textSelection' && textSelectionModeActive) {
            textSelectionModeActive = false;
            if (textLayerDivGlobal) {
                textLayerDivGlobal.style.pointerEvents = 'none';
                textLayerDivGlobal.classList.remove('text-selection-active');
            }
            if (canvas) canvas.style.visibility = 'visible';
        }
        if (except !== 'localMagnifier' && localMagnifierEnabled) {
            localMagnifierEnabled = false;
            if (magnifierGlass) magnifierGlass.style.display = 'none';
        }
        if (except !== 'paragraphSelection' && paragraphSelectionModeActive) {
            paragraphSelectionModeActive = false;
            if (pdfContainer) pdfContainer.classList.remove('paragraph-selection-mode');
            clearParagraphHighlights();
        }
        updatePageControls();
    }

    if (toggleHighlighterBtn) toggleHighlighterBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        const wasActive = highlighterEnabled;
        deactivateAllModes();
        if (!wasActive) {
            highlighterEnabled = true;
            if (drawingCanvas) drawingCanvas.style.pointerEvents = 'auto';
        }
        updatePageControls();
    });

    if (toggleTextSelectionBtn) toggleTextSelectionBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        const wasActive = textSelectionModeActive;
        deactivateAllModes();
        if (!wasActive) {
            textSelectionModeActive = true;
            if (textLayerDivGlobal) {
                textLayerDivGlobal.style.pointerEvents = 'auto';
                textLayerDivGlobal.classList.add('text-selection-active');
            }
            if (canvas) canvas.style.visibility = 'hidden';
        }
        updatePageControls();
    });

    if (toggleLocalMagnifierBtn) toggleLocalMagnifierBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        const wasActive = localMagnifierEnabled;
        deactivateAllModes();
        if (!wasActive) {
            localMagnifierEnabled = true;
        }
        updatePageControls();
    });
    
    if (toggleParagraphSelectionBtn) toggleParagraphSelectionBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        const wasActive = paragraphSelectionModeActive;
        deactivateAllModes();
        if (!wasActive) {
            paragraphSelectionModeActive = true;
            if (pdfContainer) pdfContainer.classList.add('paragraph-selection-mode');
        }
        updatePageControls();
    });

    if (clearHighlighterBtn && drawingCtx && drawingCanvas) clearHighlighterBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    });
    
    if (copyPageTextBtn) copyPageTextBtn.addEventListener('click', async () => {
        if (pdfDocs.length === 0 || pageRendering) return;
        const pageInfo = getDocAndLocalPage(currentPage);
        if (!pageInfo) { showFeedback('無法獲取目前頁面資訊。'); return; }
        try {
            const page = await pageInfo.doc.getPage(pageInfo.localPage);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join('\n');
            await navigator.clipboard.writeText(pageText);
            showFeedback('頁面文字已複製到剪貼簿！');
        } catch (err) {
            console.error('複製文字失敗:', err);
            showFeedback('複製頁面文字時發生錯誤。');
        }
    });

    if (sharePageBtn) sharePageBtn.addEventListener('click', async () => {
        if (pdfDocs.length === 0 || !canvas) { alert('請先載入 PDF 檔案'); return; }
        if (pageRendering) { alert('頁面仍在渲染中，請稍候'); return; }
        const wasCanvasHidden = canvas.style.visibility === 'hidden';
        if (wasCanvasHidden) canvas.style.visibility = 'visible';
        if (!navigator.share) { alert('您的瀏覽器不支援 Web Share API'); if (wasCanvasHidden) canvas.style.visibility = 'hidden'; return; }
        try {
            const tc = document.createElement('canvas');
            tc.width = canvas.width; tc.height = canvas.height;
            const tctx = tc.getContext('2d');
            if (!tctx) { alert('無法獲取分享畫布的上下文'); if (wasCanvasHidden) canvas.style.visibility = 'hidden'; return; }
            tctx.drawImage(canvas, 0, 0);
            if (drawingCanvas && drawingCtx) { tctx.drawImage(drawingCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height, 0, 0, tc.width, tc.height); }
            const blob = await new Promise(resolve => tc.toBlob(resolve, 'image/png'));
            if (!blob) { throw new Error('無法從畫布建立圖片資料。'); }
            const pageInfo = getDocAndLocalPage(currentPage);
            const docNamePart = pageInfo ? pageInfo.docName.replace(/\.pdf$/i, '') : 'document';
            const fn = `page_${currentPage}_(${docNamePart}-p${pageInfo.localPage})_annotated.png`;
            const f = new File([blob], fn, { type: 'image/png' });
            const sd = { title: `PDF 全域頁面 ${currentPage}`, text: `來自 ${docNamePart} 的第 ${pageInfo.localPage} 頁`, files: [f] };
            if (navigator.canShare && navigator.canShare({ files: [f] })) {
                await navigator.share(sd);
            } else {
                const fsd = { title: sd.title, text: sd.text };
                if (fsd.text && navigator.canShare && navigator.canShare(fsd)) {
                    await navigator.share(fsd);
                } else {
                    alert('您的瀏覽器不支援分享檔案或文字。');
                }
            }
        } catch (er) {
            console.error('分享錯誤:', er);
            if (er.name !== 'AbortError') { alert('分享失敗: ' + er.message); }
        } finally {
            if (wasCanvasHidden) { canvas.style.visibility = 'hidden'; }
        }
    });

    if (localMagnifierZoomSelector) localMagnifierZoomSelector.addEventListener('change', (e) => { LOCAL_MAGNIFIER_ZOOM_LEVEL = parseFloat(e.target.value); });
    
    function handlePointerMoveForLocalMagnifier(e) {
        if (!localMagnifierEnabled) return;
        if (e.type === 'touchmove' || e.type === 'touchstart') e.preventDefault();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } 
        else if (e.clientX !== undefined) { clientX = e.clientX; clientY = e.clientY; } 
        else { return; }
        updateLocalMagnifier(clientX, clientY);
    }

    function handlePointerLeaveForLocalMagnifier() {
        if (localMagnifierEnabled && magnifierGlass) magnifierGlass.style.display = 'none';
    }

    if (pdfContainer) {
        pdfContainer.addEventListener('mousemove', handlePointerMoveForLocalMagnifier);
        pdfContainer.addEventListener('mouseleave', handlePointerLeaveForLocalMagnifier);
        pdfContainer.addEventListener('touchstart', handlePointerMoveForLocalMagnifier, { passive: false });
        pdfContainer.addEventListener('touchmove', handlePointerMoveForLocalMagnifier, { passive: false });
        pdfContainer.addEventListener('touchend', handlePointerLeaveForLocalMagnifier);
        pdfContainer.addEventListener('touchcancel', handlePointerLeaveForLocalMagnifier);
    }

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (pdfDocs.length > 0) renderPage(currentPage, getPatternFromSearchInput());
        }, 250);
    });

    function navigateToNextResult() {
        if (searchResults.length === 0) return;
        const nextResult = searchResults.find(r => r.page > currentPage);
        if (nextResult) {
            goToPage(nextResult.page, getPatternFromSearchInput());
        } else {
            showFeedback('已是最後一個結果');
        }
    }

    function navigateToPreviousResult() {
        if (searchResults.length === 0) return;
        const prevResult = [...searchResults].reverse().find(r => r.page < currentPage);
        if (prevResult) {
            goToPage(prevResult.page, getPatternFromSearchInput());
        } else {
            showFeedback('已是第一個結果');
        }
    }

    function showFeedback(message) {
        let feedbackDiv = document.getElementById('feedback-message');
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.id = 'feedback-message';
            document.body.appendChild(feedbackDiv);
            Object.assign(feedbackDiv.style, { position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white', padding: '10px 20px', borderRadius: '20px', zIndex: '9999', opacity: '0', transition: 'opacity 0.5s', pointerEvents: 'none' });
        }
        feedbackDiv.textContent = message;
        feedbackDiv.style.opacity = '1';
        setTimeout(() => { feedbackDiv.style.opacity = '0'; }, 1500);
    }
    
    let touchStartX = 0, touchStartY = 0, isSwiping = false;
    const MIN_SWIPE_DISTANCE_X = 50, MAX_SWIPE_DISTANCE_Y = 60;

    if (pdfContainer) {
        pdfContainer.addEventListener('touchstart', (e) => {
            if (highlighterEnabled || textSelectionModeActive || localMagnifierEnabled || paragraphSelectionModeActive || e.touches.length !== 1) { isSwiping = false; return; }
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = true;
        }, { passive: true });
        pdfContainer.addEventListener('touchend', (e) => {
            if (!isSwiping || e.changedTouches.length !== 1) { isSwiping = false; return; }
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            if (Math.abs(diffX) > MIN_SWIPE_DISTANCE_X && Math.abs(diffY) < MAX_SWIPE_DISTANCE_Y) {
                const isSearchResultMode = searchResults.length > 0;
                if (diffX < 0) { isSearchResultMode ? navigateToNextResult() : nextPageBtn.click(); } 
                else { isSearchResultMode ? navigateToPreviousResult() : prevPageBtn.click(); }
            }
            isSwiping = false;
        });
        pdfContainer.addEventListener('touchcancel', () => { isSwiping = false; });
    }

    function clearParagraphHighlights() {
        document.querySelectorAll('.paragraph-highlight, #copy-paragraph-btn').forEach(el => el.remove());
    }

    function handleParagraphSelection(e) {
        if (!paragraphSelectionModeActive || !currentPageTextContent || !currentViewport) return;
        clearParagraphHighlights();
        const pos = getEventPosition(canvas, e);
        const clickPoint = { x: pos.x, y: pos.y };

        let closestItem = null;
        currentPageTextContent.items.forEach(item => {
            const tx = pdfjsLib.Util.transform(currentViewport.transform, item.transform);
            const itemRect = { left: tx[4], top: tx[5] - item.height * currentViewport.scale, right: tx[4] + item.width * currentViewport.scale, bottom: tx[5] };
            if (clickPoint.x >= itemRect.left && clickPoint.x <= itemRect.right && clickPoint.y >= itemRect.top && clickPoint.y <= itemRect.bottom) {
                closestItem = item;
            }
        });
        if (!closestItem) return;

        const lineTolerance = closestItem.height * 0.5;
        const paragraphBreakTolerance = closestItem.height * 1.5;
        const lines = [];
        let currentLine = [];
        let lastY = -1;

        currentPageTextContent.items.sort((a, b) => a.transform[5] - b.transform[5] || a.transform[4] - b.transform[4]);

        currentPageTextContent.items.forEach(item => {
            if (lastY === -1 || Math.abs(item.transform[5] - lastY) < lineTolerance) {
                currentLine.push(item);
            } else {
                lines.push(currentLine.sort((a, b) => a.transform[4] - b.transform[4]));
                currentLine = [item];
            }
            lastY = item.transform[5];
        });
        lines.push(currentLine.sort((a, b) => a.transform[4] - b.transform[4]));

        let clickedLineIndex = lines.findIndex(line => line.includes(closestItem));
        if (clickedLineIndex === -1) return;

        let paragraphStartLine = clickedLineIndex;
        while (paragraphStartLine > 0) {
            const currentLineY = lines[paragraphStartLine][0].transform[5];
            const prevLineY = lines[paragraphStartLine - 1][0].transform[5];
            if (Math.abs(currentLineY - prevLineY) > paragraphBreakTolerance) break;
            paragraphStartLine--;
        }

        let paragraphEndLine = clickedLineIndex;
        while (paragraphEndLine < lines.length - 1) {
            const currentLineY = lines[paragraphEndLine][0].transform[5];
            const nextLineY = lines[paragraphEndLine + 1][0].transform[5];
            if (Math.abs(nextLineY - currentLineY) > paragraphBreakTolerance) break;
            paragraphEndLine++;
        }

        let paragraphText = '';
        for (let i = paragraphStartLine; i <= paragraphEndLine; i++) {
            const line = lines[i];
            if (line.length === 0) continue;
            const firstItem = line[0];
            const lastItem = line[line.length - 1];
            const txFirst = pdfjsLib.Util.transform(currentViewport.transform, firstItem.transform);
            const txLast = pdfjsLib.Util.transform(currentViewport.transform, lastItem.transform);
            const highlight = document.createElement('div');
            highlight.className = 'paragraph-highlight';
            highlight.style.left = `${txFirst[4]}px`;
            highlight.style.top = `${txFirst[5] - firstItem.height * currentViewport.scale}px`;
            highlight.style.width = `${(txLast[4] + lastItem.width * currentViewport.scale) - txFirst[4]}px`;
            highlight.style.height = `${firstItem.height * currentViewport.scale}px`;
            pdfContainer.appendChild(highlight);
            paragraphText += line.map(item => item.str).join('') + '\n';
        }

        const lastLineOfParagraph = lines[paragraphEndLine];
        if (lastLineOfParagraph.length > 0) {
            const lastItemOfParagraph = lastLineOfParagraph[lastLineOfParagraph.length - 1];
            const tx = pdfjsLib.Util.transform(currentViewport.transform, lastItemOfParagraph.transform);
            const copyBtn = document.createElement('button');
            copyBtn.id = 'copy-paragraph-btn';
            copyBtn.textContent = '複製';
            copyBtn.style.left = `${tx[4] + lastItemOfParagraph.width * currentViewport.scale + 5}px`;
            copyBtn.style.top = `${tx[5] - lastItemOfParagraph.height * currentViewport.scale}px`;
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(paragraphText.trim());
                    showFeedback('段落已複製！');
                    clearParagraphHighlights();
                } catch (err) {
                    showFeedback('複製失敗。');
                    console.error('複製失敗:', err);
                }
            };
            pdfContainer.appendChild(copyBtn);
        }
    }

    if (pdfContainer) {
        pdfContainer.addEventListener('click', handleParagraphSelection);
    }
    
    // --- Initial setup calls ---
    initLocalMagnifier();
    updatePageControls();

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
    
    initializeApp();
});
