import { Book } from '../types';

const DB_NAME = 'BookLibraryDB';
const DB_VERSION = 2; // Incremented version for schema change
const STORE_NAME = 'books';

let db: IDBDatabase;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB error:', request.error);
      reject('IndexedDB error');
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const addBook = (book: Book): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(book);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getAllBooks = (): Promise<Book[]> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    request.onerror = () => reject(request.error);
  });
};

const getBook = (id: number): Promise<Book | undefined> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const updateBook = (book: Book): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(book);
  
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
};

const deleteBook = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
  
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
};


export const dbService = {
  initDB,
  addBook,
  getAllBooks,
  getBook,
  updateBook,
  deleteBook
};