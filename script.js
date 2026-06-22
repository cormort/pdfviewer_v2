import { initDB, saveFiles, getFiles, saveNote, getNotes, updateNote, deleteNote, exportAllNotes, importAllNotes, getNotesForFile } from './db.js';

// PDF.js is configured in index.html via ES module import
// The global pdfjsLib is set there, we just verify it's available
if (typeof pdfjsLib === 'undefined') {
    console.error('PDF.js library not loaded! Check index.html script configuration.');
}


// === Global Variables ===
let pdfDocs = [];
let pageMap = [];
let globalTotalPages = 0;
let currentPage = 1;
let pageRendering = false;
let searchResults = [];
let currentFileFilter = 'all';

let currentZoomMode = 'height';
let currentScale = 1.0;

let paragraphSelectionModeActive = false;
let currentPageTextContent = null;
let currentViewport = null;
let thumbnailObserver = null;
let currentRenderTask = null; // Item 4: render task cancellation
const textContentCache = new Map(); // Item 3: search text cache (key: "docIndex:localPage")

// === Mobile Detection Helper (Item 2: unify CSS/JS breakpoints) ===
function isMobileView() {
    return window.innerWidth <= 768 ||
           (window.innerWidth <= 896 && window.innerHeight < window.innerWidth);
}

// === DOM Element Selection ===
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas?.getContext('2d');
const toolbar = document.getElementById('toolbar');
const appContainer = document.getElementById('app-container');
const pdfContainer = document.getElementById('pdf-container');
const textLayerDivGlobal = document.getElementById('text-layer');

// Navigation Controls
const goToFirstPageBtn = document.getElementById('go-to-first-page');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumDisplay = document.getElementById('page-num-display');
const pageToGoInput = document.getElementById('page-to-go');
const goToPageBtn = document.getElementById('go-to-page-btn');
const pageSlider = document.getElementById('page-slider');

// Search Related
const resultsDropdown = document.getElementById('resultsDropdown');
const panelResultsDropdown = document.getElementById('panelResultsDropdown');
const fileFilterDropdown = document.getElementById('fileFilterDropdown');
const panelFileFilterDropdown = document.getElementById('panelFileFilterDropdown');
const searchInputElem = document.getElementById('searchInput');
const searchActionButton = document.getElementById('search-action-button');
const searchResultsPanel = document.getElementById('search-results-panel');
const resultsList = document.getElementById('results-list');
const fileSwitchDropdown = document.getElementById('fileSwitchDropdown');

// Tool Buttons
const sharePageBtn = document.getElementById('share-page-btn');
const toggleUnderlineBtn = document.getElementById('toggle-underline-btn');
const toggleHighlighterBtn = document.getElementById('toggle-highlighter-btn');
const clearHighlighterBtn = document.getElementById('clear-highlighter-btn');
const toggleTextSelectionBtn = document.getElementById('toggle-text-selection-btn');
const copyPageTextBtn = document.getElementById('copy-page-text-btn');
const toggleParagraphSelectionBtn = document.getElementById('toggle-paragraph-selection-btn');

