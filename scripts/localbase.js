/* ============ Постоянные и переменные базы данных и пользовательские данные ============= */

// Постоянные системные настройки
const DEBUG_MODE = true;
const STRINGIFY_SAVINGS = false;
const LOADING_ANIMATIONS = true;

// ✓ Данные сохраненных расписаний
let groupData = {}

// ✓ Функции сохранения и загрузки локально сохраненных данных
class indexedStorage {
  constructor(dbName, storeName = 'schedules') {
    this.dbName = dbName;
    this.storeName = storeName; // Одно имя для всех расписаний
    this.db = null;
    this.dbVersion = 1;
  }

  async initDB() {
    if (this.db) {
      console.log('[initDB] БД уже инициализирована');
      return this.db;
    }
    
    console.log('[initDB] Инициализация БД');
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('[initDB] onerror:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log('[initDB] onsuccess');
        this.db = request.result;
        
        // Проверяем, что хранилище создано
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          console.warn('[initDB] Store не найден после открытия БД!');
          this.db.close();
          this.db = null;
          reject(new Error(`Store "${this.storeName}" не был создан`));
          return;
        }
        
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        console.log('[initDB] onupgradeneeded');
        const db = event.target.result;
        
        // Создаём одно хранилище для всех расписаний
        if (!db.objectStoreNames.contains(this.storeName)) {
          console.log('[initDB] Создаю store:', this.storeName);
          db.createObjectStore(this.storeName);
        }
      };
      
      request.onblocked = () => {
        console.warn('[initDB] onblocked: Другая вкладка использует эту БД');
      };
    });
  }

  async ensureStore() {
    console.log('[ensureStore] Начало проверки хранилища');
    
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

  closeDB() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[closeDB] БД закрыта');
    }
  }
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