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
    let currentZoomMode = 'height';
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
    
    const resultsDropdown = document.getElementById('resultsDropdown');
    const panelResultsDropdown = document.getElementById('panelResultsDropdown');
    const searchResultsPanel = document.getElementById('search-results-panel');
    const resultsList = document.getElementById('results-list');

    const exportPageBtn = document.getElementById('export-page-btn');
    const sharePageBtn = document.getElementById('share-page-btn');
    const copyPageTextBtn = document.getElementById('copy-page-text-btn');
    const toggleUnderlineBtn = document.getElementById('toggle-underline-btn');
    const toggleHighlighterBtn = document.getElementById('toggle-highlighter-btn');
    const clearHighlighterBtn = document.getElementById('clear-highlighter-btn');
    const toggleTextSelectionBtn = document.getElementById('toggle-text-selection-btn');
    const toggleParagraphSelectionBtn = document.getElementById('toggle-paragraph-selection-btn');
    
    const magnifierGlass = document.getElementById('magnifier-glass');
    const magnifierCanvas = document.getElementById('magnifier-canvas');
    const localMagnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
    const toggleLocalMagnifierBtn = document.getElementById('toggle-local-magnifier-btn');
    const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
    const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');
    
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

    // ===================================================================
    //  FUNCTION DEFINITIONS (Moved to the top)
    // ===================================================================

    function updateZoomControls() {
        const allZoomBtns = [...Object.values(desktopZoomControls), ...Object.values(mobileZoomControls)];
        allZoomBtns.forEach(btn => { if(btn) btn.classList.remove('active'); });

        if (currentZoomMode === 'width') {
            if(desktopZoomControls.fitWidthBtn) desktopZoomControls.fitWidthBtn.classList.add('active');
            if(mobileZoomControls.fitWidthBtn) mobileZoomControls.fitWidthBtn.classList.add('active');
        } else if (currentZoomMode === 'height') {
            if(desktopZoomControls.fitHeightBtn) desktopZoomControls.fitHeightBtn.classList.add('active');
            if(mobileZoomControls.fitHeightBtn) mobileZoomControls.fitHeightBtn.classList.add('active');
        }
    }

    function updateResultsNav() {
        const hasResults = searchResults.length > 0;
        document.body.classList.toggle('results-bar-visible', hasResults);
        if (appContainer) appContainer.classList.toggle('results-panel-visible', hasResults);
    }

    function updatePageControls() {
        const fabContainer = document.getElementById('floating-action-buttons');
        const hasDocs = pdfDocs.length > 0;

        if (!pageNumDisplay || !fabContainer) {
            if (!hasDocs && pageNumDisplay) pageNumDisplay.textContent = '- / -';
            if (!hasDocs && fabContainer) fabContainer.style.display = 'none';
            return;
        }

        const allControls = [goToFirstPageBtn, prevPageBtn, nextPageBtn, pageToGoInput, goToPageBtn, pageSlider, toggleUnderlineBtn, toggleHighlighterBtn, clearHighlighterBtn, toggleTextSelectionBtn, sharePageBtn, exportPageBtn, toggleLocalMagnifierBtn, localMagnifierZoomSelector, copyPageTextBtn, ...Object.values(desktopZoomControls), ...Object.values(mobileZoomControls), toggleParagraphSelectionBtn];
        allControls.forEach(el => { if(el) el.disabled = !hasDocs; });

        if (!hasDocs) {
            pageNumDisplay.textContent = '- / -';
            if (pageToGoInput) { pageToGoInput.value = ''; pageToGoInput.max = 1; }
            if (pageSlider) { pageSlider.max = 1; pageSlider.value = 1; }
            fabContainer.style.display = 'none';
            if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = 'none';
            updateResultsNav();
            return;
        }

        const docInfo = getDocAndLocalPage(currentPage);
        const docNameDisplay = docInfo ? ` (檔案: ${docInfo.docName})` : '';
        pageNumDisplay.textContent = `第 ${currentPage} / ${globalTotalPages} 頁${docNameDisplay}`;
        if (pageToGoInput) { pageToGoInput.value = currentPage; pageToGoInput.max = globalTotalPages; }
        if (goToFirstPageBtn) goToFirstPageBtn.disabled = (currentPage === 1);
        if (prevPageBtn) prevPageBtn.disabled = (currentPage === 1);
        if (nextPageBtn) nextPageBtn.disabled = (currentPage === globalTotalPages);
        if (pageSlider) { pageSlider.max = globalTotalPages; pageSlider.value = currentPage; pageSlider.disabled = (globalTotalPages === 1); }

        fabContainer.style.display = 'flex';

        toggleUnderlineBtn.classList.toggle('active', showSearchResultsHighlights);
        toggleHighlighterBtn.classList.toggle('active', highlighterEnabled);
        toggleTextSelectionBtn.classList.toggle('active', textSelectionModeActive);
        toggleParagraphSelectionBtn.classList.toggle('active', paragraphSelectionModeActive);
        if (sharePageBtn) sharePageBtn.disabled = !navigator.share;
        toggleLocalMagnifierBtn.classList.toggle('active', localMagnifierEnabled);
        if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = (hasDocs && localMagnifierEnabled) ? 'flex' : 'none';

        updateResultsNav();
        updateZoomControls();
    }

    function getDocAndLocalPage(globalPage) {
        if (globalPage < 1 || globalPage > globalTotalPages || pageMap.length === 0) return null;
        const mapping = pageMap[globalPage - 1];
        if (!mapping || pdfDocs[mapping.docIndex] === undefined) return null;
        return {
            doc: pdfDocs[mapping.docIndex],
            localPage: mapping.localPage,
            docName: mapping.docName
        };
    }

    function renderTextLayer(page, viewport, highlightPattern) {
        if (!textLayerDivGlobal || !pdfjsLib || !pdfjsLib.Util) return Promise.resolve();
        return page.getTextContent().then(function(textContent) {
            currentPageTextContent = textContent;
            textLayerDivGlobal.innerHTML = '';
            textContent.items.forEach(function(item) {
                const textDiv = document.createElement('div');
                const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                let defaultFontSize = item.height * viewport.scale;
                if (defaultFontSize <= 0) defaultFontSize = 10;
                const style = `position:absolute; left:${tx[4]}px; top:${tx[5] - (item.height * viewport.scale)}px; height:${item.height * viewport.scale}px; width:${item.width * viewport.scale}px; font-size:${defaultFontSize}px; line-height: 1; white-space: pre; font-family: ${item.fontName ? item.fontName.split(',')[0] : 'sans-serif'};`;
                textDiv.setAttribute('style', style);
                textDiv.textContent = item.str;

                if (highlightPattern && highlightPattern.test(item.str)) {
                    textDiv.classList.add('wavy-underline');
                }
                textLayerDivGlobal.appendChild(textDiv);
            });
        }).catch(reason => console.error('渲染文字層失敗: ' + reason));
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

    function getPatternFromSearchInput() {
        const i = searchInputElem ? searchInputElem.value.trim() : null;
        if (!i) return null;
        try {
            if (i.startsWith('/') && i.lastIndexOf('/') > 0) {
                const ls = i.lastIndexOf('/');
                return new RegExp(i.slice(1, ls), i.slice(ls + 1));
            } else {
                const es = i.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
                const k = es.split(/\s+/).filter(ky => ky.length > 0);
                if (k.length > 0) return new RegExp(k.join('.*?'), 'gi');
            }
        } catch (e) {
            console.warn('無法從輸入建立正規表示式:', e);
            return null;
        }
        return null;
    }

    function initLocalMagnifier() {
        // ... (This function and other helpers are defined here)
    }

    // ... (All other helper functions like deactivateAllModes, drawing, paragraph selection, etc. go here)

    // ===================================================================
    //  EVENT LISTENERS & INITIALIZATION
    // ===================================================================
    
    document.getElementById('fileInput').addEventListener('change', async function(e) {
        await loadAndProcessFiles(Array.from(e.target.files));
    });

    if (searchActionButton) searchActionButton.addEventListener('click', searchKeyword);
    if (searchInputElem) searchInputElem.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchActionButton.click(); } });
    
    function goToPageDropdown(pageNumStr) {
        if (pageNumStr) {
            const pageNum = parseInt(pageNumStr);
            goToPage(pageNum, getPatternFromSearchInput());
        }
    }
    if (resultsDropdown) resultsDropdown.addEventListener('change', () => goToPageDropdown(resultsDropdown.value));
    if (panelResultsDropdown) panelResultsDropdown.addEventListener('change', () => goToPageDropdown(panelResultsDropdown.value));

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

    function handleZoom(mode, scaleChange = 0) {
        if (pdfDocs.length === 0) return;
        currentZoomMode = mode;
        if (mode === 'custom') {
            currentScale = Math.max(0.1, currentScale + scaleChange);
        }
        renderPage(currentPage, getPatternFromSearchInput());
    }

    [desktopZoomControls, mobileZoomControls].forEach(controls => {
        if (controls.fitWidthBtn) controls.fitWidthBtn.addEventListener('click', () => handleZoom('width'));
        if (controls.fitHeightBtn) controls.fitHeightBtn.addEventListener('click', () => handleZoom('height'));
        if (controls.zoomInBtn) controls.zoomInBtn.addEventListener('click', () => handleZoom('custom', 0.2));
        if (controls.zoomOutBtn) controls.zoomOutBtn.addEventListener('click', () => handleZoom('custom', -0.2));
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
    
    // --- Final Setup Calls ---
    // initLocalMagnifier(); // This can be defined before being called
    updatePageControls();
    initializeApp();
});
