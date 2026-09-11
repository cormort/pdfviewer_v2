import { initDB, saveFiles, getFiles, saveNote, getNotes, updateNote, deleteNote, exportAllNotes, importAllNotes, getNotesForFile, clearAllFiles } from './db.js?v=62';

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
// This string is the single source of truth for "mobile" and must stay
// character-for-character identical to the media query style.css uses for its
// mobile block. The old width arithmetic disagreed with it — an 800x600 window
// was mobile to JS while CSS was still laying out the tablet rules.
const MOBILE_MEDIA_QUERY = '(max-width: 768px), (orientation: landscape) and (max-height: 500px)';
const mobileMediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

function isMobileView() {
    return mobileMediaQuery.matches;
}

// === DOM Element Selection ===
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas?.getContext('2d');
const appContainer = document.getElementById('app-container');
const pdfContainer = document.getElementById('pdf-container');
const textLayerDivGlobal = document.getElementById('text-layer');

// Navigation Controls
const goToFirstPageBtn = document.getElementById('go-to-first-page');
const prevPageBtn = document.getElementById('prev-page');
const pagePrevOverlay = document.getElementById('page-prev-overlay');
const pageNextOverlay = document.getElementById('page-next-overlay');
const nextPageBtn = document.getElementById('next-page');
const pageNumDisplay = document.getElementById('page-num-display');
const pageToGoInput = document.getElementById('page-to-go');
const goToPageBtn = document.getElementById('go-to-page-btn');
const pageSlider = document.getElementById('page-slider');
const pageChip = document.getElementById('page-chip');

// Search Related
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
const emptyStateWrap = document.getElementById('empty-state-wrap');
const canvasWrapper = document.getElementById('canvas-wrapper');
const toolbarToggleTab = document.getElementById('toolbar-toggle-tab');

// === Mode Status ===
let localMagnifierEnabled = false;
const LOCAL_MAGNIFIER_SIZE = 120;
let LOCAL_MAGNIFIER_ZOOM_LEVEL = 2.5;