// Notes Related
const notesLayer = document.getElementById('notes-layer');
const toggleNotesBtn = document.getElementById('toggle-notes-btn');
const viewNotesBtn = document.getElementById('view-notes-btn');
const noteModal = document.getElementById('note-modal');
const noteContentInput = document.getElementById('note-content');
const saveNoteBtn = document.getElementById('save-note-btn');
const cancelNoteBtn = document.getElementById('cancel-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const closeNoteModal = document.getElementById('close-note-modal');
const noteModalTitle = document.getElementById('note-modal-title');
const notesListPanel = document.getElementById('notes-list-panel');
const notesListContainer = document.getElementById('notes-list-container');
const closeNotesList = document.getElementById('close-notes-list');

// Drawing Canvas
const drawingCanvas = document.getElementById('drawing-canvas');
const drawingCtx = drawingCanvas?.getContext('2d');

// Magnifier
const magnifierGlass = document.getElementById('magnifier-glass');
const magnifierCanvas = document.getElementById('magnifier-canvas');
const localMagnifierCtx = magnifierCanvas?.getContext('2d');
const toggleLocalMagnifierBtn = document.getElementById('toggle-local-magnifier-btn');
const localMagnifierZoomControlsDiv = document.getElementById('local-magnifier-zoom-controls');
const localMagnifierZoomSelector = document.getElementById('local-magnifier-zoom-selector');

// Zoom Controls
// *** 修正：全部改用 querySelectorAll 來選取 class ***
const zoomOutBtns = document.querySelectorAll('.zoom-out-btn');
const zoomInBtns = document.querySelectorAll('.zoom-in-btn');
const fitWidthBtns = document.querySelectorAll('.fit-width-btn');
const fitHeightBtns = document.querySelectorAll('.fit-height-btn');
const zoomLevelDisplay = document.getElementById('zoom-level-display');

// Others
const resizer = document.getElementById('resizer');
const mainContent = document.getElementById('main-content');
const fileInput = document.getElementById('fileInput');
const fileInputLabel = document.querySelector('label[for="fileInput"]');
const clearSessionBtn = document.getElementById('clear-session-btn');
const restoreSessionBtn = document.getElementById('restore-session-btn');
const emptyState = document.getElementById('empty-state');
const canvasWrapper = document.getElementById('canvas-wrapper');
const toolbarToggleTab = document.getElementById('toolbar-toggle-tab');

// === Mode Status ===
let localMagnifierEnabled = false;
let LOCAL_MAGNIFIER_SIZE = 120;
let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

let showSearchResultsHighlights = true;
let highlighterEnabled = false;
let textSelectionModeActive = false;
let notesModeActive = false;
let currentEditingNote = null;
let currentNotePosition = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// === Core Function: Reset App ===
function resetApp() {
    pdfDocs = [];
    pageMap = [];
    globalTotalPages = 0;
    currentPage = 1;
    searchResults = [];
    currentFileFilter = 'all';
    notesModeActive = false;
    currentEditingNote = null;
    textContentCache.clear(); // Item 3: clear search cache
    if (currentRenderTask) { currentRenderTask.cancel(); currentRenderTask = null; } // Item 4

    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    if (textLayerDivGlobal) textLayerDivGlobal.innerHTML = '';
    if (resultsList) resultsList.innerHTML = '';
    if (notesLayer) notesLayer.innerHTML = '';

    // Reset dropdowns
    const dropdowns = [
        { elem: resultsDropdown, default: '<option value="">搜尋結果</option>' },
        { elem: panelResultsDropdown, default: '<option value="">搜尋結果</option>' },
        { elem: fileFilterDropdown, default: '<option value="all">所有檔案</option>' },
        { elem: panelFileFilterDropdown, default: '<option value="all">所有檔案</option>' }
    ];
    dropdowns.forEach(({ elem, default: defaultHTML }) => {
        if (elem) elem.innerHTML = defaultHTML;
    });

    // Toggle Empty State UI
    if (emptyState) emptyState.style.display = 'flex';
    if (canvasWrapper) canvasWrapper.style.display = 'none';

    // Show/hide file input
    if (fileInputLabel) fileInputLabel.style.display = 'inline-flex';
    if (clearSessionBtn) clearSessionBtn.style.display = 'none';
    if (restoreSessionBtn) restoreSessionBtn.style.display = 'inline-block';

    updatePageControls();
    updateResultsNav();
}

// === Core Function: Load and Process Files ===
async function loadAndProcessFiles(files) {
    if (!files?.length) return;

    // Show loading animation
    showLoadingOverlay('載入 PDF 中...');
    console.log('Starting loadAndProcessFiles...');

    try {
        resetApp();
        console.log('App reset complete.');
    } catch (e) {
        console.error('Error in resetApp:', e);
        throw e;
    }

    currentZoomMode = 'width'; // 預設改為符合寬度
    if (searchInputElem) searchInputElem.value = '';

    // Set default zoom mode based on device and orientation
    // Mobile portrait: fit width, Mobile landscape: fit height, Desktop: fit width
    if (isMobileView()) {
        if (window.innerHeight > window.innerWidth) {
            currentZoomMode = 'width'; // Portrait mode - fit width
        } else {
            currentZoomMode = 'height'; // Landscape mode - fit height
        }
    } else {
        currentZoomMode = 'width'; // Desktop - fit width (修正：配合右側縮圖面板)
    }
    showSearchResultsHighlights = true;
    textLayerDivGlobal?.classList.remove('highlights-hidden');

    try {
        deactivateAllModes();
        console.log('Modes deactivated.');
    } catch (e) {
        console.error('Error in deactivateAllModes:', e);
        throw e;
    }

    const loadingPromises = Array.from(files).map(file => {
        return new Promise((resolve) => {
            if (!file || file.type !== 'application/pdf') {
                resolve(null);
                return;
            }
            const reader = new FileReader();
            reader.onload = function () {
                const typedarray = new Uint8Array(this.result);
                window.pdfjsLib.getDocument({
                    data: typedarray,
                    isEvalSupported: false,
                    enableXfa: false
                }).promise.then(pdf => {
                    resolve({ pdf, name: file.name });
                }).catch(reason => {
                    console.error(`Error loading ${file.name}:`, reason);
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
            hideLoadingOverlay();
            showNotification('未選取有效的 PDF 檔案。', 'error');
            resetApp();
            return;
        }

        loadedPdfs.forEach((result, docIndex) => {
            pdfDocs.push(result.pdf);
            for (let i = 1; i <= result.pdf.numPages; i++) {
                pageMap.push({
                    docIndex,
                    localPage: i,
                    docName: result.name
                });
            }
        });

        globalTotalPages = pageMap.length;

        hideLoadingOverlay();
        showNotification(`成功載入 ${loadedPdfs.length} 個 PDF 檔案，共 ${globalTotalPages} 頁。`, 'success');

        // Show Canvas UI
        if (emptyState) emptyState.style.display = 'none';
        if (canvasWrapper) canvasWrapper.style.display = 'block';

        renderPage(1);

        // Update file switch dropdown
        updateFileSwitchDropdown();

        if (fileInputLabel) fileInputLabel.style.display = 'none';
        if (clearSessionBtn) clearSessionBtn.style.display = 'inline-block';
        if (restoreSessionBtn) restoreSessionBtn.style.display = 'none';

    } catch (error) {
        hideLoadingOverlay();
        showNotification('讀取 PDF 檔案時發生錯誤：' + error.message, 'error');
        console.error('Error during file processing:', error);
        resetApp();
    }
}

// Mobile UI Enhancements — floating panel above FAB
const mainFab = document.getElementById('main-fab');
const fabSpeedDial = document.getElementById('fab-speed-dial');

const closeFabPanel = () => {
    fabSpeedDial?.classList.remove('active');
    mainFab?.classList.remove('active');
};

const openFabPanel = () => {
    fabSpeedDial?.classList.add('active');
    mainFab?.classList.add('active');
};

if (mainFab) {
    mainFab.addEventListener('click', (e) => {
        e.stopPropagation();
        if (fabSpeedDial?.classList.contains('active')) closeFabPanel();
        else openFabPanel();
    });
}

// Close panel after tapping any action button inside it
fabSpeedDial?.addEventListener('click', (e) => {
    if (e.target.closest('button')) closeFabPanel();
});

// Close panel when clicking outside
document.addEventListener('click', (e) => {
    if (fabSpeedDial?.classList.contains('active') && !e.target.closest('.fab-container')) {
        closeFabPanel();
    }
    // Close mobile toolbar
    if (isMobileView() &&
        appContainer?.classList.contains('menu-active') &&
        !e.target.closest('#toolbar') &&
        !e.target.closest('#toolbar-toggle-tab')) {
        appContainer.classList.remove('menu-active');
    }
});


async function handleRestoreSession() {
    try {
        const files = await getFiles();
        if (files && files.length > 0) {
            loadAndProcessFiles(files);
        } else {
            showNotification('找不到快取的工作階段。', 'info');
        }
    } catch (err) {
        console.error('Restore error:', err);
    }
}

restoreSessionBtn?.addEventListener('click', handleRestoreSession);

// === File Input Handling ===
fileInput?.addEventListener('change', async function (e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
        await saveFiles(files);
        const restoreContainer = document.getElementById('restore-session-container');
        if (restoreContainer) restoreContainer.style.display = 'none';
    } catch (dbError) {
        console.warn("Could not save session to IndexedDB", dbError);
    }

    try {
        await loadAndProcessFiles(files);

        // Auto-close menu in mobile mode
        if (isMobileView() && appContainer?.classList.contains('menu-active')) {
            appContainer.classList.remove('menu-active');
        }
    } catch (loadError) {
        console.error("Failed to load or process PDF files:", loadError);
        showNotification("載入 PDF 時發生錯誤：" + loadError.message, 'error');
    }
});

clearSessionBtn?.addEventListener('click', resetApp);

// === Helper: Get Doc and Local Page Info ===
function getDocAndLocalPage(globalPage) {
    if (globalPage < 1 || globalPage > globalTotalPages || !pageMap.length) return null;
    const mapping = pageMap[globalPage - 1];
    if (!mapping || pdfDocs[mapping.docIndex] === undefined) return null;
    return {
        doc: pdfDocs[mapping.docIndex],
        localPage: mapping.localPage,
        docName: mapping.docName
    };
}

// === Notes Functions ===

async function renderNotes() {
    if (!notesLayer || !pdfDocs.length) return;

    const pageInfo = getDocAndLocalPage(currentPage);
    if (!pageInfo) return;

    notesLayer.innerHTML = '';

    try {
        const docId = pageInfo.docName; // Using filename as ID for simplicity
        const notes = await getNotes(docId, pageInfo.localPage);

        notes.forEach(note => {
            const marker = document.createElement('div');
            marker.className = 'note-marker';
            marker.style.left = `${note.x}%`;
            marker.style.top = `${note.y}%`;
            marker.title = note.content;

            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                openNoteModal(note);
            });

            notesLayer.appendChild(marker);
        });
    } catch (err) {
        console.error('Error rendering notes:', err);
    }
}

function openNoteModal(note = null) {
    currentEditingNote = note;
    if (note) {
        if (noteModalTitle) noteModalTitle.textContent = '編輯筆記';
        if (noteContentInput) noteContentInput.value = note.content;
        if (deleteNoteBtn) deleteNoteBtn.style.display = 'block';
    } else {
        if (noteModalTitle) noteModalTitle.textContent = '新增筆記';
        if (noteContentInput) noteContentInput.value = '';
        if (deleteNoteBtn) deleteNoteBtn.style.display = 'none';
    }
    noteModal?.classList.add('active');

    // Mobile Check: Read-only mode for notes
    if (isMobileView()) {
        if (noteContentInput) {
            noteContentInput.readOnly = true;
            noteContentInput.placeholder = "手機模式下僅供閱讀";
        }
    } else {
        if (noteContentInput) {
            noteContentInput.readOnly = false;
            noteContentInput.placeholder = "在此輸入筆記內容...";
        }
    }

    setTimeout(() => noteContentInput?.focus(), 100);
}

function closeNoteModalFunc() {
    noteModal?.classList.remove('active');
    currentEditingNote = null;
    currentNotePosition = null;
}

async function saveCurrentNote() {
    const content = noteContentInput?.value.trim();
    if (!content) {
        showNotification('筆記內容不能為空', 'error');
        return;
    }

    const pageInfo = getDocAndLocalPage(currentPage);
    if (!pageInfo) return;

    try {
        if (currentEditingNote) {
            await updateNote(currentEditingNote.id, content);
            showNotification('筆記已更新', 'success');
        } else if (currentNotePosition) {
            await saveNote({
                fileId: pageInfo.docName,
                pageNum: pageInfo.localPage,
                x: currentNotePosition.x,
                y: currentNotePosition.y,
                content: content
            });
            showNotification('筆記已儲存', 'success');
        }

        closeNoteModalFunc();
        renderNotes();
    } catch (err) {
        console.error('Error saving note:', err);
        showNotification('儲存筆記失敗', 'error');
    }
}

async function deleteCurrentNote() {
    if (!currentEditingNote) return;

    if (confirm('您確定要刪除此筆記嗎？')) {
        try {
            await deleteNote(currentEditingNote.id);
            showNotification('筆記已刪除', 'success');
            closeNoteModalFunc();
            renderNotes();
        } catch (err) {
            console.error('Error deleting note:', err);
            showNotification('刪除筆記失敗', 'error');
        }
    }
}

async function showNotesList() {
    if (!notesListContainer) return;

    notesListContainer.innerHTML = '載入筆記中...';
    notesListPanel?.classList.add('active');

    try {
        const importPromises = pdfDocs.map((doc, idx) => {
            const docName = pageMap.find(m => m.docIndex === idx)?.docName;
            return docName ? getNotesForFile(docName) : Promise.resolve([]);
        });

        const allNotesResults = await Promise.all(importPromises);
        const allNotes = allNotesResults.flat().sort((a, b) => b.createdAt - a.createdAt);

        if (allNotes.length === 0) {
            notesListContainer.innerHTML = `
                <div class="empty-notes-message">
                    <div class="icon">📝</div>
                    <p>找不到任何載入檔案的筆記。</p>
                </div>
            `;
        } else {
            notesListContainer.innerHTML = '';
            allNotes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-list-item';

                // Find global page number for this note
                const globalPageNum = pageMap.findIndex(m => m.docName === note.fileId && m.localPage === note.pageNum) + 1;

                const noteMeta = document.createElement('div');
                noteMeta.className = 'note-meta';

                const notePage = document.createElement('span');
                notePage.className = 'note-page';
                notePage.textContent = `第 ${note.pageNum} 頁`;

                const noteDate = document.createElement('span');
                noteDate.textContent = new Date(note.createdAt).toLocaleDateString();

                const notePreview = document.createElement('div');
                notePreview.className = 'note-content-preview';
                notePreview.textContent = note.content || '';

                noteMeta.append(notePage, noteDate);
                noteItem.append(noteMeta, notePreview);

                noteItem.addEventListener('click', () => {
                    notesListPanel?.classList.remove('active');
                    if (globalPageNum > 0) {
                        goToPage(globalPageNum);
                        // Add a small delay to ensure page is rendered before showing note
                        setTimeout(() => {
                            openNoteModal(note);
                        }, 500);
                    }
                });

                notesListContainer.appendChild(noteItem);
            });
        }
    } catch (err) {
        console.error('Error loading notes list:', err);
        notesListContainer.innerHTML = '載入筆記時發生錯誤。';
    }
}

// === Notes Import/Export Handlers ===
const exportNotesBtn = document.getElementById('export-notes-btn');
const importNotesTriggerBtn = document.getElementById('import-notes-trigger-btn');
const importNotesInput = document.getElementById('import-notes-input');

exportNotesBtn?.addEventListener('click', async () => {
    try {
        const notes = await exportAllNotes();
        if (!notes || notes.length === 0) {
            showNotification('無筆記可供匯出', 'info');
            return;
        }

        const dataStr = JSON.stringify(notes, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pdf_pro_studio_notes_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('筆記備份匯出成功！', 'success');
    } catch (err) {
        console.error('Export failed:', err);
        showNotification('匯出筆記失敗', 'error');
    }
});

importNotesTriggerBtn?.addEventListener('click', () => {
    const backupWarning = "⚠️ 警告：匯入筆記會將其與現有筆記合併。\n\n格式錯誤的資料可能會導致資料損壞或遺失。強烈建議在繼續之前先匯出目前筆記的備份。\n\n您確定要繼續匯入嗎？";

    if (confirm(backupWarning)) {
        importNotesInput?.click();
    }
});

importNotesInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const notes = JSON.parse(event.target.result);
            if (!Array.isArray(notes)) {
                throw new Error('Invalid backup file format (not an array)');
            }

            showLoadingOverlay('匯入筆記中...');
            await importAllNotes(notes);
            hideLoadingOverlay();

            showNotification(`成功匯入 ${notes.length} 則筆記！`, 'success');
            renderNotes();
            if (notesListPanel?.classList.contains('active')) {
                showNotesList();
            }
        } catch (err) {
            console.error('Import failed:', err);
            hideLoadingOverlay();
            showNotification('匯入筆記失敗：' + err.message, 'error');
        } finally {
            importNotesInput.value = ''; // Reset input
        }
    };
    reader.readAsText(file);
});

