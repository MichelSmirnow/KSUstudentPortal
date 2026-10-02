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