let showSearchResultsHighlights = true;
let highlighterEnabled = false;
let textSelectionModeActive = false;
let notesModeActive = false;
let currentEditingNote = null;
let currentNotePosition = null;
let currentRenderEpoch = 0;
let currentSearchToken = 0;
const highlighterStrokes = new Map(); // `${docIndex}:${localPage}` -> stroke[]
let pageItemGeometry = null;   // per-render text-item rects, see getPageItemGeometry()
let currentStroke = null;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Icons are references into the inline sprite in index.html (see
// THIRD-PARTY-NOTICES.md). Inline SVG instead of emoji: the glyphs rendered
// differently on every platform, could not follow currentColor, and four of the
// tool buttons were near-indistinguishable paper emoji.
function iconSvg(name) {
    return `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}

// === Core Function: Reset App ===
function resetApp() {
    // Dropping the array alone leaks the worker-side document; reopening files
    // repeatedly kept every previous one alive.
    pdfDocs.forEach(doc => {
        try { doc.destroy(); } catch (e) { console.warn('Failed to destroy PDF document', e); }
    });
    pdfDocs = [];
    pageMap = [];
    globalTotalPages = 0;
    currentPage = 1;
    searchResults = [];
    currentFileFilter = 'all';
    notesModeActive = false;
    currentEditingNote = null;
    textContentCache.clear(); // Item 3: clear search cache
    highlighterStrokes.clear();
    currentRenderEpoch++; // orphan any in-flight render before tearing state down
    if (currentRenderTask) { currentRenderTask.cancel(); currentRenderTask = null; } // Item 4

    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    if (textLayerDivGlobal) textLayerDivGlobal.innerHTML = '';
    if (resultsList) resultsList.innerHTML = '';
    if (notesLayer) notesLayer.innerHTML = '';

    // Reset dropdowns
    const dropdowns = [
        { elem: panelResultsDropdown, default: '<option value="">搜尋結果</option>' },
        { elem: fileFilterDropdown, default: '<option value="all">所有檔案</option>' },
        { elem: panelFileFilterDropdown, default: '<option value="all">所有檔案</option>' }
    ];
    dropdowns.forEach(({ elem, default: defaultHTML }) => {
        if (elem) elem.innerHTML = defaultHTML;
    });

    // Toggle Empty State UI
    if (emptyStateWrap) emptyStateWrap.style.display = 'flex';
    if (canvasWrapper) canvasWrapper.style.display = 'none';

    // Show/hide file input
    if (fileInputLabel) fileInputLabel.style.display = 'inline-flex';
    if (clearSessionBtn) clearSessionBtn.style.display = 'none';
    syncRestoreButton();

    updatePageControls();
    updateResultsNav();
}

// === Core Function: Load and Process Files ===
async function loadAndProcessFiles(files) {
    if (!files?.length) return;

    // Show loading animation
    showLoadingOverlay('載入 PDF 中...');
    console.log('Starting loadAndProcessFiles...');

    resetApp();

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

    deactivateAllModes();

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
        if (emptyStateWrap) emptyStateWrap.style.display = 'none';
        if (canvasWrapper) canvasWrapper.style.display = 'block';

        renderPage(1);

        // Update file switch dropdown
        updateFileSwitchDropdown();

        // Cache the session only now: saving first meant one unreadable PDF
        // replaced a good cached set, so "開啟上次檔案" just failed again.
        try {
            await saveFiles(files);
        } catch (dbError) {
            console.warn('Could not save session to IndexedDB', dbError);
        }

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


// === Proximity reveal for the floating controls ===
// ponytail: idle 淡出是刻意的，但逐顆 hover 才亮等於要先猜位置。改成「靠近整區就整組全亮」，
// 用 rAF 節流 + 每幀只量兩個 rect；不用隱形的 hover pad，那會擋掉 PDF 上的點擊。
const PROXIMITY_MARGIN = 140;
const proximityTargets = [
    document.getElementById('floating-action-buttons'),
    document.querySelector('.page-nav-overlay')
].filter(Boolean);

// Pointer devices only. Touch devices never fire mousemove, so the class would
// never be added and the controls would stay faded — they are pinned to full
// opacity in CSS under `@media (hover: none)` instead.
if (proximityTargets.length && window.matchMedia('(hover: hover)').matches) {
    let pointer = null;
    let queued = false;

    const applyProximity = () => {
        queued = false;
        if (!pointer) return;
        for (const el of proximityTargets) {
            const r = el.getBoundingClientRect();
            const near = pointer.x >= r.left - PROXIMITY_MARGIN && pointer.x <= r.right + PROXIMITY_MARGIN &&
                         pointer.y >= r.top - PROXIMITY_MARGIN && pointer.y <= r.bottom + PROXIMITY_MARGIN;
            el.classList.toggle('controls-near', near);
        }
    };

    document.addEventListener('mousemove', (e) => {
        pointer = { x: e.clientX, y: e.clientY };
        if (!queued) {
            queued = true;
            requestAnimationFrame(applyProximity);
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        pointer = null;
        proximityTargets.forEach(el => el.classList.remove('controls-near'));
    });
}

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

// A restore button with nothing behind it is worse than no button, so its
// visibility follows what is actually stored.
async function syncRestoreButton() {
    if (!restoreSessionBtn) return;
    try {
        const files = await getFiles();
        restoreSessionBtn.style.display = files?.length ? '' : 'none';
    } catch (err) {
        console.warn('Could not read the stored session:', err);
        restoreSessionBtn.style.display = 'none';
    }
}

restoreSessionBtn?.addEventListener('click', handleRestoreSession);

// === File Input Handling ===
fileInput?.addEventListener('change', async function (e) {
    const files = Array.from(e.target.files);
    // Reset first: without it, picking the same file twice in a row fires no
    // change event at all. The notes import already does this.
    e.target.value = '';
    if (files.length === 0) return;

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

clearSessionBtn?.addEventListener('click', async () => {
    if (!confirm('確定要清除已快取的工作階段嗎？此操作無法復原。')) return;
    try {
        await clearAllFiles();
    } catch (err) {
        console.error('Clear session error:', err);
        showNotification('清除快取失敗：' + err.message, 'error');
    }
    resetApp();   // its syncRestoreButton() call re-reads the now-empty store
});

// === Helper: Get Doc and Local Page Info ===
function getDocAndLocalPage(globalPage) {
    if (globalPage < 1 || globalPage > globalTotalPages || !pageMap.length) return null;
    const mapping = pageMap[globalPage - 1];
    if (!mapping || pdfDocs[mapping.docIndex] === undefined) return null;
    return {
        doc: pdfDocs[mapping.docIndex],
        docIndex: mapping.docIndex,
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
            marker.innerHTML = iconSvg('map-pin');
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
    rememberFocus();
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
    restoreFocus();
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
        // One pass over pageMap instead of a scan per document and per note.
        const docNameByIndex = new Map();
        const globalPageByKey = new Map();
        pageMap.forEach((m, i) => {
            if (!docNameByIndex.has(m.docIndex)) docNameByIndex.set(m.docIndex, m.docName);
            globalPageByKey.set(`${m.docName}\u0000${m.localPage}`, i + 1);
        });

        const importPromises = pdfDocs.map((doc, idx) => {
            const docName = docNameByIndex.get(idx);
            return docName ? getNotesForFile(docName) : Promise.resolve([]);
        });

        const allNotesResults = await Promise.all(importPromises);
        const allNotes = allNotesResults.flat().sort((a, b) => b.createdAt - a.createdAt);

        if (allNotes.length === 0) {
            notesListContainer.innerHTML = `
                <div class="empty-notes-message">
                    <div class="icon">${iconSvg('notebook-text')}</div>
                    <p>找不到任何載入檔案的筆記。</p>
                </div>
            `;
        } else {
            notesListContainer.innerHTML = '';
            allNotes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-list-item';

                // Find global page number for this note
                const globalPageNum = globalPageByKey.get(`${note.fileId}\u0000${note.pageNum}`) || 0;

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
            const parsed = JSON.parse(event.target.result);
            if (!Array.isArray(parsed)) {
                throw new Error('Invalid backup file format (not an array)');
            }

            // A note missing fileId/pageNum/x/y renders as `left: undefined%`,
            // so drop the malformed entries rather than storing them.
            const isValidNote = n => n && typeof n === 'object' &&
                typeof n.fileId === 'string' && n.fileId !== '' &&
                Number.isFinite(Number(n.pageNum)) &&
                Number.isFinite(Number(n.x)) && Number.isFinite(Number(n.y));
            const notes = parsed.filter(isValidNote);
            const skipped = parsed.length - notes.length;
            if (notes.length === 0) {
                throw new Error('備份檔中沒有格式正確的筆記');
            }

            showLoadingOverlay('匯入筆記中...');
            await importAllNotes(notes);
            hideLoadingOverlay();

            showNotification(
                `成功匯入 ${notes.length} 則筆記！` + (skipped ? `（略過 ${skipped} 則格式錯誤）` : ''),
                'success');
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
    // canvasWrapper is already a module-level element; the getElementById here
    // ran on every pointer move.
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

// Mark (and scroll to) the result item for the page being viewed
// Thumbnail carousel: whichever card sits closest to the middle is the one the
// reader is looking at, so that is the card we light up. Separate from
// .is-current, which marks the page actually open behind the sheet.
let carouselFocusQueued = false;

function syncCarouselFocus() {
    carouselFocusQueued = false;
    if (!resultsList?.classList.contains('mode-thumb')) return;
    const items = [...resultsList.querySelectorAll('.result-item')];
    if (items.length === 0) return;

    const listRect = resultsList.getBoundingClientRect();
    const middle = listRect.left + listRect.width / 2;
    let focused = null;
    let shortest = Infinity;
    items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - middle);
        if (distance < shortest) {
            shortest = distance;
            focused = item;
        }
    });
    items.forEach(item => item.classList.toggle('is-focused', item === focused));
}

function queueCarouselFocus() {
    if (carouselFocusQueued) return;
    carouselFocusQueued = true;
    requestAnimationFrame(syncCarouselFocus);
}

resultsList?.addEventListener('scroll', queueCarouselFocus, { passive: true });

function highlightCurrentResult() {
    syncResultsBar();
    resultsList?.querySelectorAll('.result-item').forEach(item => {
        const isCurrent = Number(item.dataset.page) === currentPage;
        item.classList.toggle('is-current', isCurrent);
        if (isCurrent) item.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
}

function updatePageControls() {
    const fabContainer = document.getElementById('floating-action-buttons');
    const hasDocs = pdfDocs.length > 0;
    appContainer?.classList.toggle('has-docs', hasDocs);
    highlightCurrentResult();

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
    if (pagePrevOverlay) pagePrevOverlay.disabled = !hasDocs || currentPage === 1;
    if (pageNextOverlay) pageNextOverlay.disabled = !hasDocs || currentPage === globalTotalPages;

    if (pageSlider) {
        pageSlider.max = globalTotalPages;
        pageSlider.value = currentPage;
        pageSlider.disabled = (globalTotalPages === 1);
    }

    // The phone has no page number anywhere else: #toolbar .nav-section, which
    // holds #page-num-display along with the prev/next buttons, is hidden there.
    if (pageChip) {
        pageChip.textContent = hasDocs ? `${currentPage}/${globalTotalPages}` : '–/–';
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

    // A cancelled render still settles later. Without a generation stamp its
    // handlers would clear currentRenderTask (breaking the next cancel) and
    // finish laying out the text layer over whatever page is now on screen.
    const renderEpoch = ++currentRenderEpoch;
    const isStale = () => renderEpoch !== currentRenderEpoch;

    pageRendering = true;
    currentPageTextContent = null;
    currentViewport = null;
    pageItemGeometry = null;
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

    const { doc, docIndex, localPage } = pageInfo;

    doc.getPage(localPage).then(page => {
        if (isStale()) return;
        const viewportOriginal = page.getViewport({ scale: 1 });
        let scaleForCss;

        // clientWidth/clientHeight include the container's padding, and the
        // canvas adds a 1px border on each side. Fitting to them made the page
        // wider than the space it had to sit in — 11px clipped off each side on
        // a 390px phone, 41px on desktop — so "fit width" never actually fit.
        const containerStyle = getComputedStyle(pdfContainer);
        const px = v => parseFloat(v) || 0;
        const CANVAS_BORDER = 2;   // 1px each side, set below

        if (currentZoomMode === 'width') {
            const availableWidth = pdfContainer.clientWidth
                - px(containerStyle.paddingLeft) - px(containerStyle.paddingRight)
                - CANVAS_BORDER;
            scaleForCss = availableWidth / viewportOriginal.width;
        } else if (currentZoomMode === 'height') {
            const availableHeight = pdfContainer.clientHeight
                - px(containerStyle.paddingTop) - px(containerStyle.paddingBottom)
                - CANVAS_BORDER;
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
            if (isStale()) return;
            currentRenderTask = null;
            pageRendering = false;
            updatePageControls();

            // offsetTop/Left land on the canvas border box, but the bitmap starts
            // inside the 1px border set above — clientTop/Left is that border width.
            const canvasOffsetTop = canvas.offsetTop + canvas.clientTop;
            const canvasOffsetLeft = canvas.offsetLeft + canvas.clientLeft;

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
                redrawHighlighterStrokes();
            }

            return renderTextLayer(page, viewportCss, highlightPattern, docIndex, localPage, isStale);
        }).catch(reason => {
            if (isStale()) return;
            currentRenderTask = null;
            // Item 4: Gracefully handle cancelled renders
            if (reason?.name === 'RenderingCancelledException') {
                return;
            }
            console.error(`Error rendering page ${localPage}:`, reason);
            pageRendering = false;
            updatePageControls();
        });
    }).catch(reason => {
        if (isStale()) return;
        console.error(`Error getting page ${localPage}:`, reason);
        pageRendering = false;
        updatePageControls();
    });
}

// Item 3: Cached text content retrieval.
// Bounded LRU — a full textContent per page is heavy, and the old unbounded
// Map held every page of every open document until the next reset.
const TEXT_CACHE_LIMIT = 300;

async function getCachedTextContent(docIndex, localPage) {
    const key = `${docIndex}:${localPage}`;
    if (textContentCache.has(key)) {
        const hit = textContentCache.get(key);
        textContentCache.delete(key);   // re-insert to mark as most recent
        textContentCache.set(key, hit);
        return hit;
    }
    const page = await pdfDocs[docIndex].getPage(localPage);
    const tc = await page.getTextContent();
    textContentCache.set(key, tc);
    if (textContentCache.size > TEXT_CACHE_LIMIT) {
        textContentCache.delete(textContentCache.keys().next().value);
    }
    return tc;
}

function renderTextLayer(page, viewport, highlightPattern, docIndex, localPage, isStale = () => false) {
    if (!textLayerDivGlobal) return Promise.resolve();

    // Clear existing text layer
    textLayerDivGlobal.innerHTML = '';

    if (!pdfjsLib?.TextLayer) {
        console.warn('pdfjsLib.TextLayer not available, skipping text layer rendering');
        return Promise.resolve();
    }

    return getCachedTextContent(docIndex, localPage).then(textContent => {
        if (isStale()) return;
        currentPageTextContent = textContent;
        pageItemGeometry = null;

        // Handle empty text content (scanned PDFs / image-based PDFs)
        if (!textContent || !textContent.items || textContent.items.length === 0) {
            console.log('No text content found on this page (possibly a scanned PDF)');
            return;
        }

        // TextLayer emits spans positioned in *unscaled* PDF units: left/top as a
        // percentage of the container, font-size via --total-scale-factor. It also
        // does the two things a hand-rolled layer gets wrong — offsetting by the
        // font's real ascent instead of its full height, and measuring each run to
        // apply a scaleX that pins its width to the canvas glyph run.
        textLayerDivGlobal.style.setProperty('--total-scale-factor', viewport.scale);

        const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerDivGlobal,
            viewport
        });

        return textLayer.render().then(() => {
            if (isStale() || !highlightPattern) return;
            for (const span of textLayerDivGlobal.querySelectorAll('span[role="presentation"]')) {
                highlightPattern.lastIndex = 0;
                if (highlightPattern.test(span.textContent)) {
                    span.classList.add('wavy-underline');
                }
            }
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

// Strokes are kept per page in normalised (0..1) coordinates and repainted
// after every render. The canvas is resized and cleared on each page turn,
// zoom change and resize, so without this the marks lasted until the next one.
function currentStrokeKey() {
    const info = getDocAndLocalPage(currentPage);
    return info ? `${info.docIndex}:${info.localPage}` : null;
}

function redrawHighlighterStrokes() {
    if (!drawingCtx || !drawingCanvas) return;
    const key = currentStrokeKey();
    const strokes = key && highlighterStrokes.get(key);
    if (!strokes?.length) return;
    const { width, height } = drawingCanvas;
    for (const stroke of strokes) {
        drawingCtx.beginPath();
        stroke.forEach(({ x, y }, i) => {
            const px = x * width, py = y * height;
            if (i === 0) drawingCtx.moveTo(px, py);
            else drawingCtx.lineTo(px, py);
        });
        drawingCtx.stroke();
    }
}

function startDrawing(e) {
    if (!highlighterEnabled || !drawingCtx) return;
    isDrawing = true;
    const pos = getEventPosition(drawingCanvas, e);
    [lastX, lastY] = [pos.x, pos.y];
    currentStroke = [{ x: pos.x / drawingCanvas.width, y: pos.y / drawingCanvas.height }];
    drawingCtx.beginPath();
    drawingCtx.moveTo(lastX, lastY);
    if (e.type === 'touchstart') e.preventDefault();
}

function draw(e) {
    if (!isDrawing || !highlighterEnabled || !drawingCtx) return;
    const pos = getEventPosition(drawingCanvas, e);
    drawingCtx.lineTo(pos.x, pos.y);
    drawingCtx.stroke();
    currentStroke?.push({ x: pos.x / drawingCanvas.width, y: pos.y / drawingCanvas.height });
    [lastX, lastY] = [pos.x, pos.y];
    if (e.type === 'touchmove') e.preventDefault();
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    const key = currentStrokeKey();
    if (key && currentStroke?.length > 1) {
        if (!highlighterStrokes.has(key)) highlighterStrokes.set(key, []);
        highlighterStrokes.get(key).push(currentStroke);
    }
    currentStroke = null;
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
const THUMBNAIL_RETRY_LIMIT = 5;

async function renderThumbnail(docIndex, localPageNum, canvasEl, attempt = 0, pattern = getPatternFromSearchInput()) {
    try {
        const doc = pdfDocs[docIndex];
        if (!doc || !canvasEl) return;

        // List mode hides the thumbnails entirely — rendering a full page into
        // a display:none canvas is pure waste, and list is the default view.
        if (resultsList?.classList.contains('mode-list')) return;

        // Guard: If parent width is 0 or too small, wait and retry.
        // Bounded: an unmounted canvas never gets a width, and the old
        // unbounded recursion kept both the timer and the element alive.
        const parentWidth = canvasEl.parentElement?.clientWidth || 0;
        if (parentWidth <= 30) {
            if (!canvasEl.isConnected || attempt >= THUMBNAIL_RETRY_LIMIT) return;
            setTimeout(() => renderThumbnail(docIndex, localPageNum, canvasEl, attempt + 1, pattern), 150);
            return;
        }

        const page = await doc.getPage(localPageNum);
        const viewport = page.getViewport({ scale: 1 });
        // The card is CSS-sized, so the backing store can carry device pixels.
        // Capped at 2x: the carousel shows these near full width and 1x is soft.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = ((parentWidth - 20) * dpr) / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const thumbnailCtx = canvasEl.getContext('2d');

        canvasEl.height = scaledViewport.height;
        canvasEl.width = scaledViewport.width;


        const renderContext = {
            canvasContext: thumbnailCtx,
            viewport: scaledViewport
        };
        await page.render(renderContext).promise;

        await drawThumbnailMatches(docIndex, localPageNum, scaledViewport, thumbnailCtx, pattern);
    } catch (error) {
        console.error(`Failed to render thumbnail for doc ${docIndex} page ${localPageNum}:`, error);
    }
}

// The reading view marks a match by underlining the whole text run that
// contains it (see the text layer above). A thumbnail has no text layer, so the
// same marks are drawn straight onto the canvas, which is also what lets the
// exported PNG and the carousel card show where the keyword sits.
async function drawThumbnailMatches(docIndex, localPageNum, viewport, ctx, pattern) {
    if (!pattern) return;

    // Same cache the search and the text layer fill; this used to be a third,
    // uncached getTextContent for every thumbnail.
    const textContent = await getCachedTextContent(docIndex, localPageNum);
    if (!textContent?.items?.length) return;      // scanned PDF: nothing to mark

    ctx.save();
    ctx.strokeStyle = '#f31260';                  // --danger-color, as in the reading view
    ctx.lineWidth = Math.max(1, viewport.scale * 0.9);
    ctx.lineJoin = 'round';

    for (const item of textContent.items) {
        if (!item.str) continue;
        pattern.lastIndex = 0;
        if (!pattern.test(item.str)) continue;

        // item.transform is text space; this puts its baseline on the canvas.
        const [a, b, , , e, f] = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const width = item.width * viewport.scale;
        if (width <= 0) continue;

        // Rotated or vertical runs would need the full matrix; underlining them
        // horizontally would land the mark in the wrong place, so leave them.
        if (Math.abs(b) > Math.abs(a) * 0.1) continue;

        const fontSize = Math.hypot(a, b) || viewport.scale * 10;
        drawWavyLine(ctx, e, f + fontSize * 0.18, width, fontSize * 0.16);
    }

    ctx.restore();
}

// A sine wave, so the mark reads the same as the CSS wavy underline it mirrors.
function drawWavyLine(ctx, x, y, width, amplitude) {
    const wavelength = Math.max(3, amplitude * 4);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let dx = 0; dx <= width; dx += 1) {
        ctx.lineTo(x + dx, y + Math.sin((dx / wavelength) * Math.PI * 2) * amplitude);
    }
    ctx.stroke();
}

function initThumbnailObserver() {
    if (thumbnailObserver) {
        thumbnailObserver.disconnect();
    }

    // Compile the search pattern once for the whole batch rather than once per card.
    const pattern = getPatternFromSearchInput();

    thumbnailObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const canvas = entry.target;
                const docIndex = parseInt(canvas.dataset.docIndex, 10);
                const localPage = parseInt(canvas.dataset.localPage, 10);
                renderThumbnail(docIndex, localPage, canvas, 0, pattern);
                observer.unobserve(canvas);
            }
        });
    }, { root: resultsList, rootMargin: '0px 0px 200px 0px' });
}


// === Search Function ===
// Runs `jobs` with a fixed number in flight. Promise.all over every page of
// every document queued thousands of getTextContent calls at once.
const SEARCH_CONCURRENCY = 8;

function runPool(jobs, limit) {
    const results = new Array(jobs.length);
    let next = 0;
    const worker = async () => {
        while (next < jobs.length) {
            const i = next++;
            results[i] = await jobs[i]();
        }
    };
    return Promise.all(
        Array.from({ length: Math.min(limit, jobs.length) }, worker)
    ).then(() => results);
}

function searchKeyword() {
    const input = searchInputElem?.value.trim();
    // A search still in flight must not overwrite the results of a newer one.
    const searchToken = ++currentSearchToken;
    searchResults = [];
    currentFileFilter = 'all';

    const searchingOption = '<option value="">搜尋中...</option>';
    if (panelResultsDropdown) panelResultsDropdown.innerHTML = searchingOption;
    if (fileFilterDropdown) fileFilterDropdown.innerHTML = '<option value="all">所有檔案</option>';
    if (panelFileFilterDropdown) panelFileFilterDropdown.innerHTML = '<option value="all">所有檔案</option>';
    if (resultsList) resultsList.innerHTML = '搜尋中，請稍候...';
    updateResultsNav();

    if (!pdfDocs.length || !input) {
        if (pdfDocs.length > 0) renderPage(currentPage, null);
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
                if (panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">Search Results</option>';
            if (resultsList) resultsList.innerHTML = '';
            updateResultsNav();
            return;
        }
    } catch (e) {
        showNotification('正規表達式錯誤：' + e.message, 'error');
        if (panelResultsDropdown) panelResultsDropdown.innerHTML = '<option value="">Search Results</option>';
        if (resultsList) resultsList.innerHTML = '';
        updateResultsNav();
        return;
    }

    const jobs = [];
    let globalPageOffset = 0;

    // Item 3: Use cached text content for search performance
    pdfDocs.forEach((doc, docIndex) => {
        for (let i = 1; i <= doc.numPages; i++) {
            const currentGlobalPageForSearch = globalPageOffset + i;
            const pageInfo = pageMap[currentGlobalPageForSearch - 1];

            jobs.push(() =>
                getCachedTextContent(docIndex, i)
                    .then(textContent => {
                        if (searchToken !== currentSearchToken) return null;
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
                                const esc = escapeHtml;
                                const preMatch = esc(pageText.substring(startIndex, matchIndex).replace(/\n/g, ' '));
                                const highlightedMatch = esc(matchedText.replace(/\n/g, ' '));
                                const postMatch = esc(pageText.substring(matchIndex + matchedText.length, endIndex).replace(/\n/g, ' '));
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

    runPool(jobs, SEARCH_CONCURRENCY).then(allPageResults => {
        if (searchToken !== currentSearchToken) return;
        searchResults = allPageResults
            .filter(r => r !== null)
            .sort((a, b) => a.page - b.page);

        if (panelResultsDropdown) panelResultsDropdown.innerHTML = '';
        if (resultsList) resultsList.innerHTML = '';

        if (searchResults.length === 0) {
            const notFoundMsg = '<option>找不到關鍵字</option>';
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
        if (searchToken !== currentSearchToken) return;
        console.error('An unexpected error occurred during search:', err);
        const errorMsg = '<option value="">搜尋錯誤</option>';
        if (panelResultsDropdown) panelResultsDropdown.innerHTML = errorMsg;
        if (resultsList) resultsList.innerHTML = '<p style="padding: 10px;">搜尋時發生錯誤。</p>';
        renderPage(currentPage, null);
        updateResultsNav();
        showNotification('搜尋時發生錯誤', 'error');
    });
}

// Picking a page is the end of the search, so the sheet gets out of the way and
// leaves a bar behind. Mobile only: the desktop panel is a column beside the
// document, not on top of it.
const resultsPanelHeader = document.getElementById('results-panel-header');
const resultsCount = document.getElementById('results-count');

const prevResultBtn = document.getElementById('prev-result-btn');
const nextResultBtn = document.getElementById('next-result-btn');

function setResultsCollapsed(collapsed) {
    document.body.classList.toggle('results-collapsed', collapsed);
}

function getFilteredResults() {
    return currentFileFilter === 'all'
        ? searchResults
        : searchResults.filter(r => r.docName === currentFileFilter);
}

// The collapsed bar is a find bar: step through the hits without reopening the
// sheet, which is what you usually want after picking one.
function stepResult(delta) {
    const results = getFilteredResults();
    if (results.length === 0) return;

    const index = results.findIndex(r => r.page === currentPage);
    let target;
    if (index === -1) {
        target = delta > 0
            ? results.find(r => r.page > currentPage) || results[0]
            : [...results].reverse().find(r => r.page < currentPage) || results[results.length - 1];
    } else {
        target = results[(index + delta + results.length) % results.length];
    }
    goToPage(target.page, getPatternFromSearchInput());
}

function syncResultsBar() {
    if (!resultsCount) return;
    const results = getFilteredResults();
    if (results.length === 0) {
        resultsCount.textContent = '';
        return;
    }
    const index = results.findIndex(r => r.page === currentPage);
    resultsCount.textContent = index === -1
        ? `共 ${results.length} 筆`
        : `第 ${currentPage} 頁 · ${index + 1} / ${results.length}`;
}

// Collapsing used to need a page tap. This is the way out that does not also
// navigate somewhere.
document.getElementById('results-collapse-btn')?.addEventListener('click', () => {
    setResultsCollapsed(true);
});

resultsPanelHeader?.addEventListener('click', () => {
    if (!isMobileView()) return;
    setResultsCollapsed(!document.body.classList.contains('results-collapsed'));
});

prevResultBtn?.addEventListener('click', e => {
    e.stopPropagation();
    stepResult(-1);
});

nextResultBtn?.addEventListener('click', e => {
    e.stopPropagation();
    stepResult(1);
});

// ponytail: bottom bars need the sheet's real height.
// +12 matches the mobile sheet's bottom gutter.
function syncPanelHeight() {
    const visible = document.body.classList.contains('results-bar-visible');
    const h = visible && searchResultsPanel ? searchResultsPanel.offsetHeight + 12 : 0;
    document.body.style.setProperty('--panel-h', `${h}px`);
}

// The sheet grows and shrinks on its own: list mode versus thumbnail mode,
// a new set of results, a rotated phone. Measuring once was not enough.
if (searchResultsPanel && 'ResizeObserver' in window) {
    new ResizeObserver(syncPanelHeight).observe(searchResultsPanel);
}

function updateResultsNav() {
    const hasResults = searchResults.length > 0;
    document.body.classList.toggle('results-bar-visible', hasResults);
    appContainer?.classList.toggle('results-panel-visible', hasResults);
    requestAnimationFrame(syncPanelHeight);
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

    const filteredResults = getFilteredResults();

    // Only one file in play: the filename tells the user nothing
    resultsList?.classList.toggle('single-doc', docNames.length <= 1);

    const summaryDropdowns = [panelResultsDropdown];
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
                resultItem.dataset.page = result.page;
                resultItem.innerHTML = `
                    <canvas class="thumbnail-canvas" data-doc-index="${result.docIndex}" data-local-page="${result.localPage}"></canvas>
                    <div class="page-info">第 ${result.page} 頁 <span class="doc-name">(檔案: ${escapeHtml(result.docName)})</span></div>
                    <div class="context-snippet">${result.summary}</div>
                `;
                resultItem.addEventListener('click', () => {
                    goToPage(result.page, getPatternFromSearchInput());
                    if (isMobileView()) setResultsCollapsed(true);
                });
                resultsList.appendChild(resultItem);
                const thumbnailCanvas = resultItem.querySelector('.thumbnail-canvas');
                thumbnailObserver.observe(thumbnailCanvas);
            });
        }
    }

    // A new search or filter is a new question: show the answers, not the bar.
    if (filteredResults.length > 0) setResultsCollapsed(false);

    highlightCurrentResult();
    queueCarouselFocus();

    const currentPageResult = filteredResults.find(r => r.page === currentPage);
    if (currentPageResult) {
        summaryDropdowns.forEach(d => {
            if (d) d.value = currentPage;
        });
    }
}

// === Export Search Results as PDF (with a simple TOC) ===
// ponytail: TOC pages are drawn on a <canvas> and embedded as images, so we get
// CJK text for free from the system fonts instead of shipping a ~10MB CJK font
// for pdf-lib. Upgrade path: embed a subset font if selectable TOC text matters.

const TOC_ITEMS_PER_PAGE = 22;

function plainSummary(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

function drawTocPage(entries, startIndex, keyword, pageNo, pageCount) {
    // A4 portrait at ~150dpi
    const c = document.createElement('canvas');
    c.width = 1240; c.height = 1754;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#111';
    g.font = 'bold 44px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
    g.fillText(pageNo === 1 ? `搜尋結果目錄：${keyword}` : `搜尋結果目錄（續 ${pageNo}/${pageCount}）`, 80, 120);
    g.strokeStyle = '#888'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(80, 150); g.lineTo(c.width - 80, 150); g.stroke();

    let y = 220;
    const clip = (text, maxWidth) => {
        if (g.measureText(text).width <= maxWidth) return text;
        let t = text;
        while (t.length > 1 && g.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
        return t + '…';
    };
    entries.slice(startIndex, startIndex + TOC_ITEMS_PER_PAGE).forEach(e => {
        g.fillStyle = '#111';
        g.font = 'bold 26px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
        g.fillText(clip(`第 ${e.newPage} 頁 ← 原第 ${e.page} 頁 — ${e.docName}`, c.width - 160), 80, y);
        g.fillStyle = '#555';
        g.font = '22px "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
        g.fillText(clip(e.snippet, c.width - 200), 110, y + 34);
        y += 66;
    });
    return c.toDataURL('image/png');
}

async function exportResultsToPdf() {
    const results = currentFileFilter === 'all'
        ? searchResults
        : searchResults.filter(r => r.docName === currentFileFilter);
    if (!results.length) {
        showNotification('沒有可匯出的搜尋結果', 'info');
        return;
    }
    showNotification('正在產生 PDF…', 'info');
    try {
        const { PDFDocument } = await import('./lib/pdf-lib/pdf-lib.esm.min.js');
        const keyword = searchInputElem?.value.trim() || '';
        const tocPages = Math.ceil(results.length / TOC_ITEMS_PER_PAGE);
        const entries = results.map((r, i) => ({
            page: r.page,
            docName: r.docName,
            snippet: plainSummary(r.summary),
            newPage: tocPages + i + 1
        }));

        const out = await PDFDocument.create();
        for (let i = 0; i < tocPages; i++) {
            const png = await out.embedPng(drawTocPage(entries, i * TOC_ITEMS_PER_PAGE, keyword, i + 1, tocPages));
            const page = out.addPage([595.28, 841.89]);
            page.drawImage(png, { x: 0, y: 0, width: 595.28, height: 841.89 });
        }

        // Group by source doc so each source PDF is parsed once
        const sources = new Map();
        for (const r of results) {
            if (!sources.has(r.docIndex)) {
                const bytes = await pdfDocs[r.docIndex].getData();
                sources.set(r.docIndex, await PDFDocument.load(bytes, { ignoreEncryption: true }));
            }
        }
        for (const r of results) {
            const [copied] = await out.copyPages(sources.get(r.docIndex), [r.localPage - 1]);
            out.addPage(copied);
        }

        const blob = new Blob([await out.save()], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `搜尋結果_${keyword || 'export'}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotification(`已匯出 ${results.length} 頁`, 'success');
    } catch (err) {
        console.error('Export results PDF failed:', err);
        showNotification('匯出 PDF 失敗', 'error');
    }
}

