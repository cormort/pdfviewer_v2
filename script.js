document.addEventListener('DOMContentLoaded', () => {
    // ** 設定 worker 的本地路徑 **
    if (typeof pdfjsLib !== 'undefined') {
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdfjs/pdf.worker.mjs';
        }
    } else {
        console.error("pdfjsLib is not defined. Check the import or script loading order.");
        alert("PDF 程式庫載入失敗，請刷新頁面或檢查網路連線。");
        return;
    }

    let pdfDocs = [];
    let pageMap = [];
    let globalTotalPages = 0;
    let currentPage = 1;
    let pageRendering = false;

    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const toolbar = document.getElementById('toolbar');
    const toolbarToggle = document.getElementById('toolbar-toggle');
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
    
    // ** CHANGED: Get elements from their new location in the bottom bar **
    const bottomResultsBar = document.getElementById('bottom-results-bar');
    const resultsDropdown = document.getElementById('resultsDropdown');
    const prevResultBtn = document.getElementById('prev-result-btn');
    const nextResultBtn = document.getElementById('next-result-btn');

    const magnifierGlass = document.getElementById('magnifier-glass');
    const magnifierCanvas = document.getElementById('magnifier-canvas');
    const localMagnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
    const toggleLocalMagnifierBtn = document.getElementById('toggle-local-magnifier-btn');
    const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
    const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');

    let localMagnifierEnabled = false;
    let LOCAL_MAGNIFIER_SIZE = 120;
    let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

    let showSearchResultsHighlights = true;
    let highlighterEnabled = false;
    let textSelectionModeActive = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // ... (getDocAndLocalPage, initLocalMagnifier, updateLocalMagnifier, updatePageControls, etc. are unchanged) ...
    function getDocAndLocalPage(globalPage) {
        if (globalPage < 1 || globalPage > globalTotalPages || pageMap.length === 0) {
            return null;
        }
        const mapping = pageMap[globalPage - 1];
        if (!mapping || pdfDocs[mapping.docIndex] === undefined) {
            console.error(`Mapping or document not found for global page ${globalPage}`);
            return null;
        }
        return {
            doc: pdfDocs[mapping.docIndex],
            localPage: mapping.localPage,
            docName: mapping.docName
        };
    }

    function initLocalMagnifier() {
        if (magnifierCanvas && magnifierGlass) {
            magnifierGlass.style.width = `${LOCAL_MAGNIFIER_SIZE}px`;
            magnifierGlass.style.height = `${LOCAL_MAGNIFIER_SIZE}px`;
            magnifierCanvas.width = LOCAL_MAGNIFIER_SIZE;
            magnifierCanvas.height = LOCAL_MAGNIFIER_SIZE;
        }
        if (localMagnifierZoomSelector) {
            LOCAL_MAGNIFIER_ZOOM_LEVEL = parseFloat(localMagnifierZoomSelector.value);
        }
        if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = 'none';
    }

    function updateLocalMagnifier(clientX, clientY) {
        if (!localMagnifierEnabled || pdfDocs.length === 0 || pageRendering || !canvas || !magnifierGlass || !localMagnifierCtx || !pdfContainer) {
            if (magnifierGlass) magnifierGlass.style.display = 'none';
            return;
        }
        const pdfContainerRect = pdfContainer.getBoundingClientRect();
        const pointXInContainer = clientX - pdfContainerRect.left;
        const pointYInContainer = clientY - pdfContainerRect.top;
        const canvasRectInContainer = {
            left: canvas.offsetLeft,
            top: canvas.offsetTop,
            right: canvas.offsetLeft + canvas.offsetWidth,
            bottom: canvas.offsetTop + canvas.offsetHeight
        };
        if (pointXInContainer < canvasRectInContainer.left || pointXInContainer > canvasRectInContainer.right || pointYInContainer < canvasRectInContainer.top || pointYInContainer > canvasRectInContainer.bottom) {
            magnifierGlass.style.display = 'none';
            return;
        }
        magnifierGlass.style.display = 'block';
        const pointXOnCanvasCSS = pointXInContainer - canvas.offsetLeft;
        const pointYOnCanvasCSS = pointYInContainer - canvas.offsetTop;
        const scaleX = canvas.width / canvas.offsetWidth;
        const scaleY = canvas.height / canvas.offsetHeight;
        const srcX = pointXOnCanvasCSS * scaleX;
        const srcY = pointYOnCanvasCSS * scaleY;
        const srcRectCSSWidth = LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL;
        const srcRectCSSHeight = LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL;
        const srcRectPixelWidth = srcRectCSSWidth * scaleX;
        const srcRectPixelHeight = srcRectCSSHeight * scaleY;
        const srcRectX = srcX - (srcRectPixelWidth / 2);
        const srcRectY = srcY - (srcRectPixelHeight / 2);
        localMagnifierCtx.clearRect(0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
        localMagnifierCtx.fillStyle = 'white';
        localMagnifierCtx.fillRect(0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
        localMagnifierCtx.drawImage(canvas, srcRectX, srcRectY, srcRectPixelWidth, srcRectPixelHeight, 0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
        if (drawingCanvas && drawingCanvas.width > 0 && drawingCanvas.height > 0) {
            const srcDrawRectX = pointXOnCanvasCSS - (srcRectCSSWidth / 2);
            const srcDrawRectY = pointYOnCanvasCSS - (srcRectCSSHeight / 2);
            localMagnifierCtx.drawImage(drawingCanvas, srcDrawRectX, srcDrawRectY, srcRectCSSWidth, srcRectCSSHeight, 0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
        }
        let magnifierTop = (pointYInContainer - LOCAL_MAGNIFIER_SIZE - 10);
        let magnifierLeft = (pointXInContainer - (LOCAL_MAGNIFIER_SIZE / 2));
        magnifierTop = Math.max(0, Math.min(magnifierTop, pdfContainer.clientHeight - LOCAL_MAGNIFIER_SIZE - 5));
        magnifierLeft = Math.max(0, Math.min(magnifierLeft, pdfContainer.clientWidth - LOCAL_MAGNIFIER_SIZE - 5));
        magnifierGlass.style.top = `${magnifierTop + pdfContainer.scrollTop}px`;
        magnifierGlass.style.left = `${magnifierLeft + pdfContainer.scrollLeft}px`;
    }

    function updatePageControls() {
        const fabContainer = document.getElementById('floating-action-buttons');
        if (!pageNumDisplay || !goToFirstPageBtn || !prevPageBtn || !nextPageBtn || !pageToGoInput || !goToPageBtn || !pageSlider || !fabContainer || !toggleUnderlineBtn || !toggleHighlighterBtn || !clearHighlighterBtn || !toggleTextSelectionBtn || !sharePageBtn || !exportPageBtn || !toggleLocalMagnifierBtn || !localMagnifierZoomControlsDiv || !localMagnifierZoomSelector) {
            if (pdfDocs.length === 0 && pageNumDisplay) pageNumDisplay.textContent = '- / -';
            if (pdfDocs.length === 0 && fabContainer) fabContainer.style.display = 'none';
            return;
        }
        const hasDocs = pdfDocs.length > 0;
        if (!hasDocs) {
            if (pageNumDisplay) pageNumDisplay.textContent = '- / -';
            if (goToFirstPageBtn) goToFirstPageBtn.disabled = true;
            if (prevPageBtn) prevPageBtn.disabled = true;
            if (nextPageBtn) nextPageBtn.disabled = true;
            if (pageToGoInput) {
                pageToGoInput.disabled = true;
                pageToGoInput.value = '';
                pageToGoInput.max = 1;
            }
            if (goToPageBtn) goToPageBtn.disabled = true;
            if (pageSlider) {
                pageSlider.disabled = true;
                pageSlider.max = 1;
                pageSlider.value = 1;
            }
            if (fabContainer) fabContainer.style.display = 'none';
            if (toggleLocalMagnifierBtn) toggleLocalMagnifierBtn.disabled = true;
            if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = 'none';
            if (localMagnifierZoomSelector) localMagnifierZoomSelector.disabled = true;
            return;
        }
        const docInfo = getDocAndLocalPage(currentPage);
        const docNameDisplay = docInfo ? ` (檔: ${docInfo.docName})` : '';
        if (pageNumDisplay) pageNumDisplay.textContent = `第 ${currentPage} / ${globalTotalPages} 頁${docNameDisplay}`;
        if (pageToGoInput) {
            pageToGoInput.value = currentPage;
            pageToGoInput.max = globalTotalPages;
            pageToGoInput.disabled = false;
        }
        if (goToFirstPageBtn) goToFirstPageBtn.disabled = (currentPage <= 1);
        if (prevPageBtn) prevPageBtn.disabled = (currentPage <= 1);
        if (nextPageBtn) nextPageBtn.disabled = (currentPage >= globalTotalPages);
        if (goToPageBtn) goToPageBtn.disabled = false;
        if (pageSlider) {
            pageSlider.max = globalTotalPages;
            pageSlider.value = currentPage;
            pageSlider.disabled = (globalTotalPages <= 1);
        }
        if (fabContainer) fabContainer.style.display = 'flex';
        if (toggleUnderlineBtn) toggleUnderlineBtn.disabled = false;
        showSearchResultsHighlights ? toggleUnderlineBtn.classList.add('active') : toggleUnderlineBtn.classList.remove('active');
        toggleHighlighterBtn.disabled = false;
        clearHighlighterBtn.disabled = false;
        highlighterEnabled ? toggleHighlighterBtn.classList.add('active') : toggleHighlighterBtn.classList.remove('active');
        toggleHighlighterBtn.title = highlighterEnabled ? "停用螢光筆" : "啟用螢光筆";
        toggleTextSelectionBtn.disabled = !hasDocs;
        textSelectionModeActive ? toggleTextSelectionBtn.classList.add('active') : toggleTextSelectionBtn.classList.remove('active');
        toggleTextSelectionBtn.title = textSelectionModeActive ? "停用文字選取" : "啟用文字選取";
        if (sharePageBtn) sharePageBtn.disabled = !navigator.share;
        if (toggleLocalMagnifierBtn) {
            toggleLocalMagnifierBtn.disabled = !hasDocs;
            localMagnifierEnabled ? toggleLocalMagnifierBtn.classList.add('active') : toggleLocalMagnifierBtn.classList.remove('active');
            toggleLocalMagnifierBtn.title = localMagnifierEnabled ? "停用放大鏡" : "啟用放大鏡";
        }
        if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = (hasDocs && localMagnifierEnabled) ? 'flex' : 'none';
        if (localMagnifierZoomSelector) localMagnifierZoomSelector.disabled = !hasDocs;
    }
    
    document.getElementById('fileInput').addEventListener('change', function(e) {
        // ... file loading logic is unchanged ...
        // ** In this function, we now only need to call updateResultsNav to reset the bar **
        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        updateResultsNav(); // This will hide the bar and reset buttons
    });

    // ... (renderPage, renderTextLayer, and drawing functions are unchanged) ...
    function renderPage(globalPageNum, highlightPattern = null) {
        if (pdfDocs.length === 0 || !pdfContainer || !canvas || !ctx || !textLayerDivGlobal || !drawingCanvas || !drawingCtx) {
            return;
        }
        pageRendering = true;
        updatePageControls();
        if (drawingCtx && drawingCanvas) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        const pageInfo = getDocAndLocalPage(globalPageNum);
        if (!pageInfo) {
            console.error(`Could not find page info for global page ${globalPageNum}`);
            pageRendering = false;
            updatePageControls();
            return;
        }
        const {
            doc,
            localPage
        } = pageInfo;
        doc.getPage(localPage).then(function(page) {
            const viewportOriginal = page.getViewport({
                scale: 1
            });
            let availableWidth = pdfContainer.clientWidth;
            if (availableWidth <= 0) {
                availableWidth = window.innerWidth > 20 ? window.innerWidth - 20 : 300;
            }
            let baseScale = availableWidth / viewportOriginal.width;
            if (canvas.dataset.originalBorder && pdfDocs.length > 0) canvas.style.border = canvas.dataset.originalBorder;
            else if (pdfDocs.length > 0) canvas.style.border = '1px solid #000';
            showSearchResultsHighlights ? textLayerDivGlobal.classList.remove('highlights-hidden') : textLayerDivGlobal.classList.add('highlights-hidden');
            const viewportCss = page.getViewport({
                scale: baseScale
            });
            const devicePixelRatio = window.devicePixelRatio || 1;
            const qualityMultiplierVal = qualitySelector ? parseFloat(qualitySelector.value) : 1.5;
            const qualityMultiplier = qualityMultiplierVal || 1.5;
            const renderScale = baseScale * devicePixelRatio * qualityMultiplier;
            const viewportRender = page.getViewport({
                scale: renderScale
            });
            canvas.width = viewportRender.width;
            canvas.height = viewportRender.height;
            canvas.style.width = viewportCss.width + "px";
            canvas.style.height = viewportCss.height + "px";
            const renderContext = {
                canvasContext: ctx,
                viewport: viewportRender
            };
            if (ctx && viewportRender) {
                page.render(renderContext).promise.then(() => {
                    pageRendering = false;
                    updatePageControls();
                    textLayerDivGlobal.style.width = viewportCss.width + "px";
                    textLayerDivGlobal.style.height = viewportCss.height + "px";
                    textLayerDivGlobal.style.top = canvas.offsetTop + "px";
                    textLayerDivGlobal.style.left = canvas.offsetLeft + "px";
                    drawingCanvas.width = viewportCss.width;
                    drawingCanvas.height = viewportCss.height;
                    drawingCanvas.style.top = canvas.offsetTop + "px";
                    drawingCanvas.style.left = canvas.offsetLeft + "px";
                    drawingCtx.strokeStyle = 'rgba(255, 255, 0, 0.02)';
                    drawingCtx.lineWidth = 15;
                    drawingCtx.lineJoin = 'round';
                    drawingCtx.lineCap = 'round';
                    return renderTextLayer(page, viewportCss, highlightPattern);
                }).catch(reason => {
                    console.error(`Error rendering page ${localPage} from doc ${pageInfo.docName}: ` + reason);
                    pageRendering = false;
                    updatePageControls();
                });
            } else {
                pageRendering = false;
                updatePageControls();
            }
        }).catch(reason => {
            console.error(`Error getting page ${localPage} from doc ${pageInfo.docName}: ` + reason);
            pageRendering = false;
            updatePageControls();
        });
    }

    function renderTextLayer(page, viewport, highlightPattern) {
        if (!textLayerDivGlobal || !pdfjsLib || !pdfjsLib.Util) return Promise.resolve();
        return page.getTextContent().then(function(textContent) {
            textLayerDivGlobal.innerHTML = '';
            textContent.items.forEach(function(item) {
                const textDiv = document.createElement("div");
                const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
                let defaultFontSize = item.height * viewport.scale;
                if (defaultFontSize <= 0) defaultFontSize = 10;
                const style = `position:absolute; left:${tx[4]}px; top:${tx[5] - (item.height * viewport.scale)}px; height:${item.height * viewport.scale}px; width:${item.width * viewport.scale}px; font-size:${defaultFontSize}px; line-height: 1; white-space: pre; font-family: ${item.fontName ? item.fontName.split(',')[0] : 'sans-serif'};`;
                textDiv.setAttribute("style", style);
                textDiv.textContent = item.str;
                if (highlightPattern && highlightPattern.test(item.str)) {
                    textDiv.classList.add("wavy-underline");
                }
                textLayerDivGlobal.appendChild(textDiv);
            });
        }).catch(reason => console.error("Error rendering text layer: " + reason));
    }
    
    function searchKeyword() {
        if (!searchInputElem || !resultsDropdown) {
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            return;
        }
        const input = searchInputElem.value.trim();
        resultsDropdown.innerHTML = '<option value="">搜尋中，請稍候...</option>';
        updateResultsNav();

        if (pdfDocs.length === 0 || !input) {
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav();
            return;
        }
        let pattern;
        try {
            if (input.startsWith('/') && input.endsWith('/')) {
                const ls = input.lastIndexOf('/');
                pattern = new RegExp(input.slice(1, ls), input.slice(ls + 1));
            } else {
                const esc = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const kw = esc.split(/\s+|\|/).filter(k => k.length > 0);
                if (kw.length === 0) {
                    if (pdfDocs.length > 0) renderPage(currentPage, null);
                    resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
                    updateResultsNav();
                    return;
                }
                pattern = new RegExp(kw.join('|'), 'gi');
            }
        } catch (e) {
            alert('正則表達式格式錯誤: ' + e.message);
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav();
            return;
        }

        resultsDropdown.disabled = true;
        let promises = [];
        let globalPageOffset = 0;

        pdfDocs.forEach((doc, docIndex) => {
            const docName = pageMap.find(p => p.docIndex === docIndex)?.docName || `文件 ${docIndex + 1}`;
            for (let i = 1; i <= doc.numPages; i++) {
                const currentGlobalPageForSearch = globalPageOffset + i;
                promises.push(
                    doc.getPage(i).then(p => {
                        return p.getTextContent().then(tc => {
                            const pt = tc.items.map(it => it.str).join('');
                            pattern.lastIndex = 0;
                            if (pattern.test(pt)) {
                                pattern.lastIndex = 0;
                                const mr = pattern.exec(pt);
                                let fms = '找到匹配';
                                if (mr) {
                                    const mt = mr[0]; const mi = mr.index; const cl = 20;
                                    const s = Math.max(0, mi - cl);
                                    const ed = Math.min(pt.length, mi + mt.length + cl);
                                    fms = (s > 0 ? "..." : "") + pt.substring(s, mi).replace(/</g, "<") + '<span class="wavy-underline">' + mt.replace(/</g, "<") + '</span>' + pt.substring(mi + mt.length, ed).replace(/</g, "<") + (ed < pt.length ? "..." : "");
                                }
                                return { page: currentGlobalPageForSearch, summary: fms, docName: docName };
                            }
                            return null;
                        });
                    }).catch(err => {
                        console.warn(`Error processing page for search: Doc ${docName}, Page ${i}`, err);
                        return null;
                    })
                );
            }
            globalPageOffset += doc.numPages;
        });

        Promise.all(promises).then((allPageResults) => {
            const results = allPageResults.filter(r => r !== null);
            resultsDropdown.innerHTML = '';
            resultsDropdown.disabled = false;
            
            if (results.length === 0) {
                const o = document.createElement('option');
                o.textContent = '找不到關鍵字';
                resultsDropdown.appendChild(o);
                renderPage(currentPage, null);
            } else {
                results.sort((a, b) => a.page - b.page);
                let lastDocName = null;
                results.forEach((r, index) => {
                    if (r.docName !== lastDocName) {
                        if (lastDocName !== null) {
                            const footer = document.createElement('option');
                            footer.disabled = true;
                            footer.style.cssText = 'color: #ccc; font-style: italic; background-color: #222;';
                            footer.textContent = `--- 以上來自 ${lastDocName} ---`;
                            resultsDropdown.appendChild(footer);
                        }
                        const header = document.createElement('option');
                        header.disabled = true;
                        header.style.cssText = 'color: #ccc; font-style: italic; background-color: #222;';
                        header.textContent = `--- 以下來自 ${r.docName} ---`;
                        resultsDropdown.appendChild(header);
                        lastDocName = r.docName;
                    }
                    const o = document.createElement('option');
                    o.value = r.page;
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = `第 ${r.page} 頁: ${r.summary}`;
                    o.textContent = tempDiv.textContent || tempDiv.innerText || "";
                    o.title = `檔案: ${r.docName}`;
                    resultsDropdown.appendChild(o);
                    if (index === results.length - 1) {
                        const finalFooter = document.createElement('option');
                        finalFooter.disabled = true;
                        finalFooter.style.cssText = 'color: #ccc; font-style: italic; background-color: #222;';
                        finalFooter.textContent = `--- 以上來自 ${r.docName} ---`;
                        resultsDropdown.appendChild(finalFooter);
                    }
                });

                if (results.length > 0) {
                    resultsDropdown.value = results[0].page;
                    goToPage(results[0].page, pattern);
                }
            }
            updateResultsNav();
        }).catch(err => {
            console.error("Search process failed unexpectedly:", err);
            resultsDropdown.innerHTML = '<option value="">搜尋錯誤</option>';
            resultsDropdown.disabled = false;
            alert("搜尋過程發生未知錯誤，請檢查主控台。");
            renderPage(currentPage, null);
            updateResultsNav();
        });
    }

    // ** REVISED: This function now controls the bottom bar visibility and its buttons **
    function updateResultsNav() {
        if (!resultsDropdown || !prevResultBtn || !nextResultBtn || !bottomResultsBar) return;

        const options = Array.from(resultsDropdown.options);
        const validOptions = options.filter(opt => !opt.disabled && opt.value);
        const hasResults = validOptions.length > 0;

        // Toggle visibility of the entire bar and adjust body class
        bottomResultsBar.classList.toggle('hidden', !hasResults);
        document.body.classList.toggle('results-bar-visible', hasResults);

        if (!hasResults) {
            prevResultBtn.disabled = true;
            nextResultBtn.disabled = true;
            return;
        }
        
        const currentValidIndex = validOptions.findIndex(opt => opt.value === resultsDropdown.value);

        if (currentValidIndex === -1) {
            prevResultBtn.disabled = true;
            nextResultBtn.disabled = true;
            return;
        }
        
        const isFirst = currentValidIndex <= 0;
        const isLast = currentValidIndex >= validOptions.length - 1;

        prevResultBtn.disabled = isFirst;
        nextResultBtn.disabled = isLast;
    }

    function navigateResults(direction) {
        if (!resultsDropdown) return;
        const options = Array.from(resultsDropdown.options);
        const validOptions = options.filter(opt => !opt.disabled && opt.value);
        if (validOptions.length === 0) return;

        const currentValidIndex = validOptions.findIndex(opt => opt.value === resultsDropdown.value);
        if (currentValidIndex === -1) return;

        let nextValidIndex = currentValidIndex + direction;

        if (nextValidIndex >= 0 && nextValidIndex < validOptions.length) {
            const nextOption = validOptions[nextValidIndex];
            resultsDropdown.value = nextOption.value;
            // Manually dispatch change event to trigger navigation
            resultsDropdown.dispatchEvent(new Event('change'));
        }
    }


    if (searchActionButton) {
        searchActionButton.addEventListener('click', searchKeyword);
    }

    if (prevResultBtn) {
        prevResultBtn.addEventListener('click', () => navigateResults(-1));
    }
    if (nextResultBtn) {
        nextResultBtn.addEventListener('click', () => navigateResults(1));
    }

    function goToPageDropdown(pageNumStr) {
        if (pageNumStr && resultsDropdown) {
            const pageNum = parseInt(pageNumStr);
            if (!isNaN(pageNum)) {
                goToPage(pageNum, getPatternFromSearchInput());
            }
        }
    }

    if (resultsDropdown) {
        resultsDropdown.addEventListener('change', () => {
            goToPageDropdown(resultsDropdown.value);
            updateResultsNav(); // Update button states on selection change
        });
    }

    // ... (rest of the file is unchanged and correct) ...
    
    initLocalMagnifier();
    updatePageControls();
    updateResultsNav(); // Initial call to ensure the bar is hidden at start

});
