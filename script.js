document.addEventListener('DOMContentLoaded', () => {
    // Check if pdfjsLib is defined. The inline script in HTML now handles GlobalWorkerOptions
    // to ensure it's set before pdf.mjs fully initializes.
    if (typeof pdfjsLib === 'undefined') {
        console.error("pdfjsLib is not defined. Ensure pdf.mjs is loaded before script.js.");
        alert("PDF 程式庫載入失敗，請刷新頁面或檢查網路連線。");
        return;
    }

    let pdfDocs = [];
    let pageMap = [];
    let globalTotalPages = 0;
    let currentPage = 1;
    let pageRendering = false;
    let searchResults = []; // To store search results for navigation

    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const toolbar = document.getElementById('toolbar');
    const toolbarToggleTab = document.getElementById('toolbar-toggle-tab'); // New tab button
    const appContainer = document.getElementById('app-container'); // Get the app container
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
    // Removed: const prevResultBtn = document.getElementById('prev-result-btn'); // 這些按鈕已從 HTML 移除
    // Removed: const nextResultBtn = document.getElementById('next-result-btn'); // 這些按鈕已從 HTML 移除
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

    let localMagnifierEnabled = false;
    let LOCAL_MAGNIFIER_SIZE = 120;
    let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

    let showSearchResultsHighlights = true;
    let highlighterEnabled = false;
    let textSelectionModeActive = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function getDocAndLocalPage(globalPage) {
        if (globalPage < 1 || globalPage > globalTotalPages || pageMap.length === 0) {
            console.error(`Invalid globalPage: ${globalPage}, globalTotalPages: ${globalTotalPages}, pageMap.length: ${pageMap.length}`);
            return null;
        }
        const mapping = pageMap[globalPage - 1];
        if (!mapping) {
             console.error(`Mapping is null/undefined for global page ${globalPage}. pageMap entry:`, pageMap[globalPage - 1]);
             return null;
        }
        if (pdfDocs[mapping.docIndex] === undefined) {
             console.error(`pdfDocs[${mapping.docIndex}] is undefined for global page ${globalPage}. Mapping:`, mapping, "pdfDocs:", pdfDocs);
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

        if (pointXInContainer < canvasRectInContainer.left || pointXInContainer > canvasRectInContainer.right ||
            pointYInContainer < canvasRectInContainer.top || pointYInContainer > canvasRectInContainer.bottom) {
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

        localMagnifierCtx.drawImage(
            canvas,
            srcRectX, srcRectY, srcRectPixelWidth, srcRectPixelHeight,
            0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE
        );

        if (drawingCanvas && drawingCanvas.width > 0 && drawingCanvas.height > 0) {
            const srcDrawRectX = pointXOnCanvasCSS - (srcRectCSSWidth / 2);
            const srcDrawRectY = pointYOnCanvasCSS - (srcRectCSSHeight / 2);
            localMagnifierCtx.drawImage(
                drawingCanvas,
                srcDrawRectX, srcDrawRectY, srcRectCSSWidth, srcRectCSSHeight,
                0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE
            );
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

            // Also disable and hide bottom results bar
            updateResultsNav();
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

        updateResultsNav(); // Call this to update the bottom results bar visibility and button states
    }

    if (toolbarToggleTab && appContainer) {
        toolbarToggleTab.addEventListener('click', () => {
            appContainer.classList.toggle('menu-active');
        });
    }
    if (pdfContainer && appContainer) {
        // Close toolbar if clicking outside on mobile
        // Now that toolbarToggleTab is inside toolbar, we only need to check if click is outside toolbar.
        pdfContainer.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && appContainer.classList.contains('menu-active')) {
                // Check if the click was outside the toolbar (which now includes the tab)
                if (!toolbar.contains(e.target)) {
                    appContainer.classList.remove('menu-active');
                }
            }
        });
    }

    document.getElementById('fileInput').addEventListener('change', function(e) {
        const files = e.target.files;
        if (!files || files.length === 0) {
            console.log("No files selected."); // Added log
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
        searchResults = []; // Clear search results

        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
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
                    resolve(null); // Resolve with null for non-PDFs
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
                        console.log(`Successfully loaded PDF: ${file.name}, Pages: ${pdf.numPages}`); // Added log
                        resolve({
                            pdf: pdf,
                            name: file.name
                        });
                    }).catch(reason => {
                        console.error(`Error loading ${file.name}:`, reason); // Kept error log
                        // Important: Resolve with null here too, so Promise.all can complete
                        // but the file won't be added to pdfDocs.
                        resolve(null);
                    });
                };
                reader.readAsArrayBuffer(file);
            });
        });

        Promise.all(loadingPromises).then(results => {
            const loadedPdfs = results.filter(r => r !== null);
            console.log("PDF loading results (filtered):", loadedPdfs); // Added log
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
            console.log("Global Total Pages:", globalTotalPages); // Added log
            console.log("Page Map:", pageMap); // Added log
            renderPage(1);
        }).catch(error => {
            alert("讀取PDF文件時發生錯誤: " + error);
            console.error("Error during Promise.all or subsequent processing:", error); // Added log
            pdfDocs = [];
            updatePageControls();
        });
    });

    function renderPage(globalPageNum, highlightPattern = null) {
        if (pdfDocs.length === 0 || !pdfContainer || !canvas || !ctx || !textLayerDivGlobal || !drawingCanvas || !drawingCtx) {
            return;
        }
        pageRendering = true;
        updatePageControls();
        if (drawingCtx && drawingCanvas) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

        const pageInfo = getDocAndLocalPage(globalPageNum);
        if (!pageInfo) {
            // Error logged within getDocAndLocalPage
            pageRendering = false;
            updatePageControls();
            return;
        }

        const {
            doc,
            localPage
        } = pageInfo;

        doc.getPage(localPage).then(function(page) {
          const viewportOriginal = page.getViewport({ scale: 1 });
          let availableWidth = pdfContainer.clientWidth;

          if (availableWidth <= 0) {
            availableWidth = window.innerWidth > 20 ? window.innerWidth - 20 : 300;
          }

          let baseScale = availableWidth / viewportOriginal.width;

          if (canvas.dataset.originalBorder && pdfDocs.length > 0) canvas.style.border = canvas.dataset.originalBorder;
          else if (pdfDocs.length > 0) canvas.style.border = '1px solid #000';

          showSearchResultsHighlights ? textLayerDivGlobal.classList.remove('highlights-hidden') : textLayerDivGlobal.classList.add('highlights-hidden');

          const viewportCss = page.getViewport({ scale: baseScale });
          const devicePixelRatio = window.devicePixelRatio || 1;
          const qualityMultiplierVal = qualitySelector ? parseFloat(qualitySelector.value) : 1.5;
          const qualityMultiplier = qualityMultiplierVal || 1.5;

          const renderScale = baseScale * devicePixelRatio * qualityMultiplier;
          const viewportRender = page.getViewport({ scale: renderScale });

          canvas.width = viewportRender.width; canvas.height = viewportRender.height;
          canvas.style.width = viewportCss.width + "px"; canvas.style.height = viewportCss.height + "px";

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
              drawingCtx.lineJoin = 'round'; drawingCtx.lineCap = 'round';

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
            // 如果搜尋輸入框或結果下拉選單不存在，則不執行搜尋
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            updateResultsNav(); // 更新底部導航狀態
            return;
        }

        const input = searchInputElem.value.trim();
        resultsDropdown.innerHTML = '<option value="">搜尋中，請稍候...</option>';
        searchResults = []; // 清空之前的搜尋結果

        if (pdfDocs.length === 0 || !input) {
            // 如果沒有載入 PDF 文件或搜尋輸入為空，則重置顯示
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav(); // 更新底部導航狀態
            return;
        }

        let pattern;
        try {
            // 判斷是否為正則表達式（以 / 開頭和結尾）
            if (input.startsWith('/') && input.endsWith('/')) {
                const lastSlashIndex = input.lastIndexOf('/');
                pattern = new RegExp(input.slice(1, lastSlashIndex), input.slice(lastSlashIndex + 1));
            } else {
                // 將特殊字符轉義，並用空格或 | 分割關鍵字，然後組合成正則表達式
                const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const keywords = escapedInput.split(/\s+|\|/).filter(k => k.length > 0);
                if (keywords.length === 0) {
                    if (pdfDocs.length > 0) renderPage(currentPage, null);
                    resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
                    updateResultsNav(); // 更新底部導航狀態
                    return;
                }
                pattern = new RegExp(keywords.join('|'), 'gi'); // 全局不區分大小寫搜尋
            }
        } catch (e) {
            alert('正則表達式格式錯誤: ' + e.message);
            console.error('正則表達式錯誤:', e);
            resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav(); // 更新底部導航狀態
            return;
        }

        let promises = [];
        let globalPageOffset = 0;

        // 遍歷所有載入的 PDF 文件和其頁面進行搜尋
        pdfDocs.forEach((doc, docIndex) => {
            const docName = pageMap.find(p => p.docIndex === docIndex)?.docName || `文件 ${docIndex + 1}`;
            for (let i = 1; i <= doc.numPages; i++) {
                const currentGlobalPageForSearch = globalPageOffset + i;
                promises.push(
                    doc.getPage(i).then(p => {
                        return p.getTextContent().then(textContent => {
                            const pageText = textContent.items.map(item => item.str).join('');
                            pattern.lastIndex = 0; // 重置正則表達式的 lastIndex
                            if (pattern.test(pageText)) {
                                pattern.lastIndex = 0; // 再次重置以便正確執行 exec
                                const matchResult = pattern.exec(pageText);
                                let foundMatchSummary = '找到匹配';

                                if (matchResult) {
                                    const matchedText = matchResult[0];
                                    const matchIndex = matchResult.index;
                                    const contextLength = 20; // 截取上下文的長度
                                    const startIndex = Math.max(0, matchIndex - contextLength);
                                    const endIndex = Math.min(pageText.length, matchIndex + matchedText.length + contextLength);

                                    // 構造帶有高亮效果的摘要，並對 HTML 特殊字符進行轉義
                                    const preMatch = pageText.substring(startIndex, matchIndex).replace(/</g, "&lt;");
                                    const highlightedMatch = matchedText.replace(/</g, "&lt;");
                                    const postMatch = pageText.substring(matchIndex + matchedText.length, endIndex).replace(/</g, "&lt;");

                                    foundMatchSummary =
                                        (startIndex > 0 ? "..." : "") +
                                        preMatch +
                                        `<span class="wavy-underline">${highlightedMatch}</span>` +
                                        postMatch +
                                        (endIndex < pageText.length ? "..." : "");
                                }
                                return {
                                    page: currentGlobalPageForSearch,
                                    summary: foundMatchSummary,
                                    docName: docName
                                };
                            }
                            return null; // 該頁面沒有找到匹配
                        });
                    }).catch(err => {
                        console.warn(`Error processing page for search: Doc ${docName}, Page ${i}`, err);
                        return null; // 頁面處理失敗
                    })
                );
            }
            globalPageOffset += doc.numPages;
        });

        // 等待所有頁面搜尋完成
        Promise.all(promises).then((allPageResults) => {
            searchResults = allPageResults.filter(r => r !== null); // 過濾掉沒有結果的頁面
            resultsDropdown.innerHTML = ''; // 清空下拉選單內容

            if (searchResults.length === 0) {
                const option = document.createElement('option');
                option.textContent = '找不到關鍵字';
                resultsDropdown.appendChild(option);
                renderPage(currentPage, null); // 顯示當前頁面，但不高亮
            } else {
                searchResults.sort((a, b) => a.page - b.page); // 根據頁碼排序結果

                let lastDocumentName = null;

                // 將搜尋結果分組顯示，並加入文件分隔符
                searchResults.forEach((result, index) => {
                    if (result.docName !== lastDocumentName) {
                        if (lastDocumentName !== null) {
                            const footerOption = document.createElement('option');
                            footerOption.disabled = true;
                            footerOption.style.color = '#6c757d';
                            footerOption.style.fontStyle = 'italic';
                            footerOption.style.backgroundColor = '#f8f9fa';
                            footerOption.textContent = `--- 以上來自 ${lastDocumentName} ---`;
                            resultsDropdown.appendChild(footerOption);
                        }
                        const headerOption = document.createElement('option');
                        headerOption.disabled = true;
                        headerOption.style.color = '#6c757d';
                        headerOption.style.fontStyle = 'italic';
                        headerOption.style.backgroundColor = '#f8f9fa';
                        headerOption.textContent = `--- 以下來自 ${result.docName} ---`;
                        resultsDropdown.appendChild(headerOption);
                        lastDocumentName = result.docName;
                    }

                    const resultOption = document.createElement('option');
                    resultOption.value = result.page;
                    resultOption.innerHTML = `第 ${result.page} 頁: ${result.summary}`;
                    resultOption.title = `檔案: ${result.docName}`; // 鼠標懸停提示
                    resultsDropdown.appendChild(resultOption);

                    if (index === searchResults.length - 1) {
                        const finalFooterOption = document.createElement('option');
                        finalFooterOption.disabled = true;
                        finalFooterOption.style.color = '#6c757d';
                        finalFooterOption.style.fontStyle = 'italic';
                        finalFooterOption.style.backgroundColor = '#f8f9fa';
                        finalFooterOption.textContent = `--- 以上來自 ${result.docName} ---`;
                        resultsDropdown.appendChild(finalFooterOption);
                    }
                });

                if (searchResults.length > 0) {
                    resultsDropdown.value = searchResults[0].page; // 預設選擇第一個結果
                    goToPage(searchResults[0].page, pattern); // 跳轉到第一個結果頁面
                }
            }
            updateResultsNav(); // 更新底部結果導航的顯示狀態

            // 在手機模式下，如果左側工具列是開啟的，則自動收起它
            if (window.innerWidth <= 768 && appContainer.classList.contains('menu-active')) {
                appContainer.classList.remove('menu-active');
            }

        }).catch(err => {
            console.error("搜尋過程發生意外失敗:", err); // 更具體的錯誤日誌
            resultsDropdown.innerHTML = '<option value="">搜尋錯誤</option>';
            alert("搜尋過程發生未知錯誤，請檢查主控台。");
            renderPage(currentPage, null); // 顯示當前頁面，但不高亮
            updateResultsNav(); // 更新底部導航狀態
        });
    }

    function updateResultsNav() {
        const hasResults = searchResults.length > 0;
        const body = document.body;

        if (hasResults) {
            body.classList.add('results-bar-visible');
        } else {
            body.classList.remove('results-bar-visible');
            // 已移除 prevResultBtn 和 nextResultBtn，所以不再需要禁用它們的邏輯
        }
    }

    // Removed the navigateResults function entirely as there are no longer buttons to trigger it.

    if (searchActionButton) {
        searchActionButton.addEventListener('click', searchKeyword);
    }

    function goToPageDropdown(pageNumStr) {
        if (pageNumStr && resultsDropdown) {
            const pageNum = parseInt(pageNumStr);
            goToPage(pageNum, getPatternFromSearchInput());
            // updateResultsNav is called within goToPage
        }
    }
    if (resultsDropdown) {
        resultsDropdown.addEventListener('change', () => goToPageDropdown(resultsDropdown.value));
    }

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
        updateResultsNav(); // Ensure navigation is updated after page change
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

            const idu = tc.toDataURL('image/png');
            const l = document.createElement('a');
            l.href = idu;
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
});