document.getElementById('export-results-pdf-btn')?.addEventListener('click', exportResultsToPdf);

// === Search Event Listeners ===
searchActionButton?.addEventListener('click', searchKeyword);
searchInputElem?.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchActionButton?.click();
    }
});

panelResultsDropdown?.addEventListener('change', () => {
    goToPageDropdown(panelResultsDropdown.value);
    if (isMobileView()) setResultsCollapsed(true);
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

    // Only a genuine no-op is worth skipping. renderPage already cancels the
    // in-flight render, so refusing to start one while pageRendering is true
    // just swallowed the second of two quick page turns.
    if (pageRendering && currentPage === n &&
        requestedPatternKey === currentPatternKey) {
        return;
    }

    currentPage = n;
    const finalHighlightPattern = highlightPatternForPage !== null
        ? highlightPatternForPage
        : currentGlobalPattern;

    renderPage(currentPage, finalHighlightPattern);

    if (pageToGoInput) pageToGoInput.value = currentPage;
    if (pageSlider) pageSlider.value = currentPage;
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

// Only /.../ with a valid flag tail is a regex. Without the flag check, a
// plain search for a path or a date — /usr/bin, /2026/09 — was read as a
// regex whose flags are "bin" or "09", and the user got "正規表達式錯誤"
// instead of the literal search they meant.
const REGEX_FLAGS = /^[dgimsuvy]*$/;

function createSearchPattern(input) {
    const lastSlashIndex = input.lastIndexOf('/');
    // > 1, not > 0: "//" would otherwise compile to an empty regex that
    // matches every page.
    if (input.startsWith('/') && lastSlashIndex > 1 &&
        REGEX_FLAGS.test(input.slice(lastSlashIndex + 1))) {
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

// The overlays are a second surface for the same action, not a second
// implementation — forward to the buttons that already own the behaviour.
pagePrevOverlay?.addEventListener('click', () => prevPageBtn?.click());
pageNextOverlay?.addEventListener('click', () => nextPageBtn?.click());

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
        // The canvas sits above the text layer; leaving it clickable kills text selection.
        drawingCanvas?.classList.remove('highlighter-active');
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
        textLayerDivGlobal?.classList.remove('text-selection-active');
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
        drawingCanvas?.classList.add('highlighter-active');
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
    const opening = !notesListPanel?.classList.contains('active');
    if (opening) rememberFocus();
    notesListPanel?.classList.toggle('active');
    if (opening) {
        showNotesList();
        closeNotesList?.focus();
    } else {
        restoreFocus();
    }
});

toggleTextSelectionBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    const wasActive = textSelectionModeActive;
    deactivateAllModes();
    if (!wasActive) {
        textSelectionModeActive = true;
        textLayerDivGlobal?.classList.add('text-selection-active');
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

    if (!paragraphSelectionModeActive) {
        clearParagraphHighlights();
    }

    updatePageControls();
});

clearHighlighterBtn?.addEventListener('click', () => {
    if (!pdfDocs.length) return;
    const key = currentStrokeKey();
    if (key) highlighterStrokes.delete(key);
    drawingCtx?.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    showNotification('已清除本頁螢光筆標記', 'success');
});

// Note Modal Actions
saveNoteBtn?.addEventListener('click', saveCurrentNote);
cancelNoteBtn?.addEventListener('click', closeNoteModalFunc);
closeNoteModal?.addEventListener('click', closeNoteModalFunc);
deleteNoteBtn?.addEventListener('click', deleteCurrentNote);

// Close Notes List
closeNotesList?.addEventListener('click', () => {
    notesListPanel?.classList.remove('active');
    restoreFocus();
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

// === Installable app ===
// The whole viewer runs on the device already, so a service worker is all that
// stands between this and working with no network at all.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(err => console.warn('Service worker registration failed:', err));
    });
}

