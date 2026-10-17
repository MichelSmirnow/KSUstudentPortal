/* ============ Постоянные и переменные базы данных и пользовательские данные ============= */

// ✓ Постоянные системные настройки
const DEBUG_MODE = true;
const STRINGIFY_SAVINGS = false;
const LOADING_ANIMATIONS = true;

// ✓ Данные сохраненных расписаний
let groupData = {}

// ✓ Функции сохранения и загрузки локально сохраненных данных (требуется форматирование)
class indexedStorage {
  constructor(dbName, storeName = 'schedules') {
    this.dbName = dbName;
    this.storeName = storeName; // Одно имя для всех расписаний
    this.db = null;
    this.dbVersion = 1;
  }

  // ✓ Инициализация базы данных
  async initDB() {
    if (this.db) return this.db;  
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => { reject(request.error); }; // ✓ Ошибка инициализации
      request.onsuccess = () => { // ✓ Успешное открытие базы данных
        this.db = request.result;
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          this.db.close();
          this.db = null;
          reject(new Error(`Хранилище "${this.storeName}" не было создано`));
          return;
        }
        resolve(this.db);
      };
      request.onupgradeneeded = (event) => { // ✓ Если необходимо обновить версию базы данных
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) { db.createObjectStore(this.storeName); }
      };
    });
  }

  async ensureStore() {
    try {
      if (!this.db) {
        console.log('[ensureStore] БД не инициализирована, вызываю initDB');
        await this.initDB();
      }
      
      if (!this.db.objectStoreNames.contains(this.storeName)) {
        console.error('[ensureStore] Store не найден!');
        this.db = null;
        throw new Error(`Store "${this.storeName}" не существует в БД`);
      }
      
      console.log('[ensureStore] Store готов к работе');
    } catch (err) {
      console.error('[ensureStore] Ошибка:', err);
      throw err;
    }
  }

  async load(key) {
    console.log(`[load] === НАЧАЛО load(${key}) ===`);
    
    try {
      await this.ensureStore();
      console.log('[load] ensureStore() завершён');
      
      return new Promise((resolve, reject) => {
        console.log('[load] Начало загрузки');
        
        try {
          const transaction = this.db.transaction(this.storeName, 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(key); // Используем key вместо hardcoded 'groupData'
          
          request.onsuccess = () => {
            console.log(`[load] onsuccess для ${key}, result:`, request.result ? 'данные есть' : 'null');
            resolve(request.result || null);
          };
          
          request.onerror = () => {
            console.error('[load] request.onerror:', request.error);
            reject(request.error);
          };
          
          transaction.onerror = () => {
            console.error('[load] transaction.onerror:', transaction.error);
            reject(transaction.error);
          };
          
        } catch (err) {
          console.error('[load] catch (внутри Promise):', err);
          reject(err);
        }
      });
      
    } catch (err) {
      console.error('[load] catch (outer):', err);
      throw err;
    }
  }

  async save(key, data) {
    console.log(`[save] === НАЧАЛО save(${key}) ===`);
    
    try {
      await this.ensureStore();
      console.log('[save] ensureStore() завершён');
      
      return new Promise((resolve, reject) => {
        console.log('[save] Начало сохранения');
        
        try {
          const transaction = this.db.transaction(this.storeName, 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(data, key); // Используем key
          
          transaction.oncomplete = () => {
            console.log(`[save] transaction.oncomplete для ${key}`);
            resolve(data);
          };
          
          transaction.onerror = () => {
            console.error('[save] transaction.onerror:', transaction.error);
            reject(transaction.error);
          };
          
          request.onerror = () => {
            console.error('[save] request.onerror:', request.error);
            reject(request.error);
          };
          
        } catch (err) {
          console.error('[save] catch (внутри Promise):', err);
          reject(err);
        }
      });
      
    } catch (err) {
      console.error('[save] catch (outer):', err);
      throw err;
    }
  }

  async clearDB() {
    console.log('[clearDB] Очистка БД');
    try {
      await this.ensureStore();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        
        request.onsuccess = () => {
          console.log('[clearDB] БД очищена');
          resolve();
        };
        
        request.onerror = () => {
          console.error('[clearDB] Ошибка очистки:', request.error);
          reject(request.error);
        };
      });
    } catch (err) {
      console.error('[clearDB] catch:', err);
      throw err;
    }
  }

  // ✓ Объём сохранённых данных хранилища в байтах (нужен разделу «Данные приложения»)
  async size() {
    try {
      await this.ensureStore();
      return await new Promise((resolve) => {
        try {
          const transaction = this.db.transaction(this.storeName, 'readonly');
          const request = transaction.objectStore(this.storeName).openCursor();
          let total = 0;
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) { resolve(total); return; }
            const value = cursor.value;
            try {
              total += typeof value === 'string'
                ? value.length
                : JSON.stringify(value === undefined ? '' : value).length;
            } catch (_) { /* несериализуемое значение пропускаем */ }
            cursor.continue();
          };
          request.onerror = () => resolve(total);
        } catch (_) { resolve(0); }
      });
    } catch (error) {
      console.log('[size] Ошибка оценки объёма:', error && error.message ? error.message : error);
      return 0;
    }
  }

  closeDB() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[closeDB] БД закрыта');
    }
  }
}

// ✓ Оценка суммарного объёма локальных данных приложения (байты)
//    Считаем то, чем реально пользуется приложение: сохранённые расписания,
//    офлайн-кэш публикаций и настройки в localStorage.
async function measureLocalDatabaseSize() {
  let total = 0;
  let measured = false;

  for (const dbName of ['group', 'teacher']) {
    try {
      const storage = new indexedStorage(dbName, 'schedules');
      const size = await storage.size();
      if (typeof size === 'number' && size > 0) measured = true;
      total += size || 0;
      storage.closeDB();
    } catch (error) {
      // Хранилище ещё не создано — это нормально
    }
  }

  if (window.contentCache && typeof window.contentCache.size === 'function') {
    try {
      const cacheSize = await window.contentCache.size();
      if (typeof cacheSize === 'number') { total += cacheSize; measured = true; }
    } catch (error) { /* кэш недоступен */ }
  }

  try {
    let settings = 0;
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || '';
      settings += key.length + String(localStorage.getItem(key) || '').length;
    }
    total += settings;
    measured = true;
  } catch (error) { /* localStorage недоступен */ }

  if (!measured && navigator.storage && typeof navigator.storage.estimate === 'function') {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate && typeof estimate.usage === 'number') total = estimate.usage;
    } catch (error) { /* оценка недоступна */ }
  }

  return total;
}

// ✓ Полное удаление базы данных
async function clearAllIndexedDB() {
  groupData = {};
  if (!indexedDB.databases) {
    console.log("Метод indexedDB.databases() не поддерживается этим браузером.");
    return;
  }
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    const req = indexedDB.deleteDatabase(db.name);
    req.onsuccess = () => console.log(`База данных "${db.name}" удалена.`);
    req.onerror = () => console.log(`Не удалось удалить базу "${db.name}".`);
    req.onblocked = () => console.log(`Операция блокирована для базы "${db.name}".`);
  }
}