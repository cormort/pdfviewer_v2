// db.js
const DB_NAME = 'pdf-viewer-db';
const STORE_NAME = 'files';
const NOTES_STORE = 'notes';
const DB_VERSION = 2;

let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    // 檢查 IndexedDB 是否可用
    if (!window.indexedDB) {
      console.warn("IndexedDB could not be found in this browser.");
      return reject("IndexedDB not supported");
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject('Database error');
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      // 新增 notes Object Store
      if (!dbInstance.objectStoreNames.contains(NOTES_STORE)) {
        const notesStore = dbInstance.createObjectStore(NOTES_STORE, { keyPath: 'id', autoIncrement: true });
        notesStore.createIndex('fileId', 'fileId', { unique: false });
        notesStore.createIndex('fileId_pageNum', ['fileId', 'pageNum'], { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
  });
}

export function saveFiles(files) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 先清除舊檔案
    const clearRequest = store.clear();
    clearRequest.onerror = (event) => reject('Failed to clear old files', event.target.error);

    clearRequest.onsuccess = () => {
      // 如果沒有新檔案，直接結束
      if (files.length === 0) {
        return resolve();
      }

      let count = 0;
      // 將 File 物件直接存入 IndexedDB
      files.forEach(file => {
        const addRequest = store.add({ file: file });
        addRequest.onsuccess = () => {
          count++;
          if (count === files.length) {
            resolve();
          }
        };
        addRequest.onerror = (event) => {
          console.error('Could not add file to store', event.target.error);
        }
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject('Transaction error', event.target.error);
  });
}

export function getFiles() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = (event) => reject('Failed to retrieve files', event.target.error);
    request.onsuccess = (event) => {
      // 結果是 { id: 1, file: File } 格式的陣列
      // 我們只需要 File 物件本身
      const files = event.target.result.map(item => item.file);
      resolve(files);
    };
  });
}

// === Notes CRUD Functions ===

/**
 * Save a new note to the database
 * @param {Object} note - { fileId, pageNum, x, y, content }
 * @returns {Promise<number>} The ID of the saved note
 */
export function saveNote(note) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);

    const noteData = {
      ...note,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const request = store.add(noteData);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject('Failed to save note', event.target.error);
  });
}

/**
 * Get all notes for a specific page
 * @param {string} fileId - The file identifier
 * @param {number} pageNum - The page number
 * @returns {Promise<Array>} Array of notes
 */
export function getNotes(fileId, pageNum) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const index = store.index('fileId_pageNum');
    const request = index.getAll([fileId, pageNum]);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject('Failed to get notes', event.target.error);
  });
}

/**
 * Get all notes for a file
 * @param {string} fileId - The file identifier
 * @returns {Promise<Array>} Array of notes
 */
export function getNotesForFile(fileId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const index = store.index('fileId');
    const request = index.getAll(fileId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject('Failed to get notes', event.target.error);
  });
}

/**
 * Update an existing note
 * @param {number} noteId - The note ID
 * @param {string} content - The new content
 * @returns {Promise<void>}
 */
export function updateNote(noteId, content) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const getRequest = store.get(noteId);

    getRequest.onsuccess = () => {
      const note = getRequest.result;
      if (!note) {
        reject('Note not found');
        return;
      }
      note.content = content;
      note.updatedAt = Date.now();
      const updateRequest = store.put(note);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = (event) => reject('Failed to update note', event.target.error);
    };
    getRequest.onerror = (event) => reject('Failed to get note', event.target.error);
  });
}

/**
 * Delete a note by ID
 * @param {number} noteId - The note ID
 * @returns {Promise<void>}
 */
export function deleteNote(noteId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.delete(noteId);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject('Failed to delete note', event.target.error);
  });
}

/**
 * Clear all notes for a specific file
 * @param {string} fileId - The file identifier
 * @returns {Promise<void>}
 */
export function clearNotesForFile(fileId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    getNotesForFile(fileId).then(notes => {
      const transaction = db.transaction(NOTES_STORE, 'readwrite');
      const store = transaction.objectStore(NOTES_STORE);
      notes.forEach(note => store.delete(note.id));
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject('Failed to clear notes', event.target.error);
    }).catch(reject);
  });
}

/**
 * Export all notes from the database
 * @returns {Promise<Array>} All notes in the system
 */
export function exportAllNotes() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject('Failed to export notes', event.target.error);
  });
}

/**
 * Import notes into the database
 * @param {Array} notes - Array of note objects
 * @returns {Promise<void>}
 */
export function importAllNotes(notes) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('DB not initialized');
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);

    notes.forEach(note => {
      // 移除原有的 ID，讓資料庫自動生成新 ID，並更新時間戳
      const { id, ...noteData } = note;
      store.add({
        ...noteData,
        updatedAt: Date.now()
      });
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject('Failed to import notes', event.target.error);
  });
}