// Installed as an app, it can be picked as the handler for a PDF. The file
// arrives through the launch queue rather than the file input.
if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
    window.launchQueue.setConsumer(async launchParams => {
        if (!launchParams.files || launchParams.files.length === 0) return;
        try {
            const files = await Promise.all(launchParams.files.map(handle => handle.getFile()));
            loadAndProcessFiles(files);
        } catch (err) {
            console.error('Launch file error:', err);
            showNotification('無法開啟傳入的檔案', 'error');
        }
    });
}

// === LINE in-app browser notice ===
// LINE's built-in browser reports itself as "Line/<version>" and, on newer
// builds, "/IAB". Nothing in a page can push itself out of that webview, so
// the banner offers the platform's best escape and, above it, the manual route
// that always works.
const inappBanner = document.getElementById('inapp-browser-banner');

function isLineInAppBrowser() {
    return /\bLine\/\d/i.test(navigator.userAgent);
}

function openInExternalBrowser() {
    const target = new URL(window.location.href);
    target.hash = '';
    target.searchParams.set('openExternalBrowser', '1');
    const httpsUrl = target.toString();

    // intent:// needs a real host; on a file:// page there is none and the URL
    // it builds is broken, so fall through to the plain-navigation path.
    if (/android/i.test(navigator.userAgent) && target.host) {
        const scheme = target.protocol.replace(':', '');
        window.location.href =
            `intent://${target.host}${target.pathname}${target.search}` +
            `#Intent;scheme=${scheme};package=com.android.chrome;` +
            `S.browser_fallback_url=${encodeURIComponent(httpsUrl)};end`;
        return;
    }

    // iOS: this scheme hands the URL to Safari from inside a webview. When the
    // webview refuses it nothing happens, which is why the banner keeps the
    // manual instruction visible.
    window.location.href = httpsUrl.replace(/^https?:/, 'x-safari-https:');
}

