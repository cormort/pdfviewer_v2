// db.js
const DB_NAME = 'pdf-viewer-db';
const STORE_NAME = 'files';
const NOTES_STORE = 'notes';
const DB_VERSION = 2;

let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn("IndexedDB could not be found in this browser.");
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
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
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const clearRequest = store.clear();
    clearRequest.onerror = (event) => {
      console.error('Failed to clear old files', event.target.error);
      reject(event.target.error);
    };

    clearRequest.onsuccess = () => {
      if (files.length === 0) return;

      files.forEach(file => {
        store.add({ file: file });
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
}

export function getFiles() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => {
      const files = event.target.result.map(item => item.file);
      resolve(files);
    };
  });
}

// === Notes CRUD Functions ===

export function saveNote(note) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
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
    request.onerror = (event) => reject(event.target.error);
  });
}

export function getNotes(fileId, pageNum) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const index = store.index('fileId_pageNum');
    const request = index.getAll([fileId, pageNum]);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
}

export function getNotesForFile(fileId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const index = store.index('fileId');
    const request = index.getAll(fileId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
}

export function updateNote(noteId, content) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const getRequest = store.get(noteId);

    getRequest.onsuccess = () => {
      const note = getRequest.result;
      if (!note) {
        reject(new Error('Note not found'));
        return;
      }
      note.content = content;
      note.updatedAt = Date.now();
      const updateRequest = store.put(note);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = (event) => reject(event.target.error);
    };
    getRequest.onerror = (event) => reject(event.target.error);
  });
}

export function deleteNote(noteId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.delete(noteId);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

export function exportAllNotes() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (event) => reject(event.target.error);
  });
}

export function importAllNotes(notes) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('DB not initialized'));
      return;
    }
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);

    notes.forEach(note => {
      const { id, ...noteData } = note;
      store.add({
        ...noteData,
        updatedAt: Date.now()
      });
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
}