// === Magnifier Function ===
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
    if (localMagnifierZoomControlsDiv) {
        localMagnifierZoomControlsDiv.style.display = 'none';
    }
}

function updateLocalMagnifier(clientX, clientY) {
    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (!localMagnifierEnabled || !canvas || !magnifierGlass || !localMagnifierCtx || !canvasWrapper) {
        if (magnifierGlass) magnifierGlass.style.display = 'none';
        return;
    }

    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const pointXInWrapper = clientX - wrapperRect.left;
    const pointYInWrapper = clientY - wrapperRect.top;

    // Check if within canvas boundaries
    if (pointXInWrapper < 0 || pointXInWrapper > canvas.offsetWidth ||
        pointYInWrapper < 0 || pointYInWrapper > canvas.offsetHeight) {
        magnifierGlass.style.display = 'none';
        return;
    }

    magnifierGlass.style.display = 'block';

    const scaleX = canvas.width / canvas.offsetWidth;
    const scaleY = canvas.height / canvas.offsetHeight;
    const srcX = pointXInWrapper * scaleX;
    const srcY = pointYInWrapper * scaleY;

    const srcRectCSSWidth = LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL;
    const srcRectCSSHeight = LOCAL_MAGNIFIER_SIZE / LOCAL_MAGNIFIER_ZOOM_LEVEL;
    const srcRectPixelWidth = srcRectCSSWidth * scaleX;
    const srcRectPixelHeight = srcRectCSSHeight * scaleY;
    const srcRectX = srcX - (srcRectPixelWidth / 2);
    const srcRectY = srcY - (srcRectPixelHeight / 2);

    localMagnifierCtx.clearRect(0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);
    localMagnifierCtx.fillStyle = 'white';
    localMagnifierCtx.fillRect(0, 0, LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE);

    // Use canvas directly as source
    localMagnifierCtx.drawImage(
        canvas,
        srcRectX, srcRectY,
        srcRectPixelWidth, srcRectPixelHeight,
        0, 0,
        LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE
    );

    if (drawingCanvas?.width > 0 && drawingCanvas?.height > 0) {
        const srcDrawRectX = pointXInWrapper - (srcRectCSSWidth / 2);
        const srcDrawRectY = pointYInWrapper - (srcRectCSSHeight / 2);
        localMagnifierCtx.drawImage(
            drawingCanvas,
            srcDrawRectX, srcDrawRectY,
            srcRectCSSWidth, srcRectCSSHeight,
            0, 0,
            LOCAL_MAGNIFIER_SIZE, LOCAL_MAGNIFIER_SIZE
        );
    }

    // Position glass relative to its parent (canvas-wrapper)
    const magnifierTop = pointYInWrapper - (LOCAL_MAGNIFIER_SIZE / 2);
    const magnifierLeft = pointXInWrapper - (LOCAL_MAGNIFIER_SIZE / 2);

    // Offset the glass slightly to be above the cursor or following it
    // Here we'll center it on the cursor for direct feedback
    magnifierGlass.style.top = `${magnifierTop}px`;
    magnifierGlass.style.left = `${magnifierLeft}px`;
}

// === UI Control Updates ===
function updateZoomControls() {
    if (!zoomLevelDisplay) return;
    zoomLevelDisplay.textContent = `${Math.round(currentScale * 100)}% `;

    fitWidthBtns?.forEach(btn => {
        btn.classList.toggle('active', currentZoomMode === 'width');
    });

    fitHeightBtns?.forEach(btn => {
        btn.classList.toggle('active', currentZoomMode === 'height');
    });
}

// === File Switch Dropdown ===
function updateFileSwitchDropdown() {
    if (!fileSwitchDropdown) return;

    // Clear existing options
    fileSwitchDropdown.innerHTML = '';

    if (pdfDocs.length === 0) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- No Files --';
        fileSwitchDropdown.appendChild(defaultOption);
        fileSwitchDropdown.disabled = true;
        return;
    }

    fileSwitchDropdown.disabled = false;

    // Build unique file list with their starting page
    const fileList = [];
    let pageOffset = 0;
    pageMap.forEach((mapping, index) => {
        if (mapping.localPage === 1) {
            fileList.push({
                docIndex: mapping.docIndex,
                docName: mapping.docName,
                startPage: index + 1  // Global page number (1-indexed)
            });
        }
    });

    // Add options for each file
    fileList.forEach((file, idx) => {
        const option = document.createElement('option');
        option.value = file.startPage;
        // Truncate long names
        let displayName = file.docName.replace(/\.pdf$/i, '');
        if (displayName.length > 30) {
            displayName = displayName.substring(0, 27) + '...';
        }
        option.textContent = `${idx + 1}. ${displayName}`;
        option.title = file.docName;
        fileSwitchDropdown.appendChild(option);
    });

    // Set current selection based on current page
    updateFileSwitchSelection();
}

function updateFileSwitchSelection() {
    if (!fileSwitchDropdown || pdfDocs.length === 0) return;

    const docInfo = getDocAndLocalPage(currentPage);
    if (!docInfo) return;

    // Find the start page of current file
    let startPage = 1;
    for (let i = 0; i < pageMap.length; i++) {
        if (pageMap[i].docIndex === docInfo.docIndex && pageMap[i].localPage === 1) {
            startPage = i + 1;
            break;
        }
    }
    fileSwitchDropdown.value = startPage;
}

// File switch dropdown event listener
fileSwitchDropdown?.addEventListener('change', e => {
    const startPage = parseInt(e.target.value);
    if (!isNaN(startPage) && startPage > 0) {
        goToPage(startPage, getPatternFromSearchInput());
    }
});

