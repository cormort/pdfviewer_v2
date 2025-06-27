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
    // ** CHANGE: Keep track of search results globally **
    let currentSearchResults = [];

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
    const resultsDropdown = document.getElementById('resultsDropdown');
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
    
    const prevResultBtn = document.getElementById('prev-result-btn');
    const nextResultBtn = document.getElementById('next-result-btn');

    // ** CHANGE: Get new floating action button elements **
    const fabResultNavGroup = document.getElementById('fab-result-nav-group');
    const fabPrevResultBtn = document.getElementById('fab-prev-result-btn');
    const fabNextResultBtn = document.getElementById('fab-next-result-btn');
    const fabResultCounter = document.getElementById('fab-result-counter');

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

    // ... (getDocAndLocalPage, initLocalMagnifier, updateLocalMagnifier, updatePageControls functions remain the same) ...
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

    if (toolbarToggle && toolbar) {
        toolbarToggle.addEventListener('click', () => {
            toolbar.classList.toggle('active');
        });
    }
    if (pdfContainer && toolbar) {
        pdfContainer.addEventListener('click', (e) => {
            if (e.target === pdfContainer && window.innerWidth <= 768 && toolbar.classList.contains('active')) {
                toolbar.classList.remove('active');
            }
        });
    }

    document.getElementById('fileInput').addEventListener('change', function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }
        if (typeof pdfjsLib === 'undefined') {
            alert("PDF 程式庫未能正確載入，無法開啟檔案。");
            return;
        }
        pdfDocs = [];
        pageMap = [];
        globalTotalPages = 0;
        currentPage = 1;
        // ** CHANGE: Reset search results and hide FABs **
        currentSearchResults = [];
        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        updateAllNavControls();

        if (searchInputElem) searchInputElem.value = '';
        showSearchResultsHighlights = true;
        if (textLayerDivGlobal) textLayerDivGlobal.classList.remove('highlights-hidden');
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
                        resolve({
                            pdf: pdf,
                            name: file.name
                        });
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
                    pageMap.push({
                        docIndex: docIndex,
                        localPage: i,
                        docName: result.name
                    });
                }
            });
            globalTotalPages = pageMap.length;
            renderPage(1);
        }).catch(error => {
            alert("讀取PDF文件時發生錯誤: " + error);
            pdfDocs = [];
            updatePageControls();
        });
    });

    // ... (renderPage, renderTextLayer, drawing functions remain the same) ...
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

    function getEventPosition(canvasElem, evt) {
        if (!canvasElem) return {
            x: 0,
            y: 0
        };
        const rect = canvasElem.getBoundingClientRect();
        let clientX, clientY;
        if (evt.touches && evt.touches.length > 0) {
            clientX = evt.touches[0].clientX;
            clientY = evt.touches[0].clientY;
        } else {
            clientX = evt.clientX;
            clientY = evt.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDrawing(e) {
        if (pdfDocs.length === 0 || pageRendering || !highlighterEnabled || !drawingCanvas || !drawingCtx) return;
        isDrawing = true;
        const pos = getEventPosition(drawingCanvas, e);
        [lastX, lastY] = [pos.x, pos.y];
        drawingCtx.beginPath();
        drawingCtx.moveTo(lastX, lastY);
        if (e.type === 'touchstart') e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing || pdfDocs.length === 0 || !highlighterEnabled || !drawingCanvas || !drawingCtx) return;
        const pos = getEventPosition(drawingCanvas, e);
        drawingCtx.lineTo(pos.x, pos.y);
        drawingCtx.stroke();
        [lastX, lastY] = [pos.x, pos.y];
        if (e.type === 'touchmove') e.preventDefault();
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
    }

    if (drawingCanvas) {
        drawingCanvas.addEventListener('mousedown', startDrawing);
        drawingCanvas.addEventListener('mousemove', draw);
        drawingCanvas.addEventListener('mouseup', stopDrawing);
        drawingCanvas.addEventListener('mouseout', stopDrawing);
        drawingCanvas.addEventListener('touchstart', startDrawing, {
            passive: false
        });
        drawingCanvas.addEventListener('touchmove', draw, {
            passive: false
        });
        drawingCanvas.addEventListener('touchend', stopDrawing);
        drawingCanvas.addEventListener('touchcancel', stopDrawing);
    }
    
    function searchKeyword() {
        if (!searchInputElem || !resultsDropdown) {
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            return;
        }
        const input = searchInputElem.value.trim();
        resultsDropdown.innerHTML = '<option value="">搜尋中，請稍候...</option>';
        currentSearchResults = [];
        updateAllNavControls();

        if (pdfDocs.length === 0 || !input) {
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateAllNavControls();
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
                    updateAllNavControls();
                    return;
                }
                pattern = new RegExp(kw.join('|'), 'gi');
            }
        } catch (e) {
            alert('正則表達式格式錯誤: ' + e.message);
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateAllNavControls();
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
            
            // ** CHANGE: Store results globally **
            currentSearchResults = results;

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
                            footer.style.cssText = 'color: #6c757d; font-style: italic; background-color: #f8f9fa;';
                            footer.textContent = `--- 以上來自 ${lastDocName} ---`;
                            resultsDropdown.appendChild(footer);
                        }
                        const header = document.createElement('option');
                        header.disabled = true;
                        header.style.cssText = 'color: #6c757d; font-style: italic; background-color: #f8f9fa;';
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
                        finalFooter.style.cssText = 'color: #6c757d; font-style: italic; background-color: #f8f9fa;';
                        finalFooter.textContent = `--- 以上來自 ${r.docName} ---`;
                        resultsDropdown.appendChild(finalFooter);
                    }
                });

                if (results.length > 0) {
                    resultsDropdown.value = results[0].page;
                    goToPage(results[0].page, pattern);
                }
            }
            updateAllNavControls();
        }).catch(err => {
            console.error("Search process failed unexpectedly:", err);
            resultsDropdown.innerHTML = '<option value="">搜尋錯誤</option>';
            resultsDropdown.disabled = false;
            alert("搜尋過程發生未知錯誤，請檢查主控台。");
            renderPage(currentPage, null);
            updateAllNavControls();
        });
    }

    // ** CHANGE: Renamed and expanded function to update ALL nav controls (toolbar and FAB) **
    function updateAllNavControls() {
        if (!resultsDropdown || !prevResultBtn || !nextResultBtn || !fabResultNavGroup) return;

        const options = Array.from(resultsDropdown.options);
        const validOptions = options.filter(opt => !opt.disabled && opt.value);

        const hasResults = validOptions.length > 0;
        fabResultNavGroup.classList.toggle('hidden', !hasResults);

        if (!hasResults) {
            prevResultBtn.disabled = true;
            nextResultBtn.disabled = true;
            return;
        }
        
        const totalResults = validOptions.length;
        const currentValidIndex = validOptions.findIndex(opt => opt.value === resultsDropdown.value);

        if (currentValidIndex === -1) {
            prevResultBtn.disabled = true;
            nextResultBtn.disabled = true;
            fabPrevResultBtn.disabled = true;
            fabNextResultBtn.disabled = true;
            if(fabResultCounter) fabResultCounter.textContent = `- / ${totalResults}`;
            return;
        }
        
        const isFirst = currentValidIndex <= 0;
        const isLast = currentValidIndex >= totalResults - 1;

        // Update toolbar buttons
        prevResultBtn.disabled = isFirst;
        nextResultBtn.disabled = isLast;

        // Update FABs
        fabPrevResultBtn.disabled = isFirst;
        fabNextResultBtn.disabled = isLast;
        if(fabResultCounter) fabResultCounter.textContent = `${currentValidIndex + 1} / ${totalResults}`;
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

    // ** CHANGE: Add event listeners for new FABs **
    if (fabPrevResultBtn) {
        fabPrevResultBtn.addEventListener('click', () => navigateResults(-1));
    }
    if (fabNextResultBtn) {
        fabNextResultBtn.addEventListener('click', () => navigateResults(1));
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
            updateAllNavControls();
        });
    }

    // ... (rest of the file remains the same, no changes needed below this line) ...
    function goToPage(globalPageNum, highlightPatternForPage = null) {
        if (pdfDocs.length === 0 || isNaN(globalPageNum)) return;
        const n = Math.max(1, Math.min(globalPageNum, globalTotalPages));
        const currentGlobalPattern = getPatternFromSearchInput();
        if (pageRendering && currentPage === n && JSON.stringify(highlightPatternForPage) === JSON.stringify(currentGlobalPattern)) return;
        if (pageRendering && !(currentPage === n && JSON.stringify(highlightPatternForPage) !== JSON.stringify(currentGlobalPattern))) {
            return;
        }
        currentPage = n;
        const finalHighlightPattern = highlightPatternForPage !== null ? highlightPatternForPage : currentGlobalPattern;
        renderPage(currentPage, finalHighlightPattern);
        if (pageToGoInput) pageToGoInput.value = currentPage;
        if (pageSlider) pageSlider.value = currentPage;
    }

    function getPatternFromSearchInput() {
        const i = searchInputElem ? searchInputElem.value.trim() : null;
        if (!i) return null;
        try {
            if (i.startsWith('/') && i.endsWith('/')) {
                const ls = i.lastIndexOf('/');
                return new RegExp(i.slice(1, ls), i.slice(ls + 1));
            } else {
                const es = i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const k = es.split(/\s+|\|/).filter(ky => ky.length > 0);
                if (k.length > 0) return new RegExp(k.join('|'), 'gi');
            }
        } catch (e) {
            console.warn("Could not create regex from input", e);
            return null;
        }
        return null;
    }

    if (goToFirstPageBtn) goToFirstPageBtn.addEventListener('click', () => {
        if (pdfDocs.length > 0) goToPage(1, getPatternFromSearchInput());
    });
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) goToPage(currentPage - 1, getPatternFromSearchInput());
    });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
        if (pdfDocs.length > 0 && currentPage < globalTotalPages) goToPage(currentPage + 1, getPatternFromSearchInput());
    });
    if (goToPageBtn && pageToGoInput) goToPageBtn.addEventListener('click', () => {
        const pn = parseInt(pageToGoInput.value);
        if (!isNaN(pn)) {
            goToPage(pn, getPatternFromSearchInput());
        } else {
            if (pdfDocs.length > 0) alert(`請輸入 1 到 ${globalTotalPages} 的頁碼`);
            else alert('請先載入PDF檔案');
            if (pdfDocs.length > 0 && pageToGoInput) pageToGoInput.value = currentPage;
        }
    });
    if (pageToGoInput && goToPageBtn) pageToGoInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            goToPageBtn.click();
        }
    });
    if (pageSlider) pageSlider.addEventListener('input', () => {
        const newPage = parseInt(pageSlider.value);
        if (pageToGoInput && pageToGoInput.value !== newPage.toString()) {
            pageToGoInput.value = newPage;
        }
        if (currentPage !== newPage) {
            goToPage(newPage, getPatternFromSearchInput());
        }
    });
    if (qualitySelector) qualitySelector.addEventListener('change', () => {
        if (pdfDocs.length > 0) {
            renderPage(currentPage, getPatternFromSearchInput());
        }
    });
    if (exportPageBtn) exportPageBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0 || !canvas) {
            alert('請先載入PDF檔案');
            return;
        }
        if (pageRendering) {
            alert('頁面仍在渲染中，請稍候');
            return;
        }
        const wasCanvasHidden = canvas.style.visibility === 'hidden';
        if (wasCanvasHidden) canvas.style.visibility = 'visible';
        try {
            const tc = document.createElement('canvas');
            tc.width = canvas.width;
            tc.height = canvas.height;
            const tctx = tc.getContext('2d');
            if (!tctx) {
                alert('無法獲取匯出畫布的上下文');
                return;
            }
            tctx.drawImage(canvas, 0, 0);
            if (drawingCanvas && drawingCtx) tctx.drawImage(drawingCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height, 0, 0, tc.width, tc.height);
            const idu = tc.toDataURL('image/png');
            const l = document.createElement('a');
            l.href = idu;
            const pageInfo = getDocAndLocalPage(currentPage);
            const docNamePart = pageInfo ? pageInfo.docName.replace(/\.pdf$/i, '') : 'document';
            l.download = `page_${currentPage}_(${docNamePart}-p${pageInfo.localPage})_annotated.png`;
            document.body.appendChild(l);
            l.click();
            document.body.removeChild(l);
        } catch (er) {
            console.error("Export err:", er);
            alert("匯出圖片失敗: " + er.message);
        } finally {
            if (wasCanvasHidden) canvas.style.visibility = 'hidden';
        }
    });
    if (toggleUnderlineBtn) toggleUnderlineBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        showSearchResultsHighlights = !showSearchResultsHighlights;
        renderPage(currentPage, getPatternFromSearchInput());
        updatePageControls();
    });
    if (toggleHighlighterBtn) toggleHighlighterBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0 || !drawingCanvas || !canvas) return;
        highlighterEnabled = !highlighterEnabled;
        if (highlighterEnabled) {
            if (textSelectionModeActive) {
                textSelectionModeActive = false;
                if (textLayerDivGlobal) {
                    textLayerDivGlobal.style.pointerEvents = 'none';
                    textLayerDivGlobal.classList.remove('text-selection-active');
                }
                if (canvas) canvas.style.visibility = 'visible';
            }
            if (localMagnifierEnabled) {
                localMagnifierEnabled = false;
                if (magnifierGlass) magnifierGlass.style.display = 'none';
            }
            drawingCanvas.style.pointerEvents = 'auto';
        } else {
            drawingCanvas.style.pointerEvents = 'none';
        }
        updatePageControls();
    });
    if (toggleTextSelectionBtn) {
        toggleTextSelectionBtn.addEventListener('click', () => {
            if (pdfDocs.length === 0 || !textLayerDivGlobal || !canvas || !drawingCanvas) return;
            textSelectionModeActive = !textSelectionModeActive;
            if (textSelectionModeActive) {
                if (highlighterEnabled) {
                    highlighterEnabled = false;
                    if (drawingCanvas) drawingCanvas.style.pointerEvents = 'none';
                }
                if (localMagnifierEnabled) {
                    localMagnifierEnabled = false;
                    if (magnifierGlass) magnifierGlass.style.display = 'none';
                }
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
        });
    }
    if (clearHighlighterBtn && drawingCtx && drawingCanvas) clearHighlighterBtn.addEventListener('click', () => {
        if (pdfDocs.length === 0) return;
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    });
    if (sharePageBtn) sharePageBtn.addEventListener('click', async () => {
        if (pdfDocs.length === 0 || !canvas) {
            alert('請先載入PDF檔案');
            return;
        }
        if (pageRendering) {
            alert('頁面仍在渲染中，請稍候');
            return;
        }
        const wasCanvasHidden = canvas.style.visibility === 'hidden';
        if (wasCanvasHidden) canvas.style.visibility = 'visible';
        if (!navigator.share) {
            alert('您的瀏覽器不支援Web Share API');
            if (wasCanvasHidden) canvas.style.visibility = 'hidden';
            return;
        }
        try {
            const tc = document.createElement('canvas');
            tc.width = canvas.width;
            tc.height = canvas.height;
            const tctx = tc.getContext('2d');
            if (!tctx) {
                alert('無法獲取分享畫布的上下文');
                return;
            }
            tctx.drawImage(canvas, 0, 0);
            if (drawingCanvas && drawingCtx) tctx.drawImage(drawingCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height, 0, 0, tc.width, tc.height);
            tc.toBlob(async b => {
                if (!b) {
                    alert('無法生成Blob進行分享');
                    if (wasCanvasHidden) canvas.style.visibility = 'hidden';
                    return;
                }
                const pageInfo = getDocAndLocalPage(currentPage);
                const docNamePart = pageInfo ? pageInfo.docName.replace(/\.pdf$/i, '') : 'document';
                const fn = `page_${currentPage}_(${docNamePart}-p${pageInfo.localPage})_annotated.png`;
                const f = new File([b], fn, {
                    type: 'image/png'
                });
                const sd = {
                    title: `PDF全域頁面 ${currentPage}`,
                    text: `來自 ${docNamePart} 的第 ${pageInfo.localPage} 頁 (PDF工具)`,
                    files: [f]
                };
                if (navigator.canShare && navigator.canShare({
                        files: [f]
                    })) {
                    await navigator.share(sd);
                } else {
                    console.warn('不支援分享檔案，將嘗試只分享文字');
                    const fsd = {
                        title: sd.title,
                        text: sd.text
                    };
                    if (fsd.text && navigator.canShare && navigator.canShare(fsd)) {
                        await navigator.share(fsd);
                    } else {
                        alert('您的瀏覽器不支援分享檔案或文字。');
                    }
                }
                if (wasCanvasHidden) canvas.style.visibility = 'hidden';
            }, 'image/png');
        } catch (er) {
            console.error("Share err:", er);
            alert("分享失敗: " + er.message);
            if (wasCanvasHidden) canvas.style.visibility = 'hidden';
        }
    });
    if (toggleLocalMagnifierBtn) {
        toggleLocalMagnifierBtn.addEventListener('click', () => {
            if (pdfDocs.length === 0) return;
            localMagnifierEnabled = !localMagnifierEnabled;
            if (localMagnifierEnabled) {
                if (textSelectionModeActive) {
                    textSelectionModeActive = false;
                    if (textLayerDivGlobal) {
                        textLayerDivGlobal.style.pointerEvents = 'none';
                        textLayerDivGlobal.classList.remove('text-selection-active');
                    }
                    if (canvas) canvas.style.visibility = 'visible';
                }
                if (highlighterEnabled) {
                    highlighterEnabled = false;
                    if (drawingCanvas) drawingCanvas.style.pointerEvents = 'none';
                }
                if (drawingCanvas) drawingCanvas.style.pointerEvents = 'none';
                if (textLayerDivGlobal) textLayerDivGlobal.style.pointerEvents = 'none';
                if (canvas) canvas.style.visibility = 'visible';
            } else {
                if (magnifierGlass) magnifierGlass.style.display = 'none';
                if (highlighterEnabled && drawingCanvas) {
                    drawingCanvas.style.pointerEvents = 'auto';
                } else if (textSelectionModeActive && textLayerDivGlobal) {
                    textLayerDivGlobal.style.pointerEvents = 'auto';
                }
            }
            updatePageControls();
        });
    }
    if (localMagnifierZoomSelector) {
        localMagnifierZoomSelector.addEventListener('change', (e) => {
            LOCAL_MAGNIFIER_ZOOM_LEVEL = parseFloat(e.target.value);
        });
    }

    function handlePointerMoveForLocalMagnifier(e) {
        if (!localMagnifierEnabled || pdfDocs.length === 0) return;
        if (e.type === 'touchmove' || e.type === 'touchstart') e.preventDefault();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.clientX !== undefined) {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            return;
        }
        updateLocalMagnifier(clientX, clientY);
    }

    function handlePointerLeaveForLocalMagnifier() {
        if (localMagnifierEnabled && magnifierGlass) {
            magnifierGlass.style.display = 'none';
        }
    }
    if (pdfContainer) {
        pdfContainer.addEventListener('mousemove', handlePointerMoveForLocalMagnifier);
        pdfContainer.addEventListener('mouseleave', handlePointerLeaveForLocalMagnifier);
        pdfContainer.addEventListener('touchstart', handlePointerMoveForLocalMagnifier, {
            passive: false
        });
        pdfContainer.addEventListener('touchmove', handlePointerMoveForLocalMagnifier, {
            passive: false
        });
        pdfContainer.addEventListener('touchend', handlePointerLeaveForLocalMagnifier);
        pdfContainer.addEventListener('touchcancel', handlePointerLeaveForLocalMagnifier);
    }
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (pdfDocs.length > 0) {
                renderPage(currentPage, getPatternFromSearchInput());
            }
        }, 250);
    });
    initLocalMagnifier();
    updatePageControls();
    updateAllNavControls();

});
