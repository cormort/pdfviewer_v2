// db.js
const DB_NAME = 'pdf-viewer-db';
const STORE_NAME = 'files';
const DB_VERSION = 1;

let db;

export function initDB() {
  return new Promise((resolve, reject) => {
    // 檢查 IndexedDB 是否可用
    if (!window.indexedDB) {
      console.warn("IndexedDB could not be found in this browser.");
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(new Error('Database error: ' + event.target.error.message));
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
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

    // 確保交易完成或發生錯誤時，Promise 才會被解決/拒絕
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(new Error('Transaction error: ' + event.target.error));

    // 先清除舊檔案
    const clearRequest = store.clear();
    clearRequest.onerror = (event) => reject(new Error('Failed to clear old files: ' + event.target.error));

    clearRequest.onsuccess = () => {
      // 如果沒有新檔案，讓 transaction.oncomplete 處理最終的 resolve
      if (files.length === 0) {
        return;
      }

      files.forEach(file => {
        const addRequest = store.add({ file: file });

        // 檔案添加失敗，記錄錯誤，並讓 transaction.onerror 決定是否拒絕整個交易
        addRequest.onerror = (event) => {
          console.error('Could not add file to store', event.target.error);
        }
      });
    };
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

    request.onerror = (event) => reject(new Error('Failed to retrieve files: ' + event.target.error));
    request.onsuccess = (event) => {
      // 結果是 { id: 1, file: File } 格式的陣列
      // 我們只需要 File 物件本身
      const files = event.target.result.map(item => item.file);
      resolve(files);
    };
  });
}