function updatePageControls() {
    const fabContainer = document.getElementById('floating-action-buttons');
    const hasDocs = pdfDocs.length > 0;

    if (!pageNumDisplay || !fabContainer) {
        if (!hasDocs && pageNumDisplay) pageNumDisplay.textContent = '- / -';
        if (!hasDocs && fabContainer) fabContainer.style.display = 'none';
        return;
    }

    const allControls = [
        goToFirstPageBtn, prevPageBtn, nextPageBtn, pageToGoInput, goToPageBtn,
        pageSlider, toggleUnderlineBtn, toggleHighlighterBtn, clearHighlighterBtn,
        toggleTextSelectionBtn, sharePageBtn, toggleLocalMagnifierBtn,
        localMagnifierZoomSelector, copyPageTextBtn, toggleNotesBtn, viewNotesBtn,
        ...zoomInBtns, ...zoomOutBtns, // <-- 修正：使用新的陣列
        ...fitWidthBtns, ...fitHeightBtns, toggleParagraphSelectionBtn
    ];

    allControls.forEach(el => {
        if (el) el.disabled = !hasDocs;
    });

    if (!hasDocs) {
        if (pageNumDisplay) pageNumDisplay.textContent = '- / -';
        if (pageToGoInput) {
            pageToGoInput.value = '';
            pageToGoInput.max = 1;
        }
        if (pageSlider) {
            pageSlider.max = 1;
            pageSlider.value = 1;
        }
        fabContainer.style.display = 'none';
        if (localMagnifierZoomControlsDiv) {
            localMagnifierZoomControlsDiv.style.display = 'none';
        }
        updateResultsNav();
        return;
    }

    const docInfo = getDocAndLocalPage(currentPage);
    const pageInfoText = `第 ${currentPage} / ${globalTotalPages} 頁`;
    let fullDisplayText = pageInfoText;
    const fullDocNameForTitle = docInfo?.docName || 'N/A';

    if (docInfo?.docName) {
        const cleanName = docInfo.docName.replace(/\.pdf$/i, '');
        const START_CHARS = 10;
        const END_CHARS = 10;
        let displayDocName = cleanName;

        if (cleanName.length > (START_CHARS + END_CHARS)) {
            const startPart = cleanName.substring(0, START_CHARS);
            const endPart = cleanName.slice(-END_CHARS);
            displayDocName = `${startPart}...${endPart}`;
        }
        fullDisplayText += ` (${displayDocName})`;
    }

    if (pageNumDisplay) pageNumDisplay.textContent = fullDisplayText;
    if (pageNumDisplay) pageNumDisplay.title = `${pageInfoText} (檔案：${fullDocNameForTitle})`;

    if (pageToGoInput) {
        pageToGoInput.value = currentPage;
        pageToGoInput.max = globalTotalPages;
    }

    if (goToFirstPageBtn) goToFirstPageBtn.disabled = (currentPage === 1);
    if (prevPageBtn) prevPageBtn.disabled = (currentPage === 1);
    if (nextPageBtn) nextPageBtn.disabled = (currentPage === globalTotalPages);

    if (pageSlider) {
        pageSlider.max = globalTotalPages;
        pageSlider.value = currentPage;
        pageSlider.disabled = (globalTotalPages === 1);
    }

    fabContainer.style.display = 'flex';

    // Update button states
    toggleUnderlineBtn?.classList.toggle('active', showSearchResultsHighlights);

    if (toggleHighlighterBtn) {
        toggleHighlighterBtn.classList.toggle('active', highlighterEnabled);
        toggleHighlighterBtn.title = highlighterEnabled ? '關閉螢光筆' : '開啟螢光筆';
    }

    if (toggleTextSelectionBtn) {
        toggleTextSelectionBtn.classList.toggle('active', textSelectionModeActive);
        toggleTextSelectionBtn.title = textSelectionModeActive ? '關閉文字選取' : '開啟文字選取';
    }

    toggleParagraphSelectionBtn?.classList.toggle('active', paragraphSelectionModeActive);

    if (sharePageBtn) sharePageBtn.disabled = !navigator.share;

    if (toggleLocalMagnifierBtn) {
        toggleLocalMagnifierBtn.classList.toggle('active', localMagnifierEnabled);
        toggleLocalMagnifierBtn.title = localMagnifierEnabled ? '關閉放大鏡' : '開啟放大鏡';
    }

    if (toggleNotesBtn) {
        toggleNotesBtn.classList.toggle('active', notesModeActive);
        toggleNotesBtn.title = notesModeActive ? '關閉筆記模式' : '開啟筆記模式';
    }

    if (localMagnifierZoomControlsDiv) {
        localMagnifierZoomControlsDiv.style.display = (hasDocs && localMagnifierEnabled) ? 'flex' : 'none';
    }

    const isTSModeActive = textSelectionModeActive;
    if (copyPageTextBtn) {
        copyPageTextBtn.disabled = !hasDocs || !isTSModeActive;
        copyPageTextBtn.title = isTSModeActive ? '複製頁面文字' : '請先開啟文字選取模式';
    }

    if (toggleParagraphSelectionBtn) {
        toggleParagraphSelectionBtn.disabled = !hasDocs || !isTSModeActive;
        toggleParagraphSelectionBtn.title = isTSModeActive ? '開啟段落選取' : '請先開啟文字選取模式';
    }

    updateResultsNav();
    updateZoomControls();
    updateFileSwitchSelection();
}

// Dedicated listener for adding notes on the notes layer
notesLayer?.addEventListener('click', (e) => {
    if (!notesModeActive) return;

    // Prevent adding note when clicking on existing markers
    if (e.target.classList.contains('note-marker')) return;

    const rect = canvasWrapper.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    currentNotePosition = { x: xPercent, y: yPercent };
    openNoteModal();
});

// === Page Rendering ===
function renderPage(globalPageNum, highlightPattern = null) {
    if (!pdfDocs.length || !pdfContainer || !canvas || !ctx) return;

    // Item 4: Cancel any in-flight render before starting a new one
    if (currentRenderTask) {
        currentRenderTask.cancel();
        currentRenderTask = null;
    }

    pageRendering = true;
    currentPageTextContent = null;
    currentViewport = null;
    updatePageControls();

    drawingCtx?.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    clearParagraphHighlights();
    if (notesLayer) notesLayer.innerHTML = '';

    const pageInfo = getDocAndLocalPage(globalPageNum);
    if (!pageInfo) {
        pageRendering = false;
        updatePageControls();
        return;
    }

    const { doc, localPage } = pageInfo;

    doc.getPage(localPage).then(page => {
        const viewportOriginal = page.getViewport({ scale: 1 });
        let scaleForCss;

        if (currentZoomMode === 'width') {
            scaleForCss = pdfContainer.clientWidth / viewportOriginal.width;
        } else if (currentZoomMode === 'height') {
            const availableHeight = pdfContainer.clientHeight - 20;
            scaleForCss = availableHeight / viewportOriginal.height;
        } else {
            scaleForCss = currentScale;
        }
        currentScale = scaleForCss;

        if (canvas.dataset.originalBorder && pdfDocs.length > 0) {
            canvas.style.border = canvas.dataset.originalBorder;
        } else if (pdfDocs.length > 0) {
            canvas.style.border = '1px solid #000';
        }

        textLayerDivGlobal?.classList.toggle('highlights-hidden', !showSearchResultsHighlights);

        const viewportCss = page.getViewport({ scale: scaleForCss });
        currentViewport = viewportCss;
        // Item 5: Dynamic QUALITY_FACTOR — Retina already has high dpr, no need to double
        const devicePixelRatio = window.devicePixelRatio || 1;
        const QUALITY_FACTOR = devicePixelRatio >= 2 ? 1.0 : 1.5;
        const renderScale = scaleForCss * devicePixelRatio * QUALITY_FACTOR;
        const viewportRender = page.getViewport({ scale: renderScale });

        canvas.width = viewportRender.width;
        canvas.height = viewportRender.height;
        canvas.style.width = `${viewportCss.width}px`;
        canvas.style.height = `${viewportCss.height}px`;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewportRender
        };

        // Item 4: Track render task for cancellation
        const renderTask = page.render(renderContext);
        currentRenderTask = renderTask;

        renderTask.promise.then(() => {
            currentRenderTask = null;
            pageRendering = false;
            updatePageControls();

            const canvasOffsetTop = canvas.offsetTop;
            const canvasOffsetLeft = canvas.offsetLeft;

            if (textLayerDivGlobal) {
                textLayerDivGlobal.style.width = `${viewportCss.width}px`;
                textLayerDivGlobal.style.height = `${viewportCss.height}px`;
                textLayerDivGlobal.style.top = `${canvasOffsetTop}px`;
                textLayerDivGlobal.style.left = `${canvasOffsetLeft}px`;
            }

            if (drawingCanvas) {
                drawingCanvas.width = viewportCss.width;
                drawingCanvas.height = viewportCss.height;
                drawingCanvas.style.top = `${canvasOffsetTop}px`;
                drawingCanvas.style.left = `${canvasOffsetLeft}px`;
            }

            if (notesLayer) {
                notesLayer.style.width = `${viewportCss.width}px`;
                notesLayer.style.height = `${viewportCss.height}px`;
                notesLayer.style.top = `${canvasOffsetTop}px`;
                notesLayer.style.left = `${canvasOffsetLeft}px`;
                renderNotes();
            }

            if (drawingCtx) {
                drawingCtx.strokeStyle = 'rgba(255, 255, 0, 0.06)';
                drawingCtx.lineWidth = 15;
                drawingCtx.lineJoin = 'round';
                drawingCtx.lineCap = 'round';
            }

            return renderTextLayer(page, viewportCss, highlightPattern);
        }).catch(reason => {
            currentRenderTask = null;
            // Item 4: Gracefully handle cancelled renders
            if (reason?.name === 'RenderingCancelledException') {
                console.log('Render cancelled (page switch)');
                return;
            }
            console.error(`Error rendering page ${localPage}:`, reason);
            pageRendering = false;
            updatePageControls();
        });
    }).catch(reason => {
        console.error(`Error getting page ${localPage}:`, reason);
        pageRendering = false;
        updatePageControls();
    });
}