if (inappBanner) {
    if (isLineInAppBrowser() && sessionStorage.getItem('inappNoticeDismissed') !== '1') {
        inappBanner.classList.add('is-visible');
    }

    document.getElementById('inapp-open-external')?.addEventListener('click', openInExternalBrowser);

    document.getElementById('inapp-banner-close')?.addEventListener('click', () => {
        inappBanner.classList.remove('is-visible');
        try {
            sessionStorage.setItem('inappNoticeDismissed', '1');
        } catch {
            /* private mode: the notice simply comes back next load */
        }
    });
}

// Links opened from inside LINE land in its built-in browser, where file
// pickers and storage behave differently. LINE hands a link to the phone's
// default browser instead when it carries openExternalBrowser=1, and the
// parameter has to be in the link that gets sent, so the app builds it here.
// Every other app just sees an extra query parameter and ignores it.
const shareLinkBtn = document.getElementById('share-link-btn');

function buildExternalBrowserLink() {
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.set('openExternalBrowser', '1');
    return url.toString();
}

shareLinkBtn?.addEventListener('click', async () => {
    const link = buildExternalBrowserLink();
    const payload = { title: 'PDF 專業工作室', text: 'PDF 關鍵字搜尋與註解工具', url: link };

    try {
        if (navigator.share) {
            await navigator.share(payload);
            return;
        }
        await navigator.clipboard.writeText(link);
        showNotification('已複製連結，貼到 LINE 就會用預設瀏覽器開啟', 'success');
    } catch (err) {
        if (err.name === 'AbortError') return;
        try {
            await navigator.clipboard.writeText(link);
            showNotification('已複製連結，貼到 LINE 就會用預設瀏覽器開啟', 'success');
        } catch {
            showNotification('無法分享連結：' + err.message, 'error');
        }
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

// Pointer moves arrive far faster than the screen repaints; coalesce them so
// the magnifier does at most one measure-and-draw per frame.
let magnifierPointer = null;
let magnifierQueued = false;

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

    magnifierPointer = { clientX, clientY };
    if (magnifierQueued) return;
    magnifierQueued = true;
    requestAnimationFrame(() => {
        magnifierQueued = false;
        if (magnifierPointer) updateLocalMagnifier(magnifierPointer.clientX, magnifierPointer.clientY);
    });
}

function handlePointerLeaveForLocalMagnifier() {
    magnifierPointer = null;
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
        success: 'check',
        error: 'x',
        warning: 'triangle-alert',
        info: 'info'
    };

    const iconSpan = document.createElement('span');
    iconSpan.className = 'notification-icon';
    iconSpan.innerHTML = iconSvg(icons[type] || icons.info);

    const msgSpan = document.createElement('span');
    msgSpan.className = 'notification-message';
    msgSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.setAttribute('aria-label', '關閉通知');
    closeBtn.innerHTML = iconSvg('x');
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
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    const messageEl = overlay.querySelector('.loading-message');
    if (messageEl) messageEl.textContent = message;
    overlay.style.display = 'flex';
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
                isSearchResultMode ? stepResult(1) : nextPageBtn?.click();
            } else {
                isSearchResultMode ? stepResult(-1) : prevPageBtn?.click();
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

// The click hit-test used to run Util.transform over every item on the page,
// and the line grouping sorted currentPageTextContent.items *in place* — that
// array is the cached textContent shared with search and the text layer, so
// the sort silently reordered the text search joins together.
// Both now work off a per-render cache built from a copy.
// ponytail: still a linear scan of the cached rects, which is plenty for a
// click handler; bucket by row only if a page ever gets slow enough to notice.
function getPageItemGeometry() {
    if (pageItemGeometry) return pageItemGeometry;
    if (!currentPageTextContent || !currentViewport) return null;

    const scale = currentViewport.scale;
    const rects = currentPageTextContent.items.map(item => {
        const tx = pdfjsLib.Util.transform(currentViewport.transform, item.transform);
        return {
            item,
            left: tx[4],
            top: tx[5] - item.height * scale,
            right: tx[4] + item.width * scale,
            bottom: tx[5]
        };
    });
    const sortedItems = [...currentPageTextContent.items].sort((a, b) =>
        a.transform[5] - b.transform[5] || a.transform[4] - b.transform[4]
    );

    pageItemGeometry = { rects, sortedItems };
    return pageItemGeometry;
}

function handleParagraphSelection(e) {
    if (!paragraphSelectionModeActive || !currentPageTextContent || !currentViewport || !textLayerDivGlobal) return;

    clearParagraphHighlights();

    const geometry = getPageItemGeometry();
    if (!geometry) return;

    const pos = getEventPosition(textLayerDivGlobal, e);
    const clickPoint = { x: pos.x, y: pos.y };

    let closestItem = null;
    for (const r of geometry.rects) {
        if (clickPoint.x >= r.left && clickPoint.x <= r.right &&
            clickPoint.y >= r.top && clickPoint.y <= r.bottom) {
            closestItem = r.item;
        }
    }

    if (!closestItem) return;

    const lineTolerance = closestItem.height * 0.5;
    const paragraphBreakTolerance = closestItem.height * 1.5;

    const lines = [];
    let currentLine = [];
    let lastY = -1;

    geometry.sortedItems.forEach(item => {
        if (lastY === -1 || Math.abs(item.transform[5] - lastY) < lineTolerance) {
            currentLine.push(item);
        } else {
            lines.push(currentLine.sort((a, b) => a.transform[4] - b.transform[4]));
            currentLine = [item];
        }
        lastY = item.transform[5];
    });
    lines.push(currentLine.sort((a, b) => a.transform[4] - b.transform[4]));

    const clickedLineIndex = lines.findIndex(line => line.includes(closestItem));
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
    // A modal is modal: nothing behind it should react to the page shortcuts.
    if (openDialogs().length) return;

    // Don't steal keys from anything the user is operating with the keyboard.
    // SELECT needs the arrows, BUTTON needs Space, and contenteditable needs both.
    const t = e.target;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' ||
        t.tagName === 'BUTTON' || t.isContentEditable) return;

    if (!pdfDocs.length) return;

    switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
            e.preventDefault();
            if (searchResults.length > 0) {
                stepResult(-1);
            } else {
                prevPageBtn?.click();
            }
            break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
            e.preventDefault();
            if (searchResults.length > 0) {
                stepResult(1);
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
        await syncRestoreButton();
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

// Show the pdf.js version the app is actually running, rather than trusting a
// checked-in text file to be kept in step with it.
const appVersionEl = document.querySelector('.app-version');
if (appVersionEl && window.pdfjsLib?.version) {
    appVersionEl.textContent += ` · pdf.js ${window.pdfjsLib.version}`;
}

// === Start Application ===
initLocalMagnifier();
updatePageControls();

initResizer();
initializeApp();

// First visit only: the browser's own banner offers to install the app, and
// nothing says that installing is optional. Say it once — not when we are
// already running as an installed app, where the point is moot.
try {
    const installed = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
    if (!installed && !localStorage.getItem('pwaOptionalNoticeSeen')) {
        showNotification('不需安裝也能使用：直接用瀏覽器開啟即可，安裝只是多了主畫面圖示。', 'info');
        localStorage.setItem('pwaOptionalNoticeSeen', '1');
    }
} catch {
    // Private mode can throw on localStorage; the hint is not worth failing over.
}

console.log('✓ PDF 閱讀器已優化並初始化。');
console.log('鍵盤快速鍵：');
console.log('  ← / → ：上一頁 / 下一頁 (或上一個/下一個搜尋結果)');
console.log('  Home / End ：第一頁 / 最後一頁');
console.log('  Ctrl+F ：搜尋');
console.log('  + / - ：放大 / 縮小');
console.log('  Ctrl+0 ：重設縮放 (符合高度)');

// ponytail: landscape search panel is faded until touched, opaque while in use
document.addEventListener('pointerdown', (e) => {
    if (!searchResultsPanel) return;
    searchResultsPanel.classList.toggle('panel-focused', searchResultsPanel.contains(e.target));
}, true);

// === Search results: list vs thumbnail mode (user's choice, kept per browser) ===
const resultsViewToggle = document.getElementById('results-view-toggle');

function applyResultsView(mode) {
    const wasList = resultsList?.classList.contains('mode-list');
    resultsList?.classList.toggle('mode-thumb', mode === 'thumb');
    resultsList?.classList.toggle('mode-list', mode !== 'thumb');
    // The carousel is a page picker, so the strip left above it should belong
    // to the document, not to controls that do nothing while you are choosing.
    document.body.classList.toggle('thumb-mode', mode === 'thumb');
    if (resultsViewToggle) {
        const toList = mode === 'thumb';
        resultsViewToggle.innerHTML =
            iconSvg(toList ? 'list' : 'layout-grid') +
            `<span id="results-view-label">${toList ? '列表' : '縮圖'}</span>`;
    }

    // Thumbnails are skipped while in list mode, so the canvases the observer
    // already consumed are still blank when we switch back.
    if (mode === 'thumb' && wasList && thumbnailObserver && resultsList) {
        for (const c of resultsList.querySelectorAll('.thumbnail-canvas')) {
            if (!c.width) thumbnailObserver.observe(c);
        }
    }
}

applyResultsView(localStorage.getItem('resultsView') || 'list');

resultsViewToggle?.addEventListener('click', () => {
    const next = resultsList?.classList.contains('mode-thumb') ? 'list' : 'thumb';
    localStorage.setItem('resultsView', next);
    applyResultsView(next);
    highlightCurrentResult();
    queueCarouselFocus();
});

// Tapping the empty state is the same as hitting 開啟 PDF.
// It is role="button", so it has to answer Enter and Space like one.
emptyState?.addEventListener('click', () => fileInput?.click());
emptyState?.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput?.click();
    }
});

