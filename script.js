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
    let resizeTimeout; // Declare resizeTimeout here

    // 3. DOM ELEMENT SELECTIONS
    // =========================================================================
    // 所有的 DOM 元素選取都應該在 DOMContentLoaded 內且在使用前進行
    const appContainer = document.getElementById('app-container');
    const toolbar = document.getElementById('toolbar');
    const toolbarToggle = document.getElementById('toolbar-toggle-tab');
    const pdfContainer = document.getElementById('pdf-container');

    const canvas = document.getElementById('pdf-canvas');
    // 添加 null 檢查以防止 getContext 錯誤
    const ctx = canvas ? canvas.getContext('2d') : null;

    const textLayerDivGlobal = document.getElementById('text-layer');

    const drawingCanvas = document.getElementById('drawing-canvas');
    // 添加 null 檢查以防止 getContext 錯誤
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
    // 添加 null 檢查以防止 getContext 錯誤
    const localMagnifierCtx = magnifierCanvas ? magnifierCanvas.getContext('2d') : null;
    const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
    const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');

    // 4. FUNCTION DEFINITIONS (確保所有函數在使用前定義)
    // =========================================================================

    function getDocAndLocalPage(globalPage) {
        if (globalPage < 1 || globalPage > globalTotalPages || pageMap.length < globalPage) {
            return null;
        }
        return pageMap[globalPage - 1];
    }

    function updatePageControls() {
        const hasDocs = pdfDocs.length > 0;

        // 更新所有相關控制項的啟用狀態
        // 使用更安全的查詢，避免在元素不存在時報錯
        const allControls = document.querySelectorAll(
            '#page-navigation button, #page-navigation input, ' +
            '#floating-action-buttons button, #quality-selector, #local-magnifier-zoom-controls select, #local-magnifier-zoom-controls label'
        );
        allControls.forEach(el => {
            // 某些按鈕如分享按鈕可能有額外的啟用條件
            if (el === sharePageBtn) {
                el.disabled = !hasDocs || !navigator.share;
            } else {
                el.disabled = !hasDocs;
            }
        });

        // 浮動按鈕群組的顯示控制
        if (document.getElementById('floating-action-buttons')) {
            document.getElementById('floating-action-buttons').style.display = hasDocs ? 'flex' : 'none';
        }

        // 當沒有文件時，重置頁碼顯示
        if (!hasDocs) {
            if (pageNumDisplay) pageNumDisplay.textContent = '- / -';
            if (pageSlider) {
                pageSlider.max = 1;
                pageSlider.value = 1;
            }
            // 確保其他可能被禁用的元素在無文件時也正確顯示禁用狀態
            if (toggleUnderlineBtn) toggleUnderlineBtn.classList.remove('active');
            if (toggleHighlighterBtn) toggleHighlighterBtn.classList.remove('active');
            if (toggleTextSelectionBtn) toggleTextSelectionBtn.classList.remove('active');
            if (toggleLocalMagnifierBtn) toggleLocalMagnifierBtn.classList.remove('active');
            if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = 'none';
            return;
        }

        // 有文件時，更新頁碼和滑塊
        const docInfo = getDocAndLocalPage(currentPage);
        if (pageNumDisplay) pageNumDisplay.textContent = docInfo ? `第 ${currentPage} / ${globalTotalPages} 頁 (${docInfo.docName})` : `第 ${currentPage} / ${globalTotalPages} 頁`;
        if (pageToGoInput) {
            pageToGoInput.value = currentPage;
            pageToGoInput.max = globalTotalPages;
        }
        if (pageSlider) {
            pageSlider.max = globalTotalPages;
            pageSlider.value = currentPage;
        }

        // 導航按鈕的啟用/禁用邏輯
        if (goToFirstPageBtn) goToFirstPageBtn.disabled = currentPage <= 1;
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= globalTotalPages;

        // 特殊模式按鈕的 'active' 狀態
        if (toggleUnderlineBtn) toggleUnderlineBtn.classList.toggle('active', showSearchResultsHighlights);
        if (toggleHighlighterBtn) toggleHighlighterBtn.classList.toggle('active', highlighterEnabled);
        if (toggleTextSelectionBtn) toggleTextSelectionBtn.classList.toggle('active', textSelectionModeActive);
        if (toggleLocalMagnifierBtn) toggleLocalMagnifierBtn.classList.toggle('active', localMagnifierEnabled);

        // 局部放大鏡控制的顯示
        if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = localMagnifierEnabled ? 'flex' : 'none';
    }

    function renderPage(globalPageNum) {
        // 如果沒有 PDF 文件或正在渲染中，則直接返回
        if (pdfDocs.length === 0 || pageRendering) {
            // 在沒有文件時也確保控制項更新
            if (pdfDocs.length === 0) {
                updatePageControls();
            }
            return;
        }

        pageRendering = true;
        updatePageControls(); // 渲染前更新一次控制項狀態

        const pageInfo = getDocAndLocalPage(globalPageNum);

        // 關鍵修正：在解構前檢查 pageInfo 和 pageInfo.doc 是否存在
        if (!pageInfo || !pageInfo.doc) {
            console.error("無效的頁面資訊或 PDF 文件物件 for page:", globalPageNum, pageInfo);
            pageRendering = false;
            updatePageControls(); // 發生錯誤後再次更新控制項
            return;
        }

        const { doc, localPage } = pageInfo; // 現在安全地解構

        doc.getPage(localPage).then(page => {
            const patternToUse = getPatternFromSearchInput();
            const containerWidth = pdfContainer ? pdfContainer.clientWidth : 0; // 確保 pdfContainer 存在
            const scale = (containerWidth / page.getViewport({ scale: 1.0 }).width) * parseFloat(qualitySelector ? qualitySelector.value : 1.5); // 確保 qualitySelector 存在

            const viewport = page.getViewport({ scale });

            // 確保 canvas 和 ctx 存在
            if (!canvas || !ctx) {
                console.error("Canvas 或 2D 渲染上下文不可用。");
                pageRendering = false;
                updatePageControls();
                return;
            }

            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.width = "100%";
            canvas.style.height = "auto";

            // 渲染 PDF 頁面到 canvas
            page.render({ canvasContext: ctx, viewport }).promise
                .then(() => {
                    return page.getTextContent();
                })
                .then(textContent => {
                    // 確保 textLayerDivGlobal 存在
                    if (!textLayerDivGlobal) {
                        console.error("文字層元素不可用。");
                        // 如果 textLayerDivGlobal 不存在，我們無法渲染文字層，但可以繼續繪製高亮
                        return Promise.reject("文字層元素不可用。");
                    }
                    const textLayerViewport = page.getViewport({ scale: canvas.offsetWidth / page.getViewport({ scale: 1.0 }).width });
                    textLayerDivGlobal.innerHTML = ''; // 清除之前的文字層內容
                    textLayerDivGlobal.style.width = `${canvas.offsetWidth}px`;
                    textLayerDivGlobal.style.height = `${canvas.offsetHeight}px`;
                    textLayerDivGlobal.style.left = `${canvas.offsetLeft}px`;
                    textLayerDivGlobal.style.top = `${canvas.offsetTop}px`;

                    return pdfjsLib.renderTextLayer({
                        textContentSource: textContent,
                        container: textLayerDivGlobal,
                        viewport: textLayerViewport,
                    }).promise;
                })
                .then(() => {
                    // 應用搜索結果高亮
                    if (showSearchResultsHighlights && patternToUse && textLayerDivGlobal) {
                        Array.from(textLayerDivGlobal.querySelectorAll('span')).forEach(span => {
                            if (patternToUse.test(span.textContent)) span.classList.add('wavy-underline');
                        });
                    }

                    // 更新繪圖 canvas 的尺寸和位置
                    if (drawingCanvas && drawingCtx && canvas) {
                        drawingCanvas.width = canvas.offsetWidth;
                        drawingCanvas.height = canvas.offsetHeight;
                        drawingCanvas.style.left = `${canvas.offsetLeft}px`;
                        drawingCanvas.style.top = `${canvas.offsetTop}px`;
                        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); // 清除之前的繪圖
                    }
                })
                .catch(err => {
                    console.error("頁面渲染或文字層處理時發生錯誤:", err);
                    alert(`頁面渲染失敗: ${err.message || err}`);
                })
                .finally(() => {
                    pageRendering = false;
                    updatePageControls(); // 渲染完成後再次更新控制項狀態
                });
        }).catch(err => {
            console.error("獲取 PDF 頁面時發生錯誤:", err);
            alert(`載入頁面失敗: ${err.message || err}`);
            pageRendering = false;
            updatePageControls();
        });
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        resetApplicationState(); // 重置應用程式狀態

        const loadingPromises = Array.from(files).map(file => {
            return new Promise((resolve, reject) => {
                if (file.type !== 'application/pdf') {
                    console.warn(`跳過非 PDF 文件: ${file.name}`);
                    resolve(null); // 跳過非 PDF 文件
                    return;
                }
                const reader = new FileReader();
                reader.onload = function() {
                    const typedarray = new Uint8Array(this.result);
                    // 確保 pdfjsLib 已定義
                    if (typeof pdfjsLib === 'undefined') {
                        reject("pdfjsLib 未定義，無法載入 PDF。");
                        return;
                    }
                    pdfjsLib.getDocument({ data: typedarray, isEvalSupported: false, enableXfa: false })
                        .promise.then(pdf => resolve({ pdf, name: file.name }))
                        .catch(reason => reject(`無法載入檔案 ${file.name}: ${reason.message || reason}`));
                };
                reader.onerror = () => reject(`讀取檔案 ${file.name} 失敗。`);
                reader.readAsArrayBuffer(file);
            });
        });

        Promise.allSettled(loadingPromises).then(results => { // 使用 Promise.allSettled 處理部分失敗
            const loadedPdfs = [];
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value !== null) {
                    loadedPdfs.push(result.value);
                } else if (result.status === 'rejected') {
                    console.error(`載入檔案失敗: ${result.reason}`);
                    alert(`部分文件載入失敗: ${result.reason}`);
                }
            });

            if (loadedPdfs.length === 0) {
                alert("未選擇任何有效的 PDF 檔案或所有檔案載入失敗。");
                updatePageControls(); // 更新控制項以反映無文件狀態
                return;
            }

            loadedPdfs.forEach((result, docIndex) => {
                pdfDocs.push(result.pdf);
                for (let i = 1; i <= result.pdf.numPages; i++) {
                    pageMap.push({ docIndex, localPage: i, docName: result.name });
                }
            });
            globalTotalPages = pageMap.length;
            renderPage(1); // 載入完成後渲染第一頁
        });
    }

    function searchKeyword() {
        const input = searchInputElem ? searchInputElem.value.trim() : '';
        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋中...</option>';
        updateResultsNav(); // 更新底部結果導航條狀態

        if (pdfDocs.length === 0 || !input) {
            if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
            updateResultsNav();
            return;
        }

        const pattern = getPatternFromSearchInput();
        if (!pattern) {
            alert("正則表達式格式錯誤或輸入為空。");
            if (resultsDropdown) resultsDropdown.innerHTML = '';
            updateResultsNav();
            return;
        }

        if (resultsDropdown) resultsDropdown.disabled = true;

        const promises = pageMap.map((pageInfo, index) => {
            const doc = pdfDocs[pageInfo.docIndex];
            if (!doc) return Promise.resolve(null); // 如果 document 不存在，則跳過

            return doc.getPage(pageInfo.localPage).then(page =>
                page.getTextContent().then(textContent =>
                    pattern.test(textContent.items.map(it => it.str).join(''))
                        ? { page: index + 1, docName: pageInfo.docName }
                        : null
                )
            ).catch(err => {
                console.error(`獲取頁面 ${pageInfo.docName} 第 ${pageInfo.localPage} 頁文字內容時發生錯誤: ${err}`);
                return null; // 即使出錯，也返回 null 讓 Promise.allSettled 繼續
            });
        });

        Promise.all(promises).then(results => {
            const foundPages = results.filter(r => r !== null);
            if (resultsDropdown) resultsDropdown.innerHTML = ''; // 清空選項

            if (foundPages.length === 0) {
                if (resultsDropdown) resultsDropdown.innerHTML = '<option>找不到關鍵字</option>';
            } else {
                foundPages.forEach(result => {
                    const option = document.createElement('option');
                    option.value = result.page;
                    option.textContent = `第 ${result.page} 頁 (${result.docName})`;
                    if (resultsDropdown) resultsDropdown.appendChild(option);
                });
                // 跳轉到第一個搜尋結果頁面並應用高亮
                goToPage(foundPages[0].page);
            }
        }).finally(() => {
            if (resultsDropdown) resultsDropdown.disabled = false;
            updateResultsNav(); // 搜索完成後更新導航條狀態
        });
    }

    function updateResultsNav() {
        const hasResults = resultsDropdown && resultsDropdown.options.length > 0 &&
                           resultsDropdown.options[0].value !== '' &&
                           resultsDropdown.options[0].textContent !== '找不到關鍵字';

        if (document.body) document.body.classList.toggle('results-bar-visible', hasResults);
        if (bottomResultsBar) bottomResultsBar.style.display = hasResults ? 'flex' : 'none'; // 顯式控制顯示

        if (!hasResults) {
            if (prevResultBtn) prevResultBtn.disabled = true;
            if (nextResultBtn) nextResultBtn.disabled = true;
            return;
        }

        const currentIndex = resultsDropdown ? resultsDropdown.selectedIndex : -1;
        if (prevResultBtn) prevResultBtn.disabled = currentIndex <= 0;
        if (nextResultBtn) nextResultBtn.disabled = currentIndex >= (resultsDropdown ? resultsDropdown.options.length - 1 : 0);
    }

    function navigateResults(direction) {
        if (!resultsDropdown) return;

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
        renderPage(currentPage); // 渲染指定頁面
    }

    function goToPageDropdown(pageNumStr) {
        if (pageNumStr) goToPage(parseInt(pageNumStr, 10));
        updateResultsNav();
    }

    function handleGoToPage() {
        if (pageToGoInput) {
            goToPage(parseInt(pageToGoInput.value, 10));
        }
    }

    function getPatternFromSearchInput() {
        const input = searchInputElem ? searchInputElem.value.trim() : '';
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
            // 如果不是正則表達式，則轉義特殊字符
            return new RegExp(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        } catch (e) {
            console.error("正則表達式解析錯誤:", e);
            return null; // 返回 null 表示正則表達式格式錯誤
        }
    }

    function resetApplicationState() {
        pdfDocs = [];
        pageMap = [];
        globalTotalPages = 0;
        currentPage = 1;
        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">搜尋結果</option>';
        updateResultsNav(); // 重置搜尋導航狀態
        resetModes(); // 重置所有操作模式
        updatePageControls(); // 更新頁面控制項為無文件狀態
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空 canvas
            canvas.width = 1; // 設置一個小尺寸
            canvas.height = 1;
        }
        if (textLayerDivGlobal) textLayerDivGlobal.innerHTML = ''; // 清空文字層
    }

    function resetModes() {
        highlighterEnabled = false;
        textSelectionModeActive = false;
        localMagnifierEnabled = false;

        if (textLayerDivGlobal) {
            textLayerDivGlobal.classList.remove('text-selection-active');
            textLayerDivGlobal.style.pointerEvents = 'none';
        }
        if (drawingCanvas) drawingCanvas.style.pointerEvents = 'none';

        // 確保 canvas 存在才操作其樣式
        if (canvas) canvas.style.visibility = 'visible';

        if (drawingCtx && drawingCanvas) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        if (magnifierGlass) magnifierGlass.style.display = 'none';

        updatePageControls(); // 更新控制項狀態以反映模式變化
    }

    function setMode(mode) {
        textSelectionModeActive = (mode === 'text');
        highlighterEnabled = (mode === 'highlighter');
        localMagnifierEnabled = (mode === 'magnifier');

        if (textLayerDivGlobal) {
            textLayerDivGlobal.classList.toggle('text-selection-active', textSelectionModeActive);
            textLayerDivGlobal.style.pointerEvents = textSelectionModeActive ? 'auto' : 'none';
        }

        if (drawingCanvas) drawingCanvas.style.pointerEvents = highlighterEnabled ? 'auto' : 'none';

        // 確保 canvas 存在才操作其樣式
        if (canvas) canvas.style.visibility = textSelectionModeActive ? 'hidden' : 'visible';

        if (!localMagnifierEnabled && magnifierGlass) magnifierGlass.style.display = 'none';

        updatePageControls(); // 更新控制項狀態
    }

    // --- 其他輔助函數 ---
    function toggleTextSelection() {
        if (pdfDocs.length > 0) setMode(textSelectionModeActive ? null : 'text');
    }

    function toggleHighlighter() {
        if (pdfDocs.length > 0) setMode(highlighterEnabled ? null : 'highlighter');
    }

    function toggleLocalMagnifier() {
        if (pdfDocs.length > 0) setMode(localMagnifierEnabled ? null : 'magnifier');
    }

    function startDrawing(e) {
        if (!highlighterEnabled || !drawingCanvas) return;
        isDrawing = true;
        // 處理觸控事件
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = drawingCanvas.getBoundingClientRect();
        [lastX, lastY] = [clientX - rect.left, clientY - rect.top];
        e.preventDefault(); // 防止觸控滾動
    }

    function draw(e) {
        if (!isDrawing || !drawingCtx || !drawingCanvas) return;
        // 處理觸控事件
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = drawingCanvas.getBoundingClientRect();
        const currentX = clientX - rect.left;
        const currentY = clientY - rect.top;

        drawingCtx.beginPath();
        drawingCtx.moveTo(lastX, lastY);
        drawingCtx.lineTo(currentX, currentY);
        drawingCtx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // 半透明黃色
        drawingCtx.lineWidth = 20;
        drawingCtx.lineCap = 'round';
        drawingCtx.stroke();
        [lastX, lastY] = [currentX, currentY];
        e.preventDefault(); // 防止觸控滾動
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function handlePointerMoveForLocalMagnifier(e) {
        if (!localMagnifierEnabled) return;
        const touch = e.touches ? e.touches[0] : e;
        updateLocalMagnifier(touch.clientX, touch.clientY);
        e.preventDefault(); // 防止觸控滾動
    }

    function handlePointerLeaveForLocalMagnifier() {
        if (localMagnifierEnabled && magnifierGlass) {
            magnifierGlass.style.display = 'none';
        }
    }

    function updateLocalMagnifier(clientX, clientY) {
        if (!magnifierGlass || !magnifierCanvas || !localMagnifierCtx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // 如果鼠標離開了 canvas 範圍
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
        if (!pdfDocs.length || !canvas || !drawingCanvas) {
            console.warn("無法生成圖像：未載入 PDF 或 canvas 元素不可用。");
            return null;
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // 繪製 PDF 內容
        tempCtx.drawImage(canvas, 0, 0);

        // 繪製螢光筆標記
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
            alert('無法匯出頁面，請確認已載入 PDF 檔案。');
        }
    }

    async function sharePage() {
        if (!navigator.share) {
            alert('您的瀏覽器不支持分享功能。請使用支援 Web Share API 的瀏覽器。');
            return;
        }

        const blob = await getAnnotatedPageAsBlob();
        if (blob) {
            try {
                const file = new File([blob], `page_${currentPage}.png`, { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: `PDF Viewer - Page ${currentPage}`,
                    text: `從多 PDF 智能檢索器分享頁面 ${currentPage}。`,
                });
            } catch (error) {
                console.error('分享失敗:', error);
                if (error.name !== 'AbortError') { // AbortError 表示用戶取消分享
                    alert('分享失敗。');
                }
            }
        } else {
            alert('無法分享頁面，請確認已載入 PDF 檔案。');
        }
    }


    // 5. EVENT LISTENERS & INITIALIZATION (確保在所有函數定義之後才添加監聽器和執行初始化)
    // =========================================================================

    if (toolbarToggle) toolbarToggle.addEventListener('click', () => {
        if (appContainer) appContainer.classList.toggle('menu-active');
    });

    if (pdfContainer && appContainer) {
        pdfContainer.addEventListener('click', (e) => {
            // 只在點擊 pdfContainer 本身（而非其子元素）且在移動設備上時關閉菜單
            if (e.target === pdfContainer && window.innerWidth <= 768 && appContainer.classList.contains('menu-active')) {
                appContainer.classList.remove('menu-active');
            }
        });
    }

    // 確保 DOM 元素存在後才添加事件監聽器
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (searchActionButton) searchActionButton.addEventListener('click', searchKeyword);
    if (searchInputElem) searchInputElem.addEventListener('keypress', e => { if (e.key === 'Enter') searchActionButton.click(); });

    if (prevResultBtn) prevResultBtn.addEventListener('click', () => navigateResults(-1));
    if (nextResultBtn) nextResultBtn.addEventListener('click', () => navigateResults(1));
    if (resultsDropdown) resultsDropdown.addEventListener('change', () => goToPageDropdown(resultsDropdown.value));

    if (goToFirstPageBtn) goToFirstPageBtn.addEventListener('click', () => goToPage(1));
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => { if (currentPage > 1) goToPage(currentPage - 1); });
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => { if (currentPage < globalTotalPages) goToPage(currentPage + 1); });
    if (goToPageBtn) goToPageBtn.addEventListener('click', handleGoToPage);
    if (pageToGoInput) pageToGoInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleGoToPage(); });
    if (pageSlider) pageSlider.addEventListener('input', () => goToPage(parseInt(pageSlider.value)));

    if (qualitySelector) qualitySelector.addEventListener('change', () => { if (pdfDocs.length > 0) renderPage(currentPage); });

    if (toggleUnderlineBtn) toggleUnderlineBtn.addEventListener('click', () => { showSearchResultsHighlights = !showSearchResultsHighlights; renderPage(currentPage); });
    if (toggleTextSelectionBtn) toggleTextSelectionBtn.addEventListener('click', toggleTextSelection); // 使用輔助函數
    if (toggleHighlighterBtn) toggleHighlighterBtn.addEventListener('click', toggleHighlighter); // 使用輔助函數
    if (clearHighlighterBtn) clearHighlighterBtn.addEventListener('click', () => { if (drawingCtx) drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); });
    if (toggleLocalMagnifierBtn) toggleLocalMagnifierBtn.addEventListener('click', toggleLocalMagnifier); // 使用輔助函數

    if (localMagnifierZoomSelector) localMagnifierZoomSelector.addEventListener('change', (e) => {
        LOCAL_MAGNIFIER_ZOOM_LEVEL = parseFloat(e.target.value);
        // 如果放大鏡已啟用，更新其顯示
        if (localMagnifierEnabled) {
            // 觸發一次 mousemove 事件來更新放大鏡位置和內容
            const event = new MouseEvent('mousemove', {
                clientX: lastX, // 使用上次的 X 座標
                clientY: lastY, // 使用上次的 Y 座標
                bubbles: true,
                cancelable: true,
                view: window
            });
            pdfContainer.dispatchEvent(event);
        }
    });

    // 繪圖事件監聽器 (確保 drawingCanvas 存在)
    if (drawingCanvas) {
        drawingCanvas.addEventListener('mousedown', startDrawing);
        drawingCanvas.addEventListener('mousemove', draw);
        drawingCanvas.addEventListener('mouseup', stopDrawing);
        drawingCanvas.addEventListener('mouseout', stopDrawing);
        drawingCanvas.addEventListener('touchstart', startDrawing, { passive: false });
        drawingCanvas.addEventListener('touchmove', draw, { passive: false });
        drawingCanvas.addEventListener('touchend', stopDrawing);
        drawingCanvas.addEventListener('touchcancel', stopDrawing);
    }

    // 放大鏡事件監聽器 (確保 pdfContainer 存在)
    if (pdfContainer) {
        pdfContainer.addEventListener('mousemove', handlePointerMoveForLocalMagnifier);
        pdfContainer.addEventListener('mouseleave', handlePointerLeaveForLocalMagnifier);
        pdfContainer.addEventListener('touchstart', handlePointerMoveForLocalMagnifier, { passive: false });
        pdfContainer.addEventListener('touchmove', handlePointerMoveForLocalMagnifier, { passive: false });
        pdfContainer.addEventListener('touchend', handlePointerLeaveForLocalMagnifier);
        pdfContainer.addEventListener('touchcancel', handlePointerLeaveForLocalMagnifier);
    }

    if (exportPageBtn) exportPageBtn.addEventListener('click', exportPageAsImage);
    if (sharePageBtn) sharePageBtn.addEventListener('click', sharePage);

    // 視窗大小改變事件監聽器
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (pdfDocs.length > 0) renderPage(currentPage);
        }, 250); // 防抖動
    });

    // 初始呼叫以正確設定頁面載入時的 UI 狀態
    updatePageControls();
    updateResultsNav();
});