// Item 3: Cached text content retrieval
async function getCachedTextContent(docIndex, localPage) {
    const key = `${docIndex}:${localPage}`;
    if (textContentCache.has(key)) return textContentCache.get(key);
    const page = await pdfDocs[docIndex].getPage(localPage);
    const tc = await page.getTextContent();
    textContentCache.set(key, tc);
    return tc;
}

function renderTextLayer(page, viewport, highlightPattern) {
    if (!textLayerDivGlobal) return Promise.resolve();

    // Clear existing text layer
    textLayerDivGlobal.innerHTML = '';

    // Check if pdfjsLib.Util is available
    if (!pdfjsLib?.Util) {
        console.warn('pdfjsLib.Util not available, skipping text layer rendering');
        return Promise.resolve();
    }

    return page.getTextContent().then(textContent => {
        currentPageTextContent = textContent;

        // Handle empty text content (scanned PDFs / image-based PDFs)
        if (!textContent || !textContent.items || textContent.items.length === 0) {
            console.log('No text content found on this page (possibly a scanned PDF)');
            return;
        }

        textContent.items.forEach(item => {
            // Skip empty strings
            if (!item.str || item.str.trim() === '') return;

            const textDiv = document.createElement('div');
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
            let defaultFontSize = item.height * viewport.scale;
            if (defaultFontSize <= 0) defaultFontSize = 10;

            // Set inline style for positioning
            textDiv.style.cssText = `
                position: absolute;
                left: ${tx[4]}px;
                top: ${tx[5] - (item.height * viewport.scale)}px;
                height: ${item.height * viewport.scale}px;
                font-size: ${defaultFontSize}px;
                line-height: 1;
                white-space: pre;
                font-family: ${item.fontName ? item.fontName.split(',')[0] : 'sans-serif'};
                transform-origin: 0% 0%;
            `;

            textDiv.textContent = item.str;

            // Highlight matching text (reset lastIndex for global regex)
            if (highlightPattern) {
                highlightPattern.lastIndex = 0;
                if (highlightPattern.test(item.str)) {
                    textDiv.classList.add('wavy-underline');
                }
            }

            textLayerDivGlobal.appendChild(textDiv);
        });
    }).catch(reason => {
        console.warn('Text layer rendering skipped:', reason.message || reason);
        // Don't throw - text layer is optional, page render should still complete
    });
}

// === Drawing Function ===
function getEventPosition(canvasElem, evt) {
    if (!canvasElem) return { x: 0, y: 0 };
    const rect = canvasElem.getBoundingClientRect();
    let clientX, clientY;

    if (evt.touches?.length > 0) {
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
    if (!highlighterEnabled || !drawingCtx) return;
    isDrawing = true;
    const pos = getEventPosition(drawingCanvas, e);
    [lastX, lastY] = [pos.x, pos.y];
    drawingCtx.beginPath();
    drawingCtx.moveTo(lastX, lastY);
    if (e.type === 'touchstart') e.preventDefault();
}

function draw(e) {
    if (!isDrawing || !highlighterEnabled || !drawingCtx) return;
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
    drawingCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    drawingCanvas.addEventListener('touchmove', draw, { passive: false });
    drawingCanvas.addEventListener('touchend', stopDrawing);
    drawingCanvas.addEventListener('touchcancel', stopDrawing);
}

// === Thumbnail Rendering ===
async function renderThumbnail(docIndex, localPageNum, canvasEl) {
    try {
        const doc = pdfDocs[docIndex];
        if (!doc || !canvasEl) return;

        // Guard: If parent width is 0 or too small, wait and retry
        const parentWidth = canvasEl.parentElement?.clientWidth || 0;
        if (parentWidth <= 30) {
            setTimeout(() => renderThumbnail(docIndex, localPageNum, canvasEl), 150);
            return;
        }

        const page = await doc.getPage(localPageNum);
        const viewport = page.getViewport({ scale: 1 });
        const scale = (parentWidth - 20) / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const thumbnailCtx = canvasEl.getContext('2d');

        canvasEl.height = scaledViewport.height;
        canvasEl.width = scaledViewport.width;


        const renderContext = {
            canvasContext: thumbnailCtx,
            viewport: scaledViewport
        };
        await page.render(renderContext).promise;
    } catch (error) {
        console.error(`Failed to render thumbnail for doc ${docIndex} page ${localPageNum}:`, error);
    }
}

function initThumbnailObserver() {
    if (thumbnailObserver) {
        thumbnailObserver.disconnect();
    }

    thumbnailObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const canvas = entry.target;
                const docIndex = parseInt(canvas.dataset.docIndex, 10);
                const localPage = parseInt(canvas.dataset.localPage, 10);
                renderThumbnail(docIndex, localPage, canvas);
                observer.unobserve(canvas);
            }
        });
    }, { root: resultsList, rootMargin: '0px 0px 200px 0px' });
}


// === Search Function ===
function searchKeyword() {
    const input = searchInputElem?.value.trim();
    searchResults = [];
    currentFileFilter = 'all';

    const searchingOption = '<option value="">搜尋中...</option>';
    if (resultsDropdown) resultsDropdown.innerHTML = searchingOption;
    if (panelResultsDropdown) panelResultsDropdown.innerHTML = searchingOption;
    if (fileFilterDropdown) fileFilterDropdown.innerHTML = '<option value="all">所有檔案</option>';
    if (panelFileFilterDropdown) panelFileFilterDropdown.innerHTML = '<option value="all">所有檔案</option>';
    if (resultsList) resultsList.innerHTML = '搜尋中，請稍候...';
    updateResultsNav();

    if (!pdfDocs.length || !input) {
        if (pdfDocs.length > 0) renderPage(currentPage, null);
        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">Search Results</option>';
        if (panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">Search Results</option>';
        if (resultsList) resultsList.innerHTML = '';
        updateResultsNav();
        return;
    }

    let pattern;
    try {
        pattern = createSearchPattern(input);
        if (!pattern) {
            if (pdfDocs.length > 0) renderPage(currentPage, null);
            if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">Search Results</option>';
            if (panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">Search Results</option>';
            if (resultsList) resultsList.innerHTML = '';
            updateResultsNav();
            return;
        }
    } catch (e) {
        showNotification('正規表達式錯誤：' + e.message, 'error');
        if (resultsDropdown) resultsDropdown.innerHTML = '<option value="">Search Results</option>';
        if (panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">Search Results</option>';
        if (resultsList) resultsList.innerHTML = '';
        updateResultsNav();
        return;
    }

    let promises = [];
    let globalPageOffset = 0;

    // Item 3: Use cached text content for search performance
    pdfDocs.forEach((doc, docIndex) => {
        for (let i = 1; i <= doc.numPages; i++) {
            const currentGlobalPageForSearch = globalPageOffset + i;
            const pageInfo = pageMap[currentGlobalPageForSearch - 1];

            promises.push(
                getCachedTextContent(docIndex, i)
                    .then(textContent => {
                        const pageText = textContent.items.map(item => item.str).join('');
                        pattern.lastIndex = 0;
                        if (pattern.test(pageText)) {
                            pattern.lastIndex = 0;
                            const matchResult = pattern.exec(pageText);
                            let foundMatchSummary = '找到符合項目';

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
                            return {
                                page: currentGlobalPageForSearch,
                                summary: foundMatchSummary,
                                docName: pageInfo.docName,
                                docIndex: pageInfo.docIndex,
                                localPage: pageInfo.localPage
                            };
                        }
                        return null;
                    })
                    .catch(err => {
                        console.warn(`Error processing page for search: Doc ${pageInfo.docName}, Page ${i}`, err);
                        return null;
                    })
            );
        }
        globalPageOffset += doc.numPages;
    });

    Promise.all(promises).then(allPageResults => {
        searchResults = allPageResults
            .filter(r => r !== null)
            .sort((a, b) => a.page - b.page);

        if (resultsDropdown) resultsDropdown.innerHTML = '';
        if (panelResultsDropdown) panelResultsDropdown.innerHTML = '';
        if (resultsList) resultsList.innerHTML = '';

        if (searchResults.length === 0) {
            const notFoundMsg = '<option>找不到關鍵字</option>';
            if (resultsDropdown) resultsDropdown.innerHTML = notFoundMsg;
            if (panelResultsDropdown) panelResultsDropdown.innerHTML = notFoundMsg;
            if (fileFilterDropdown) fileFilterDropdown.innerHTML = '<option value="all">所有檔案</option>';
            if (panelFileFilterDropdown) panelFileFilterDropdown.innerHTML = '<option value="all">所有檔案</option>';
            if (resultsList) resultsList.innerHTML = '<p style="padding: 10px;">找不到關鍵字。</p>';
            renderPage(currentPage, null);
            showNotification('找不到符合結果', 'info');
        } else {
            // IMPORTANT: Expand the panel BEFORE populating results
            // This ensures the container has proper width when thumbnails are observed
            updateResultsNav();
            updateFilterAndResults('all');
            if (searchResults.length > 0) {
                goToPage(searchResults[0].page, pattern);
            }
            showNotification(`找到 ${searchResults.length} 個符合結果`, 'success');
        }
        // Also call for the no-results case
        if (searchResults.length === 0) {
            updateResultsNav();
        }

        if (isMobileView() && appContainer?.classList.contains('menu-active')) {
            appContainer.classList.remove('menu-active');
        }
    }).catch(err => {
        console.error('An unexpected error occurred during search:', err);
        const errorMsg = '<option value="">搜尋錯誤</option>';
        if (resultsDropdown) resultsDropdown.innerHTML = errorMsg;
        if (panelResultsDropdown) panelResultsDropdown.innerHTML = errorMsg;
        if (resultsList) resultsList.innerHTML = '<p style="padding: 10px;">搜尋時發生錯誤。</p>';
        renderPage(currentPage, null);
        updateResultsNav();
        showNotification('搜尋時發生錯誤', 'error');
    });
}

function updateResultsNav() {
    const hasResults = searchResults.length > 0;
    document.body.classList.toggle('results-bar-visible', hasResults);
    appContainer?.classList.toggle('results-panel-visible', hasResults);
}


function updateFilterAndResults(selectedFile = 'all') {
    currentFileFilter = selectedFile;
    const docNames = [...new Set(searchResults.map(r => r.docName))];
    const fileDropdowns = [fileFilterDropdown, panelFileFilterDropdown];

    fileDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        dropdown.innerHTML = '<option value="all">所有檔案</option>';
        docNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            dropdown.appendChild(option);
        });
        dropdown.value = currentFileFilter;
    });

    const filteredResults = currentFileFilter === 'all'
        ? searchResults
        : searchResults.filter(r => r.docName === currentFileFilter);

    const summaryDropdowns = [resultsDropdown, panelResultsDropdown];
    summaryDropdowns.forEach(dropdown => {
        if (!dropdown) return;
        dropdown.innerHTML = '';
        if (filteredResults.length === 0) {
            dropdown.innerHTML = '<option value="">此檔案中無符合結果</option>';
        } else {
            filteredResults.forEach(result => {
                const option = document.createElement('option');
                option.value = result.page;
                option.innerHTML = `第 ${result.page} 頁：${result.summary}`;
                dropdown.appendChild(option);
            });
        }
    });

    if (resultsList) {
        resultsList.innerHTML = '';
        if (filteredResults.length === 0) {
            resultsList.innerHTML = '<p style="padding: 10px;">此檔案中找不到符合結果。</p>';
        } else {
            initThumbnailObserver();
            filteredResults.forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `
                    <canvas class="thumbnail-canvas" data-doc-index="${result.docIndex}" data-local-page="${result.localPage}"></canvas>
                    <div class="page-info">第 ${result.page} 頁 (檔案: ${result.docName})</div>
                    <div class="context-snippet">${result.summary}</div>
                `;
                resultItem.addEventListener('click', () => {
                    goToPage(result.page, getPatternFromSearchInput());
                });
                resultsList.appendChild(resultItem);
                const thumbnailCanvas = resultItem.querySelector('.thumbnail-canvas');
                thumbnailObserver.observe(thumbnailCanvas);
            });
        }
    }

    const currentPageResult = filteredResults.find(r => r.page === currentPage);
    if (currentPageResult) {
        summaryDropdowns.forEach(d => {
            if (d) d.value = currentPage;
        });
    }
}

