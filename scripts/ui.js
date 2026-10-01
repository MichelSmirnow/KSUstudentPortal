/* ============ Постоянные и переменные базы данных и пользовательские данные ============= */

// Постоянные системные настройки
const DEBUG_MODE = true;
const STRINGIFY_SAVINGS = false;
const LOADING_ANIMATIONS = true;

// Данные по группе
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


/* ====================================== ✓ Расписание ====================================== */

// ✓ Парсер ICS календаря с сайта ЕЙОС КГУ
class ICSParser {
  constructor() {
    this.parseShedule = [];
  }

  // ✓ Получение ICS календаря расписания
  async fetch(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'text/calendar' }
      });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      const text = await response.text();
      return this.parse(text);
    } catch (error) {
      console.log('Ошибка доступа к серверу:', error);
      return undefined;
    }
  }

  // ✓ Парсирование полученного календаря до объекта и запись в массив
  parse(icsContent) {
    this.parseShedule = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent = null;
    lines.forEach(line => {
      line = line.trim();
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        this.parseShedule.push(this.normalizeEvent(currentEvent));
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        this.parseProperty(currentEvent, line);
      }
    });
    return this.parseShedule;
  }

  // ✓ Вспомогательная функция парсирования значения в календаре
  parseProperty(event, line) {
    const colonIndex = line.indexOf(':');
    let key = line.substring(0, colonIndex).split(';')[0];
    let value = line.substring(colonIndex + 1);
    event[key] = value;
  }

  // ✓ Нормализация обьекта календаря
  normalizeEvent(event) {
    return {
      uid: event.UID || '',
      summary: this.decode(event.SUMMARY || ''),
      description: this.decode(event.DESCRIPTION || ''),
      location: this.decode(event.LOCATION || ''),
      startTime: this.parseDateTime(event.DTSTART),
      endTime: this.parseDateTime(event.DTEND),
      created: event.CREATED || '',
      lastModified: event.LAST_MODIFIED || ''
    };
  }

  // ✓ Парсирование времени (нормализация значений времени в обьектах календаря)
  parseDateTime(dateString) {
    if (!dateString) return null;
    const date = dateString.replace(/[TZ]/g, '');
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    const hour = date.substring(8, 10) || '00';
    const minute = date.substring(10, 12) || '00';
    const utcDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
    return utcDate;
  }

  // ✓ Вспомогательная функция корректного декодирования строкового значения
  decode(text) {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }
}

// ✓ Глобальный кэш хранилищ — теперь используем одно для всех
const storageCache = new Map();
function getStorage(dbName) {
  const key = dbName;
  if (!storageCache.has(key)) {
    storageCache.set(key, new indexedStorage(dbName, 'schedules'));
  }
  return storageCache.get(key);
}

// ✓ Загрузить расписание из локальной памяти
async function loadLocalShedule(sheduleID, sheduleType) {
  if (!sheduleID || !sheduleType) { 
    throw new Error('Данные для загрузки расписания объявлены неверным образом'); 
  }
  try {
    const storage = getStorage(sheduleType);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Load timeout')), 10000)
    );
    const loadedData = await Promise.race([
      storage.load(sheduleID), // Передаем sheduleID как ключ
      timeoutPromise
    ]);
    if (loadedData === null || loadedData === undefined) {
      if (DEBUG_MODE) console.warn(`Данные ${sheduleID} не найдены в локальной памяти`);
      return undefined;
    }
    const parsedData = JSON.parse(loadedData);
    if (DEBUG_MODE) console.log(`Загруженное расписание ${sheduleID}:`, parsedData);
    return parsedData ?? [];
  } catch (error) {
    if (DEBUG_MODE) console.warn(`Ошибка загрузки ${sheduleID}:`, error.message);
    return undefined;
  }
}

// ✓ Сохранить расписание в локальной памяти
async function saveLocalShedule(inputShedule, sheduleID, sheduleType) {
  if (!inputShedule || !sheduleID || !sheduleType) { 
    throw new Error('Данные для сохранения расписания объявлены неверным образом'); 
  }
  try {
    const storage = getStorage(sheduleType);
    const stringedShedule = JSON.stringify(inputShedule);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Save timeout')), 10000)
    );
    await Promise.race([
      storage.save(sheduleID, stringedShedule), // Передаем sheduleID как ключ
      timeoutPromise
    ]);
    if (DEBUG_MODE) console.log(`✓ Расписание ${sheduleID} успешно сохранено`);
  } catch (error) {
    if (DEBUG_MODE) console.warn(`Ошибка сохранения данных ${sheduleID}:`, error.message);
    throw new Error(`Ошибка сохранения данных: ${error.message}`);
  }
}

// ✓ Выгрузить календарь с расписанием с сайта ЭЙОС КГУ и распарсировать его
async function fetchShedule(sheduleID, sheduleType) {

  // ✓ Функция слияния двух массивов расписаний
  function mergeSchedules(oldSchedule = [], newSchedule = []) {
    const merged = [];

    // Нормализация текста для корректного сравнения
    const normalize = value => {
      return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
    };
    
    const getSubgroup = item => { // Извлекаем признак подгруппы. Поддерживаются варианты: "п/г 1", "п/г 2", "подгруппа 1", "подгруппа 2"
      const text = `${item.summary ?? ''} ${item.description ?? ''}`;
      const match = text.match(/(?:п\/г|подгруппа|подгр\.?)\s*№?\s*(\d+)/i);
      return match ? `subgroup:${match[1]}` : 'subgroup:none';
    };
    const getAdditionalKey = item => {
      return [
        getSubgroup(item),
        normalize(item.description),
        normalize(item.location)
      ].join('|');
    };
    const getStartTime = item => { return normalize(item.startTime); };
    const getSummary = item => { return normalize(item.summary); };
    const getDay = item => { return String(item.startTime ?? '').slice(0, 10); };

    const isSameItem = (oldItem, newItem) => {
      // 1. Основная проверка — UID
      if (
        oldItem.uid &&
        newItem.uid &&
        String(oldItem.uid) === String(newItem.uid)
      ) {
        return true;
      }

      // 2. Запасная проверка — startTime + подгруппа + описание + аудитория
      const sameStartTime = (getStartTime(oldItem) === getStartTime(newItem));
      const sameAdditionalData = (getAdditionalKey(oldItem) === getAdditionalKey(newItem));
      if (sameStartTime && sameAdditionalData) return true;

      // 3. Если время занятия изменилось, пробуем найти его по дню + summary + подгруппе.
      const sameDay = (getDay(oldItem) !== '') && (getDay(oldItem) === getDay(newItem));
      const sameSummary = (getSummary(oldItem) !== '') && (getSummary(oldItem) === getSummary(newItem));
      const sameSubgroup = (getSubgroup(oldItem) === getSubgroup(newItem));
      if (sameDay && sameSummary && sameSubgroup) return true;
      return false;
    };

    const addOrUpdate = item => {
      const existingIndex = merged.findIndex(existingItem => isSameItem(existingItem, item));
      if (existingIndex === -1) { // Такого занятия ещё нет
        merged.push(item);
      } else { // Занятие уже есть, обновляем
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...item
        };
      }
    };

    // Очистка старого расписания от дубликатов
    for (const item of oldSchedule) { addOrUpdate(item); }
    for (const item of newSchedule) { addOrUpdate(item); }
    return merged;
  }

  // ✓ Сгенерировать ссылку для получения расписания (добавить расписание аудиторий)
  function getSheduleLink(type, id) {
    if (type === 'group') {
      const groupIDtoExtract = getGroupID(id);
      if (!groupIDtoExtract) { console.warn('Такой группы нету в списке'); return undefined; }
      return `https://eios.kosgos.ru/api/Rasp?idGroup=${groupIDtoExtract}&iCal=true`;
    } else if (type === 'teacher') {
      return `https://eios.kosgos.ru/api/Rasp?idTeacher=${id}&iCal=true`;
    } else if (type === 'room') {
      return `https://eios.kosgos.ru/api/Rasp?idAudLine=${id}&iCal=true`;
    } else { // Вернуть обьект с содержимым что расписания не существует / не заложено в системе

    }
  }

  let oldShedule;
  try { // ✓ Попытка загрузить данные из локального хранилища
    oldShedule = await loadLocalShedule(sheduleID, sheduleType);
    if (!oldShedule || oldShedule.length === 0 || !Array.isArray(oldShedule)) {
      oldShedule = undefined;
      throw new Error('Расписание отсутствует либо было записано неверно');
    }
    if (DEBUG_MODE) console.log('Получилось выгрузить старое расписание: ', oldShedule);
  } catch (error) {
    if (DEBUG_MODE) console.warn('Ошибка при загрузке расписания из локального хранилища, используется серверное расписание', error);
  }

  let newShedule;
  try { // ✓ Попытка обновить данные с сервера
    const parser = new ICSParser();
    const sheduleLink = getSheduleLink(sheduleType, sheduleID);
    newShedule = await parser.fetch(sheduleLink);
    if (!newShedule || newShedule.length === 0 || !Array.isArray(newShedule)) {
      newShedule = undefined;
      throw new Error('Не получилось соединиться с сервером или формат расписания на сервере неверен');
    }
    if (DEBUG_MODE) console.log('Удалось сделать запрос и получить расписание: ', newShedule);
  } catch (error) { // Если пришел пустой массив
    if (DEBUG_MODE) console.warn('Ошибка при загрузке расписания с сервера, используется файл локального сохранения', error);
  }

  if (!newShedule && !oldShedule) { console.warn('Без интернета первый раз зашел в приложение, ужас что говорить :/'); return undefined; }
  let mergedShedule;
  try { // ✓ Слияние двух расписаний
    if (!newShedule) {
      mergedShedule = oldShedule;
    } else if (!oldShedule) {
      mergedShedule = newShedule;
    } else {
      mergedShedule = mergeSchedules(oldShedule, newShedule);
    }
    if (DEBUG_MODE) console.log({ mergedShedule });
  } catch (error) {
    console.warn('Этот этап невозможно крашнуть');
  }

  // ✓ Сохраняем слитое расписание в локальное хранилище
  try {
    await saveLocalShedule(mergedShedule, sheduleID, sheduleType);
  } catch (error) {
    console.log('Тебе прям реально не везет :(', error);
    return mergedShedule;
  }
  console.log('Расписание успешно сохранено и обновлено');
  return mergedShedule;
}

// ✓ Привести дату к стандартному формату
const justifyDate = (date) => { return date instanceof Date ? date : new Date(date); };

// ✓ Отрисовка расписания 
class ScheduleRenderer {
  constructor(events) {
    this.sheduleData = events;
    if (DEBUG_MODE) console.log('Получен запрос на рендер расписания: ', this.sheduleData);
  }

