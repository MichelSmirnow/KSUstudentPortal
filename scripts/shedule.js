/* ====================================== ✓ Расписание ====================================== */

/* ============================ ✓ Доступ к ЭЙОС ============================
 * Расписание забирается обычным запросом по ссылке (fetch) внутри ICSParser.
 * Никаких CORS-проверок, источников и прокси здесь нет: если запрос не прошёл,
 * fetchShedule возвращает undefined, а интерфейс предлагает загрузить файл .ics вручную.
 * ============================================================================== */

// ✓ Разобрать календарь, который пользователь принёс сам, и сохранить его на устройство
async function importSheduleFromText(text, sheduleID, sheduleType) {
  const calendar = String(text || '').replace(/^\uFEFF/, '');
  if (!/BEGIN:VEVENT/i.test(calendar)) {
    return { success: false, message: 'Внутри нет ни одного занятия: это не похоже на календарь ЭЙОС (ожидается файл .ics)' };
  }
  try {
    const events = new ICSParser().parse(calendar);
    if (!Array.isArray(events) || events.length === 0) {
      return { success: false, message: 'Календарь прочитан, но занятий в нём нет' };
    }
    await saveLocalShedule(events, sheduleID, sheduleType);
    return { success: true, count: events.length, events, message: `Сохранено занятий: ${events.length}` };
  } catch (error) {
    return { success: false, message: `Не удалось сохранить расписание: ${(error && error.message) || error}` };
  }
}

/* -----------------------------------------------------------------------------------------
 * ✓ Сеть без софтлока
 *
 * Раньше запрос к ЭЙОС уходил в никуда: пока сервер не отвечал, страница висела в загрузке
 * (на плохой сети — около 20 секунд) и сыпала ошибками в консоль. Теперь у каждого запроса
 * есть предел ожидания, а при отсутствии соединения запрос не делается вовсе: приложение
 * сразу уходит в оффлайн-режим и показывает то, что уже сохранено на устройстве.
 * -------------------------------------------------------------------------------------- */

// ✓ Нет сохранённого расписания — ждём чуть дольше, есть — почти не ждём
const SHEDULE_FETCH_TIMEOUT = 10000;   // расписания на устройстве нет
const SHEDULE_REFRESH_TIMEOUT = 4000;  // расписание уже есть, показывать есть что

// ✓ Есть ли подключение к интернету
function isNetworkOnline() {
  try { return navigator.onLine !== false; } catch (_) { return true; }
}
window.isNetworkOnline = isNetworkOnline;

/**
 * ✓ Запрос с ограничением по времени.
 * Отменённый по таймауту запрос не висит в фоне и не мешает повторной загрузке.
 */