// === Search Event Listeners ===
searchActionButton?.addEventListener('click', searchKeyword);
searchInputElem?.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchActionButton?.click();
    }
});

resultsDropdown?.addEventListener('change', () => {
    goToPageDropdown(resultsDropdown.value);
});

panelResultsDropdown?.addEventListener('change', () => {
    goToPageDropdown(panelResultsDropdown.value);
});

fileFilterDropdown?.addEventListener('change', e => {
    updateFilterAndResults(e.target.value);
});

panelFileFilterDropdown?.addEventListener('change', e => {
    updateFilterAndResults(e.target.value);
});

function goToPageDropdown(pageNumStr) {
    if (pageNumStr) {
        const pageNum = parseInt(pageNumStr);
        goToPage(pageNum, getPatternFromSearchInput());
    }
}

function goToPage(globalPageNum, highlightPatternForPage = null) {
    if (!pdfDocs.length || isNaN(globalPageNum)) return;

    const n = Math.max(1, Math.min(globalPageNum, globalTotalPages));
    const currentGlobalPattern = getPatternFromSearchInput();
    const requestedPatternKey = getPatternKey(highlightPatternForPage);
    const currentPatternKey = getPatternKey(currentGlobalPattern);

    if (pageRendering && currentPage === n &&
        requestedPatternKey === currentPatternKey) {
        return;
    }

    if (pageRendering && !(currentPage === n &&
        requestedPatternKey !== currentPatternKey)) {
        return;
    }

    currentPage = n;
    const finalHighlightPattern = highlightPatternForPage !== null
        ? highlightPatternForPage
        : currentGlobalPattern;

    renderPage(currentPage, finalHighlightPattern);

    if (pageToGoInput) pageToGoInput.value = currentPage;
    if (pageSlider) pageSlider.value = currentPage;
    if (resultsDropdown) resultsDropdown.value = currentPage;
    if (panelResultsDropdown) panelResultsDropdown.value = currentPage;
}

function getPatternFromSearchInput() {
    const i = searchInputElem?.value.trim();
    if (!i) return null;

    try {
        return createSearchPattern(i);
    } catch (e) {
        console.warn('Could not create regex from input:', e);
        return null;
    }
}

function createSearchPattern(input) {
    if (input.startsWith('/') && input.lastIndexOf('/') > 0) {
        const lastSlashIndex = input.lastIndexOf('/');
        return new RegExp(input.slice(1, lastSlashIndex), input.slice(lastSlashIndex + 1));
    }

    const escapedInput = input.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');
    const keywords = escapedInput.split(/\s+/).filter(keyword => keyword.length > 0);
    return keywords.length > 0 ? new RegExp(keywords.join('.*?'), 'gi') : null;
}

function getPatternKey(pattern) {
    if (!pattern) return '';
    if (pattern instanceof RegExp) return `/${pattern.source}/${pattern.flags}`;
    return String(pattern);
}

// === Page Navigation ===
goToFirstPageBtn?.addEventListener('click', () => {
    if (pdfDocs.length > 0) goToPage(1, getPatternFromSearchInput());
});

prevPageBtn?.addEventListener('click', () => {
    if (currentPage > 1) goToPage(currentPage - 1, getPatternFromSearchInput());
});

nextPageBtn?.addEventListener('click', () => {
    if (pdfDocs.length > 0 && currentPage < globalTotalPages) {
        goToPage(currentPage + 1, getPatternFromSearchInput());
    }
});

goToPageBtn?.addEventListener('click', () => {
    const pn = parseInt(pageToGoInput?.value);
    if (!isNaN(pn)) goToPage(pn, getPatternFromSearchInput());
});

pageToGoInput?.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        goToPageBtn?.click();
    }
});

pageSlider?.addEventListener('input', () => {
    const newPage = parseInt(pageSlider.value);
    if (pageToGoInput) pageToGoInput.value = newPage;
    if (currentPage !== newPage) goToPage(newPage, getPatternFromSearchInput());
});

// === Tool Buttons ===
toggleUnderlineBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    showSearchResultsHighlights = !showSearchResultsHighlights;
    renderPage(currentPage, getPatternFromSearchInput());
});

function deactivateAllModes(except = null) {
    if (except !== 'highlighter') {
        highlighterEnabled = false;
        if (toggleHighlighterBtn) toggleHighlighterBtn.classList.remove('active');
    }
    if (except !== 'magnifier') {
        localMagnifierEnabled = false;
        if (toggleLocalMagnifierBtn) toggleLocalMagnifierBtn.classList.remove('active');
        if (magnifierGlass) magnifierGlass.style.display = 'none';
        if (localMagnifierZoomControlsDiv) localMagnifierZoomControlsDiv.style.display = 'none';
    }
    if (except !== 'selection') {
        textSelectionModeActive = false;
        if (toggleTextSelectionBtn) toggleTextSelectionBtn.classList.remove('active');
        if (textLayerDivGlobal) textLayerDivGlobal.classList.remove('text-selection-active');
        paragraphSelectionModeActive = false;
        if (toggleParagraphSelectionBtn) toggleParagraphSelectionBtn.classList.remove('active');
        clearParagraphHighlights();
    }
    if (except !== 'notes') {
        notesModeActive = false;
        if (toggleNotesBtn) toggleNotesBtn.classList.remove('active');
        if (pdfContainer) pdfContainer.classList.remove('notes-mode');
        if (canvasWrapper) canvasWrapper.classList.remove('notes-mode');
        if (notesLayer) notesLayer.classList.remove('active');
    }
    updatePageControls();
}

toggleHighlighterBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    const wasActive = highlighterEnabled;
    deactivateAllModes();
    if (!wasActive) {
        highlighterEnabled = true;
        if (drawingCanvas) drawingCanvas.style.pointerEvents = 'auto';
    }
    updatePageControls();
});

toggleNotesBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    const wasActive = notesModeActive;
    deactivateAllModes();
    if (!wasActive) {
        notesModeActive = true;
        if (pdfContainer) pdfContainer.classList.add('notes-mode');
        if (canvasWrapper) canvasWrapper.classList.add('notes-mode');
        if (notesLayer) notesLayer.classList.add('active');
    }
    updatePageControls();
});

viewNotesBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    notesListPanel?.classList.toggle('active');
    if (notesListPanel?.classList.contains('active')) {
        showNotesList();
    }
});

toggleTextSelectionBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    const wasActive = textSelectionModeActive;
    deactivateAllModes();
    if (!wasActive) {
        textSelectionModeActive = true;
        if (textLayerDivGlobal) {
            textLayerDivGlobal.style.pointerEvents = 'auto';
            textLayerDivGlobal.classList.add('text-selection-active');
        }
        // Keep canvas visible - text layer is transparent overlay
    }
    updatePageControls();
});

toggleLocalMagnifierBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    const wasActive = localMagnifierEnabled;
    deactivateAllModes();
    if (!wasActive) {
        localMagnifierEnabled = true;
    }
    updatePageControls();
});

toggleParagraphSelectionBtn?.addEventListener('click', () => {
    if (!pdfDocs.length || !textSelectionModeActive) return;

    paragraphSelectionModeActive = !paragraphSelectionModeActive;

    if (paragraphSelectionModeActive) {
        if (pdfContainer) pdfContainer.classList.add('paragraph-selection-mode');
    } else {
        if (pdfContainer) pdfContainer.classList.remove('paragraph-selection-mode');
        clearParagraphHighlights();
    }

    updatePageControls();
});

clearHighlighterBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    drawingCtx?.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    showNotification('已清除螢光筆標記', 'success');
});

// Note Modal Actions
saveNoteBtn?.addEventListener('click', saveCurrentNote);
cancelNoteBtn?.addEventListener('click', closeNoteModalFunc);
closeNoteModal?.addEventListener('click', closeNoteModalFunc);
deleteNoteBtn?.addEventListener('click', deleteCurrentNote);

// Close Notes List
closeNotesList?.addEventListener('click', () => {
    notesListPanel?.classList.remove('active');
});

copyPageTextBtn?.addEventListener('click', async () => {
    if (!pdfDocs.length || pageRendering) return;

    const pageInfo = getDocAndLocalPage(currentPage);
    if (!pageInfo) {
        showNotification('無法取得目前頁面資訊', 'error');
        return;
    }

    try {
        const page = await pageInfo.doc.getPage(pageInfo.localPage);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join('\n');
        await navigator.clipboard.writeText(pageText);
        showNotification('已複製整頁文字到剪貼簿', 'success');
    } catch (err) {
        console.error('Failed to copy text:', err);
        showNotification('複製頁面文字失敗', 'error');
    }
});

sharePageBtn?.addEventListener('click', async () => {
    if (!pdfDocs.length || !canvas) {
        showNotification('請先載入 PDF 檔案', 'error');
        return;
    }
    if (pageRendering) {
        showNotification('頁面仍在渲染中，請稍候', 'warning');
        return;
    }
    if (!navigator.share) {
        showNotification('您的瀏覽器不支援分享功能（需要 HTTPS 網站）', 'error');
        return;
    }

    const SHARE_RESOLUTION_MULTIPLIER = 2.0;
    const originalBtnText = sharePageBtn.innerHTML;
    sharePageBtn.disabled = true;
    sharePageBtn.innerHTML = '<span class="loading-spinner"></span> 準備中...';

    try {
        const pageInfo = getDocAndLocalPage(currentPage);
        if (!pageInfo) throw new Error('無法取得目前頁面資訊');

        const page = await pageInfo.doc.getPage(pageInfo.localPage);
        const shareViewport = page.getViewport({
            scale: currentScale * SHARE_RESOLUTION_MULTIPLIER
        });

        const tc = document.createElement('canvas');
        tc.width = shareViewport.width;
        tc.height = shareViewport.height;
        const tctx_share = tc.getContext('2d');
        if (!tctx_share) throw new Error('無法獲取分享畫布的渲染上下文');

        const renderContext = {
            canvasContext: tctx_share,
            viewport: shareViewport
        };
        await page.render(renderContext).promise;

        if (drawingCanvas?.width > 0) {
            tctx_share.drawImage(
                drawingCanvas,
                0, 0, drawingCanvas.width, drawingCanvas.height,
                0, 0, tc.width, tc.height
            );
        }

        const blob = await new Promise(resolve => tc.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('無法從畫布產生圖片資料');

        const docNamePart = pageInfo.docName.replace(/\.pdf$/i, '');
        const fn = `page_${currentPage}_(${docNamePart}-p${pageInfo.localPage})_annotated_HD.png`;
        const f = new File([blob], fn, { type: 'image/png' });
        const sd = {
            title: `PDF 全域第 ${currentPage} 頁`,
            text: `來自 ${docNamePart} 的第 ${pageInfo.localPage} 頁 (PDF 工具)`,
            files: [f]
        };

        if (navigator.canShare && navigator.canShare({ files: [f] })) {
            await navigator.share(sd);
        } else {
            showNotification('您的瀏覽器不支援檔案分享', 'error');
        }
    } catch (er) {
        console.error('Share error:', er);
        if (er.name !== 'AbortError') {
            showNotification('分享失敗：' + er.message, 'error');
        }
    } finally {
        sharePageBtn.disabled = false;
        sharePageBtn.innerHTML = originalBtnText;
    }
});

localMagnifierZoomSelector?.addEventListener('change', e => {
    LOCAL_MAGNIFIER_ZOOM_LEVEL = parseFloat(e.target.value);
});

function handlePointerMoveForLocalMagnifier(e) {
    if (!localMagnifierEnabled) return;
    if (e.type === 'touchmove' || e.type === 'touchstart') e.preventDefault();

    let clientX, clientY;
    if (e.touches?.length > 0) {
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
    pdfContainer.addEventListener('touchstart', handlePointerMoveForLocalMagnifier, { passive: false });
    pdfContainer.addEventListener('touchmove', handlePointerMoveForLocalMagnifier, { passive: false });
    pdfContainer.addEventListener('touchend', handlePointerLeaveForLocalMagnifier);
    pdfContainer.addEventListener('touchcancel', handlePointerLeaveForLocalMagnifier);
}

// === Window Resizing ===
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (pdfDocs.length > 0) {
            renderPage(currentPage, getPatternFromSearchInput());
        }
    }, 250);
});

// === Zoom Controls ===
// *** 修正：全部改用 forEach 迴圈 ***
fitWidthBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
        currentZoomMode = 'width';
        renderPage(currentPage, getPatternFromSearchInput());
    });
});

fitHeightBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
        currentZoomMode = 'height';
        renderPage(currentPage, getPatternFromSearchInput());
    });
});

zoomInBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
        currentZoomMode = 'custom';
        currentScale += 0.2;
        renderPage(currentPage, getPatternFromSearchInput());
    });
});

zoomOutBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
        currentZoomMode = 'custom';
        currentScale = Math.max(0.1, currentScale - 0.2);
        renderPage(currentPage, getPatternFromSearchInput());
    });
});

// === Search Result Navigation ===
function navigateToNextResult() {
    if (!searchResults.length) return;
    const nextResult = searchResults.find(r => r.page > currentPage);
    if (nextResult) {
        goToPage(nextResult.page, getPatternFromSearchInput());
    } else {
        showNotification('已是最後一個搜尋結果', 'info');
    }
}

function navigateToPreviousResult() {
    if (!searchResults.length) return;
    const prevResult = [...searchResults].reverse().find(r => r.page < currentPage);
    if (prevResult) {
        goToPage(prevResult.page, getPatternFromSearchInput());
    } else {
        showNotification('已是第一個搜尋結果', 'info');
    }
}