  // ✓ Отсортировать и сгруппировать даты
  groupByDate(events) {
    if (!events) return undefined;
    const grouped = {};
    events.forEach(event => {
      if (!event.startTime) return;
      const dateKey = ScheduleRenderer.formatDateKey(event.startTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key].sort((a, b) =>
          a.startTime - b.startTime
        );
        return acc;
      }, {});
  }

  // ✓ Отформатировать дату для группировки занятий по дням (YYYY-MM-DD)
  static formatDateKey(date) {
    if (!date) return undefined;
    const value = justifyDate(date);
    if (Number.isNaN(value.getTime())) return undefined;

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // ✓ Отформатировать дату для стандартного отображения
  static formatDate(date) {
    if (!date) return undefined;
    const value = justifyDate(date);
    if (Number.isNaN(value.getTime())) return undefined;

    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // ✓ Извлечь данные пары в удобном для рендера формате
  static extractElementData(event) {
    if (!event) return undefined;

    // ✓ Отформатировать время для стандартного отображения
    function formatTime(date) {
      if (!date) return undefined;
      const value = justifyDate(date);
      if (Number.isNaN(value.getTime())) return undefined;

      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // ✓ Определить преподавателя занятия
    function extractTeacher(description) {
      const match = description.match(/([А-Яа-яЁё\s\.]+)/);
      const extractedTeacher = match ? match[0].trim() : '';
      return extractedTeacher;
    }

    // Определить список групп, для которых актуально данное занятие
    function extractGroups(description) {
      const match = description.match(/группа:\s*(.*)$/i);
      return match ? match[1].trim() : '';
    }

    // ✓ Получаем основную информацию по занятию
    const startTime = event.startTime ? formatTime(event.startTime) : '67:67';
    const endTime = event.endTime ? formatTime(event.endTime) : 'Никогда';
    const room = event.location ? event.location : 'туалет';
    const teacher = event.description ? extractTeacher(event.description) : 'Преподаватель С.';
    const groups = event.description ? extractGroups(event.description) : 'Группы не указаны';

    // ✓ Получаем дополнительную информацию по занятию
    const typeMatch = event.summary.match(/\(([^)]+)\)/);
    const type = typeMatch ? String(typeMatch[1]).substring(0, 7) : '';

    // ✓ Получаем название и цвет предмета
    const colors = {
      'пр.': 'rgba(252,184,38,1)',
      'пр ': 'rgba(252,184,38,1)',
      'лек': 'rgba(37, 204, 37, 1)',
      'лаб': 'rgba(190, 38, 190, 1)',
    }
    const nameMatch = {
      'лаб': 'Лаба',
      'лек': 'Лекция',
      'пр.': 'Практика',
      'пр ': 'Практика',
    };
    const subjectMatch = event.summary.slice(0, 3);
    const subjectMatchColor = colors[subjectMatch] ? colors[subjectMatch] : colors['пр.'];
    const name = nameMatch[subjectMatch] ? nameMatch[subjectMatch] : 'Занятие';
    const subject = (event.summary).match(/ (.*?)(?=\(|,[^,]*$|$)/)?.[1].trim() ?? "";
    const subgroup = (event.summary).match(/,([^,]*)$/)?.[1].trim() ?? "";;
    return { startTime, endTime, room, teacher, groups, type, name, subject, subgroup, subjectMatch, subjectMatchColor };
  }

  // ✓ Извлечь данные события в удобном для рендера формате
  extractEventData(dateKey) {
    if (!dateKey) return undefined;

    // ✓ Определить день недели по дате
    function getDayName(date) {
      const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
      return days[date.getDay() - 1];
    }

    // ✓ Определить цвет дня недели
    function getDayColor(date) {
      const today = new Date();
      const dayOfWeek = date.getDay();
      const colors = {
        1: '#4a6e8fff', // Понедельник
        2: '#4a5f8fff', // Вторник
        3: '#3a538fff', // Среда
        4: '#4a548fff', // Четверг
        5: '#574a8fff', // Пятница
        6: '#64147cff', // Суббота
        0: '#660f0fff' // Воскресенье
      };
      if (date.toDateString() === today.toDateString()) {
        return '#a01212ff'; // return '#12a01eff';
      } else {
        return colors[dayOfWeek] || '#4a6e8fff';
      }
    }

    // ✓ Получаем данные дня недели
    const dayDate = new Date(dateKey + 'T00:00:00');
    const dayName = getDayName(dayDate);
    const formattedDate = ScheduleRenderer.formatDate(dayDate);
    const dayColor = getDayColor(dayDate);
    return { dayName, formattedDate, dayColor };
  }

  // ✓ Рендер элемента расписания 
  createEventElement(event, teachery) {
    if (!event) return undefined;

    // ✓ Создаем элемент и экстрактируем данные события
    const eventElementContainer = document.createElement('div');
    eventElementContainer.classList.add('event');
    const extractedData = ScheduleRenderer.extractElementData(event);

    // ✓ HTML структура
    eventElementContainer.innerHTML = `
    <div class="event-time-block" style="border-left: 5px solid ${extractedData.subjectMatchColor}">
      <div class="event-time">
        <span class="start-time">${extractedData.startTime}</span>
        <span class="end-time">${extractedData.endTime}</span>
      </div>
      <span style="color: #555; margin-top: 5px; font-size: 13px;">${extractedData.name}</span>
    </div>
    <div class="event-content">
      <div class="event-header">
        <p class="event-subject"><b>${extractedData.subject}</b></p>
        <div class="event-type-container">
          ${extractedData.type ? `<span class="event-type">${extractedData.type}</span>` : ''}
          ${extractedData.subgroup ? `<span class="event-type">${extractedData.subgroup}</span>` : ''}
        </div>
      </div>
      <div class="event-details">
        ${teachery ? `<div class="event-detail">${extractedData.groups}</div>` : `<div class="event-detail">${extractedData.teacher}</div>`}
        <div class="event-detail"><i>Аудитория</i> <b>${extractedData.room}</b></div>
      </div>
    </div>`;

    // ✓ Обработчик нажатия на занятие
    eventElementContainer.addEventListener('click', async () => {
      await generateSubpage('lesson', event);
    });

    return eventElementContainer;
  }

  // ✓ Рендер элемента перерыва
  createPauseElement(timeout, breakfast) {
    const pauseContainer = document.createElement('div');
    if (!timeout || typeof timeout !== 'number') return pauseContainer;
    const hours = Math.floor(timeout / 60);
    const minutes = timeout - (hours * 60);
    pauseContainer.classList.add('pauseEvent');
    const textContainer = document.createElement('p');
    if (breakfast === 'lanch') {
      textContainer.innerHTML = `Обеденный перерыв`;
    } else if (breakfast === 'timeout') {
      textContainer.innerHTML = `Свободное время между занятиями: ${(hours > 0) ? `${hours}ч` : ``} ${(minutes > 0) ? `${minutes}мин` : ``}`;
    } else if (breakfast === 'noclass') {
      textContainer.innerHTML = `Нет учебных занятий в этот день`;
    }
    pauseContainer.appendChild(textContainer);
    return pauseContainer;
  }

  // ✓ Сгенерировать самообновляющийся элемент текущего/следующего занятия 
  createDayEventElement(event, next) {
    if (!event) return undefined;

    // ✓ Создаем элемент и экстрактируем данные события
    const dayEventContainer = document.createElement('div');
    dayEventContainer.classList.add('container-hidden');
    dayEventContainer.classList.add('lesson-container');
    const extractedData = ScheduleRenderer.extractElementData(event);
    const colors = {
      'лаб': 'linear-gradient(to bottom right, #667eea 0%, #764ba2 100%)',
      'лек': 'linear-gradient(to bottom right, #2dac14 0%, #1c6e0bff 100%)',
      'пр.': 'linear-gradient(to bottom right, #c28b16 0%, #bbac2a 50%, #c28b16 100%)',
      'пр ': 'linear-gradient(to bottom right, #c28b16 0%, #bbac2a 50%, #c28b16 100%)',
      'next': 'linear-gradient(to bottom right, #66b5ea 0%, #31459e 100%)',
    };
    dayEventContainer.style.backgroundImage = next ? colors['next'] : colors[extractedData.subjectMatch];

    // ✓ Функции рассчета оставшегося времени (до конца/до начала)
    function calculateTime(nextEvent) {
      const now = new Date();
      let totalDuration = 0; let elapsed = 0; let remaining = 0;
      const startTime = justifyDate(event.startTime);
      const endTime = justifyDate(event.endTime);
      if (nextEvent === true) { // ✓ Время до начала пары
        remaining = startTime - now;
      } else { // ✓ Время до конца пары
        totalDuration = endTime - startTime;
        elapsed = now - startTime;
        remaining = endTime - now;
      }
      const progressPercent = (elapsed / totalDuration) * 100;
      const remainingHours = Math.floor(remaining / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const remainingSeconds = Math.floor((remaining % (1000 * 60)) / 1000);
      const remainingTime = `${(remainingHours < 10) ? `0${remainingHours}` : remainingHours}:${(remainingMinutes < 10) ? `0${remainingMinutes}` : remainingMinutes}:${(remainingSeconds < 10) ? `0${remainingSeconds}` : remainingSeconds}`;
      return { remainingTime, progressPercent };
    }
    const extractedTime = calculateTime(next);

    // HTML структура (требуется доработка)
    dayEventContainer.innerHTML = `
    <div class="lesson-subcontainer">
      <div class="lesson-time-block" style="border-left: 5px solid ${extractedData.subjectMatchColor}">
        <div class="lesson-time">
          <span class="lesson-start-time">${extractedData.startTime}</span>
          <span class="lesson-end-time">${extractedData.endTime}</span>
        </div>
        <span class="lesson-type">${extractedData.name}</span>
      </div>

      <div class="lesson-content">
        <div class="lesson-header">
          <p class="lesson-subject">${extractedData.subject}</p>
          <div class="event-type-container">
            ${extractedData.type ? `<span class="lesson-type2">${extractedData.type}</span>` : ''}
            ${extractedData.subgroup ? `<span class="lesson-type2">${extractedData.subgroup}</span>` : ''}
          </div>
        </div>
        <div class="lesson-details">
          <div class="lesson-detail">${extractedData.teacher}</div>
          <div class="lesson-detail"><i>Аудитория</i> <b>${extractedData.room}</b></div>
        </div>
      </div>
    </div>

    <div class="lesson-progress">
      <div class="class-progress-header">
        <span class="class-progress-label">${next ? 'До начала занятия' : 'До конца осталось'}</span>
        <span class="class-remaining-time" id="class-remaining-time-${next}">${extractedTime.remainingTime}</span>
      </div>
      ${next ? '' : `<div class="class-progress-bar-container">
        <div class="class-progress-bar" id="class-progress-bar-${next}" style="width: ${extractedTime.progressPercent}%"></div>
       </div>`}
    </div>`;

    // ✓ Обработчик нажатия на занятие
    dayEventContainer.addEventListener('click', async () => {
      await generateSubpage('lesson', event);
    });

    // ✓ Тик обновления оставшегося времени
    const updateProgress = () => {
      const nowUpdate = new Date();
      const startTime = justifyDate(event.startTime);
      const endTime = justifyDate(event.endTime);

      // ✓ Проверяем, не началась ли пара (для следующей пары)
      if (nowUpdate > startTime && next === true) {
        dayEventContainer.classList.add('container-hidden');
        setTimeout(() => { dayEventContainer.remove(); changeSheduleTypeContent('day'); }, 510);
        return;
      }

      // ✓ Проверяем, не закончилась ли пара (для текущей пары)
      if (nowUpdate > endTime) {
        dayEventContainer.classList.add('container-hidden');
        setTimeout(() => { dayEventContainer.remove(); }, 510);
        return;
      }

      // ✓ Получаем и применяем данные об оставшемся времени
      const extractedUpdateTime = calculateTime(next);
      const progressBar = container.querySelector(`#class-progress-bar-${next}`);
      const remainingTimeSpan = container.querySelector(`#class-remaining-time-${next}`);
      if (progressBar) progressBar.style.width = extractedUpdateTime.progressPercent + '%';
      if (remainingTimeSpan) remainingTimeSpan.textContent = extractedUpdateTime.remainingTime;
    };
    const intervalId = setInterval(updateProgress, 500);
    dayEventContainer.dataset.intervalId = intervalId;

    // ✓ Останавливаем обновление при удалении элемента
    const observer = new MutationObserver(() => {
      if (!document.contains(dayEventContainer)) {
        clearInterval(intervalId); observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });

    setTimeout(() => { dayEventContainer.classList.remove('container-hidden'); }, 10);
    return dayEventContainer; // ✓ Возвращаем собранный контейнер
  }

  // ✓ Рендер дня расписания из элементов по дате 
  createDateElement(date, teachery, emptie) {
    // ✓ Получаем данные дня
    const dateKey = ScheduleRenderer.formatDateKey(date);
    const dayEvents = this.sheduleData
      .filter(event => event.startTime && ScheduleRenderer.formatDateKey(event.startTime) === dateKey)
      .sort((a, b) => a.startTime - b.startTime);
    const extractedData = this.extractEventData(dateKey);

    // ✓ Подготовка к генерации списка занятий
    const eventsContainer = document.createElement('div');
    eventsContainer.classList.add('schedule-day');
    eventsContainer.innerHTML = `<div class="day-header" style="background-color: ${extractedData.dayColor};">
      <span class="day-name">${extractedData.dayName}</span>
      <span class="day-date">${extractedData.formattedDate}</span>
    </div>`;
    const dayEventsContainer = document.createElement('div');
    dayEventsContainer.classList.add('day-events');

    if (emptie === true) { // Если в этот день нет занятий
      eventsContainer.appendChild(this.createPauseElement(100, 'noclass'));
      return eventsContainer;
    }

    // ✓ Генерируем список занятий
    let prevEvent;
    dayEvents.forEach((event, index) => {
      if (prevEvent) {
        const prevStartDate = justifyDate(prevEvent.startTime);
        const endDate = justifyDate(prevEvent.endTime);
        const startDate = justifyDate(event.startTime);
        const minutes = Math.abs(startDate - endDate) / 1000 / 60;
        if (minutes >= 90 && prevStartDate < startDate) { // Если обнаружен большой перерыв между занятиями
          dayEventsContainer.appendChild(this.createPauseElement(minutes, 'timeout'));
        }
        if (minutes >= 30 && minutes <= 60 && prevStartDate < startDate) { // Если обнаружен обеденный перерыв между занятиями
          dayEventsContainer.appendChild(this.createPauseElement(minutes, 'lanch'));
        }
      }
      dayEventsContainer.appendChild(this.createEventElement(event, teachery));
      prevEvent = event;
    });
    if (!dayEventsContainer.hasChildNodes()) dayEventsContainer.innerHTML = '<p style="text-align: center;">На этот день нет расписания</p>'
    eventsContainer.appendChild(dayEventsContainer);

    return eventsContainer; // ✓ Возвращаем собранный контейнер
  }

  // ✓ Получить элементы текущей и следующей пар
  // Может быть проблема с подгруппами - это надо будет решить потом
  getDayEventElements() {
    const now = new Date();
    const wrapper = document.createElement('div');
    wrapper.className = 'classes-wrapper';

    // ✓ Проверить совпадение дат событий
    const isSameDay = (date1, date2) => {
      const d1 = justifyDate(date1);
      const d2 = justifyDate(date2);
      return (
        !Number.isNaN(d1.getTime()) &&
        !Number.isNaN(d2.getTime()) &&
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    };

    // ✓ Ищем и добавляем текущее занятие
    let currentClassElement = undefined;
    const currentEvent = this.sheduleData.find(({ startTime, endTime }) => {
      const start = justifyDate(startTime);
      const end = justifyDate(endTime);
      return (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        now >= start &&
        now <= end
      );
    });
    if (currentEvent) currentClassElement = this.createDayEventElement(currentEvent, undefined);

    // ✓ Ищем следующее событие в тот же день
    let nextClassElement = undefined;
    let nextEvent = null;
    if (currentEvent) { // ✓ Если есть текущее событие, ищем следующее после него в тот же день
      nextEvent = this.sheduleData.find(event => {
        const startTime = justifyDate(event.startTime);
        const endTime = justifyDate(event.endTime);
        return (
          event.startTime &&
          event.endTime &&
          !Number.isNaN(startTime.getTime()) &&
          !Number.isNaN(endTime.getTime()) &&
          startTime > justifyDate(currentEvent.endTime) &&
          isSameDay(startTime, now)
        );
      });
    } else { // ✓ Если нет текущего события, ищем первое начальное занятие
      nextEvent = this.sheduleData.find(event => {
        const startTime = justifyDate(event.startTime);
        const endTime = justifyDate(event.endTime);
        return (
          event.startTime &&
          event.endTime &&
          !Number.isNaN(startTime.getTime()) &&
          !Number.isNaN(endTime.getTime()) &&
          startTime > now &&
          isSameDay(startTime, now)
        );
      });
    }

    // ✓ Добавляем следующее занятие или отсутствие занятий в ближайшее время
    if (nextEvent) {
      const nextStartTime = justifyDate(nextEvent.startTime);
      const timeUntilNext = nextStartTime - now;
      const hoursUntilNext = timeUntilNext / (1000 * 60 * 60);

      // ✓ Если до следующей пары меньше 3 часов
      if (hoursUntilNext <= 3) nextClassElement = this.createDayEventElement(nextEvent, true);
    }

    return { currentClassElement, nextClassElement }; // ✓ Возвращаем собранные контейнеры
  }

  // ✓ Создаем список доступных недель
  generateWeekSelector(sheduleContainer, teachery) {

    // ✓ Проверить, находятся ли даты на одной неделе
    function isSameWeek(selectedDate, date) {
      function getWeekNumber(date) { // ✓ Получить номер текущей недели
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      }
      return date.getFullYear() === selectedDate.getFullYear() && getWeekNumber(date) === getWeekNumber(selectedDate);
    }

    // ✓ Получить понедельник той недели, на которой расположена входящая дата
    function getMondayOfWeek(date) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    }

    // ✓ Стандартное форматирование даты
    function formatWeekDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // ✓ Стандартное форматирование недели
    function formatWeekDisplay(monday, sunday) {
      const months = ['Янв', 'Фев', 'Март', 'Апр', 'Май', 'Июнь',
        'Июль', 'Авг', 'Сент', 'Окт', 'Ноя', 'Дек'];
      const mondayDay = monday.getDate();
      const sundayDay = sunday.getDate();
      const mondayMonth = months[monday.getMonth()];
      const sundayMonth = months[sunday.getMonth()];
      if (monday.getMonth() === sunday.getMonth()) {
        return `${mondayDay} - ${sundayDay} ${sundayMonth}`;
      } else {
        return `${mondayDay} ${mondayMonth} - ${sundayDay} ${sundayMonth}`;
      }
    }

    // ✓ Определяем все уникальные недели
    const weeks = new Map();
    this.sheduleData.forEach(event => {
      const monday = getMondayOfWeek(event.startTime);
      const mondayStr = formatWeekDate(monday);
      if (!weeks.has(mondayStr)) {
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        weeks.set(mondayStr, {
          monday: new Date(monday),
          sunday,
          events: []
        });
      }
      weeks.get(mondayStr).events.push(event);
    });

    // ✓ Сортируем недели по дате
    const sortedWeeks = Array.from(weeks.values()).sort(
      (a, b) => a.monday - b.monday
    );

    // ✓ Определяем текущую неделю и понедельник этой недели
    const today = new Date();
    const currentMonday = getMondayOfWeek(today);
    const currentMondayStr = formatWeekDate(currentMonday);
    let selectedDate = new Date(currentMonday);

    // Создаем кнопки для каждой недели
    const weekContainer = document.createElement('div');
    weekContainer.className = 'radio-week-container flex-container';
    sortedWeeks.forEach(week => {
      const button = document.createElement('button');
      button.className = 'radio-week-button';
      button.dataset.mondayDate = formatWeekDate(week.monday);
      const weekDisplay = formatWeekDisplay(week.monday, week.sunday);
      button.textContent = weekDisplay;

      // ✓ Если текущая неделя, делаем её выбранной по умолчанию
      if (formatWeekDate(week.monday) === currentMondayStr) {
        button.classList.add('selected'); button.classList.add('current-week-button');
      }

      // ✓ Найти список дней, нахожящихся между двумя датами
      function getDaysBetween(startDate, endDate) {
        const days = [];
        const current = new Date(startDate);
        current.setDate(current.getDate() + 1);
        while (current < endDate) {
          days.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        return days;
      }

      // ✓ Добавляем обработку нажатия на кнопку недели
      button.addEventListener('click', () => {
        if (!button.classList.contains('selected')) {
          weekContainer.querySelectorAll('.radio-week-button').forEach(btn => {
            btn.classList.remove('selected'); // ✓ Очищаем остальные кнопки от нажатия
          }); button.classList.add('selected');

          // Перерендриваем блок расписания
          selectedDate = new Date(week.monday);
          let previousDate = null;
          sheduleContainer.innerHTML = '';
          const grouped = this.groupByDate(this.sheduleData);
          const sortedDateKeys = Object.keys(grouped).sort();
          sortedDateKeys.forEach((dateKey) => {
            const dayDate = new Date(dateKey + 'T00:00:00');
            if (previousDate !== null) {
              const daysBetween = getDaysBetween(previousDate, dayDate);
              daysBetween.forEach((gapDate) => {
                if (isSameWeek(selectedDate, gapDate) && gapDate.getDay() !== 0) {
                  sheduleContainer.appendChild(this.createDateElement(gapDate, teachery, true));
                }
              });
            }
            if (isSameWeek(selectedDate, dayDate)) {
              sheduleContainer.appendChild(this.createDateElement(dayDate, teachery));
            }
            previousDate = dayDate;
          });
        }
      });
      weekContainer.appendChild(button);
    });

    return { weekContainer, selectedDate };
  }

  // ✓ Произвести рендер расписания и получить элемент расписания
  render(type, teachery) {
    if (type === 'day') { // ✓ Сгенерировать внутридневное расписание
      const dayElementContainer = document.createElement('div');
      dayElementContainer.classList.add('relative-container');

      // ✓ Получаем текущую и следующую пары, если их нет, то в ближайщее время нет занятий
      const DayEventElements = this.getDayEventElements();
      if (DayEventElements.currentClassElement) dayElementContainer.appendChild(DayEventElements.currentClassElement);
      if (DayEventElements.nextClassElement) dayElementContainer.appendChild(DayEventElements.nextClassElement);
      if (!DayEventElements.currentClassElement && !DayEventElements.nextClassElement) {
        const noClassesBlock = document.createElement('div');
        noClassesBlock.className = 'no-classes-block';
        noClassesBlock.innerHTML = '<img src="images/ui/sleeping-cat.png"/><p>В ближайшее время пар не будет, можете отдохнуть)</p>';
        dayElementContainer.appendChild(noClassesBlock);
      }

      // ✓ Проверяем, закончились ли сегодня пары
      function isClassesEndedToday(sheduleData) {
        const today = ScheduleRenderer.formatDateKey(new Date());
        const now = new Date();
        const todayEvents = sheduleData.filter(event => {
          const startTime = justifyDate(event.startTime);
          return startTime && (ScheduleRenderer.formatDateKey(startTime) === today)
        });
        if (todayEvents.length === 0) return true;
        const lastEvent = todayEvents.reduce((latest, event) =>
          justifyDate(event.endTime) > justifyDate(latest.endTime) ? event : latest
        );
        return now > justifyDate(lastEvent.endTime);
      }

      // ✓ Возвращает дату следующего учебного дня
      function getNextClassesDate(sheduleData) {
        const today = ScheduleRenderer.formatDateKey(new Date());
        const allDates = [...new Set( // Берём все уникальные даты из событий
          sheduleData
            .filter(event => event.startTime)
            .map(event => ScheduleRenderer.formatDateKey(event.startTime))
        )].sort();
        const nextDate = allDates.find(date => date > today); // Ищем первую дату, которая больше сегодняшней
        return nextDate ? new Date(nextDate + 'T00:00:00') : null;
      }

      // ✓ Добавляем расписание дня
      const p = document.createElement('p'); p.setAttribute("style", "text-align: center;");
      let nextDate;
      const dayShedule = document.createElement('div');
      if (isClassesEndedToday(this.sheduleData)) {
        nextDate = getNextClassesDate(this.sheduleData);
        p.innerHTML = 'Расписание на следующий учебный день';
      } else {
        nextDate = new Date();
        p.innerHTML = 'Расписание на сегодня';
      }
      dayShedule.appendChild(this.createDateElement(nextDate));
      dayElementContainer.appendChild(p);
      dayElementContainer.appendChild(dayShedule);

      // ✓ Добавляем филлер в конце для увеличения высоты страницы
      const fillerDiv = document.createElement('div');
      fillerDiv.setAttribute("style", "height: 100px; width: 100%;")
      dayElementContainer.appendChild(fillerDiv);

      return dayElementContainer; // ✓ Возвращаем собранный контейнер

    } else if (type === 'week') { // Сгенерировать недельное расписание
      // ✓ Создаем контейнер расписания
      const weekElementContainer = document.createElement('div');
      weekElementContainer.classList.add('relative-container');

      const weekSheduleContainer = document.createElement('div');
      const extractedWeekSelector = this.generateWeekSelector(weekSheduleContainer, teachery);
      weekElementContainer.appendChild(extractedWeekSelector.weekContainer);
      const selectedDate = extractedWeekSelector.selectedDate;

      // ✓ Проверить, находятся ли даты на одной неделе
      function isSameWeek(selectedDate, date) {
        function getWeekNumber(date) { // ✓ Получить номер текущей недели
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
          return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        }
        return date.getFullYear() === selectedDate.getFullYear() && getWeekNumber(date) === getWeekNumber(selectedDate);
      }

      // ✓ Найти список дней, нахожящихся между двумя датами
      function getDaysBetween(startDate, endDate) {
        const days = [];
        const current = new Date(startDate);
        current.setDate(current.getDate() + 1);
        while (current < endDate) {
          days.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        return days;
      }

      // ✓ Генерируем недельное расписание
      const grouped = this.groupByDate(this.sheduleData);
      const sortedDateKeys = Object.keys(grouped).sort();
      let previousDate = null;
      sortedDateKeys.forEach((dateKey) => {
        const dayDate = new Date(dateKey + 'T00:00:00');
        if (previousDate !== null) {
          const daysBetween = getDaysBetween(previousDate, dayDate);
          daysBetween.forEach((gapDate) => {
            if (isSameWeek(selectedDate, gapDate) && gapDate.getDay() !== 0) {
              weekSheduleContainer.appendChild(this.createDateElement(gapDate, teachery, true));
            }
          });
        }
        if (isSameWeek(selectedDate, dayDate)) {
          weekSheduleContainer.appendChild(this.createDateElement(dayDate, teachery));
        }
        previousDate = dayDate;
      });
      weekElementContainer.appendChild(weekSheduleContainer);

      // ✓ Добавляем филлер в конце для увеличения высоты страницы
      const fillerDiv = document.createElement('div');
      fillerDiv.setAttribute("style", "height: 100px; width: 100%;")
      weekElementContainer.appendChild(fillerDiv);

      return weekElementContainer; // ✓ Возвращаем собранный контейнер

    } else { // Если страница не найдена (Ошибка 404)
      return undefined;
    }
  }
}

// ✓ Сменить контент расписания
function changeSheduleTypeContent(type) {
  const sheduleContainer = document.getElementById('shedule-container');
  if (groupData[CurrentGroup]) {
    const renderer = new ScheduleRenderer(groupData[CurrentGroup]);
    const sheduleFiller = renderer.render(type);
    sheduleContainer.innerHTML = '';
    sheduleContainer.appendChild(sheduleFiller);
  } else {
    sheduleContainer.innerHTML = '';
    sheduleContainer.appendChild(generateNoEthernetContainer());
  }
  
}

// ✓ Изменение режима просмотра расписания
let animationInProgress = false;
function switchSchedule(type) {
  if (animationInProgress === true) return;
  const dayButton = document.getElementById('shedule-day');
  const weekButton = document.getElementById('shedule-week');
  if (type === 'day' && !dayButton.classList.contains('selected')) { // ✓ Если выбрано внутридневное расписание
    weekButton.classList.remove('selected');
    dayButton.classList.add('selected');
    changeSheduleTypeContent('day');
  } else if (type === 'week' && !weekButton.classList.contains('selected')) { // ✓ Если выбрано недельное расписание
    dayButton.classList.remove('selected');
    weekButton.classList.add('selected');
    changeSheduleTypeContent('week');
  }
}


/* ======================================= Кафедра ======================================== */

// Отрисовка кафедры
class KafederRenderer {
  constructor() {
    this.allTeachers = this.extractAllTeachers();
  }

  // ✓ Получить всех преподавателей с информацией об институте и кафедре
  extractAllTeachers() {
    const teachers = [];
    Object.entries(teachersData).forEach(([instituteName, departments]) => {
      Object.entries(departments).forEach(([departmentName, teachersObj]) => {
        Object.entries(teachersObj).forEach(([key, teacher]) => {
          if (teacher.fullName) {
            teachers.push({ ...teacher, instituteName, departmentName, key });
          }
        });
      });
    });
    return teachers;
  }

  // ✓ Создать список учителей по входящему списку
  renderTeachers(teachers, container) {
    teachers.forEach((teacher, index) => {
      const teacherElement = document.createElement('div');
      teacherElement.classList.add('teacher-card');

      // ✓ Обьявляем внутреннее содержимое карточки учителя
      teacherElement.innerHTML = `
      <img src="${teacher.image}" alt="${teacher.fullName}" class="teacher-image">
      <div class="teacher-info">
        <div class="teacher-name">${teacher.fullName}</div>
        ${teacher.academicDegree ? `<div class="teacher-degree">${teacher.academicDegree}</div>` : ''}
        ${teacher.workPost ? `<div class="teacher-post">${teacher.workPost}</div>` : 'Преподаватель кафедры'}
      </div>`;

      // ✓ Добавляем обработчик нажатия на учителя
      teacherElement.addEventListener('click', async () => {
        await generateSubpage('teacher', teacher); // teacher ЭТО ОБЬЕКТ!!! ЕГО НАДО ПО ДРУГОМУ ПАРСИРОВАТЬ!!!
      });

      container.appendChild(teacherElement);
    });
  }

  // ✓ Создать список кафедр
  renderDepartments(departments, container) {
    Object.entries(departments).forEach(([key, value]) => {
      const departamentContainer = document.createElement('details');
      departamentContainer.classList.add('kafeder-department');
      departamentContainer.innerHTML = `<summary class="department-title">${key}</summary>`;

      const departamentContent = document.createElement('div');
      departamentContent.classList.add('departament-content');
      this.renderTeachers(Object.values(value), departamentContent);
      departamentContainer.appendChild(departamentContent);
      container.appendChild(departamentContainer);
    });
  }

  // ✓ Создать список институтов (факультетов)
  renderInstitutes(container) {
    Object.entries(teachersData).forEach(([key, value]) => {
      const instituteStyle = institutesStyle[key];
      console.log(instituteStyle);
      const InstituteContainer = document.createElement('details');
      InstituteContainer.classList.add('kafeder-institute');
      InstituteContainer.innerHTML = `
      <summary class="institute-title" style="background-image: url(${instituteStyle.backgroundImage});">
        <div class="institute-background-image" style="background-image: linear-gradient(${instituteStyle.backgroundGradient}) !important;"></div>
        <div class="institute-title-info"><div class="institute-title-info-subcontainer" style="text-shadow: ${instituteStyle.textShadow}; color: ${instituteStyle.textColor};">
          <p>${key}</p>
          <p style="padding-top: 3px; font-size: 18px;"><b>${instituteStyle.abbreviation}</b></p>
        </div></div>
      </summary>`;

      const InstituteContent = document.createElement('div');
      InstituteContent.classList.add('institute-content');
      this.renderDepartments(value, InstituteContent);
      InstituteContainer.appendChild(InstituteContent);
      container.appendChild(InstituteContainer);
    });
  }


  /*
  
    // Поиск по любому совпадению букв (case-insensitive)
    searchTeachers(query) {
      if (!query.trim()) { return []; }
      const searchLower = query.toLowerCase();
      return this.allTeachers.filter(teacher => {
        return (
          teacher.fullName.toLowerCase().includes(searchLower) ||
          teacher.academicDegree.toLowerCase().includes(searchLower) ||
          teacher.workPost.toLowerCase().includes(searchLower) ||
          teacher.instituteName.toLowerCase().includes(searchLower) ||
          teacher.departmentName.toLowerCase().includes(searchLower)
        );
      });
    }
  
    // Рендер поисковика
    renderSearch() {
      return `
        <div class="search-wrapper">
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              id="teachersSearch" 
              placeholder="Поиск не работает, сорян ^("
              autocomplete="off"
            >
            <div class="search-icon">🔍</div>
          </div>
        </div>
      `;
    }
  
    // Рендер результатов поиска
    renderSearchResults(results) {
      if (results.length === 0) {
        return `
          <div class="search-results-container">
            <div class="no-results">
              <div class="no-results-icon">❌</div>
              <div class="no-results-text">Преподаватель не найден</div>
            </div>
          </div>
        `;
      }
  
      const resultsHtml = results.map(teacher => {
        return `
          <div class="teacher-card">
            <img src="${teacher.image}" alt="${teacher.fullName}" class="teacher-image">
            <div class="teacher-info">
              <div class="teacher-name">${teacher.fullName}</div>
              <div class="teacher-degree">${teacher.academicDegree}</div>
              <div class="teacher-post">${teacher.workPost}</div>
            </div>
            <div class="teacher-meta">
              <div class="teacher-department">${teacher.departmentName}</div>
              <div class="teacher-institute">${teacher.instituteName}</div>
            </div>
          </div>
        `;
      }).join('');
  
      return `
        <div class="search-results-container">
          <div class="search-results-count">Найдено: ${results.length}</div>
          ${resultsHtml}
        </div>
      `;
    }
  
    // Инициализация обработчиков поиска
    initSearch() {
      const searchInput = document.getElementById('teachersSearch');
      const hierarchy = document.getElementById('hierarchy');
      const searchResults = document.getElementById('searchResults');
  
      if (!searchInput) return;
  
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        
        if (!query.trim()) {
          // Если поле пустое, показываем иерархию
          hierarchy.style.display = 'block';
          searchResults.style.display = 'none';
        } else {
          // Ищем и выводим результаты
          const results = this.searchTeachers(query);
          searchResults.innerHTML = this.renderSearchResults(results);
          hierarchy.style.display = 'none';
          searchResults.style.display = 'block';
        }
      });
    }
  
  */


  // Основной метод рендера с поиском
  render() {
    const kafederContainer = document.createElement('div');
    this.renderInstitutes(kafederContainer);
    return kafederContainer;
  }
}


/* ================================= Интерфейс и страницы ================================= */

// Основные контейнеры страницы
const containerMain = document.getElementById('container');
const containerTranslate = document.getElementById('container-translate');
const containerUpward = document.getElementById('container-upwards');
const containerLoading = document.getElementById('container-loading');

// Получить персонализированный текст ошибки
function generateErrorContainer(error) {
  return `<h1>Упс!</h1>
  <p>Похоже, при попытке отобразить расписание появилась ошибка. Вот инструкции, которые возможно Вам помогут:</p>
  <p>1) Попробуйте перезапустить приложение. Это действие сбросит локально сохраненное расписание и перезапишет новое с сайта ЭЙОС КГУ.</p>
  <p>2) Если нет подключения к интернету, попробуйте наладить подключение к сети и перезайти в приложение.</p>
  <p>Текст ошибки (для тестировщиков):</p>
  <p style="color: red">${error}</p>`;
}

// ✓ Если расписание невозможно подключить из-за отсутствия интернет-соединения
function generateNoEthernetContainer() {
  const ethernetContainer = document.createElement('div');
  ethernetContainer.style.width = 'calc(100% - 20px)';
  ethernetContainer.style.margin = '0 auto';
  ethernetContainer.innerHTML = `
  <p style="font-size: 20px; margin-bottom: -5px;"><b>Нет подключения к интернету</b></p>
  <p>1) Если у вас выключен интернет, попробуйте подключиться к сети и обновить данную страницу</p>
  <p>2) Если у вас выключен VPN или PROXY сервис, попробуйте отключить его и обновить страницу</p>
  <p style="color: #333 !important; font-size: 13px !important;">Код ошибки (для тестировщиков): ETH0</p>
  <img style="width: 100%; margin-top: -30px; filter: drop-shadow(0 10px 5px rgba(2, 8, 61, 0.35));" src="images/supbanners/noEthernet.png" />
  `;
  return ethernetContainer;
}

/* ======== Генерация основного контента страницы (нижнее навигационное меню) ======== */

// ✓ Объявление кнопок закрепленного интерфейса
let navOpened = 'nav-shedule'; // Текущая открытая страница навигационного меню
const navPosition = {          // Расположение кнопок слева направо
  'web': 0,
  'nav-kafeder': 1,
  'nav-homework': 2,
  'nav-shedule': 3,
  'nav-messager': 4,
  'nav-account': 5,
  'lesson': 6,
  'notifications': 7,
}

// Генерация контента на страницах приложения
async function generatePageContent(id) {
  const generatePageContentContainer = document.createElement('div');
  if (id === 'nav-kafeder') {          // ✓ Окно кафедры
    const kafederContainer = document.createElement('div');
    try {
      const renderer = new KafederRenderer();
      const innerElement = renderer.render();
      kafederContainer.id = 'kafeder-container';
      kafederContainer.appendChild(innerElement);
    } catch (err) { kafederContainer.innerHTML = generateErrorContainer(err); }

    // ✓ Заполняем контейнер данными и возвращаем
    generatePageContentContainer.innerHTML = `
    <div class="flex-container info-container">
      <div class="banner-half" style="z-index: 9999 !important;">
        <h3>Кафедра</h3>
        <p>Списки институтов, аудиторий и преподавательский состав</p>
        <p style="font-size: 12px; color: #777;">Вся информация взята из открытых источников</p>
      </div>
      <img class="banner-half" style="z-index: 1 !important;" src="images/supbanners/kafeder.png"/>
    </div>
    <div class="flex-container radio-container">
      <button id="kafeder-teachers" class="radio-button selected" onclick="">Преподаватели</button>
      <button id="kafeder-lessons" class="radio-button" onclick="">Аудитории</button>
    </div>`;
    generatePageContentContainer.appendChild(kafederContainer);
    return generatePageContentContainer;

  } else if (id === 'nav-homework') {  // Окно домашних заданий, работы и материалов

    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Материалы</h3>
          <p>Загружайте, делитесь и просматривайте конспекты, записи лекций и домашние задания</p>
        </div>
        <img class="banner-half" src="images/supbanners/homework.png"/>
      </div>
      <div id="shedule-container"></div>
    </div>
    `;
  } else if (id === 'nav-shedule') {   // ✓ Окно расписания
    const sheduleContainer = document.createElement('div');
    sheduleContainer.id = 'shedule-container';
    exitBlock: { try {
      if (!groupData[CurrentGroup]) {
        groupData[CurrentGroup] = await fetchShedule(CurrentGroup, 'group');
        if (!groupData[CurrentGroup]) {
          sheduleContainer.appendChild(generateNoEthernetContainer());
          break exitBlock;
        }
      }
      const renderer = new ScheduleRenderer(groupData[CurrentGroup]);
      const innerElement = renderer.render('day');
      sheduleContainer.appendChild(innerElement);
    } catch (err) { console.warn(err); 
      sheduleContainer.innerHTML = generateErrorContainer(err); 
    }}

    // ✓ Получить случайное описание 
    function getRandomDescription() {
      const descriptions = [
        "Ходит слух, что 4 курс умудряется прогуливать даже перемены",
        "Мы преследовали умные мысли. Они не смогли убежать",
        "Три пары хорошо, а две - лучше",
        "Лучше не прогуливать физкультуру. Поверьте.",
        "Если ты прогулял пару, то ты ее прогулял.",
        "Мы пишем код на бумаге. Если вообще пишем...",
        "Расписание пишется вручную. ChatGPT сломался, извините",
        "Какое расписание? Я спать хочу вообще-то",
        "Первокурсники кибербеза НЕ умеют пробивать",
        "За двумя зайцами погонишься - застрянешь в текстурах",
        "Расписание еще не пушнули. Приходите позже",
        "Чем больше дедлайн, тем ровнее мой код",
        "Мне тренировки к турниру по DOTA2 дороже сна",
        "Сессия - это естественный отбор в среде первокурсников",
        "Впитал(а) python с молоком матери",
        "ГДЗ уже не поможет...",
        "Самая лучшая аудитория - туалет",
        "Print('Hello, world!')",
        "Если пришел раньше препода, значит не опоздал",
        "Знайте, мы дышим одним воздухом с ректором КГУ",
        "Код за хвост не подергаешь",
        "Код не кот - когда гладишь не мурлычет",
        "Кто-то это вообще читает?",
      ];
      const randomIndex = Math.floor(Math.random() * descriptions.length);
      return descriptions[randomIndex];
    }

    // ✓ Заполняем контейнер данными и возвращаем
    generatePageContentContainer.innerHTML = `
    <div class="flex-container info-container">
      <div class="banner-half">
        <h3>Расписание</h3>
        <p>${getRandomDescription()}</p>
      </div>
      <img class="banner-half" src="images/supbanners/note.png"/>
    </div>
    <div class="flex-container radio-container">
      <button id="shedule-day" class="radio-button selected" onclick="switchSchedule('day')">День</button>
      <button id="shedule-week" class="radio-button" onclick="switchSchedule('week')">Неделя</button>
    </div>`;
    generatePageContentContainer.appendChild(sheduleContainer);
    return generatePageContentContainer;

  } else if (id === 'nav-messager') {  // Окно чатов

    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Связь</h3>
          <p>Все ссылки на чаты и каналы КГУ на разных площадках - в одном месте</p>
        </div>
        <img class="banner-half" src="images/supbanners/messager.png"/>
      </div>
      <div id="messager-container">
        <button class="messager-button vk-button" onclick="openLink('https://vk.me/join/8DfcHJRFXddLyLELoai/JNfBYD0bD2WME3s=')">
          <div class="messager-button-inset"><div class="relative-container flex-container" style="justify-content: start !important;">
            <img class="messager-button-avatar" src="images/ui/vk.png"/>
            <div>
              <p class="messager-button-header"><b>(ВКонтакте) ИВИТШ КГУ 2026</b></p>
              <p>Официальный чат первого курса института</p>
            </div>
          </div></div>
        </button>

        <!-- Более менее готовый рабочий дизайн под шаблон -->
        <button class="messager-button tg-button" onclick="openLink('tg://join?invite=3ucdy90chfg5MDky')">
          <div class="messager-button-inset"><div class="relative-container flex-container" style="justify-content: start !important;">
            <img class="messager-button-avatar" src="images/ui/tg.png"/>
            <div>
              <p class="messager-button-header"><b>(Telegram) 26-ИСбо-4 без куратора</b></p>
              <p>Чат для неофициального общения</p>
            </div>
          </div></div>
        </button>

        <button class="messager-button vk-button" onclick="openLink('https://vk.me/join/LofPzydYEehzayfIU3v6YvVeS5/2va3Wvow=')">
          <div class="messager-button-inset"><div class="relative-container flex-container" style="justify-content: start !important;">
            <img class="messager-button-avatar" src="images/ui/vk.png"/>
            <div>
              <p class="messager-button-header"><b>(ВКонтакте) 26-ИСбо-4 с куратором</b></p>
              <p>Для объявлений и решения вопросов</p>
            </div>
          </div></div>
        </button>

        <button class="messager-button max-button" onclick="openLink('https://www.youtube.com/watch?v=PkT0PJwy8mI')">
          <div class="messager-button-inset"><div class="relative-container flex-container" style="justify-content: start !important;">
            <img class="messager-button-avatar" src="images/ui/max.png"/>
            <div>
              <p class="messager-button-header"><b>(Макс) Официальный чат мусор дроп</b></p>
              <p>Твой шанс на большой дроп</p>
            </div>
          </div></div>
        </button>
      </div>
    </div>
    `;
  } else if (id === 'nav-account') {   // Окно аккаунта

    generatePageContentContainer.innerHTML = `
      <button onclick="clearAllIndexedDB();">Вылечить расписание</button>
      <button onclick="(async () => { await window.auth.logout(); auth.endSession(); })();">Выйти из аккаунта</button>
    `;
    return generatePageContentContainer;

  } else if (id === 'notifications') { // Окно уведомлений администрации

    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Объявления</h3>
          <p>Получайте самые свежие новости от старосты, профорга и культорга</p>
        </div>
        <img class="banner-half" src="images/supbanners/notifications.png"/>
      </div>
      <div id="shedule-container"></div>
    </div>
    `;
  } else if (id === 'web') {           // Страница разработчика

    generatePageContentContainer.innerHTML = `
    <div class="relative-contaner" style="display: flex; flex-direction: column; gap: 10px; ">
    <div class="flex-container info-container">
      <div class="banner-half">
        <h3>Об авторах</h3>
        <p></p>
      </div>
      <img class="banner-half" src="images/supbanners/note.png"/>
    </div>
    <div class="info-container">
      <div class="flex-container">
        <p class="banner-half" style="font-size: 20px"><b>Я люблю сырки</b></p>
        <img style="width: 70% !important;" src="images/supbanners/sirok.png"/>  
      </div>
      <p class="">Чтобы поддержать разработчика, можете ему лично купить <i>глазированный сырок</i> (а лучше два)</p>
    </div>
    <div class="flex-container">
      <p></p>
      <button>Закинуть денег на растишку</button>
    </div>
    `;
    return generatePageContentContainer;
  } else { // Страница не найдена, ошибка 404
    return `
    <img src="images/supbanners/404.jpg" class="banner-half" style="width: 100% !important;"/>
    <h1>Пустая страница</h1>
    <p>Тут пока ничего нету прикинь</p>
    `;
  }
}

// ✓ Функция генерации страницы 
async function generatePage(id, skip) {
  if (!id) throw new Error('Страницы не существует');
  animationInProgress = true;
  if (LOADING_ANIMATIONS) flag.loading = true;
  containerMain.classList.add('animated');         // Для плавного перемещения
  containerTranslate.classList.remove('animated'); // Для мгновенного перемещения

  // ✓ Убираем перекрывающий контейнер
  if (containerUpward.classList.contains('visible')) {
    containerUpward.classList.remove('visible');
    containerUpward.classList.add('hidden');
    setTimeout(() => { containerUpward.innerHTML = ''; }, 350);
  }

  // ✓ Мгновенное перемещение второстепенного окна вбок и плавное перемещение текущего окна
  if (navPosition[id] > navPosition[navOpened]) { // Если открыта правая страница
    const a = await generatePageContent(id);
    containerTranslate.appendChild(a);
    containerTranslate.classList.add('right');
    containerMain.classList.add('left');
  } else if (navPosition[id] < navPosition[navOpened]) { // Если открыта левая страница
    const a = await generatePageContent(id);
    containerTranslate.appendChild(a);
    containerTranslate.classList.add('left');
    containerMain.classList.add('right');
  } else if (skip === true) { // Если нужно первично инициализировать
    const a = await generatePageContent(id);
    containerMain.appendChild(a);
    animationInProgress = false;
    if (LOADING_ANIMATIONS) flag.loading = false;
    return;
  } else { // Эта страница уже открыта
    animationInProgress = false;
    if (LOADING_ANIMATIONS) flag.loading = false;
    return;
  }
  navOpened = id;
  if (LOADING_ANIMATIONS) flag.loading = false;

  // ✓ Показать анимацию перелистывания
  // Прячет основной контейнер и пролистывает насередину трансляционный
  setTimeout(() => {
    containerTranslate.classList.add('animated');
    containerTranslate.classList.remove('left');
    containerTranslate.classList.remove('right');
  }, 10);

  // ✓ Мгновенная подмена второстепенного трансляционного на основной
  setTimeout(() => {
    containerMain.classList.remove('animated');
    containerMain.innerHTML = '';
    containerMain.append(...containerTranslate.children);

    containerMain.classList.remove('left');
    containerMain.classList.remove('right');
    containerTranslate.innerHTML = '';
    animationInProgress = false;
  }, 500);
}


/* ======== Генерация перекрывающего контента страницы ======== */

// Генерация перекрывающего контента на перекрывающем окне
async function generateSubpageContent(id, data) {
  if (!data) { }

  // ✓ Получить данные о преподавателе
  function extractTeachersData(teacher) {
    extractedTeacher = teacher.substring(teacher.indexOf(' ') + 1);
    let performedTeacher = extractedTeacher;
    for (const institute of Object.values(teachersData)) {
      for (const department of Object.values(institute)) {
        if (department[extractedTeacher]) {
          performedTeacher = department[extractedTeacher]; break;
        }
      }
    }
    return performedTeacher;
  }

  const generatePageContentContainer = document.createElement('div');
  generatePageContentContainer.id = 'subpage';
  if (id === 'lesson') { // Перекравающее окно информации о занятии (data - элемент расписания)
    const extractedData = ScheduleRenderer.extractElementData(data);
    const teacherData = extractTeachersData(extractedData.teacher);
    const extractedSubject = extractedData.subject 
      ? ((extractedData.subject).length > 66
        ? `${(extractedData.subject).substring(0,66)}...`
        : extractedData.subject)
      : `Безымянная пара`;
    generatePageContentContainer.innerHTML = `
    <div class="info-container"><div class="relative-container" style="height: 200px !important">
      <img class="materials-teacher" src="${teacherData.image}"/>
      <div class="materials-teacher-info" style="border-left: 5px solid ${extractedData.subjectMatchColor ? extractedData.subjectMatchColor : `rgb(0,0,0)`}">
        <p><span>${teacherData.fullName ? teacherData.fullName : `Преподаватель С.`}<span></p>
        <p><b>${extractedSubject}</b></p>
        <p><span style="font-size: 14px;">${extractedData.name ? extractedData.name : `Занятие`}</span></p>
        <p><span style="font-size: 14px;">Аудитория - </span><b>${extractedData.room ? extractedData.room : `Туалет`}</b></p>
      </div>
    </div></div>
      
    <div class="info-container materials-info-container" id="materials-materials">
      <h3>Материалы занятия</h3>  
      <p style="font-size: 14px;">Просматривайте и прикрепляйте </p>
      <div class="radio-container flex-container">
        <button class="radio-button">+ Прикрепить файл</button>
        <button class="radio-button">+ Добавить текст</button>
      </div>
      <details>
        <summary>Просмотреть</summary>
      </details>
    </div>

    <div class="info-container materials-info-container" id="materials-homework">
      <h3>Домашнее задание</h3>  
      <p style="font-size: 12px;"></p>
      <div class="radio-container flex-container">
        <button class="radio-button">+ Прикрепить файл</button>
        <button class="radio-button">+ Добавить текст</button>
      </div>
      <details>
        <summary>Просмотреть</summary>
      </details>
    </div>

    <details>
      <summary>
        <h3>Что публиковать?</h3>
      </summary>
      <p></p>
      <ul>
        <li>Текстовые формулировки </li>
        <li>Фотографии записей на доске</li>
        <li>Любые документы, содержащие учебные материалы, относящиеся к теме занятия (в том числе под авторством преподавателя)</li>
        <li>Ссылки на полезные источники информации (видео, статьи)</li>
      </ul>
    </details>
    `;
  } else if (id === 'teacher') { // Перекрывающее окно информации о преподавателе (data - инициалы преподавателя)
    const teacherData = data; let sheduleFiller;

    // Получаем расписание преподавателя
    exitBlock: { if (!groupData[teacherData.fullName]) { 
      groupData[teacherData.fullName] = await fetchShedule(teacherData.sheduleCode, 'teacher'); 
      if (!groupData[teacherData.fullName]) {
        sheduleContainer.appendChild(generateNoEthernetContainer());
        break exitBlock;
      }
    }
    const renderer = new ScheduleRenderer(groupData[teacherData.fullName]);
    sheduleFiller = renderer.render('week', true);
    }
    generatePageContentContainer.innerHTML = `
    <div class="flex-container">  
      <img class="materials-teacher" src="${teacherData.image}"/>
      <div class="info-container" style="padding: 0 15px !important; text-align: center;">
        <p>${teacherData.fullName}</p>
      <div>
    </div>
    `;
    generatePageContentContainer.appendChild(sheduleFiller);
  } else {

  }

  return generatePageContentContainer;

}

// ✓ Функция генерации перекрывающего окна
async function generateSubpage(id, data) {
  if (!id) throw new Error('Страницы не существует');
  containerUpward.innerHTML = '';

  // ✓ Добавляем кнопку закрытия второстепенного окна
  const closeButton = document.createElement('button');
  closeButton.id = 'subpage-close-button';
  closeButton.innerHTML = 'Закрыть'
  closeButton.addEventListener('click', async () => {
    containerUpward.classList.remove('visible');
    containerUpward.classList.add('hidden');
    setTimeout(() => { containerUpward.innerHTML = ''; }, 350);
  });
  containerUpward.appendChild(closeButton);

  // ✓ Заполняем родительский контейнер сгенерированным контентом
  const a = await generateSubpageContent(id, data);
  containerUpward.appendChild(a);

  // ✓ Показываем полученный контейнер
  setTimeout(() => {
    containerUpward.classList.remove('hidden');
    containerUpward.classList.add('visible');
  }, 10);
}


/* ======== ✓ Функции загрузки контента страницы ======== */

// ✓ Флаги
let _loading = false;
const flag = {
  get loading() { return _loading; },
  set loading(newLoading) {
    _loading = newLoading;
    if (_loading === true) {
      setTimeout(() => {
        if (_loading === true) {
          clearTimeout(showLoadingPageTimeout1);
          clearTimeout(showLoadingPageTimeout2);
          showLoadingPage();
        } else { hideLoadingPage(); }
      }, 200);
    } else { hideLoadingPage(); }
  }
};

// ✓ Функция показа контейнера загрузки контента
let showLoadingPageTimeout1; let showLoadingPageTimeout2;
function showLoadingPage() {
  containerLoading.innerHTML = `<img width="50px" height="50px" src="images/ui/spinner.gif"/><p>Загрузка...</p>`;
  setTimeout(() => {
    containerLoading.classList.remove('hidden');
    containerLoading.classList.add('visible');
  }, 10);
  showLoadingPageTimeout1 = setTimeout(() => {
    containerLoading.innerHTML = `
    <img width="50px" height="50px" src="images/ui/spinner.gif"/>
    <p>Пожалуйста, подождите еще немного...</p>
    `;
  }, 10000);
  showLoadingPageTimeout2 = setTimeout(() => {
    containerLoading.innerHTML = `
    <img width="50px" height="50px" src="images/ui/spinner.gif"/>
    <p>Загрузка занимает очень много времени. Ожидайте.</p>
    `;
  }, 20000);
}

// ✓ Функция скрытия контейнера загрузки контента
function hideLoadingPage() {
  clearTimeout(showLoadingPageTimeout1);
  clearTimeout(showLoadingPageTimeout2);
  setTimeout(() => {
    containerLoading.classList.remove('visible');
    containerLoading.classList.add('hidden');
  }, 10);
  setTimeout(() => {
    containerLoading.innerHTML = '';
  }, 350);
}

// ✓ Обработка нажатий на кнопку стороннего перехода
function openLink(link) {
  if (link.startsWith('tg://') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('viber://') || link.startsWith('whatsapp://')) {
    window.location.href = link;
  } else {
    window.open(link, '_blank');
  }
}

/* ======== ✓ Уведомления и другое ======== */

// Функция для показа уведомления в приложении
function showNotification(message, type = "info") {
  const notificationImage = { // Объявляем список дополнительных иконок к уведомлениям
    'info':     'images/ui/info.png',
    'error':    'images/ui/warning.png',
    'success':  'images/ui/check.png',
    'question': 'images/ui/question.png',
  };

  const notificationsContainer = document.getElementById('notifications');
  if (!notificationsContainer) return;
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `<span>${message}</span><img class="notification-image" src="${notificationImage[type]}"/>`;

  // ✓ Добавляем обработчики преждевременного скрытия уведомления
  let isSwiping = false;
  notification.addEventListener("touchstart", () => { isSwiping = true; });
  notification.addEventListener("touchend", () => { isSwiping = false; removeNotification(notification); });
  notification.addEventListener("mousedown", () => { isSwiping = true; });
  notification.addEventListener("mouseup", () => { isSwiping = false; removeNotification(notification); });
  notification.addEventListener("click", () => { isSwiping = false; removeNotification(notification); });

  // ✓ Добавляем полученное уведомление и анимируем его
  notificationsContainer.appendChild(notification);
  notification.offsetHeight;
  notification.classList.add("notification-enter");

  // ✓ Если превышен лимит уведомлений, удаляем старое
  const notifications = notificationsContainer.querySelectorAll(".notification");
  if (notifications.length > 3) { removeNotification(notifications[0]); }

  // ✓ Удаляем уведомление через 3500мс
  const timeoutId = setTimeout(() => {
    if (!isSwiping) { removeNotification(notification); }  
  }, 3500);
  notification.dataset.timeoutId = timeoutId; // Сохраняем timeout ID для возможности отмены при удалении
}

// ✓ Функция для плавного удаления уведомления
function removeNotification(notification) {
  // ✓ Очищаем timeout если уведомление удаляется досрочно
  if (notification.dataset.timeoutId) { clearTimeout(parseInt(notification.dataset.timeoutId)); }
  notification.classList.remove("notification-enter");
  notification.classList.add("notification-exit");

  // ✓ Удаляем элемент после завершения анимации
  setTimeout(() => { notification.remove(); }, 300);
}


/* ============================ Аутентификация и инициализация ============================ */

// ✓ Основные контейнеры приложения
const authContainer = document.getElementById("auth");
const sessionContainer = document.getElementById("session");
const authContainerContent = authContainer.innerHTML;
const sessionContainerContent = sessionContainer.innerHTML;

// ✓ Функции аутентификации
// Требуется доработка окна дополнительной информации
class AuthProcessor {

  // ✓ Функция инициализации сессии
  static async startSession() {
    if (DEBUG_MODE) console.log("🔓 Инициализация сессии пользователя");
    flag.loading = true;

    // ✓ Скрываем блок аутентификации, показываем блок сессии
    containerLoading.style.zIndex = '1000';
    sessionContainer.style.display = 'block';
    authContainer.classList.add('hidden');
    authContainer.classList.remove('visible');
    setTimeout(() => {
      sessionContainer.classList.remove('hidden');
      sessionContainer.classList.add('visible');
      authContainer.innerHTML = '';
    }, 350);

    // ✓ Добавление слушателей нажатия на все кнопки интерфейса
    const navButtons = document.querySelectorAll('.nav-element');
    const buttonNotifications = document.getElementById('header-notifications');
    const buttonWeb = document.getElementById('header-web');
    navButtons.forEach(button => {
      button.addEventListener('click', async () => {
        if (DEBUG_MODE) console.log('📌 Нажата кнопка ', button.id);
        try {
          if (animationInProgress !== true) { await generatePage(button.id); }
        } catch { animationInProgress = false; }
      });
    });
    buttonNotifications.addEventListener('click', async () => {
      if (DEBUG_MODE) console.log('📌 Нажата кнопка ', buttonNotifications.id);
      try {
        if (animationInProgress !== true) { await generatePage('notifications'); }
      } catch { animationInProgress = false; }
    });
    buttonWeb.addEventListener('click', async () => {
      if (DEBUG_MODE) console.log('📌 Нажата кнопка ', buttonWeb.id);
      try {
        if (animationInProgress !== true) { await generatePage('web'); }
      } catch { animationInProgress = false; }
    });

    // ✓ Функция для смены расписания группы
    const groupChange = document.getElementById('header-group-p');
    CurrentGroup = localStorage.getItem('userGroup') || '26-ИСбо-4';
    (document.getElementById('header-group')).innerHTML = CurrentGroup;
    groupChange.addEventListener('click', async () => {
      if (DEBUG_MODE) console.log('📌 Нажата кнопка ', groupChange.id);
      if (navOpened === 'nav-shedule' && LOADING_ANIMATIONS) { flag.loading = true; }

      // ✓ Выбираем следующий ключ в списке избранных групп
      const groupKeys = Object.keys(favoriteGroups);
      const currentIndex = groupKeys.indexOf(CurrentGroup);
      const nextIndex = (currentIndex + 1) % groupKeys.length;
      CurrentGroup = groupKeys[nextIndex];
      if (DEBUG_MODE) console.log('Текущая группа была сменена на ', CurrentGroup);

      // ✓ Обновляем страницу и расписание
      (document.getElementById('header-group')).innerHTML = CurrentGroup;
      if (navOpened === 'nav-shedule') {
        const sheduleContainer = document.getElementById('shedule-container');
        try {
          const dayButton = document.getElementById('shedule-day');
          const moduleSelected = (dayButton.classList.contains('selected')) ? "day" : "week";
          exitBlock: { 
            if (!groupData[CurrentGroup]) {
              groupData[CurrentGroup] = await fetchShedule(CurrentGroup, 'group');
              if (!groupData[CurrentGroup]) {
                setTimeout(() => {
                  sheduleContainer.innerHTML = '';
                  sheduleContainer.appendChild(generateNoEthernetContainer()); 
                }, 500);
                break exitBlock;
              }
            }
            setTimeout(() => {
              const renderer = new ScheduleRenderer(groupData[CurrentGroup]);
              const sheduleFiller = renderer.render(moduleSelected);
              sheduleContainer.innerHTML = '';
              sheduleContainer.appendChild(sheduleFiller);
            }, 500);
          }
        } catch (err) { if (DEBUG_MODE) console.warn('Ошибка смены расписания: ', err); }
        setTimeout(() => { flag.loading = false; return;  }, 1000);
      }
    });

    // ✓ Обновляем имя в шапке
    const user = window.auth.getCurrentUser();
    const headerName = document.querySelector("#header-name");
    if (headerName) {
      headerName.textContent = (user && typeof user !== 'null') ? `🧑 ${user.displayName}` : `🕵🏻 Гостевой режим`;
    }

    // ✓ Загружаем расписание и генерируем страницу
    try {
      if (DEBUG_MODE) console.log("✅ Сессия успешно инициализирована");
      await generatePage("nav-shedule", true);
    } catch (error) {
      if (DEBUG_MODE) console.error("❌ Ошибка при рендере страницы сессии:", error);
      showNotification(`Ошибка при загрузке страницы: ${error}`, "error");
    }

    setTimeout(() => { containerLoading.style.zIndex = '7'; flag.loading = false; }, 250);
  }

  // ✓ Функция завершения сессии и открытия окна авторизации
  endSession() {
    if (DEBUG_MODE) console.log("🔐 Завершение сессии пользователя");
    flag.loading = true;

    // ✓ Очищаем пользовательские сохраненные данные
    groupData = {}; localStorage.clear();

    // ✓ Генерируем окно авторизации
    this.renderAuth(false);
    flag.loading = false;
  }

  // ✓ Функция рендера и добавления обработчиков нажатия элементов авторизации
  renderAuth(progressed) {

    // ✓ Обьявление элементов авторизации 
    authContainer.innerHTML = authContainerContent;
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const AdditionalForm = document.getElementById("additional-form");
    const toggleToLogin = document.getElementById("auth-button-toggleLogin");
    const toggleToRegister = document.getElementById("auth-button-toggleRegister");
    const backOnTrack = document.getElementById('auth-button-backOnTrack');
    const guestModeButton1 = document.getElementById("auth-button-guestMode1");
    const guestModeButton2 = document.getElementById("auth-button-guestMode2");

    sessionContainer.classList.add('hidden');
    sessionContainer.classList.remove('visible');
    setTimeout(() => { 
      authContainer.classList.remove('hidden'); 
      authContainer.classList.add('visible');
      sessionContainer.style.display = 'none';
    }, 200);
    if (progressed) { // ✓ Если пользователь начал регистрацию но не допрошел ее
      registerForm.classList.add("form-hidden");
      loginForm.classList.add("form-hidden");
      AdditionalForm.classList.remove("form-hidden");
      backOnTrack.innerHTML = 'Выйти из аккаунта';
    } else {
      registerForm.classList.remove("form-hidden");
      loginForm.classList.add("form-hidden");
      AdditionalForm.classList.add("form-hidden");
    }

    // ✓ Инициализируем кнопки переключения между режимами авторизации
    toggleToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      registerForm.classList.add("form-hidden");
      AdditionalForm.classList.add("form-hidden");
      loginForm.classList.remove("form-hidden");
    });
    toggleToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      loginForm.classList.add("form-hidden");
      AdditionalForm.classList.add("form-hidden");
      registerForm.classList.remove("form-hidden");
    });
    backOnTrack.addEventListener("click", async(e) => {
      e.preventDefault();
      AdditionalForm.classList.add("form-hidden");
      loginForm.classList.add("form-hidden");
      registerForm.classList.remove("form-hidden");
      await window.auth.logout();
    });

    // ✓ Установка переключателя режима просмотра пароля
    function setupPasswordToggle(passwordInput, toggleButton) {
      toggleButton.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        const eyeIcon = toggleButton.querySelector('.eye-icon');
        eyeIcon?.classList.toggle('show-password', isPassword);
      });
    }
    const passwordInput1 = document.getElementById('auth-input-registerPassword');
    const toggleButton1 = document.getElementById('auth-register-passwordToggle');
    const passwordInput2 = document.getElementById('auth-input-registerPasswordAgain');
    const toggleButton2 = document.getElementById('auth-register-passwordAgainToggle');
    const passwordInput3 = document.getElementById('auth-input-loginPassword');
    const toggleButton3 = document.getElementById('auth-login-passwordToggle');
    setupPasswordToggle(passwordInput1, toggleButton1);
    setupPasswordToggle(passwordInput2, toggleButton2);
    setupPasswordToggle(passwordInput3, toggleButton3);

    // ✓ Обработка регистрации
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // ✓ Обьявление значений введенных элементов
      const username = document.querySelector("#auth-input-registerUsername").value.trim();
      const email = document.querySelector("#auth-input-registerEmail").value.trim();
      const password = document.querySelector("#auth-input-registerPassword").value;
      const passwordAgain = document.querySelector("#auth-input-registerPasswordAgain").value;
      const policy = document.querySelector("#auth-chechmark-policy").value;

      // ✓ Валидация полей ввода и совпадения паролей
      if (!username || !email || !password || !passwordAgain) {
        showNotification("Необходимо заполнить все регистрационные поля", "error"); return;
      }
      if (password !== passwordAgain) {
        showNotification("Введенные пароли не совпадают", "error"); return;
      }
      if (!policy) {
        showNotification("Необходимо согласиться с политикой конфиденциальности", "error"); return;
      }

      // ✓ Отключаем кнопку на время осуществения связи с сервером
      const submitButton = registerForm.querySelector("button[type='submit']");
      submitButton.disabled = true; toggleToLogin.disabled = true; toggleToRegister.disabled = true;
      submitButton.textContent = "Загрузка...";

      // ✓ Вызываем метод регистрации из класса Authentication
      const result = await window.auth.register(email, password, username);
      if (result.success) { // ✓ Если регистрация прошла успешно
        showNotification(result.message, "success");
        registerForm.reset();
        setTimeout(async() => {
          loginForm.classList.add("form-hidden");
          registerForm.classList.add("form-hidden");
          AdditionalForm.classList.remove("form-hidden");
          backOnTrack.innerHTML = 'Выйти из аккаунта';
        }, 200);
      } else { // ✓ Если произошла ошибка во время авторизации
        showNotification(result.message, "error");
        submitButton.textContent = "Зарегистрироваться";
      }
      submitButton.disabled = false; toggleToLogin.disabled = false; toggleToRegister.disabled = false;
    });

    // Обработка ввода формы дополнительной информации
    new authGroupSelector();
    AdditionalForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Обьявление значений введенных элементов
      const userGroup = document.querySelector("#auth-input-group").value.trim();

      // Валидация введенных значений
      if (!userGroup || typeof userGroup !== 'string') {
        showNotification('Необходимо ввести Вашу группу обучения', 'error'); return;
      }

      // Сохраняем пользовательские данные в локальное хранилище
      localStorage.setItem('userData', true);
      localStorage.setItem('userGroup', userGroup);

      // ✓ Запускаем сессию
      const submitButton = registerForm.querySelector("button[type='submit']");
      submitButton.disabled = true; backOnTrack.disabled = true;
      submitButton.textContent = "Загрузка...";
      setTimeout(async() => {
        await AuthProcessor.startSession();
      }, 200);
    });

    // ✓ Обработка входа в аккаунт
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // ✓ Обьявление значений введенных элементов
      const email = document.querySelector("#auth-input-loginEmail").value.trim();
      const password = document.querySelector("#auth-input-loginPassword").value;

      if (!email || !password) { // ✓ Валидация полей ввода
        showNotification("Необходимо заполнить все регистрационные поля", "error"); return;
      }

      // ✓ Отключаем кнопку на время осуществения связи с сервером
      const submitButton = loginForm.querySelector("button[type='submit']");
      submitButton.disabled = true; toggleToLogin.disabled = true; toggleToRegister.disabled = true;
      submitButton.textContent = "Загрузка...";

      // ✓ Вызываем метод регистрации из класса Authentication
      const result = await window.auth.login(email, password);
      if (result.success) {
        showNotification(result.message, "success");
        registerForm.reset();
        setTimeout(async() => {
          loginForm.classList.add("form-hidden");
          registerForm.classList.add("form-hidden");
          AdditionalForm.classList.remove("form-hidden");
          backOnTrack.innerHTML = 'Выйти из аккаунта';
        }, 200);
      } else { // ✓ Если произошла ошибка во время авторизации
        showNotification(result.message, "error");
        submitButton.textContent = "Зарегистрироваться";
      }
      submitButton.disabled = false; toggleToLogin.disabled = false; toggleToRegister.disabled = false;
    });

    // ✓ Обработка запуска гостевого режима
    async function guestModeEventListener() {
      console.log("🕵🏻 Включен гостевой режим");
      if (localStorage.getItem('userData')) { // ✓ Если это не первый случай запуска гостевого режима
        await AuthProcessor.startSession();
      } else { // ✓ Если человек еще ни разу не запускал гостевой режим
        registerForm.classList.add("form-hidden");
        loginForm.classList.add("form-hidden");
        AdditionalForm.classList.remove("form-hidden");
      }
    }
    guestModeButton1.addEventListener("click", async () => guestModeEventListener());
    guestModeButton2.addEventListener("click", async () => guestModeEventListener());
  }

  // ✓ Главная функция инициализации процессора аутентификации
  async init() {
    if (DEBUG_MODE) console.log("🚀 Инициализация приложения...");
    flag.loading = true;

    // ✓ Инициализируем Firebase и получаем текущий вход в аккаунт
    await new Promise((resolve) => {
      const unsubscribe = window.auth.auth.onAuthStateChanged(() => {
        unsubscribe();
        resolve();
      });
    });

    const currentUser = window.auth.getCurrentUser();
    if (currentUser && localStorage.getItem('userData')) { // ✓ Если вход в аккаунт выполнен и выбраны данные
      if (DEBUG_MODE) console.log("✅ Пользователь авторизован: ", currentUser.email);
      await AuthProcessor.startSession();
    } else if (currentUser) { // ✓ Если прошла регистрация, но пользователь не довыбирал
      if (DEBUG_MODE) console.log("❓ Пользователь авторизован, но не допрошел регистрацию: ", currentUser.email);
      showNotification('Для доступа к приложению необходимо завершить регистрацию', 'info');
      this.renderAuth(true);
    } else { // ✓ Если авторизация не выполнена на данном устройстве
      if (DEBUG_MODE) console.log("❌ Пользователь не авторизован");
      showNotification('Сохраненный аккаунт не обнаружен. Запускаем авторизацию...', 'info');
      this.renderAuth(false);
    }
    flag.loading = false;
  }
}
const auth = new AuthProcessor();
auth.init(); // Когда приложение загружается, первым делом запускаем авторизацию

// Когда проинициализируется сессия, устанавливаем обработчики для выхода и удаления
window.addEventListener("load", () => {
  setTimeout(() => {
    if (window.auth.isAuthenticated()) {
      const headerRight = document.querySelector("#header-right");
      if (!headerRight) return;

      // Проверяем, есть ли уже кнопка выхода
      let logoutBtn = document.querySelector("#logout-btn");
      if (!logoutBtn) {
        logoutBtn = document.createElement("button");
        logoutBtn.id = "logout-btn";
        logoutBtn.className = "header-button logout-button";
        logoutBtn.textContent = "Выход";
        headerRight.appendChild(logoutBtn);
      }

      logoutBtn.addEventListener("click", async () => {
        if (confirm("Вы уверены, что хотите выйти из аккаунта?")) {
          const result = await window.auth.logout();
          if (result.success) {
            endSession();
          }
        }
      });

      // Проверяем, есть ли уже кнопка удаления
      let deleteBtn = document.querySelector("#delete-account-btn");
      if (!deleteBtn) {
        deleteBtn = document.createElement("button");
        deleteBtn.id = "delete-account-btn";
        deleteBtn.className = "header-button delete-button";
        deleteBtn.textContent = "Удалить аккаунт";
        headerRight.appendChild(deleteBtn);
      }

      deleteBtn.addEventListener("click", async () => {
        const password = prompt(
          "Для удаления аккаунта введите ваш пароль:"
        );

        if (!password) {
          showNotification("❌ Отменено", "error");
          return;
        }

        if (
          confirm(
            "⚠️ Это действие необратимо! Все данные будут удалены. Вы уверены?"
          )
        ) {
          const result = await window.auth.deleteAccount(password);

          if (result.success) {
            showNotification("✅ " + result.message, "success");
            setTimeout(() => endSession(), 1500);
          } else {
            showNotification("❌ " + result.message, "error");
          }
        }
      });
    }
  }, 100);
});