async function fetchWithTimeout(url, options) {
  const settings = options || {};
  const timeout = Number(settings.timeout) > 0 ? Number(settings.timeout) : SHEDULE_FETCH_TIMEOUT;
  const requestOptions = Object.assign({}, settings);
  delete requestOptions.timeout;

  // ✓ Отмена + гонка по времени: страница дождётся ответа не дольше лимита,
  //   даже если запрос «повис» и не отменяется сам (или браузер старый).
  let timer = 0;
  let controller = null;
  if (typeof AbortController === 'function') {
    controller = new AbortController();
    requestOptions.signal = controller.signal;
  }
  const attempt = Promise.resolve().then(() => fetch(url, requestOptions));
  try {
    return await Promise.race([
      attempt,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          if (controller) { try { controller.abort(); } catch (_) { /* уже отменён */ } }
          reject(new Error('время ожидания ответа истекло'));
        }, timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    // ✓ Отказ после истечения лимита никому не нужен — гасим, чтобы не сыпало в консоль
    attempt.catch(() => {});
  }
}
window.fetchWithTimeout = fetchWithTimeout;

// ✓ Состояние последней загрузки расписания: ok | offline | error
const sheduleLoadStatus = new Map();
function setSheduleStatus(sheduleID, sheduleType, status, details) {
  sheduleLoadStatus.set(`${sheduleType || 'group'}:${sheduleID}`, { status, details: details || '' });
}
window.getSheduleStatus = (sheduleID, sheduleType) => {
  const record = sheduleLoadStatus.get(`${sheduleType || 'group'}:${sheduleID}`);
  return record ? record.status : 'unknown';
};
window.getSheduleStatusDetails = (sheduleID, sheduleType) => {
  const record = sheduleLoadStatus.get(`${sheduleType || 'group'}:${sheduleID}`);
  return record ? record.details : '';
};

// ✓ Парсер ICS календаря с сайта ЕЙОС КГУ
class ICSParser {
  constructor() {
    this.parseShedule = [];
  }

  // ✓ Получение ICS календаря расписания: обычный запрос по ссылке и разбор ответа
  async fetch(url, options) {
    const timeout = Number(options && options.timeout) > 0 ? Number(options.timeout) : undefined;
    if (!url) {
      window.lastSheduleFetchError = 'ссылка на расписание не собралась';
      if (DEBUG_MODE) console.warn('Ссылка на расписание не собралась');
      throw new Error('ссылка на расписание не собралась');
    }
    // ✓ Нет соединения — даже не стучимся: страница должна открыться сразу
    if (!isNetworkOnline()) {
      window.lastSheduleFetchError = 'нет подключения к интернету';
      throw new Error('нет подключения к интернету');
    }
    try {
      const response = await fetchWithTimeout(url, { timeout });
      if (!response.ok) throw new Error(`сервер ответил ${response.status}`);
      window.lastSheduleFetchError = '';
      return this.parse(await response.text());
    } catch (error) {
      // Причину запоминаем: её показывает панель ручной загрузки расписания
      window.lastSheduleFetchError = (error && error.message) ? error.message : String(error);
      throw error;
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

/* ==================== ✓ Помощники расписания (обновление 16.10.2026) ==================== */

// ✓ Понедельник недели, в которой находится дата
function getMondayOfDate(date) {
  const value = justifyDate(date);
  const day = value.getDay();
  const diff = value.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(value);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ✓ Ключ дня в формате YYYY-MM-DD (без обращения к классу ScheduleRenderer)
function getDayKey(date) {
  const value = justifyDate(date);
  if (Number.isNaN(value.getTime())) return '';
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

// ✓ Контейнер прокрутки страницы расписания
function getSheduleScrollContainer() {
  return document.getElementById('container');
}

// ✓ Безопасная прокрутка: в старых WebView и в средах без scrollTo остаётся запасной путь
function applyScroll(node, options) {
  if (!node) return false;
  const target = options || {};
  try {
    if (typeof node.scrollTo === 'function') { node.scrollTo(target); return true; }
  } catch (error) { /* переходим к прямой установке значений */ }
  try {
    if (typeof target.top === 'number') node.scrollTop = target.top;
    if (typeof target.left === 'number') node.scrollLeft = target.left;
    return true;
  } catch (error) { return false; }
}

// ✓ Поставить блок дня сразу под «прилипшей» панелью выбора недели
function scrollSheduleToToday(weekContainer) {
  let attempts = 0;
  const run = () => {
    attempts += 1;
    const container = getSheduleScrollContainer();
    const dayElement = weekContainer && weekContainer.querySelector
      ? weekContainer.querySelector('[data-shedule-today="true"]')
      : null;
    if (container && dayElement && dayElement.isConnected) {
      const containerRect = container.getBoundingClientRect();
      const dayRect = dayElement.getBoundingClientRect();
      const absoluteTop = dayRect.top - containerRect.top + container.scrollTop;
      // Панель недель прилипает к верху (top: -10px), её нижняя граница — высота минус 10px
      const panel = container.querySelector('.radio-week-container');
      const panelHeight = panel ? Math.max(0, panel.offsetHeight - 10) : 0;
      const target = Math.max(0, absoluteTop - (panelHeight + 16));
      applyScroll(container, { top: target, behavior: 'smooth' });
      return;
    }
    if (attempts < 25) setTimeout(run, 60);
  };
  setTimeout(run, 40);
}

// ✓ Прокрутить расписание наверх (к понедельнику выбранной недели)
function scrollSheduleToTop() {
  let attempts = 0;
  const run = () => {
    attempts += 1;
    const container = getSheduleScrollContainer();
    if (container && container.isConnected) {
      applyScroll(container, { top: 0, behavior: 'smooth' });
      return;
    }
    if (attempts < 25) setTimeout(run, 60);
  };
  setTimeout(run, 40);
}

// ✓ Поставить текущую неделю по центру панели выбора недель
function centerWeekSelector(weekContainer) {
  let attempts = 0;
  const run = () => {
    attempts += 1;
    const container = document.getElementById('container');
    const host = weekContainer && weekContainer.isConnected
      ? weekContainer
      : (container ? container.querySelector('.radio-week-container') : null);
    const button = host ? host.querySelector('.current-week-button') : null;
    if (host && button) {
      const hostRect = host.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const absoluteLeft = buttonRect.left - hostRect.left + host.scrollLeft;
      const target = absoluteLeft - (host.clientWidth - button.offsetWidth) / 2;
      applyScroll(host, { left: Math.max(0, target), behavior: 'smooth' });
      return;
    }
    if (attempts < 25) setTimeout(run, 60);
  };
  setTimeout(run, 40);
}

// ✓ Фокус недельного расписания: текущая неделя — к сегодняшнему дню, остальные — наверх
function focusWeekSchedule(weekContainer, selectedDate) {
  centerWeekSelector(weekContainer);
  const selectedMondayKey = getDayKey(getMondayOfDate(selectedDate || new Date()));
  const currentMondayKey = getDayKey(getMondayOfDate(new Date()));
  if (selectedMondayKey === currentMondayKey) scrollSheduleToToday(weekContainer);
  else scrollSheduleToTop();
}

// ✓ Плашка «пар нет» со спящим котом (если картинки нет — остаётся только текст)
function buildNoClassesBlock(text, extraClass) {
  const block = document.createElement('div');
  block.className = 'no-classes-block' + (extraClass ? ` ${extraClass}` : '');
  const image = document.createElement('img');
  image.src = 'images/ui/sleeping-cat.png';
  image.alt = 'Спящий кот';
  image.addEventListener('error', () => { try { image.remove(); } catch (error) { image.style.display = 'none'; } });
  block.appendChild(image);
  const paragraph = document.createElement('p');
  paragraph.textContent = text;
  block.appendChild(paragraph);
  return block;
}

// ✓ Очистить локальную базу расписаний (раздел «Данные приложения»)
async function clearLocalShedules() {
  const cleared = [];
  const failed = [];
  for (const dbName of ['group', 'teacher']) {
    try {
      const storage = getStorage(dbName);
      await storage.clearDB();
      cleared.push(dbName);
    } catch (error) {
      if (DEBUG_MODE) console.warn(`Не удалось очистить локальное расписание «${dbName}»:`, error && error.message ? error.message : error);
      failed.push(dbName);
    }
  }
  groupData = {};
  return { cleared, failed };
}

// ✓ Загрузить расписание из локальной памяти
async function loadLocalShedule(sheduleID, sheduleType) {
  if (!sheduleID || !sheduleType) { 
    throw new Error('Данные для загрузки расписания объявлены неверным образом'); 
  }
  let timer = 0;
  try {
    const storage = getStorage(sheduleType);
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Load timeout')), 10000);
    });
    const loadedData = await Promise.race([
      storage.load(sheduleID), // Передаем sheduleID как ключ
      timeoutPromise
    ]);
    clearTimeout(timer);
    if (loadedData === null || loadedData === undefined) {
      if (DEBUG_MODE) console.warn(`Данные ${sheduleID} не найдены в локальной памяти`);
      return undefined;
    }
    const parsedData = JSON.parse(loadedData);
    if (DEBUG_MODE) console.log(`Загруженное расписание ${sheduleID}:`, parsedData);
    return parsedData ?? [];
  } catch (error) {
    clearTimeout(timer);
    if (DEBUG_MODE) console.warn(`Ошибка загрузки ${sheduleID}:`, error.message);
    return undefined;
  }
}

// ✓ Сохранить расписание в локальной памяти
async function saveLocalShedule(inputShedule, sheduleID, sheduleType) {
  if (!inputShedule || !sheduleID || !sheduleType) { 
    throw new Error('Данные для сохранения расписания объявлены неверным образом'); 
  }
  let timer = 0;
  try {
    const storage = getStorage(sheduleType);
    const stringedShedule = JSON.stringify(inputShedule);
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Save timeout')), 10000);
    });
    await Promise.race([
      storage.save(sheduleID, stringedShedule), // Передаем sheduleID как ключ
      timeoutPromise
    ]);
    clearTimeout(timer);
    if (DEBUG_MODE) console.log(`✓ Расписание ${sheduleID} успешно сохранено`);
  } catch (error) {
    clearTimeout(timer);
    if (DEBUG_MODE) console.warn(`Ошибка сохранения данных ${sheduleID}:`, error.message);
    throw new Error(`Ошибка сохранения данных: ${error.message}`);
  }
}

// ✓ Выгрузить календарь с расписанием с сайта ЭЙОС КГУ и распарсировать его
async function fetchShedule(sheduleID, sheduleType) {

  // ✓ Функция слияния двух массивов расписаний
  function mergeSchedules(oldSchedule = [], newSchedule = []) {
    // Нормализация текста для корректного сравнения
    const normalize = value => {
      return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
    };

    // ВАЖНО: из локального хранилища время приходит строкой, а с сервера — объектом Date.
    // Из-за этого сравнение «старое / новое» всегда давало false, и при каждом обновлении
    // в дне появлялась ещё одна копия той же пары. Приводим оба варианта к ISO-строке.
    const timeKey = value => {
      if (value === null || value === undefined || value === '') return '';
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? normalize(value) : date.toISOString();
    };

    const getStartTime = item => { return timeKey(item.startTime); };
    const getDay = item => { return timeKey(item.startTime).slice(0, 10); };

    // Название предмета без хвоста «, 1 п/г» — подгруппа проверяется отдельно
    const getSummary = item => {
      const full = normalize(item.summary);
      const withoutSubgroup = full.replace(/,[^,]*$/, '').trim();
      return withoutSubgroup || full;
    };

    const getSubgroup = item => { // Извлекаем признак подгруппы. Поддерживаются варианты: "п/г 1", "п/г 2", "подгруппа 1", "подгруппа 2"
      const text = `${item.summary ?? ''} ${item.description ?? ''}`;
      const match = text.match(/(?:п\/г|подгруппа|подгр\.?)\s*№?\s*(\d+)/i);
      return match ? `subgroup:${match[1]}` : 'subgroup:none';
    };

    const getRoom = item => { return normalize(item.location).replace(/[^0-9a-zа-я]+/g, ''); };

    const getTeacher = item => { // В описании ФИО стоит перед «группа: …»
      const text = String(item.description ?? '').split(/группа\s*:/i)[0];
      const fio = text.match(/[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.\s*[А-ЯЁ]\./);
      return normalize(fio ? fio[0] : text);
    };

    const isSameItem = (oldItem, newItem) => {
      // 1. Основная проверка — UID
      if (
        oldItem.uid &&
        newItem.uid &&
        String(oldItem.uid) === String(newItem.uid)
      ) {
        return true;
      }

      const sameSummary = getSummary(oldItem) !== '' && getSummary(oldItem) === getSummary(newItem);
      const sameSubgroup = getSubgroup(oldItem) === getSubgroup(newItem);
      const sameRoom = getRoom(oldItem) !== '' && getRoom(oldItem) === getRoom(newItem);
      const sameTeacher = getTeacher(oldItem) !== '' && getTeacher(oldItem) === getTeacher(newItem);
      const sameStartTime = getStartTime(oldItem) !== '' && getStartTime(oldItem) === getStartTime(newItem);
      const sameDay = getDay(oldItem) !== '' && getDay(oldItem) === getDay(newItem);

      // 2. Совпало время начала — сверяем предмет, подгруппу и (аудиторию либо преподавателя)
      if (sameStartTime && sameSummary && sameSubgroup && (sameRoom || sameTeacher)) return true;

      // 3. Если время занятия изменилось, ищем его по дню + предмету + подгруппе + аудитории/преподавателю
      if (sameDay && sameSummary && sameSubgroup && (sameRoom || sameTeacher)) return true;

      return false;
    };

    let merged = [];

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

    // Дополнительная проверка (как просили в задаче): прогоняем слияние по кругу,
    // пока список не перестанет уменьшаться. Так дочищаются копии, которые
    // «догнали» друг друга по полям только после первого прохода.
    for (let pass = 0; pass < 5; pass += 1) {
      const before = merged.length;
      const cleaned = [];
      for (const item of merged) {
        const duplicateIndex = cleaned.findIndex(existingItem => isSameItem(existingItem, item));
        if (duplicateIndex === -1) cleaned.push(item);
        else cleaned[duplicateIndex] = { ...cleaned[duplicateIndex], ...item };
      }
      merged = cleaned;
      if (merged.length === before) break;
    }

    return merged;
  }

  // ✓ Сгенерировать ссылку для получения расписания (добавить расписание аудиторий)
  function getSheduleLink(type, id) {
    const link = buildSheduleLink(type, id);
    if (!link) console.warn('Ссылку на расписание собрать не удалось:', type, id);
    return link;
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
  const online = isNetworkOnline();
  // ✓ Если расписание уже есть — ждём сервер совсем недолго: показывать есть что
  const requestTimeout = oldShedule ? SHEDULE_REFRESH_TIMEOUT : SHEDULE_FETCH_TIMEOUT;
  try { // ✓ Попытка обновить данные с сервера
    if (!online) throw new Error('нет подключения к интернету');
    const parser = new ICSParser();
    const sheduleLink = getSheduleLink(sheduleType, sheduleID);
    newShedule = await parser.fetch(sheduleLink, { timeout: requestTimeout });
    if (!newShedule || newShedule.length === 0 || !Array.isArray(newShedule)) {
      newShedule = undefined;
      throw new Error('Не получилось соединиться с сервером или формат расписания на сервере неверен');
    }
    if (DEBUG_MODE) console.log('Удалось сделать запрос и получить расписание: ', newShedule);
    setSheduleStatus(sheduleID, sheduleType, 'ok');
  } catch (error) { // Если пришел пустой массив
    newShedule = undefined;
    const details = (error && error.message) ? error.message : String(error);
    setSheduleStatus(sheduleID, sheduleType, online ? 'error' : 'offline', details);
    if (DEBUG_MODE) console.warn('Ошибка при загрузке расписания с сервера, используется файл локального сохранения', error);
  }

  if (!newShedule && !oldShedule) {
    if (DEBUG_MODE) console.warn('Расписания нет ни на сервере, ни на устройстве');
    return undefined;
  }
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
    if (DEBUG_MODE) console.warn('Ошибка слияния расписаний:', error && error.message ? error.message : error);
  }

  // ✓ Сохраняем слитое расписание в локальное хранилище
  try {
    await saveLocalShedule(mergedShedule, sheduleID, sheduleType);
  } catch (error) {
    if (DEBUG_MODE) console.warn('Не удалось сохранить расписание на устройстве:', error && error.message ? error.message : error);
    return mergedShedule;
  }
  if (DEBUG_MODE) console.log('Расписание успешно сохранено и обновлено');
  return mergedShedule;
}

// ✓ Ссылка на API ЭЙОС: её же показываем пользователю для ручной загрузки файла
function buildSheduleLink(type, id) {
  if (type === 'group') {
    const groupIDtoExtract = typeof getGroupID === 'function' ? getGroupID(id) : null;
    if (!groupIDtoExtract) return undefined;
    return `http://data.kgustud.ru/%D0%98%D0%92%D0%98%D0%A2%D0%A8/%D0%A0%D0%B0%D1%81%D0%BF%D0%B8%D1%81%D0%B0%D0%BD%D0%B8%D0%B5%20%D0%B3%D1%80%D1%83%D0%BF%D0%BF/${groupIDtoExtract}.ics`;
    // return `https://eios.kosgos.ru/api/Rasp?idGroup=${groupIDtoExtract}&iCal=true`;
  }
  if (type === 'teacher') return `https://eios.kosgos.ru/api/Rasp?idTeacher=${id}&iCal=true`;
  if (type === 'room') return `https://eios.kosgos.ru/api/Rasp?idAudLine=${id}&iCal=true`;
  return undefined;
}

window.buildSheduleLink = buildSheduleLink;
window.importSheduleFromText = importSheduleFromText;

// ✓ Привести дату к стандартному формату
const justifyDate = (date) => { return date instanceof Date ? date : new Date(date); };

// ✓ Безопасный текст для вставки в разметку расписания
function escapeSheduleText(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* -----------------------------------------------------------------------------------------
 * ✓ Живой блок «текущая и следующая пара»
 *
 * Раньше за временем следила каждая карточка: при наступлении пары она скрывалась, через
 * полсекунды удалялась и перерисовывала страницу расписания целиком. Из-за этого начавшаяся
 * пара на мгновение пропадала, просмотр недели переключался на день, а после окончания пары
 * следующая пара не становилась текущей (она и оставалась «следующей»).
 * Теперь блоком управляет один таймер — ScheduleLiveTrack: он обновляет отсчёт на карточках
 * и пересобирает только сам блок, когда текущая или следующая пара меняется.
 * -------------------------------------------------------------------------------------- */

// ✓ Подпись состояния блока: по ней таймер понимает, что пора пересобрать карточки
function liveStateSignature(state) {
  if (!state) return '';
  const itemKey = (item) => {
    if (!item) return '-';
    const event = item.event || {};
    const title = String(event.summary || event.title || '');
    return `${item.kind}:${item.start.getTime()}:${item.end.getTime()}:${title}`;
  };
  return [
    itemKey(state.current),
    (state.extraCurrent || []).map(itemKey).join('+'),
    itemKey(state.next),
  ].join('|');
}

// ✓ Собрать карточку пары или события
function buildLiveItemElement(renderer, item, isNext) {
  if (!item || !renderer) return undefined;
  if (item.kind === 'event') return renderer.createDayEventNoticeElement(item.event, isNext);
  return renderer.createDayEventElement(item.event, isNext);
}

// ✓ Пересобрать содержимое блока текущих пар, вернуть подпись состояния
function fillScheduleLiveBlock(block, renderer) {
  if (!block) return '';
  const state = renderer && typeof renderer.getDayEventState === 'function'
    ? renderer.getDayEventState()
    : { current: null, extraCurrent: [], next: null };
  const signature = liveStateSignature(state);
  const nodes = [];
  const push = (node) => { if (node) nodes.push(node); };
  push(buildLiveItemElement(renderer, state.current, false));
  (state.extraCurrent || []).forEach((item) => push(buildLiveItemElement(renderer, item, false)));
  push(buildLiveItemElement(renderer, state.next, true));
  if (nodes.length === 0) nodes.push(buildNoClassesBlock('В ближайшее время пар не будет, можете отдохнуть)'));
  block.innerHTML = '';
  nodes.forEach((node) => block.appendChild(node));
  return signature;
}

// ✓ Текущий режим просмотра расписания (день или неделя)
function currentScheduleViewType() {
  const weekButton = document.getElementById('shedule-week');
  return weekButton && weekButton.classList.contains('selected') ? 'week' : 'day';
}

// ✓ Перерисовать расписание, сохранив место прокрутки
function rerenderScheduleInPlace(type) {
  const scrollNode = typeof getSheduleScrollContainer === 'function' ? getSheduleScrollContainer() : null;
  const top = scrollNode ? scrollNode.scrollTop : 0;
  if (typeof changeSheduleTypeContent === 'function') changeSheduleTypeContent(type || currentScheduleViewType());
  const actualNode = typeof getSheduleScrollContainer === 'function' ? getSheduleScrollContainer() : null;
  if (actualNode && scrollNode) actualNode.scrollTop = top;
}

// ✓ Подключить общий таймер к блоку текущих пар
function attachScheduleLiveTrack(container, block, renderer, endedProbe) {
  if (typeof ScheduleLiveTrack === 'undefined' || !ScheduleLiveTrack) return;
  ScheduleLiveTrack.attach(container, block, renderer, endedProbe);
}

const ScheduleLiveTrack = {
  entries: new Map(),
  period: 1000,

  // ✓ Один таймер на контейнер расписания
  attach(container, block, renderer, endedProbe) {
    if (!container || !block || !renderer) return;
    this.detach(container);
    const probe = typeof endedProbe === 'function' ? endedProbe : null;
    const entry = {
      container, block, renderer,
      signature: fillScheduleLiveBlock(block, renderer),
      endedProbe: probe,
      ended: probe ? Boolean(probe(renderer.sheduleData)) : false,
      timer: 0,
    };
    entry.timer = setInterval(() => { this.tick(entry); }, this.period);
    this.entries.set(container, entry);
  },

  detach(container) {
    const entry = this.entries.get(container);
    if (!entry) return;
    clearInterval(entry.timer);
    this.entries.delete(container);
  },

  // ✓ Убрать таймеры у контейнеров, которых уже нет на странице
  prune() {
    this.entries.forEach((entry, container) => {
      if (!entry.container.isConnected || !entry.block.isConnected) this.detach(container);
    });
  },

  tick(entry) {
    try {
      if (!entry.container.isConnected || !entry.block.isConnected) { this.detach(entry.container); return; }

      // ✓ Отсчёт времени на показанных карточках
      const cards = entry.block.querySelectorAll('.lesson-container');
      for (let index = 0; index < cards.length; index += 1) {
        const card = cards[index];
        if (typeof card.updateLiveValues === 'function') card.updateLiveValues();
      }

      // ✓ Пара началась или закончилась — пересобираем блок
      const signature = liveStateSignature(entry.renderer.getDayEventState());
      if (signature !== entry.signature) entry.signature = fillScheduleLiveBlock(entry.block, entry.renderer);

      // ✓ Закончились ли сегодня пары — перерисовываем расписание, сохраняя прокрутку
      if (entry.endedProbe) {
        const ended = Boolean(entry.endedProbe(entry.renderer.sheduleData));
        if (ended !== entry.ended) {
          entry.ended = ended;
          this.detach(entry.container);
          rerenderScheduleInPlace(currentScheduleViewType());
        }
      }
    } catch (error) {
      if (DEBUG_MODE) console.warn('Обновление текущей пары остановлено: ', error);
      this.detach(entry.container);
    }
  },
};
window.ScheduleLiveTrack = ScheduleLiveTrack;

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
    // В описании пары рядом с ФИО идёт хвост «группа: 26-ИСбо-4», поэтому раньше
    // в имя преподавателя попадало слово «группа» и карточка преподавателя не находилась.
    // Ищем именно ФИО с инициалами, а не первый попавшийся русский текст.
    function extractTeacher(description) {
      const text = String(description || '');
      if (!text) return '';
      const fio = text.match(/[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.\s*[А-ЯЁ]\./);
      if (fio) return fio[0].replace(/\s+/g, ' ').trim();
      // Запасной вариант: убираем строку со списком групп и берём оставшийся русский текст
      const withoutGroups = text.replace(/группа\s*:[^\n]*/gi, ' ').trim();
      const fallback = withoutGroups.match(/([А-Яа-яЁё][А-Яа-яЁё\s\.]*)/);
      return fallback ? fallback[0].replace(/\s+/g, ' ').trim() : '';
    }

    // Определить список групп, для которых актуально данное занятие
    // Список заканчивается либо концом строки, либо следующим ФИО преподавателя.
    function extractGroups(description) {
      const match = String(description || '').match(
        /группа\s*:\s*([\s\S]*?)(?=\s*[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.|$)/i
      );
      return match ? match[1].replace(/[\s,]+$/, '').trim() : '';
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
    const subgroup = (event.summary).match(/,([^,]*)$/)?.[1].trim() ?? "";
    return { startTime, endTime, room, teacher, groups, type, name, subject, subgroup, subjectMatch, subjectMatchColor };
  }

  // ✓ Извлечь данные события в удобном для рендера формате
  extractEventData(dateKey) {
    if (!dateKey) return undefined;

    // ✓ Определить день недели по дате
    function getDayName(date) {
      const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
      return days[(date.getDay() + 6) % 7];
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
    // ✓ Время пары в атрибутах: по нему к карточке крепится полоска пересекающегося события
    try {
      const startStamp = justifyDate(event.startTime).getTime();
      const endStamp = justifyDate(event.endTime).getTime();
      if (!Number.isNaN(startStamp)) eventElementContainer.dataset.eventStart = String(startStamp);
      if (!Number.isNaN(endStamp)) eventElementContainer.dataset.eventEnd = String(endStamp);
    } catch (_) { /* время не разобралось — полоска просто не появится */ }
    const extractedData = ScheduleRenderer.extractElementData(event);

    // ✓ HTML структура
    eventElementContainer.innerHTML = `
    <div class="event-time-block" style="border-left: 5px solid ${extractedData.subjectMatchColor}">
      <div class="event-time">
        <span class="start-time">${extractedData.startTime}</span>
        <span class="end-time">${extractedData.endTime}</span>
      </div>
      <span style="color: var(--text-muted); margin-top: 5px; font-size: 13px;">${extractedData.name}</span>
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
      await navigateTo('lesson', { event, source: 'schedule' });
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

  // ✓ Карточка события (текущего или следующего) — тот же механизм, что у пары, но с синей меткой
  createDayEventNoticeElement(item, next) {
    if (!item) return undefined;
    const container = document.createElement('div');
    container.classList.add('container-hidden', 'lesson-container', 'lesson-container--event');
    container.style.backgroundImage = next
      ? 'linear-gradient(to bottom right, #66b5ea 0%, #31459e 100%)'
      : 'linear-gradient(to bottom right, #1b6fd6 0%, #0d3f86 100%)';

    const start = justifyDate(item.startTime);
    const end = justifyDate(item.endTime);
    const pad = (value) => String(value).padStart(2, '0');
    const clock = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    // ✓ Оставшееся время пересчитывается общим таймером блока текущих пар
    const noticeRemainingText = () => {
      const now = new Date();
      const diff = Math.max((next ? start - now : end - now), 0);
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      return `${next ? 'До начала события' : 'До конца события'}: ${pad(hours)}:${pad(minutes)}`;
    };

    const roleLabel = item.ownerRoleLabel || 'Событие';
    const authorLabel = item.ownerLogin ? `${roleLabel} · ${item.ownerLogin}` : roleLabel;
    container.innerHTML = `
      <div class="lesson-subcontainer">
        <div class="lesson-time-block" style="border-left: 5px solid #8fd0ff">
          <div class="lesson-time">
            <span class="lesson-start-time">${clock(start)}</span>
            <span class="lesson-end-time">${clock(end)}</span>
          </div>
          <span class="lesson-type">событие</span>
        </div>
        <div class="lesson-content">
          <div class="lesson-header">
            <p class="lesson-subject">${escapeSheduleText(item.title || 'Событие')}</p>
            <div class="event-type-container"><span class="lesson-type2">${escapeSheduleText(roleLabel)}</span></div>
          </div>
          <div class="lesson-details">
            <div class="lesson-detail">${escapeSheduleText(authorLabel)}</div>
            ${item.place ? `<div class="lesson-detail"><i>Место</i> <b>${escapeSheduleText(item.place)}</b></div>` : ''}
          </div>
        </div>
      </div>
      <div class="lesson-progress"><div class="class-progress-header">
        <span class="class-progress-label">${next ? 'Скоро начнётся' : 'Идёт сейчас'}</span>
        <span class="class-remaining-time">${noticeRemainingText()}</span>
      </div></div>`;

    container.addEventListener('click', async () => {
      if (typeof window.openScheduleEvent === 'function') window.openScheduleEvent(item.eventId);
    });

    // ✓ Обновление оставшегося времени по общему таймеру (без своего setInterval)
    container.updateLiveValues = () => {
      const remainingSpan = container.querySelector('.class-remaining-time');
      if (remainingSpan) remainingSpan.textContent = noticeRemainingText();
    };
    setTimeout(() => { container.classList.remove('container-hidden'); }, 10);
    return container;
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
      await navigateTo('lesson', { event, source: 'schedule' });
    });

    // ✓ Обновление оставшегося времени: вызывается общим таймером блока текущих пар.
    //   Раньше у каждой карточки был свой setInterval: он сам удалял карточку и перерисовывал
    //   всю страницу — начавшаяся пара на полсекунды пропадала, а после окончания пары
    //   следующая пара не становилась текущей. Теперь карточка только показывает время,
    //   а сменой состояния управляет ScheduleLiveTrack.
    dayEventContainer.updateLiveValues = () => {
      const extractedUpdateTime = calculateTime(next);
      const progressBar = dayEventContainer.querySelector(`#class-progress-bar-${next}`);
      const remainingTimeSpan = dayEventContainer.querySelector(`#class-remaining-time-${next}`);
      if (progressBar) progressBar.style.width = extractedUpdateTime.progressPercent + '%';
      if (remainingTimeSpan) remainingTimeSpan.textContent = extractedUpdateTime.remainingTime;
    };

    setTimeout(() => { dayEventContainer.classList.remove('container-hidden'); }, 10);
    return dayEventContainer; // ✓ Возвращаем собранный контейнер
  }

  // ✓ Рендер дня расписания из элементов по дате 
  createDateElement(date, teachery, emptie) {
    // ✓ Получаем данные дня
    const dateKey = ScheduleRenderer.formatDateKey(date);
    if (!dateKey) { // Даты нет — вместо пустого элемента показываем понятную заглушку
      const emptyContainer = document.createElement('div');
      emptyContainer.classList.add('schedule-day');
      emptyContainer.dataset.sheduleDate = '';
      emptyContainer.innerHTML = '<div class="day-events"><p style="text-align: center;">Расписание на этот день ещё не составлено</p></div>';
      return emptyContainer;
    }
    const dayEvents = this.sheduleData
      .filter(event => event.startTime && ScheduleRenderer.formatDateKey(event.startTime) === dateKey)
      .sort((a, b) => a.startTime - b.startTime);
    const extractedData = this.extractEventData(dateKey);

    // ✓ Подготовка к генерации списка занятий
    const eventsContainer = document.createElement('div');
    eventsContainer.classList.add('schedule-day');
    eventsContainer.dataset.sheduleDate = dateKey; // ✓ Ключ дня: по нему обновляются заметки и события
    eventsContainer.innerHTML = `<div class="day-header" style="background-color: ${extractedData.dayColor};">
      <span class="day-name">${extractedData.dayName}</span>
      <span class="day-date">${extractedData.formattedDate}</span>
    </div>`;
    const dayEventsContainer = document.createElement('div');
    dayEventsContainer.classList.add('day-events');

    if (emptie === true) { // Если в этот день нет занятий
      eventsContainer.appendChild(this.createPauseElement(100, 'noclass'));
      // ✓ Даже без пар день показывает события, уведомления и заметки: плюсик есть у каждого дня
      dayEventsContainer.classList.add('day-events--empty');
      eventsContainer.appendChild(dayEventsContainer);
      this._appendDayExtras(eventsContainer, dayEventsContainer, dateKey, dayEvents);
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

    // ✓ События и уведомления дня, а затем пользовательские заметки
    this._appendDayExtras(eventsContainer, dayEventsContainer, dateKey, dayEvents);

    return eventsContainer; // ✓ Возвращаем собранный контейнер
  }

  /**
   * Дополнения дня: события (синяя метка), уведомления и пользовательские заметки.
   * Событие, не пересекающееся с парами, встаёт в расписание на своё время;
   * пересекающееся — тонкой полоской, чтобы не закрывать пару.
   */
  _appendDayExtras(dayCard, dayEventsContainer, dateKey, dayEvents) {
    const extras = window.ScheduleExtras;
    if (!extras) return;

    const toDate = (value) => { const d = justifyDate(value); return Number.isNaN(d.getTime()) ? null : d; };

    const events = typeof extras.eventsForDay === 'function' ? (extras.eventsForDay(dateKey) || []) : [];
    const eventItems = events.filter((item) => item && item.kind === 'event' && item.startTime);

    // ✓ Время пар берём из атрибутов самих карточек: перерывы между парами не сбивают сопоставление
    const lessonNodes = Array.from(dayEventsContainer.querySelectorAll('.event')).map((node) => ({
      node,
      start: Number(node.dataset.eventStart) || 0,
      end: Number(node.dataset.eventEnd) || 0,
    }));

    eventItems.forEach((item) => {
      const start = toDate(item.startTime);
      const end = toDate(item.endTime) || (start ? new Date(start.getTime() + 3600000) : null);
      if (!start || !end) return;

      // ✓ Пары, с которыми событие пересекается: на каждую «заезжает» тонкая синяя полоска
      const overlaps = lessonNodes.filter((entry) => entry.start && entry.end
        && start.getTime() < entry.end && end.getTime() > entry.start);

      if (overlaps.length > 0) {
        overlaps.forEach((entry) => this._attachEventStrip(entry, item, start, end));
        return;
      }

      // ✓ Самостоятельное событие — отдельная карточка в хронологическом порядке
      const card = this._createDayEventCard(item, start, end);
      const nextLesson = lessonNodes.find((entry) => entry.start && entry.start > start.getTime());
      if (nextLesson && nextLesson.node.parentNode === dayEventsContainer) {
        dayEventsContainer.insertBefore(card, nextLesson.node);
      } else {
        dayEventsContainer.appendChild(card);
      }
    });

    // ✓ Пользовательские заметки дня
    if (typeof extras.notesForDay === 'function') {
      const notesNode = extras.notesForDay(dateKey);
      if (notesNode) dayCard.appendChild(notesNode);
    }
  }

  /**
   * ✓ Полоска пересекающегося события внутри карточки пары.
   * Пара остаётся читаемой: полоска тонкая, стоит у правого края и занимает
   * только тот участок по высоте, который совпадает по времени.
   */
  _attachEventStrip(lessonEntry, item, start, end) {
    const node = lessonEntry.node;
    const total = lessonEntry.end - lessonEntry.start;
    if (!node || !total || total <= 0) return;

    const pad = (value) => String(value).padStart(2, '0');
    const clock = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const from = Math.max(start.getTime(), lessonEntry.start) - lessonEntry.start;
    const to = Math.min(end.getTime(), lessonEntry.end) - lessonEntry.start;
    const topPercent = Math.max(0, Math.min(96, (from / total) * 100));
    const heightPercent = Math.max(8, Math.min(100 - topPercent, ((to - from) / total) * 100));

    node.classList.add('event--has-overlap');

    const strip = document.createElement('button');
    strip.type = 'button';
    strip.className = 'event-overlap-strip';
    strip.style.top = `${topPercent}%`;
    strip.style.height = `${heightPercent}%`;

    const timeLabel = `${clock(start)}–${clock(end)}`;
    const title = item.title || 'Событие';
    strip.title = item.place ? `${title} · ${timeLabel} · ${item.place}` : `${title} · ${timeLabel}`;
    strip.setAttribute('aria-label', `Событие поверх пары: ${title}, ${timeLabel}`);

    const label = document.createElement('span');
    label.className = 'event-overlap-strip-label';
    label.textContent = `${timeLabel} · ${title}`;
    strip.appendChild(label);

    strip.addEventListener('click', (event) => {
      event.stopPropagation();
      if (typeof window.openScheduleEvent === 'function') window.openScheduleEvent(item.eventId);
    });
    node.appendChild(strip);
  }

  // ✓ Карточка самостоятельного события в списке пар
  _createDayEventCard(item, start, end) {
    const card = document.createElement('div');
    card.className = 'event event--notice-event';
    const pad = (value) => String(value).padStart(2, '0');
    card.innerHTML = `
      <div class="event-time-block" style="border-left: 5px solid #1b6fd6">
        <div class="event-time">
          <span class="start-time">${pad(start.getHours())}:${pad(start.getMinutes())}</span>
          <span class="end-time">${pad(end.getHours())}:${pad(end.getMinutes())}</span>
        </div>
        <span class="event-kind-label">событие</span>
      </div>
      <div class="event-content">
        <div class="event-header">
          <p class="event-subject"><b>${escapeSheduleText(item.title || 'Событие')}</b></p>
          <div class="event-type-container"><span class="event-type">${escapeSheduleText(item.ownerRoleLabel || '')}</span></div>
        </div>
        <div class="event-details">
          <div class="event-detail">${escapeSheduleText(item.ownerRoleLabel || '')}${item.ownerLogin ? ` · ${escapeSheduleText(item.ownerLogin)}` : ''}</div>
          ${item.place ? `<div class="event-detail"><i>Место</i> <b>${escapeSheduleText(item.place)}</b></div>` : ''}
        </div>
      </div>`;
    card.addEventListener('click', () => {
      if (typeof window.openScheduleEvent === 'function') window.openScheduleEvent(item.eventId);
    });
    return card;
  }

  /* ================================================================================
   * ✓ Текущая и следующая пара — только для своей подгруппы и своего языка.
   *
   * Раньше поиск «следующей» пары не проверял подгруппу: выбиралась первая пара
   * из расписания, поэтому второкурсник из 2-й подгруппы видел пару 1-й подгруппы.
   * Теперь все кандидаты проходят ОДИН фильтр: группа уже отфильтрована в данных,
   * подгруппа и язык проверяются здесь. Дополнительно список сортируется по времени,
   * а события/уведомления из раздела «События» участвуют наравне с парами.
   * ============================================================================== */

  // ✓ Подгруппа, с которой сейчас работает приложение
  getActiveSubgroup() {
    const explicit = Number(window.CurrentSubgroup);
    if (explicit === 1 || explicit === 2) return explicit;
    try {
      const data = JSON.parse(localStorage.getItem('userData') || '{}') || {};
      const saved = Number(data.userSubgroup);
      if (saved === 1 || saved === 2) return saved;
    } catch (_) { /* нет сохранённых данных */ }
    return 1;
  }

  // ✓ Изучаемый язык пользователя
  getActiveLanguage() {
    try {
      const data = JSON.parse(localStorage.getItem('userData') || '{}') || {};
      return String(data.userLanguage || '');
    } catch (_) { return ''; }
  }

  // ✓ Подгруппа занятия: «1 п/г», «2 подгруппа», «, 2» и т.п. null — деления нет
  static getEventSubgroupByText(event) {
    if (!event) return null;
    if (Number(event.targetSubgroup) === 1 || Number(event.targetSubgroup) === 2) {
      return Number(event.targetSubgroup);
    }
    if (typeof window.HomeworkRenderer !== 'undefined'
      && window.HomeworkRenderer && typeof window.HomeworkRenderer.getEventSubgroup === 'function') {
      return window.HomeworkRenderer.getEventSubgroup(event);
    }
    const text = `${String(event.summary || '')} ${String(event.description || '')}`;
    const patterns = [
      /(?:п\/г|подгрупп[аы]?|подгр\.?)\s*[:№#]?\s*(1|2)\b/i,
      /\b(1|2)\s*(?:п\/г|подгрупп[аы]?|подгр\.?)/i,
      /,\s*(1|2)(?:\s|$)/,
    ];
    for (const pattern of patterns) {
      const found = text.match(pattern);
      if (found) return Number(found[1]);
    }
    return null;
  }

  // ✓ Язык занятия (Английский / Немецкий / Французский) либо пустая строка
  static getEventLanguage(event) {
    const text = `${String((event && event.summary) || '')} ${String((event && event.description) || '')}`;
    if (/англ/i.test(text)) return 'Английский';
    if (/немец/i.test(text)) return 'Немецкий';
    if (/франц/i.test(text)) return 'Французский';
    return '';
  }

  // ✓ Подходит ли занятие пользователю: подгруппа и язык
  isEventForUser(event) {
    const eventSubgroup = ScheduleRenderer.getEventSubgroupByText(event);
    if (eventSubgroup !== null && eventSubgroup !== this.getActiveSubgroup()) return false;

    const userLanguage = this.getActiveLanguage();
    if (!userLanguage) return true; // язык не выбран — фильтр не применяем
    const eventLanguage = ScheduleRenderer.getEventLanguage(event);
    if (!eventLanguage) return true; // занятие не языковое
    const normalize = (value) => String(value).toLowerCase();
    return normalize(userLanguage).slice(0, 5) === normalize(eventLanguage).slice(0, 5);
  }

  // ✓ Все занятия и события на сегодня, подходящие пользователю, по времени
  _timelineForToday(now) {
    const todayKey = ScheduleRenderer.formatDateKey(now);
    const list = [];

    (Array.isArray(this.sheduleData) ? this.sheduleData : []).forEach((event) => {
      if (!event || !event.startTime || !event.endTime) return;
      const start = justifyDate(event.startTime);
      const end = justifyDate(event.endTime);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      if (ScheduleRenderer.formatDateKey(start) !== todayKey) return;
      if (!this.isEventForUser(event)) return;
      list.push({ kind: 'lesson', start, end, event });
    });

    // ✓ События из раздела «События» участвуют наравне с парами
    const extras = window.ScheduleExtras;
    const dayEvents = extras && typeof extras.eventsForDay === 'function' ? extras.eventsForDay(todayKey) : [];
    (Array.isArray(dayEvents) ? dayEvents : []).forEach((item) => {
      if (!item || item.kind !== 'event' || !item.startTime) return;
      const start = new Date(Number(item.startTime));
      const end = new Date(Number(item.endTime) || Number(item.startTime) + 60 * 60 * 1000);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      list.push({ kind: 'event', start, end, event: Object.assign({}, item, { _isNoticeEvent: true }) });
    });

    return list.sort((a, b) => a.start - b.start);
  }

  // ✓ Какие занятия показывать прямо сейчас (без создания элементов)
  getDayEventState(now) {
    const currentTime = now instanceof Date ? now : new Date();
    const timeline = this._timelineForToday(currentTime);

    // ✓ Всё, что идёт прямо сейчас: пара и, возможно, события поверх неё
    const running = timeline.filter((item) => currentTime >= item.start && currentTime <= item.end);

    // Пара остаётся главной карточкой, события при пересечении показываются дополнительно
    const currentLesson = running.find((item) => item.kind === 'lesson') || null;
    const currentEvents = running.filter((item) => item.kind === 'event');
    const current = currentLesson || currentEvents[0] || null;
    const extraCurrent = currentLesson ? currentEvents : currentEvents.slice(1);

    // ✓ Отсчёт «следующего» начинается после самого позднего из текущих занятий
    const runningEnd = running.length > 0
      ? running.reduce((max, item) => (item.end > max ? item.end : max), running[0].end)
      : null;
    const upcoming = runningEnd
      ? timeline.filter((item) => item.start > runningEnd)
      : timeline.filter((item) => item.start > currentTime);

    // ✓ «Следующее занятие» показываем, только если до него не больше трёх часов
    const next = upcoming.find((item) => (item.start - currentTime) / (1000 * 60 * 60) <= 3) || null;

    return { current, extraCurrent, next };
  }

  // ✓ Получить элементы текущего и следующего занятия
  getDayEventElements() {
    const state = this.getDayEventState();
    const build = (item, isNext) => buildLiveItemElement(this, item, isNext);

    return {
      currentClassElement: build(state.current, false),
      // ✓ Дополнительные текущие события при пересечении с парой
      extraCurrentElements: state.extraCurrent.map((item) => build(item, false)).filter(Boolean),
      nextClassElement: build(state.next, true),
    };
  }

  // ✓ Создаем список доступных недель
  generateWeekSelector(sheduleContainer, teachery) {

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

      // ✓ Добавляем обработку нажатия на кнопку недели
      button.addEventListener('click', () => {
        if (!button.classList.contains('selected')) {
          weekContainer.querySelectorAll('.radio-week-button').forEach(btn => {
            btn.classList.remove('selected'); // ✓ Очищаем остальные кнопки от нажатия
          }); button.classList.add('selected');

          // ✓ Перерисовываем блок расписания: снова создаём все дни недели Пн–Сб
          selectedDate = new Date(week.monday);
          this.fillWeekDays(sheduleContainer, selectedDate, teachery);
          focusWeekSchedule(weekContainer, selectedDate);
        }
      });
      weekContainer.appendChild(button);
    });

    return { weekContainer, selectedDate };
  }

  // ✓ Создать блоки всех учебных дней недели (Пн–Сб), затем заполнить их парами.
  // Пустой день (в том числе первый в неделе) показывается плашкой «нет пар»,
  // а не пропускается — как просили в задаче.
  fillWeekDays(container, selectedDate, teachery) {
    if (!container) return;
    container.innerHTML = '';
    const monday = getMondayOfDate(selectedDate || new Date());
    const todayKey = getDayKey(new Date());
    for (let index = 0; index < 6; index += 1) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + index);
      const dateKey = getDayKey(dayDate);
      const hasEvents = this.sheduleData.some((event) => {
        if (!event || !event.startTime) return false;
        return getDayKey(justifyDate(event.startTime)) === dateKey;
      });
      const dayElement = this.createDateElement(dayDate, teachery, !hasEvents);
      if (!dayElement) continue;
      dayElement.dataset.sheduleDate = dateKey;
      if (dateKey === todayKey) dayElement.dataset.sheduleToday = 'true';
      container.appendChild(dayElement);
    }
  }

  // ✓ Произвести рендер расписания и получить элемент расписания
  render(type, teachery) {
    if (type === 'day') { // ✓ Сгенерировать внутридневное расписание
      const dayElementContainer = document.createElement('div');
      dayElementContainer.classList.add('relative-container');

      // ✓ Блок «текущая и следующая пара»: его содержимое обновляет общий таймер
      const liveBlock = document.createElement('div');
      liveBlock.classList.add('shedule-live-block');
      dayElementContainer.appendChild(liveBlock);
      fillScheduleLiveBlock(liveBlock, this);

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

      // ✓ Есть ли пары в конкретный день (проверка по дате события)
      function hasClassesOn(dayDate) {
        const dateKey = ScheduleRenderer.formatDateKey(dayDate);
        if (!dateKey) return false;
        return this.sheduleData.some((event) => {
          if (!event || !event.startTime) return false;
          return ScheduleRenderer.formatDateKey(event.startTime) === dateKey;
        });
      }

      // ✓ Добавляем расписание дня
      const p = document.createElement('p'); p.setAttribute("style", "text-align: center;");
      let nextDate;
      const dayShedule = document.createElement('div');
      if (isClassesEndedToday(this.sheduleData)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        if (hasClassesOn.call(this, tomorrow)) {
          nextDate = tomorrow;
          p.innerHTML = 'Расписание на следующий учебный день';
          dayShedule.appendChild(this.createDateElement(nextDate));
        } else {
          // Завтра пар нет — вместо расписания следующего учебного дня показываем это
          p.innerHTML = 'Расписание на следующий учебный день';
          dayShedule.appendChild(buildNoClassesBlock('Завтра пар нет, можно отдохнуть)', 'no-classes-block--tomorrow'));
        }
      } else {
        nextDate = new Date();
        p.innerHTML = 'Расписание на сегодня';
        dayShedule.appendChild(this.createDateElement(nextDate));
      }
      dayElementContainer.appendChild(p);
      dayElementContainer.appendChild(dayShedule);

      // ✓ Добавляем филлер в конце для увеличения высоты страницы
      const fillerDiv = document.createElement('div');
      fillerDiv.setAttribute("style", "height: 100px; width: 100%;")
      dayElementContainer.appendChild(fillerDiv);

      // ✓ Подключаем общий таймер: он сам сменит текущую пару на следующую
      attachScheduleLiveTrack(dayElementContainer, liveBlock, this, isClassesEndedToday);

      return dayElementContainer; // ✓ Возвращаем собранный контейнер

    } else if (type === 'week') { // Сгенерировать недельное расписание
      // ✓ Создаем контейнер расписания
      const weekElementContainer = document.createElement('div');
      weekElementContainer.classList.add('relative-container');

      const weekSheduleContainer = document.createElement('div');
      const extractedWeekSelector = this.generateWeekSelector(weekSheduleContainer, teachery);
      weekElementContainer.appendChild(extractedWeekSelector.weekContainer);
      const selectedDate = extractedWeekSelector.selectedDate;

      // ✓ Сначала создаём дни недели (Пн–Сб), затем заполняем их парами
      this.fillWeekDays(weekSheduleContainer, selectedDate, teachery);
      weekElementContainer.appendChild(weekSheduleContainer);

      // ✓ Автопрокрутка: текущий день — под панелью недель, иначе — вверх к понедельнику
      focusWeekSchedule(extractedWeekSelector.weekContainer, selectedDate);

      // ✓ Добавляем филлер в конце для увеличения высоты страницы
      const fillerDiv = document.createElement('div');
      fillerDiv.setAttribute("style", "height: 100px; width: 100%;")
      weekElementContainer.appendChild(fillerDiv);

      return weekElementContainer; // ✓ Возвращаем собранный контейнер

    } else { // Если страница не найдена (Ошибка 404)
      return undefined;
    }
  }

  /* ==================================================================================
   * ✓ Сравнение расписаний двух групп
   *
   * Дополнительные виды контейнеров для отдельной подстраницы «Сравнение расписаний»:
   * слева — упрощённое расписание своей подгруппы, справа — расписание другой группы.
   * Сравнение работает и внутри дня, и внутри недели; есть два режима — «два столбика»
   * и «построчно» (сначала своя пара, затем пара другой группы).
   *
   * Тег совпадения один на сравнение: показывается самое важное совпадение
   * (аудитория → этаж → разные корпуса одного института → один корпус разных институтов).
   * Если у другой группы в это время пары для двух подгрупп — сравнение тройное:
   * своя пара сравнивается с каждой из них и получает свой тег.
   * =============================================================================== */

  // ✓ Аудитория: корпус и этаж («Б-407» → корпус «Б», этаж 4; «СДО» — без этажа)
  static parseRoomInfo(room) {
    const text = String(room || '').trim();
    if (!text) return null;
    const match = text.match(/^([A-Za-zА-Яа-яЁё]+)[\s\-–—]*(\d)?/);
    const building = match && match[1] ? match[1].toUpperCase() : text.toUpperCase();
    const floor = match && match[2] ? Number(match[2]) : null;
    return { building, floor, room: text.toUpperCase() };
  }

  // ✓ Институт группы: сравнивается и у бакалавров, и у магистров
  static getGroupInstitute(groupName) {
    try {
      if (typeof getGroupInfo === 'function') {
        const info = getGroupInfo(groupName);
        if (info && info.institute) return String(info.institute);
      }
    } catch (_) { /* метаданные групп недоступны */ }
    return '';
  }

  // ✓ Один тег на сравнение: от самого важного совпадения к менее важному
  static compareVerdict(mine, theirs) {
    if (!mine || !theirs) return null;
    const left = ScheduleRenderer.parseRoomInfo(mine.room);
    const right = ScheduleRenderer.parseRoomInfo(theirs.room);
    if (!left || !right) return null;

    if (left.room === right.room) return { kind: 'room', text: 'в одной аудитории' };

    const sameBuilding = left.building === right.building;
    if (sameBuilding && left.floor !== null && left.floor === right.floor) {
      return { kind: 'floor', text: 'на одном этаже' };
    }

    const institutesKnown = Boolean(mine.institute) && Boolean(theirs.institute);
    const sameInstitute = institutesKnown && String(mine.institute) === String(theirs.institute);
    if (sameInstitute) {
      // ✓ У групп одного института интересно другое: пары разъезжаются по корпусам
      if (!sameBuilding) return { kind: 'buildings', text: 'в разных корпусах' };
      return null;
    }
    if (sameBuilding) return { kind: 'building', text: 'в одном корпусе' };
    return null;
  }

  // ✓ Занятия по дням: dateKey -> [{ event, start, end }] по времени начала
  static groupEventsByDay(events) {
    const map = new Map();
    (Array.isArray(events) ? events : []).forEach((event) => {
      if (!event || !event.startTime) return;
      const start = justifyDate(event.startTime);
      const end = justifyDate(event.endTime || event.startTime);
      if (Number.isNaN(start.getTime())) return;
      const key = ScheduleRenderer.formatDateKey(start);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ event, start, end });
    });
    map.forEach((list) => list.sort((a, b) => a.start - b.start));
    return map;
  }

  // ✓ Слоты сравнения: пары, начинающиеся одновременно
  static buildCompareSlots(myItems, theirItems) {
    const stamps = new Map();
    const add = (side, items) => {
      (items || []).forEach((item) => {
        const stamp = item.start.getTime();
        if (!stamps.has(stamp)) stamps.set(stamp, { time: item.start, mine: [], theirs: [] });
        stamps.get(stamp)[side].push(item);
      });
    };
    add('mine', myItems);
    add('theirs', theirItems);
    return Array.from(stamps.values()).sort((a, b) => a.time - b.time);
  }

  // ✓ Часы и минуты занятия
  static formatClock(date) {
    const value = justifyDate(date);
    if (!value || Number.isNaN(value.getTime())) return '';
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  // ✓ Название дня недели (понедельник — первый)
  static getDayName(date) {
    const value = justifyDate(date);
    if (!value || Number.isNaN(value.getTime())) return '';
    return ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'][(value.getDay() + 6) % 7];
  }

  // ✓ Упрощённая карточка пары: время, предмет, вид занятия, аудитория
  createCompareCard(event, side) {
    const data = ScheduleRenderer.extractElementData(event) || {};
    const card = document.createElement('div');
    card.className = `compare-card compare-card--${side === 'other' ? 'other' : 'mine'}`;

    const time = document.createElement('div');
    time.className = 'compare-card-time';
    time.innerHTML = `<span class="compare-card-start">${escapeSheduleText(data.startTime || '')}</span>`
      + `<span class="compare-card-end">${escapeSheduleText(data.endTime || '')}</span>`;

    const content = document.createElement('div');
    content.className = 'compare-card-content';
    const subject = document.createElement('p');
    subject.className = 'compare-card-subject';
    subject.textContent = data.subject || 'Без названия';
    const details = document.createElement('p');
    details.className = 'compare-card-details';
    const subgroup = data.subgroup ? ` · ${escapeSheduleText(data.subgroup)}` : '';
    details.innerHTML = `${escapeSheduleText(data.name || '')}${subgroup} · <b>${escapeSheduleText(data.room || '')}</b>`;
    content.appendChild(subject);
    content.appendChild(details);

    card.appendChild(time);
    card.appendChild(content);
    return card;
  }

  // ✓ Заглушка, когда пары в это время нет
  createCompareEmptyCard(text) {
    const card = document.createElement('div');
    card.className = 'compare-card compare-card--empty';
    card.textContent = text || 'Пары нет';
    return card;
  }

  // ✓ Тег совпадения в стиле админ-тега
  createCompareTag(verdict) {
    const tag = document.createElement('span');
    tag.className = `compare-tag compare-tag--${verdict.kind}`;
    tag.textContent = `Пары ${verdict.text}`;
    return tag;
  }

  // ✓ Строка сравнения: время, свои пары, пары другой группы с тегами
  createCompareSlot(slot, options) {
    const settings = options || {};
    const wrapper = document.createElement('div');
    wrapper.className = `compare-slot compare-slot--${settings.mode === 'rows' ? 'rows' : 'columns'}`;

    const time = document.createElement('div');
    time.className = 'compare-slot-time';
    time.textContent = ScheduleRenderer.formatClock(slot.time);
    wrapper.appendChild(time);

    const body = document.createElement('div');
    body.className = 'compare-slot-body';
    wrapper.appendChild(body);

    const mineColumn = document.createElement('div');
    mineColumn.className = 'compare-column compare-column--mine';
    const myItems = slot.mine.length > 0 ? slot.mine : [null];
    myItems.forEach((item) => {
      mineColumn.appendChild(item ? this.createCompareCard(item.event, 'mine') : this.createCompareEmptyCard('Пары нет'));
    });
    body.appendChild(mineColumn);

    const otherColumn = document.createElement('div');
    otherColumn.className = 'compare-column compare-column--other';
    // ✓ Тройное сравнение: свою пару сравниваем с каждой парой другой группы
    const mainMine = slot.mine[0] || null;
    const theirItems = slot.theirs.length > 0 ? slot.theirs : [null];
    theirItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'compare-other-row';
      row.appendChild(item ? this.createCompareCard(item.event, 'other') : this.createCompareEmptyCard('Пары нет'));
      if (item && mainMine) {
        const verdict = ScheduleRenderer.compareVerdict(
          { room: mainMine.event.location, institute: settings.myInstitute },
          { room: item.event.location, institute: settings.otherInstitute },
        );
        if (verdict) row.appendChild(this.createCompareTag(verdict));
      }
      otherColumn.appendChild(row);
    });
    body.appendChild(otherColumn);

    return wrapper;
  }

  /**
   * ✓ Контейнер сравнения расписаний.
   * options: days, mode ('columns' | 'rows'), myGroup, otherGroup, myEvents, otherEvents
   */
  renderCompare(options) {
    const settings = options || {};
    const days = Array.isArray(settings.days) && settings.days.length > 0 ? settings.days : [new Date()];
    const mode = settings.mode === 'rows' ? 'rows' : 'columns';
    const myInstitute = ScheduleRenderer.getGroupInstitute(settings.myGroup);
    const otherInstitute = ScheduleRenderer.getGroupInstitute(settings.otherGroup);
    const myByDay = ScheduleRenderer.groupEventsByDay(settings.myEvents);
    const otherByDay = ScheduleRenderer.groupEventsByDay(settings.otherEvents);
    const todayKey = ScheduleRenderer.formatDateKey(new Date());

    const root = document.createElement('div');
    root.className = `compare-view compare-view--${mode}`;

    days.forEach((day) => {
      const key = ScheduleRenderer.formatDateKey(day);
      if (!key) return;
      const section = document.createElement('div');
      section.className = 'compare-day';

      if (days.length > 1) {
        const header = document.createElement('div');
        header.className = 'compare-day-header' + (key === todayKey ? ' compare-day-header--today' : '');
        header.innerHTML = `<span class="compare-day-name">${escapeSheduleText(ScheduleRenderer.getDayName(day))}</span>`
          + `<span class="compare-day-date">${escapeSheduleText(ScheduleRenderer.formatDate(day) || '')}</span>`;
        section.appendChild(header);
      }

      const slots = ScheduleRenderer.buildCompareSlots(myByDay.get(key) || [], otherByDay.get(key) || []);
      if (slots.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'compare-empty';
        empty.textContent = 'Пар в этот день нет';
        section.appendChild(empty);
      } else {
        slots.forEach((slot) => section.appendChild(this.createCompareSlot(slot, {
          mode, myInstitute, otherInstitute,
        })));
      }
      root.appendChild(section);
    });

    return root;
  }
}

// ✓ Помощники расписания наружу (нужны ui.js и разделу «Данные приложения»)
window.centerWeekSelector = centerWeekSelector;
window.scrollSheduleToToday = scrollSheduleToToday;
window.scrollSheduleToTop = scrollSheduleToTop;
window.clearLocalShedules = clearLocalShedules;

// ✓ Сменить контент расписания
function changeSheduleTypeContent(type) {
  const sheduleContainer = document.getElementById('shedule-container');
  if (!sheduleContainer) return; // ✓ Страница расписания не открыта — обновлять нечего
  // ✓ Таймеры предыдущего блока текущих пар больше не нужны
  if (typeof ScheduleLiveTrack !== 'undefined' && ScheduleLiveTrack) ScheduleLiveTrack.prune();
  if (groupData[CurrentGroup]) {
    const renderer = new ScheduleRenderer(groupData[CurrentGroup]);
    const sheduleFiller = renderer.render(type);
    if (!sheduleFiller) return; // ✓ Неизвестный режим — оставляем как есть
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