// === Notification System (Optimized — Item 6: styles now in style.css) ===
function showNotification(message, type = 'info') {
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const iconSpan = document.createElement('span');
    iconSpan.className = 'notification-icon';
    iconSpan.textContent = icons[type] || icons.info;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'notification-message';
    msgSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => notification.remove());

    notification.appendChild(iconSpan);
    notification.appendChild(msgSpan);
    notification.appendChild(closeBtn);

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Loading Overlay (Item 6: styles now in style.css)
function showLoadingOverlay(message = '載入中...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        const content = document.createElement('div');
        content.className = 'loading-content';
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner-large';
        const msg = document.createElement('p');
        msg.className = 'loading-message';
        msg.textContent = message;
        content.appendChild(spinner);
        content.appendChild(msg);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    } else {
        // Support both id and class selectors for loading-message element
        const messageEl = overlay.querySelector('.loading-message') || overlay.querySelector('#loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// === Touch Gestures ===
let touchStartX = 0;
let touchStartY = 0;
let isSwiping = false;
const MIN_SWIPE_DISTANCE_X = 50;
const MAX_SWIPE_DISTANCE_Y = 60;

if (pdfContainer) {
    pdfContainer.addEventListener('touchstart', e => {
        if (highlighterEnabled || textSelectionModeActive ||
            localMagnifierEnabled || paragraphSelectionModeActive ||
            e.touches.length !== 1) {
            isSwiping = false;
            return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = true;
    }, { passive: true });

    pdfContainer.addEventListener('touchend', e => {
        if (!isSwiping || e.changedTouches.length !== 1) {
            isSwiping = false;
            return;
        }
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > MIN_SWIPE_DISTANCE_X && Math.abs(diffY) < MAX_SWIPE_DISTANCE_Y) {
            const isSearchResultMode = searchResults.length > 0;
            if (diffX < 0) {
                isSearchResultMode ? navigateToNextResult() : nextPageBtn?.click();
            } else {
                isSearchResultMode ? navigateToPreviousResult() : prevPageBtn?.click();
            }
        }
        isSwiping = false;
    });

    pdfContainer.addEventListener('touchcancel', () => {
        isSwiping = false;
    });
}

// === Paragraph Selection Function ===
function clearParagraphHighlights() {
    document.querySelectorAll('.paragraph-highlight, #copy-paragraph-btn').forEach(el => el.remove());
}

function handleParagraphSelection(e) {
    if (!paragraphSelectionModeActive || !currentPageTextContent || !currentViewport || !textLayerDivGlobal) return;

    clearParagraphHighlights();

    const pos = getEventPosition(textLayerDivGlobal, e);
    const clickPoint = { x: pos.x, y: pos.y };

    let closestItem = null;
    currentPageTextContent.items.forEach(item => {
        const tx = pdfjsLib.Util.transform(currentViewport.transform, item.transform);
        const itemRect = {
            left: tx[4],
            top: tx[5] - item.height * currentViewport.scale,
            right: tx[4] + item.width * currentViewport.scale,
            bottom: tx[5]
        };
        if (clickPoint.x >= itemRect.left && clickPoint.x <= itemRect.right &&
            clickPoint.y >= itemRect.top && clickPoint.y <= itemRect.bottom) {
            closestItem = item;
        }
    });

    if (!closestItem) return;

    const lineTolerance = closestItem.height * 0.5;
    const paragraphBreakTolerance = closestItem.height * 1.5;

    const lines = [];
    let currentLine = [];
    let lastY = -1;

    currentPageTextContent.items.sort((a, b) =>
        a.transform[5] - b.transform[5] || a.transform[4] - b.transform[4]
    );

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
        if (!line.length) continue;

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
        textLayerDivGlobal.appendChild(highlight);

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
                showNotification('已複製段落', 'success');
                clearParagraphHighlights();
            } catch (err) {
                showNotification('複製失敗', 'error');
                console.error('Copy failed:', err);
            }
        };
        textLayerDivGlobal.appendChild(copyBtn);
    }
}

if (pdfContainer) {
    textLayerDivGlobal?.addEventListener('click', handleParagraphSelection);
}

// === Thumbnail Rerendering ===
function rerenderAllThumbnails() {
    if (!resultsList) return;
    initThumbnailObserver();
    const resultItems = resultsList.querySelectorAll('.result-item');

    resultItems.forEach(item => {
        const canvasEl = item.querySelector('.thumbnail-canvas');
        if (canvasEl) {
            thumbnailObserver.observe(canvasEl);
        }
    });
}

// === Panel Resizing ===
function initResizer() {
    if (!resizer || !searchResultsPanel || !mainContent) return;

    let x = 0;
    let panelWidth = 0;

    const mouseDownHandler = function (e) {
        e.preventDefault();
        x = e.clientX;
        const panelStyles = window.getComputedStyle(searchResultsPanel);
        panelWidth = parseInt(panelStyles.width, 10);

        document.body.style.userSelect = 'none';
        document.body.style.pointerEvents = 'none';

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function (e) {
        const dx = e.clientX - x;
        const newWidth = panelWidth - dx;

        const minWidth = 200;
        const maxWidth = mainContent.clientWidth * 0.7;
        if (newWidth > minWidth && newWidth < maxWidth) {
            searchResultsPanel.style.flexBasis = `${newWidth}px`;
        }
    };

    const mouseUpHandler = function () {
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);

        if (pdfDocs.length > 0) {
            renderPage(currentPage, getPatternFromSearchInput());
        }
        if (searchResults.length > 0) {
            rerenderAllThumbnails();
        }
    };

    resizer.addEventListener('mousedown', mouseDownHandler);
}

// === Keyboard Shortcuts ===
document.addEventListener('keydown', e => {
    // Ignore keydown events in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (!pdfDocs.length) return;

    switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
            e.preventDefault();
            if (searchResults.length > 0) {
                navigateToPreviousResult();
            } else {
                prevPageBtn?.click();
            }
            break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
            e.preventDefault();
            if (searchResults.length > 0) {
                navigateToNextResult();
            } else {
                nextPageBtn?.click();
            }
            break;
        case 'Home':
            e.preventDefault();
            goToPage(1, getPatternFromSearchInput());
            break;
        case 'End':
            e.preventDefault();
            goToPage(globalTotalPages, getPatternFromSearchInput());
            break;
        case 'f':
        case 'F':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                searchInputElem?.focus();
            }
            break;
        case '+':
        case '=':
            e.preventDefault();
            zoomInBtns[0]?.click(); // Trigger the first button in the list
            break;
        case '-':
            e.preventDefault();
            zoomOutBtns[0]?.click(); // Trigger the first button in the list
            break;
        case '0':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                currentZoomMode = 'height';
                renderPage(currentPage, getPatternFromSearchInput());
            }
            break;
    }
});

// === Initialize App ===
async function initializeApp() {
    try {
        await initDB();
        const storedFiles = await getFiles();
        if (storedFiles.length > 0) {
            const restoreContainer = document.getElementById('restore-session-container');
            const restoreBtn = document.getElementById('restore-session-btn');
            if (restoreContainer) restoreContainer.style.display = 'block';
            if (restoreBtn) {
                restoreBtn.onclick = async () => {
                    await loadAndProcessFiles(storedFiles);
                    restoreContainer.style.display = 'none';
                };
            }
        }
    } catch (error) {
        console.error("Could not initialize app from IndexedDB:", error);
    }
}

// Item 6: CSS Animation Injection block removed — styles now in style.css

// === Mobile Menu Toggle ===
toolbarToggleTab?.addEventListener('click', () => {
    appContainer?.classList.toggle('menu-active');
});

// Close menu when clicking outside on mobile
pdfContainer?.addEventListener('click', () => {
    if (isMobileView() && appContainer?.classList.contains('menu-active')) {
        appContainer.classList.remove('menu-active');
    }
});

// === Start Application ===
initLocalMagnifier();
updatePageControls();

// === Temporary Debug Overlay ===
const debugDiv = document.createElement('div');
debugDiv.style.position = 'fixed';
debugDiv.style.top = '10px';
debugDiv.style.right = '10px';
debugDiv.style.background = 'rgba(0, 0, 0, 0.85)';
debugDiv.style.color = '#fff';
debugDiv.style.zIndex = '99999';
debugDiv.style.padding = '10px';
debugDiv.style.fontFamily = 'monospace';
debugDiv.style.fontSize = '12px';
debugDiv.style.borderRadius = '5px';
debugDiv.id = 'debug-layout-info';
document.body.appendChild(debugDiv);

setInterval(() => {
    const pdfContainer = document.getElementById('pdf-container');
    const canvas = document.getElementById('pdf-canvas');
    const wrapper = document.getElementById('canvas-wrapper');
    debugDiv.innerHTML = `
        container: ${pdfContainer?.clientWidth}x${pdfContainer?.clientHeight}<br>
        wrapper: ${wrapper?.clientWidth}x${wrapper?.clientHeight}<br>
        canvas style: ${canvas?.style.width}x${canvas?.style.height}<br>
        canvas attr: ${canvas?.width}x${canvas?.height}<br>
        scale: ${currentScale}<br>
        zoomMode: ${currentZoomMode}
    `;
}, 500);
initResizer();
initializeApp();

console.log('✓ PDF 閱讀器已優化並初始化。');
console.log('鍵盤快速鍵：');
console.log('  ← / → ：上一頁 / 下一頁 (或上一個/下一個搜尋結果)');
console.log('  Home / End ：第一頁 / 最後一頁');
console.log('  Ctrl+F ：搜尋');
console.log('  + / - ：放大 / 縮小');
console.log('  Ctrl+0 ：重設縮放 (符合高度)');