// === Dialog focus management ===
// role="dialog" + aria-modal promises the screen reader that focus is trapped.
// These two keep that promise and hand focus back where it came from.
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
let focusBeforeDialog = null;

function openDialogs() {
    return [noteModal, notesListPanel].filter(d => d?.classList.contains('active'));
}

function rememberFocus() {
    // Only the first dialog in a chain records the origin. Opening a note from
    // the notes list closes the list first, so by the time the modal asks,
    // there is no open dialog and activeElement is already <body> — checking
    // openDialogs() here is not enough, the saved value is what guards it.
    if (focusBeforeDialog) return;
    focusBeforeDialog = document.activeElement;
}

function restoreFocus() {
    if (openDialogs().length) return;   // another dialog is still up
    // The remembered element can have been hidden while the dialog was open;
    // focusing it then would drop focus to <body> anyway.
    if (focusBeforeDialog?.isConnected && focusBeforeDialog.offsetParent !== null) {
        focusBeforeDialog.focus?.();
    }
    focusBeforeDialog = null;
}

document.addEventListener('keydown', e => {
    const dialog = openDialogs().pop();
    if (!dialog) return;

    if (e.key === 'Escape') {
        if (dialog === noteModal) closeNoteModalFunc();
        else dialog.classList.remove('active');
        restoreFocus();
        return;
    }

    if (e.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll(FOCUSABLE)]
        .filter(el => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
});

// Clear button inside the search box
const clearSearchBtn = document.getElementById('clear-search-btn');

function syncClearSearchBtn() {
    if (clearSearchBtn) clearSearchBtn.hidden = !searchInputElem?.value;
}

searchInputElem?.addEventListener('input', syncClearSearchBtn);
syncClearSearchBtn();

clearSearchBtn?.addEventListener('click', () => {
    if (!searchInputElem) return;
    searchInputElem.value = '';
    syncClearSearchBtn();
    searchKeyword();   // empty input resets results, dropdowns and highlights
    searchInputElem.focus();
});
