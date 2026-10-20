/*
 * HomeworkRenderer
 *
 * Одна страница с двумя режимами:
 *  - «Домашнее задание»: ближайшие ещё не завершённые занятия (ТОЛЬКО практики и
 *    лабораторные) по каждой дисциплине для подгруппы и изучаемого языка студента.
 *  - «Материалы»: дисциплины, собранные из расписания и Firestore. Практики и
 *    лабораторные одной дисциплины объединяются в одну запись, внутри которой
 *    раскрывается список вариантов (практика/лабораторная, язык, подгруппа).
 *    Количество занятий считается только по прошедшим парам (+1, если пара идёт сейчас).
 *
 * Дополнительно: страница информации о занятии (renderLessonContents) получила
 * переключатель «Сегодняшнее ДЗ / ДЗ на следующее занятие» и переключатель дней
 * для просмотра и добавления материалов.
 *
 * DOM собирается через createElement + appendChild. Корневой элемент возвращается
 * синхронно, содержимое Firestore подтягивается асинхронно.
 */
class HomeworkRenderer {

  /* ================================ Константы ================================ */

  // Виды занятий, которые участвуют в домашних заданиях и материалах (лекций нет вообще)
  static HOMEWORK_KINDS = ['practice', 'lab'];

  // Максимальная длина превью текста публикации
  static PREVIEW_LIMIT = 100;

  // Сколько дней показывать в переключателе дней на странице занятия
  static DAY_SWITCH_LIMIT = 24;

  // Изучаемые языки: сверка по слову в названии занятия в любом регистре
  static LANGUAGE_RULES = [
    { name: 'Английский', pattern: /английск/i },
    { name: 'Немецкий', pattern: /немецк/i },
    { name: 'Французский', pattern: /французск/i },
  ];

  static ADMIN_BADGE_TEXT = 'Админ';

  static _adminIdsPromise = null;

  constructor(events, options = {}) {
    this.scheduleData = Array.isArray(events) ? events : [];
    this.options = {
      refreshInterval: 60_000,
      retryDelay: 60_000,
      storageKeyPrefix: 'homework-checkpoints-v2',
      initialMode: 'homework',
      ...options,
    };

    this._root = null;
    this._listContainer = null;
    this._homeworkTab = null;
    this._materialsTab = null;
    this._refreshTimer = null;
    this._observer = null;
    this._hasBeenConnected = false;
    this._selectedMode = this.options.initialMode === 'materials' ? 'materials' : 'homework';
    this._completed = this._readCompleted();
  }

  /* ================================ Каркас страницы ================================ */

  /** Собрать и вернуть корневой DOM-элемент страницы. */
  render() {
    this.destroy();
    this._hasBeenConnected = false;

    this._root = document.createElement('div');
    this._root.classList.add('homework-renderer');

    const tabs = document.createElement('div');
    tabs.classList.add('homework-mode-switch', 'flex-container', 'radio-container');

    this._homeworkTab = document.createElement('button');
    this._homeworkTab.type = 'button';
    this._homeworkTab.classList.add('radio-button');
    this._homeworkTab.textContent = 'Домашнее задание';
    this._homeworkTab.addEventListener('click', () => this._setMode('homework'));

    this._materialsTab = document.createElement('button');
    this._materialsTab.type = 'button';
    this._materialsTab.classList.add('radio-button');
    this._materialsTab.textContent = 'Материалы';
    this._materialsTab.addEventListener('click', () => this._setMode('materials'));

    tabs.appendChild(this._homeworkTab);
    tabs.appendChild(this._materialsTab);

    this._listContainer = document.createElement('div');
    this._listContainer.classList.add('homework-renderer-content');
    this._root.appendChild(tabs);
    this._root.appendChild(this._listContainer);

    this._setTabClasses();
    this._renderContent(new Date());
    this._observeRootRemoval();
    this._scheduleRefresh();
    return this._root;
  }

  destroy() {
    if (this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    this._root = null;
    this._listContainer = null;
  }

  _setMode(mode) {
    if (this._selectedMode === mode) return;
    this._selectedMode = mode;
    this._setTabClasses();
    if (mode !== 'homework' && this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
    this._renderContent(new Date());
    if (mode === 'homework') this._scheduleRefresh();
  }

  _setTabClasses() {
    if (!this._homeworkTab || !this._materialsTab) return;
    this._homeworkTab.classList.toggle('selected', this._selectedMode === 'homework');
    this._materialsTab.classList.toggle('selected', this._selectedMode === 'materials');
    this._homeworkTab.setAttribute('aria-pressed', String(this._selectedMode === 'homework'));
    this._materialsTab.setAttribute('aria-pressed', String(this._selectedMode === 'materials'));
  }

  _renderContent(now) {
    if (!this._listContainer) return;
    this._clearChildren(this._listContainer);
    if (this._selectedMode === 'materials') {
      this._renderMaterialsIndex();
    } else {
      this._renderHomeworkDays(now);
    }
  }

  /* ================================ Утилиты дат и текста ================================ */

  static toDate(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());

    // subjectTimestamp в Firestore — Unix-секунды, а расписание содержит Date.
    if (typeof value === 'number' && Math.abs(value) < 100_000_000_000) {
      const secondsDate = new Date(value * 1000);
      return Number.isNaN(secondsDate.getTime()) ? null : secondsDate;
    }

    if (typeof justifyDate === 'function') {
      try {
        const justified = justifyDate(value);
        const date = justified instanceof Date ? justified : new Date(justified);
        if (!Number.isNaN(date.getTime())) return date;
      } catch (_) {
        // Переходим к нативному парсингу.
      }
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  static formatDateKey(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  static formatDate(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    return `${String(value.getDate()).padStart(2, '0')}.${String(value.getMonth() + 1).padStart(2, '0')}.${value.getFullYear()}`;
  }

  static formatTime(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  /** Время публикации в формате ЧЧ:ММ, ДД.ММ.ГГГГ */
  static formatDateTime(value) {
    const date = HomeworkRenderer.toDateTimestamp(value);
    if (!date) return '';
    return `${HomeworkRenderer.formatTime(date)}, ${HomeworkRenderer.formatDate(date)}`;
  }

  /** Unix-время публикации может прийти в секундах или миллисекундах */
  static toDateTimestamp(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    const milliseconds = number < 100_000_000_000 ? number * 1000 : number;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  static dayName(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    return ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][value.getDay()];
  }

  static shortDayName(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    return ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][value.getDay()];
  }

  static daysBetween(fromDate, toDate) {
    const from = HomeworkRenderer.toDate(fromDate);
    const to = HomeworkRenderer.toDate(toDate);
    if (!from || !to) return 0;
    const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.max(0, Math.round((toUtc - fromUtc) / 86_400_000));
  }

  static dayWord(number) {
    const lastTwo = Math.abs(number) % 100;
    const last = Math.abs(number) % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'дней';
    if (last === 1) return 'день';
    if (last >= 2 && last <= 4) return 'дня';
    return 'дней';
  }

  static lessonWord(number) {
    const lastTwo = number % 100;
    const last = number % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'занятий';
    if (last === 1) return 'занятие';
    if (last >= 2 && last <= 4) return 'занятия';
    return 'занятий';
  }

  static imageWord(number) {
    const lastTwo = number % 100;
    const last = number % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'изображений';
    if (last === 1) return 'изображение';
    if (last >= 2 && last <= 4) return 'изображения';
    return 'изображений';
  }

  static normalize(value) {
    return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU');
  }

  /** Обрезать превью текста: не длиннее 100 символов, при обрезке — троеточие */
  static makePreview(text) {
    const preview = String(text || '').trim().replace(/\s+/g, ' ');
    if (!preview) return '';
    return preview.length > HomeworkRenderer.PREVIEW_LIMIT
      ? `${preview.slice(0, HomeworkRenderer.PREVIEW_LIMIT - 1).trimEnd()}…`
      : preview;
  }

  /* ================================ Разбор занятия ================================ */

  static getEventDetails(event) {
    let extracted = {};
    if (typeof ScheduleRenderer !== 'undefined' && ScheduleRenderer && typeof ScheduleRenderer.extractElementData === 'function') {
      try {
        extracted = ScheduleRenderer.extractElementData(event) || {};
      } catch (_) {
        extracted = {};
      }
    }
    const summary = String((event && event.summary) || '').trim();
    const fallback = summary.match(/ (.*?)(?=\(|,[^,]*$|$)/);
    const subject = String(extracted.subject || (fallback && fallback[1] ? fallback[1].trim() : summary));
    return {
      subject,
      type: String(extracted.name || ''),
      subgroupText: String(extracted.subgroup || ''),
      typeCode: String(extracted.subjectMatch || ''),
    };
  }

  static getLessonKind(event) {
    const summary = String((event && event.summary) || '').trim().toLocaleLowerCase('ru-RU');
    const prefix = summary.slice(0, 3);
    if (prefix.startsWith('лек')) return 'lecture';
    if (prefix.startsWith('лаб')) return 'lab';
    if (/^пр(?:\.|\s)/.test(summary)) return 'practice';
    return 'other';
  }

  static getLessonKindName(kind) {
    return ({ lecture: 'Лекция', practice: 'Практика', lab: 'Лабораторная', other: 'Занятие' })[kind] || 'Занятие';
  }

  static getLessonColor(kind) {
    return ({ lecture: '#25cc25', practice: '#fcb826', lab: '#be26be', other: '#75849a' })[kind] || '#75849a';
  }

  /** Порядок видов занятий внутри дисциплины: лекция → практика → лабораторная → прочее */
  static getKindOrder(kind) {
    return ({ lecture: 0, practice: 1, lab: 2 })[kind] ?? 3;
  }

  /**
   * Цвет дисциплины в материалах:
   * есть лабораторные — фиолетовый, иначе есть практики — жёлтый,
   * если ни практик, ни лабораторных нет (только лекции) — зелёный.
   */
  static getDisciplineColor(kinds) {
    const list = Array.isArray(kinds) ? kinds : [];
    if (list.includes('lab')) return HomeworkRenderer.getLessonColor('lab');
    if (list.includes('practice')) return HomeworkRenderer.getLessonColor('practice');
    return HomeworkRenderer.getLessonColor('lecture');
  }

  /** В домашних заданиях участвуют только практики и лабораторные */
  static isHomeworkKind(kind) {
    return HomeworkRenderer.HOMEWORK_KINDS.includes(kind);
  }

  static isHomeworkEvent(event) {
    return HomeworkRenderer.isHomeworkKind(HomeworkRenderer.getLessonKind(event));
  }

  static getEventSubgroup(event) {
    if (event && (Number(event.targetSubgroup) === 1 || Number(event.targetSubgroup) === 2)) {
      return Number(event.targetSubgroup);
    }
    const details = HomeworkRenderer.getEventDetails(event);
    const subgroupValue = String(details.subgroupText || '').match(/\d+/);
    if (subgroupValue && (subgroupValue[0] === '1' || subgroupValue[0] === '2')) {
      return Number(subgroupValue[0]);
    }

    const searchable = `${String((event && event.summary) || '')} ${String((event && event.description) || '')}`;
    const patterns = [
      /(?:п\/г|подгрупп[аы]?|подгр\.?)\s*[:№#]?\s*(1|2)\b/i, // «подгруппа: 1»
      /\b(1|2)\s*(?:п\/г|подгрупп[аы]?|подгр\.?)/i,           // «1 подгруппа»
      /,\s*(1|2)(?:\s|$)/,                                   // короткий хвост «, 1»
    ];
    for (const pattern of patterns) {
      const marked = searchable.match(pattern);
      if (marked) return Number(marked[1]);
    }
    return null;
  }

  /** Преподаватель пары (из расписания либо из описания занятия) */
  static getEventTeacher(event) {
    if (!event) return '';
    if (event.teacher) return String(event.teacher).trim();
    if (typeof ScheduleRenderer !== 'undefined' && ScheduleRenderer
      && typeof ScheduleRenderer.extractElementData === 'function') {
      try {
        const extracted = ScheduleRenderer.extractElementData(event) || {};
        if (extracted.teacher) return String(extracted.teacher).trim();
      } catch (_) { /* описание разобрать не удалось — ниже пробуем вручную */ }
    }
    const description = String(event.description || '');
    const fio = description.match(/[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.\s*[А-ЯЁ]\./);
    return fio ? fio[0].replace(/\s+/g, ' ').trim() : '';
  }

  static isEventForSubgroup(event, subgroup) {
    const eventSubgroup = HomeworkRenderer.getEventSubgroup(event);
    return eventSubgroup === null || Number(eventSubgroup) === Number(subgroup);
  }

  static getEventTimestamp(event) {
    const start = HomeworkRenderer.toDate(event && event.startTime);
    return start ? Math.floor(start.getTime() / 1000) : null;
  }

  static eventIdentity(event) {
    const timestamp = HomeworkRenderer.getEventTimestamp(event) || 0;
    return `${timestamp}::${String((event && event.summary) || '').trim()}`;
  }

  /* ---------------- Изучаемый язык ---------------- */

  static getUserData() {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  static getUserSubgroup() {
    // ✓ Своя группа — своя подгруппа, чужая группа — всегда первая подгруппа
    const active = Number(window.CurrentSubgroup);
    if (active === 1 || active === 2) return active;
    const data = HomeworkRenderer.getUserData();
    const value = data.userSubgroup ?? (data.snapshot && data.snapshot.userSubgroup);
    return Number(value) === 2 ? 2 : 1;
  }

  /** Изучаемый язык пользователя (или null, если он ещё не выбран) */
  static getUserLanguage() {
    const data = HomeworkRenderer.getUserData();
    const value = data.userLanguage || data.studyLanguage || (data.snapshot && data.snapshot.userLanguage) || '';
    const normalized = String(value).trim().toLocaleLowerCase('ru-RU');
    if (!normalized) return null;
    const rule = HomeworkRenderer.LANGUAGE_RULES.find((item) => item.pattern.test(normalized));
    return rule ? rule.name : null;
  }

  /** Язык занятия по слову в названии/описании (Английский/Немецкий/Французский в любом регистре) */
  static getEventLanguage(event) {
    const text = `${String((event && event.summary) || '')} ${String((event && event.description) || '')}`;
    if (!text.trim()) return null;
    const rule = HomeworkRenderer.LANGUAGE_RULES.find((item) => item.pattern.test(text));
    return rule ? rule.name : null;
  }

  /** Человекочитаемый ярлык языка, например «Английский 2» */
  static getEventLanguageLabel(event) {
    const language = HomeworkRenderer.getEventLanguage(event);
    if (!language) return '';
    const raw = `${String((event && event.summary) || '')} ${String((event && event.description) || '')}`;
    const match = raw.match(/(английск[а-яё]*|немецк[а-яё]*|французск[а-яё]*)\s*(\d+)?/i);
    const level = match && match[2] ? ` ${match[2]}` : '';
    return `${language}${level}`;
  }

  static isEventForUserLanguage(event) {
    const userLanguage = HomeworkRenderer.getUserLanguage();
    if (!userLanguage) return true;                 // язык не выбран — показываем всё
    const eventLanguage = HomeworkRenderer.getEventLanguage(event);
    if (!eventLanguage) return true;                // занятие не про язык — показываем
    return eventLanguage === userLanguage;
  }

  /* ---------------- Названия дисциплин и объединение в группы ---------------- */

  /** Служебные части названия: подгруппа и язык обучающегося */
  static isNoisePart(part) {
    const value = String(part || '').trim();
    if (!value) return true;
    if (/^(?:п\/г|пг|подгрупп[а-яё]*|подгр\.?)\s*[:№#]?\s*\d+$/i.test(value)) return true;          // «п/г 2», «подгруппа 1»
    if (/^\d+\s*(?:п\/г|подгрупп[а-яё]*|подгр\.?)$/i.test(value)) return true;                     // «2 п/г»
    if (/^(?:английск[а-яё]*|немецк[а-яё]*|французск[а-яё]*)\s*\d*$/i.test(value)) return true;    // «Английский2»
    return false;
  }

  /**
   * Универсальный ключ дисциплины: убираем вид занятия (лек/пр/лаб), подгруппу и язык.
   * Именно по этому ключу практики и лабораторные одной дисциплины объединяются в группу.
   */
  static subjectKeyFrom(value) {
    let text = String(value ?? '').replace(/\s+/g, ' ').trim();
    // 1. Убираем префикс вида занятия
    text = text.replace(
      /^\s*(?:лекц[а-яё]*|лек\.?|лек|практик[а-яё]*|практ\.?|пр\.?|пр\b|лабораторн[а-яё]*|лаб\.?|лаб\b|семинар[а-яё]*|сем\.?)\s*[.:,]?\s+/i,
      ''
    );
    // 2. Выкидываем служебные части (подгруппа, язык) — они идут отдельными ярлыками
    const parts = text.split(',').map((part) => part.trim()).filter(Boolean);
    const meaningful = parts.filter((part) => !HomeworkRenderer.isNoisePart(part));
    text = (meaningful.length ? meaningful : parts).join(', ');
    // 3. Убираем висящие точки и запятые
    text = text.replace(/[.,;:\s]+$/g, '');
    return HomeworkRenderer.normalize(text);
  }

  /** Отображаемое название дисциплины (без подгруппы и языка) */
  static displaySubjectName(subject) {
    const parts = String(subject ?? '').split(',').map((part) => part.trim()).filter(Boolean);
    const meaningful = parts.filter((part) => !HomeworkRenderer.isNoisePart(part));
    return (meaningful.length ? meaningful : parts).join(', ') || String(subject ?? '');
  }

  /** Полное описание занятия: удобно использовать во всех режимах */
  static describeEvent(event) {
    const details = HomeworkRenderer.getEventDetails(event);
    const kind = HomeworkRenderer.getLessonKind(event);
    const subject = details.subject || 'Занятие без названия';
    return {
      event,
      kind,
      kindName: HomeworkRenderer.getLessonKindName(kind),
      color: HomeworkRenderer.getLessonColor(kind),
      subject,
      displaySubject: HomeworkRenderer.displaySubjectName(subject),
      subjectKey: HomeworkRenderer.subjectKeyFrom(subject),
      language: HomeworkRenderer.getEventLanguage(event),
      languageLabel: HomeworkRenderer.getEventLanguageLabel(event),
      subgroup: HomeworkRenderer.getEventSubgroup(event),
      start: HomeworkRenderer.toDate(event && event.startTime),
      end: HomeworkRenderer.toDate(event && event.endTime),
      dateKey: HomeworkRenderer.formatDateKey(event && event.startTime),
    };
  }

  /** Идёт ли пара прямо сейчас */
  static isOngoing(descriptorOrEvent, now = new Date()) {
    const start = descriptorOrEvent && descriptorOrEvent.start instanceof Date
      ? descriptorOrEvent.start
      : HomeworkRenderer.toDate(descriptorOrEvent && descriptorOrEvent.startTime);
    const end = descriptorOrEvent && descriptorOrEvent.end instanceof Date
      ? descriptorOrEvent.end
      : HomeworkRenderer.toDate(descriptorOrEvent && descriptorOrEvent.endTime);
    if (!start || !end) return false;
    return start <= now && now <= end;
  }

  /** Количество занятий: только прошедшие (+1, если пара идёт прямо сейчас) */
  static countPastOccurrences(descriptors, now = new Date()) {
    let count = 0;
    for (const item of descriptors) {
      if (!item || !item.start || !item.end) continue;
      if (item.end <= now) count += 1;
      else if (item.start <= now && now <= item.end) count += 1;
    }
    return count;
  }

  /**
   * Ближайшие ещё не завершённые занятия по каждой дисциплине + виду занятия.
   * Учитываются только практики и лабораторные, подгруппа и язык пользователя.
   */
  getUpcomingUniqueEvents(now = new Date(), filterToUser = true) {
    const candidates = this.scheduleData
      .map((event) => {
        if (!event || !event.startTime || !event.endTime) return null;
        if (!HomeworkRenderer.isHomeworkEvent(event)) return null;
        const start = HomeworkRenderer.toDate(event.startTime);
        const end = HomeworkRenderer.toDate(event.endTime);
        if (!start || !end || end <= start || end <= now) return null;
        if (filterToUser && !HomeworkRenderer.isEventForSubgroup(event, HomeworkRenderer.getUserSubgroup())) return null;
        if (filterToUser && !HomeworkRenderer.isEventForUserLanguage(event)) return null;

        const descriptor = HomeworkRenderer.describeEvent(event);
        return {
          ...descriptor,
          subjectKey: `${descriptor.kind}|${descriptor.subjectKey}|${descriptor.subgroup || 'all'}`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    const seen = new Set();
    const unique = [];
    for (const item of candidates) {
      if (seen.has(item.subjectKey)) continue;
      seen.add(item.subjectKey);
      unique.push(item);
    }
    return unique;
  }

  /* ================================ Режим «Домашнее задание» ================================ */

  _renderHomeworkDays(now) {
    const uniqueEvents = this.getUpcomingUniqueEvents(now, true);
    if (uniqueEvents.length === 0) {
      this._listContainer.appendChild(this._createEmptyMessage('В ближайшее время у вашей подгруппы нет практик и лабораторных.'));
      return;
    }

    const groupsByDate = new Map();
    for (const item of uniqueEvents) {
      if (!groupsByDate.has(item.dateKey)) {
        groupsByDate.set(item.dateKey, {
          dateKey: item.dateKey,
          date: new Date(item.start.getFullYear(), item.start.getMonth(), item.start.getDate()),
          events: [],
        });
      }
      groupsByDate.get(item.dateKey).events.push(item);
    }

    const groups = Array.from(groupsByDate.values()).sort((a, b) => a.date - b.date);
    const todayKey = HomeworkRenderer.formatDateKey(now);
    const highlightedDateKey = groups.some((group) => group.dateKey === todayKey) ? todayKey : groups[0].dateKey;

    for (const group of groups) {
      this._listContainer.appendChild(this._createHomeworkDay(group, now, group.dateKey === highlightedDateKey));
    }
  }

  _createHomeworkDay(group, now, highlighted) {
    const day = document.createElement('section');
    day.classList.add('homework-day');
    if (highlighted) day.classList.add('homework-day--highlighted');
    day.dataset.date = group.dateKey;

    const header = document.createElement('div');
    header.classList.add('homework-day-header');
    if (highlighted) header.classList.add('homework-day-header--highlighted');

    const offset = HomeworkRenderer.daysBetween(now, group.date);
    const offsetText = document.createElement('span');
    offsetText.classList.add('homework-day-offset');
    offsetText.textContent = offset === 0 ? 'Сегодня' : `Через ${offset} ${HomeworkRenderer.dayWord(offset)}`;
    offsetText.dataset.daysUntil = String(offset);

    const dateText = document.createElement('span');
    dateText.classList.add('homework-day-date');
    dateText.textContent = `${HomeworkRenderer.dayName(group.date)}, ${HomeworkRenderer.formatDate(group.date)}`;

    header.appendChild(offsetText);
    header.appendChild(dateText);
    day.appendChild(header);

    const eventsContainer = document.createElement('div');
    eventsContainer.classList.add('homework-day-events');
    for (const item of group.events) eventsContainer.appendChild(this._createHomeworkItem(item));
    day.appendChild(eventsContainer);
    return day;
  }

  /**
   * Карточка занятия. Кнопка «Добавить ДЗ» и кнопка отметки о выполнении находятся
   * внутри карточки (ровно по одной на пару), а не под каждой публикацией.
   */
  _createHomeworkItem(item) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('homework-item-wrapper');

    const card = document.createElement('article');
    card.classList.add('homework-item', `homework-item--${item.kind}`);
    card.style.setProperty('--lesson-kind-color', item.color);
    card.dataset.kind = item.kind;

    /* Заголовок карточки — открывает информацию о паре */
    const header = document.createElement('div');
    header.classList.add('homework-item-header');

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.classList.add('homework-item-open');
    openButton.title = 'Открыть информацию о занятии';
    openButton.addEventListener('click', () => this._navigate('lesson', { event: item.event, source: 'homework' }));

    const title = document.createElement('span');
    title.classList.add('homework-item-subject');
    title.textContent = item.displaySubject;

    const meta = document.createElement('span');
    meta.classList.add('homework-item-meta');
    const parts = [
      item.kindName,
      HomeworkRenderer.formatDate(item.start),
      `${HomeworkRenderer.formatTime(item.start)}–${HomeworkRenderer.formatTime(item.end)}`,
    ];
    if (item.subgroup) parts.push(`${item.subgroup}-я подгруппа`);
    if (item.languageLabel) parts.push(item.languageLabel);
    meta.textContent = parts.join(' · ');

    openButton.appendChild(title);
    openButton.appendChild(meta);
    header.appendChild(openButton);
    card.appendChild(header);

    /* Действия занятия: «Добавить ДЗ» + «Отметить ДЗ сделанным» (кружок справа внутри кнопки) */
    const actions = document.createElement('div');
    actions.classList.add('homework-item-actions');

    const addButton = this._createAddButton(item.event, 'homework', 'Добавить ДЗ на эту пару', { source: 'homework' });
    addButton.classList.add('homework-add-button');
    actions.appendChild(addButton);

    const checkpoint = this._createCheckpointButton(item.event);
    checkpoint.hidden = true; // пока не известно, есть ли ДЗ
    actions.appendChild(checkpoint);
    card.appendChild(actions);

    /* Публикации занятия */
    const postsContainer = document.createElement('div');
    postsContainer.classList.add('homework-assignment-list');
    card.appendChild(postsContainer);
    wrapper.appendChild(card);

    this._loadEventContent(item.event, true).then((content) => {
      if (!wrapper.contains(card)) return;
      const homeworkPosts = HomeworkRenderer.buildPosts(content.texts, content.images, 'homework');
      this._drawCheckpoint(checkpoint, item.event, homeworkPosts.length > 0);
      this._clearChildren(postsContainer);
      if (homeworkPosts.length === 0) return;
      for (const post of homeworkPosts) {
        postsContainer.appendChild(this._createPostSnippet(item.event, post, 'homework', { source: 'homework' }));
      }
    }).catch((error) => {
      console.warn('Не удалось загрузить домашнее задание пары:', error);
      this._drawCheckpoint(checkpoint, item.event, false);
    });

    return wrapper;
  }

  /** Кнопка отметки о выполнении: текст слева, кружок — в правой части кнопки */
  _createCheckpointButton(event) {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('homework-checkpoint');

    const label = document.createElement('span');
    label.classList.add('homework-checkpoint-label');
    label.textContent = 'Отметить ДЗ сделанным';

    const mark = document.createElement('span');
    mark.classList.add('homework-checkpoint-mark');
    mark.setAttribute('aria-hidden', 'true');

    button.appendChild(label);
    button.appendChild(mark);

    button.addEventListener('click', (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      const key = this._eventStorageKey(event);
      if (this._completed.has(key)) this._completed.delete(key);
      else this._completed.add(key);
      this._writeCompleted();
      this._drawCheckpoint(button, event, true);
    });

    return button;
  }

  _drawCheckpoint(button, event, hasHomework) {
    if (!button) return;
    if (!hasHomework) {
      button.hidden = true;
      return;
    }
    button.hidden = false;

    const key = this._eventStorageKey(event);
    const completed = this._completed.has(key);
    const label = button.querySelector('.homework-checkpoint-label');
    const mark = button.querySelector('.homework-checkpoint-mark');

    button.classList.toggle('homework-checkpoint--completed', completed);
    button.setAttribute('aria-pressed', String(completed));
    button.setAttribute('aria-label', completed ? 'Отметить ДЗ невыполненным' : 'Отметить ДЗ выполненным');
    button.title = completed ? 'ДЗ выполнено' : 'Отметить ДЗ выполненным';
    if (label) label.textContent = completed ? 'ДЗ сделано' : 'Отметить ДЗ сделанным';
    if (mark) mark.textContent = completed ? '✓' : '';
  }

  /* ================================ Сниппеты публикаций ================================ */

  /**
   * Сниппет публикации:
   *  - превью текста не длиннее 100 символов с троеточием;
   *  - при открытии превью скрывается (текст не дублируется), полный текст — внутри;
   *  - автор, его группа обучения и время публикации (ЧЧ:ММ, ДД.ММ.ГГГГ) видны всегда;
   *  - справа от имени — значки статусов: админ (красный), староста (синий),
   *    преподаватель (фиолетовый) и свой тег администрации (синий);
   *  - здесь же — статус модерации и меню действий из трёх точек.
   */
  _createPostSnippet(event, post, type, options = {}) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('homework-post');
    wrapper.classList.add(type === 'material' ? 'homework-post--material' : 'homework-post--homework');

    const disclosure = document.createElement('details');
    disclosure.classList.add('homework-post-details');

    const summary = document.createElement('summary');
    summary.classList.add('homework-post-snippet');

    /* Первая строка: превью текста + количество изображений */
    const previewRow = document.createElement('span');
    previewRow.classList.add('homework-post-snippet-row');

    const previewText = document.createElement('span');
    previewText.classList.add('homework-post-snippet-text', 'homework-post-preview');
    const preview = HomeworkRenderer.makePreview(post.textContent);
    previewText.textContent = preview || `Прикреплено ${post.images.length} ${HomeworkRenderer.imageWord(post.images.length)}`;
    previewRow.appendChild(previewText);

    if (post.images.length > 0 && preview) {
      const imageCount = document.createElement('span');
      imageCount.classList.add('homework-post-image-count');
      imageCount.textContent = `📷 ${post.images.length}`;
      previewRow.appendChild(imageCount);
    }
    summary.appendChild(previewRow);

    /* Вторая строка: автор и время публикации — остаются видимыми всегда */
    const metaRow = document.createElement('span');
    metaRow.classList.add('homework-post-meta');

    const author = document.createElement('span');
    author.classList.add('homework-post-author');
    author.textContent = post.author || 'Автор не указан';
    // ✓ Клик по имени автора открывает предосмотр его аккаунта (почты там не видно)
    const authorUid = String(post.userId || post.authorId || '');
    if (authorUid) {
      author.classList.add('homework-post-author--link');
      author.title = 'Открыть предосмотр аккаунта автора';
      author.addEventListener('click', (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        const navigate = window.navigateTo || (typeof navigateTo === 'function' ? navigateTo : null);
        if (typeof navigate === 'function') {
          navigate('userprofile', { userId: authorUid, userName: post.author || '' });
        }
      });
    }
    metaRow.appendChild(author);

    /* Группа обучения автора публикации */
    const authorGroup = post.userGroup ? String(post.userGroup) : '';
    if (authorGroup) {
      const group = document.createElement('span');
      group.classList.add('homework-post-group');
      group.textContent = `· группа ${authorGroup}`;
      metaRow.appendChild(group);
    }

    const publishedAt = HomeworkRenderer.formatDateTime(post.timestamp);
    if (publishedAt) {
      const date = document.createElement('span');
      date.classList.add('homework-post-date');
      date.textContent = publishedAt;
      metaRow.appendChild(date);
    }

    /* Публикация ещё не прошла модерацию */
    if (String(post.moderation || '') === 'pending') {
      const moderation = document.createElement('span');
      moderation.classList.add('homework-moderation-badge');
      moderation.textContent = 'Не проверено';
      moderation.title = 'Публикация ожидает проверки администратором';
      metaRow.appendChild(moderation);
    }

    /* Значки статусов: админ, староста, преподаватель, свой тег (тянутся из userdata) */
    const badgeHost = document.createElement('span');
    badgeHost.classList.add('homework-post-badge-host');
    metaRow.appendChild(badgeHost);
    summary.appendChild(metaRow);

    const context = {
      event,
      type,
      subject: (HomeworkRenderer.getEventDetails(event).subject) || post.subject || '',
      start: HomeworkRenderer.toDate(event && event.startTime),
      end: HomeworkRenderer.toDate(event && event.endTime),
      source: options.source || 'materials',
    };

    if (window.UserBadges && typeof window.UserBadges.renderInto === 'function') {
      window.UserBadges.renderInto(badgeHost, post);
    } else {
      HomeworkRenderer.getAdminIds().then((adminIds) => {
        if (!HomeworkRenderer.isAdminAuthor(post, adminIds) || !HomeworkRenderer.isRenderAlive(badgeHost)) return;
        const badge = document.createElement('span');
        badge.classList.add('homework-admin-badge');
        badge.textContent = HomeworkRenderer.ADMIN_BADGE_TEXT;
        badgeHost.appendChild(badge);
      });
    }

    /* Меню действий публикации: жалоба, поделиться, скопировать, редактировать, удалить */
    if (window.PostMenu && typeof window.PostMenu.buildButton === 'function') {
      const menuArea = document.createElement('span');
      menuArea.classList.add('homework-post-menu-area');
      menuArea.appendChild(window.PostMenu.buildButton(post, context));
      metaRow.appendChild(menuArea);
    }

    /* Полный текст и изображения */
    const fullContent = document.createElement('div');
    fullContent.classList.add('homework-post-full');

    if (post.textContent) {
      const text = document.createElement('p');
      text.classList.add('homework-post-text');
      text.textContent = post.textContent;
      fullContent.appendChild(text);
    }

    if (post.images.length > 0) {
      const imageGrid = document.createElement('div');
      imageGrid.classList.add('homework-image-grid');
      post.images.forEach((imageRecord, index) => {
        const imageUrl = String(imageRecord.imageUrl || imageRecord.url || '').trim();
        if (!imageUrl) return;
        const image = document.createElement('img');
        image.classList.add('homework-post-image');
        image.alt = `Изображение ${index + 1} к публикации`;
        image.loading = 'lazy';
        image.src = imageUrl;
        image.addEventListener('click', (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          // ✓ Просмотр чужой публикации: только просмотр, без редактирования
          const saveFolder = post.textType === 'homework' ? 'Домашние задания' : 'Материалы';
          if (window.imageViewer) window.imageViewer.open(imageUrl, { mode: 'view', saveFolder });
          else if (window.openImageViewer) window.openImageViewer(imageUrl, { mode: 'view', saveFolder });
        });
        imageGrid.appendChild(image);
        if (window.contentCache) window.contentCache.cacheImage(imageUrl);
      });
      fullContent.appendChild(imageGrid);
    }

    disclosure.appendChild(summary);
    disclosure.appendChild(fullContent);
    wrapper.appendChild(disclosure);
    return wrapper;
  }

  /** Список id администраторов (коллекция admindata), кэшируется на время сессии */
  static getAdminIds() {
    if (!HomeworkRenderer._adminIdsPromise) {
      HomeworkRenderer._adminIdsPromise = (async () => {
        try {
          if (window.database && typeof window.database.getAdminIds === 'function') {
            const result = await window.database.getAdminIds();
            if (result && result.success === true && Array.isArray(result.ids)) {
              return new Set(result.ids.map((value) => String(value)));
            }
          }
        } catch (error) {
          console.warn('Не удалось получить список администраторов:', error);
        }
        return new Set();
      })();
    }
    return HomeworkRenderer._adminIdsPromise;
  }

  static isAdminAuthor(post, adminIds) {
    if (!post) return false;
    if (post.isAdmin === true || post.authorIsAdmin === true) return true;
    if (!adminIds || adminIds.size === 0) return false;
    const candidates = [post.userId, post.authorId, post.uid, post.authorEmail];
    return candidates.some((value) => value && adminIds.has(String(value)));
  }

  /* ================================ Режим «Материалы» ================================ */

  async _renderMaterialsIndex() {
    const loading = document.createElement('p');
    loading.classList.add('homework-loading');
    loading.textContent = 'Загружаю список дисциплин…';
    this._listContainer.appendChild(loading);

    const group = HomeworkRenderer.getCurrentGroup();
    const [textResult, imageResult] = await Promise.all([
      HomeworkRenderer.fetchTexts('userGroup', group),
      HomeworkRenderer.fetchImages('userGroup', group),
    ]);
    if (!this._listContainer) return;
    this._clearChildren(this._listContainer);

    const texts = HomeworkRenderer.getResultArray(textResult, 'texts');
    const images = HomeworkRenderer.getResultArray(imageResult, 'images');
    const now = new Date();
    const disciplines = new Map();

    const addEvent = (event, sourceRecord = null) => {
      if (!event || !event.summary) return;
      // В материалах показываем все виды занятий (в том числе лекции) и все языки:
      // изучаемый язык влияет только на список домашних заданий.
      const descriptor = HomeworkRenderer.describeEvent(event);
      const variantKey = `${descriptor.kind}|${descriptor.languageLabel || 'none'}`;

      if (!disciplines.has(descriptor.subjectKey)) {
        disciplines.set(descriptor.subjectKey, {
          key: descriptor.subjectKey,
          title: descriptor.displaySubject,
          variants: new Map(),
          events: [],
        });
      }
      const discipline = disciplines.get(descriptor.subjectKey);

      if (!discipline.variants.has(variantKey)) {
        discipline.variants.set(variantKey, {
          key: variantKey,
          kind: descriptor.kind,
          kindName: descriptor.kindName,
          color: descriptor.color,
          subject: descriptor.subject,
          subjectKey: descriptor.subjectKey,
          language: descriptor.language,
          languageLabel: descriptor.languageLabel,
          subgroups: new Set(),
          events: [],
          hasServerData: false,
        });
      }
      const variant = discipline.variants.get(variantKey);
      const identity = HomeworkRenderer.eventIdentity(event);
      if (!variant.events.some((saved) => HomeworkRenderer.eventIdentity(saved) === identity)) {
        variant.events.push(event);
        discipline.events.push(event);
      }
      const subgroup = descriptor.subgroup || HomeworkRenderer.getRecordSubgroup(sourceRecord);
      if (subgroup) variant.subgroups.add(subgroup);
      if (sourceRecord) variant.hasServerData = true;
    };

    for (const event of this.scheduleData) addEvent(event);
    // ✓ Обращения в поддержку и ответы на них — не материалы: отфильтровываем их до сборки
    for (const record of texts) {
      if (HomeworkRenderer.isServiceRecord(record)) continue;
      addEvent(HomeworkRenderer.eventFromRecord(record), record);
    }
    for (const record of images) {
      if (HomeworkRenderer.isServiceRecord(record)) continue;
      addEvent(HomeworkRenderer.eventFromRecord(record), record);
    }

    if (disciplines.size === 0) {
      this._listContainer.appendChild(this._createEmptyMessage('В расписании и материалах пока нет занятий.'));
      return;
    }

    const ordered = Array.from(disciplines.values()).map((discipline) => {
      const eventDescriptors = discipline.events
        .map((event) => HomeworkRenderer.describeEvent(event))
        .sort((a, b) => a.start - b.start);
      return { ...discipline, eventDescriptors };
    }).sort((a, b) => {
      const aLast = a.eventDescriptors.reduce((latest, item) => Math.max(latest, item.start ? item.start.getTime() : 0), 0);
      const bLast = b.eventDescriptors.reduce((latest, item) => Math.max(latest, item.start ? item.start.getTime() : 0), 0);
      return bLast - aLast;
    });

    const list = document.createElement('div');
    list.classList.add('materials-subject-list');
    for (const discipline of ordered) {
      list.appendChild(this._createDisciplineBlock(discipline, now));
    }
    this._listContainer.appendChild(list);
  }

  /** Блок дисциплины: заголовок + раскрывающийся список практик и лабораторных */
  _createDisciplineBlock(discipline, now) {
    const container = document.createElement('div');
    container.classList.add('materials-discipline');

    const variants = Array.from(discipline.variants.values()).map((variant) => {
      const descriptors = variant.events
        .map((event) => HomeworkRenderer.describeEvent(event))
        .sort((a, b) => a.start - b.start);
      return { ...variant, descriptors };
    }).sort((a, b) => {
      // Лекция всегда первая, затем практика/лабораторная, затем прочее.
      const kindDifference = HomeworkRenderer.getKindOrder(a.kind) - HomeworkRenderer.getKindOrder(b.kind);
      if (kindDifference !== 0) return kindDifference;
      const labelDifference = String(a.languageLabel || '').localeCompare(String(b.languageLabel || ''), 'ru');
      if (labelDifference !== 0) return labelDifference;
      const aLast = a.descriptors.length ? a.descriptors[a.descriptors.length - 1].start : 0;
      const bLast = b.descriptors.length ? b.descriptors[b.descriptors.length - 1].start : 0;
      return bLast - aLast;
    });

    const visibleVariants = variants.filter((variant) =>
      HomeworkRenderer.countPastOccurrences(variant.descriptors, now) > 0 || variant.hasServerData
    );

    const header = document.createElement('button');
    header.type = 'button';
    header.classList.add('materials-discipline-header');
    // Цвет группы дисциплин: лабы — фиолетовый, практики — жёлтый, только лекции — зелёный.
    header.style.setProperty('--lesson-kind-color', HomeworkRenderer.getDisciplineColor(variants.map((variant) => variant.kind)));

    const title = document.createElement('span');
    title.classList.add('materials-discipline-title');
    title.textContent = discipline.title;
    header.appendChild(title);

    const hasOngoing = discipline.eventDescriptors.some((item) => HomeworkRenderer.isOngoing(item, now));
    if (hasOngoing) {
      const nowBadge = document.createElement('span');
      nowBadge.classList.add('materials-now-badge');
      nowBadge.textContent = 'Сейчас';
      header.appendChild(nowBadge);
    }

    const total = HomeworkRenderer.countPastOccurrences(discipline.eventDescriptors, now);
    const kinds = Array.from(new Set(visibleVariants.map((variant) => variant.kindName)));
    const meta = document.createElement('span');
    meta.classList.add('materials-discipline-meta');
    meta.textContent = `${total} ${HomeworkRenderer.lessonWord(total)}${kinds.length ? ` · ${kinds.join(', ')}` : ''}`;
    header.appendChild(meta);

    const arrow = document.createElement('span');
    arrow.classList.add('materials-discipline-arrow');
    arrow.textContent = '›';
    header.appendChild(arrow);

    const variantsBox = document.createElement('div');
    variantsBox.classList.add('materials-discipline-variants');

    if (visibleVariants.length === 0) {
      const empty = document.createElement('p');
      empty.classList.add('lesson-content-empty');
      empty.textContent = 'Прошедших занятий пока нет.';
      variantsBox.appendChild(empty);
    }

    for (const variant of visibleVariants) {
      const variantButton = document.createElement('button');
      variantButton.type = 'button';
      variantButton.classList.add('materials-variant-button');
      variantButton.style.setProperty('--lesson-kind-color', variant.color);

      const variantTitle = document.createElement('span');
      variantTitle.classList.add('materials-variant-title');
      const subgroups = Array.from(variant.subgroups).sort().map((value) => `${value}-я подгруппа`).join(', ');
      const labels = [variant.kindName];
      // Язык в подписи оставляем только у языковых занятий.
      if (variant.languageLabel) labels.push(variant.languageLabel);
      if (subgroups) labels.push(subgroups);
      variantTitle.textContent = labels.join(' · ');
      variantButton.appendChild(variantTitle);

      const isNow = variant.descriptors.some((item) => HomeworkRenderer.isOngoing(item, now));
      if (isNow) {
        const nowBadge = document.createElement('span');
        nowBadge.classList.add('materials-now-badge');
        nowBadge.textContent = 'Идёт сейчас';
        variantButton.appendChild(nowBadge);
      }

      const variantCount = HomeworkRenderer.countPastOccurrences(variant.descriptors, now);
      const countLabel = document.createElement('span');
      countLabel.classList.add('materials-variant-meta');
      countLabel.textContent = `${variantCount} ${HomeworkRenderer.lessonWord(variantCount)}`;
      variantButton.appendChild(countLabel);

      variantButton.addEventListener('click', (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        this._navigate('subject', {
          subject: variant.subject,
          subjectKey: variant.subjectKey,
          kind: variant.kind,
          language: variant.language,
          group: HomeworkRenderer.getCurrentGroup(),
        });
      });

      variantsBox.appendChild(variantButton);
    }

    header.addEventListener('click', () => {
      container.classList.toggle('materials-discipline--open');
      header.setAttribute('aria-expanded', String(container.classList.contains('materials-discipline--open')));
    });
    header.setAttribute('aria-expanded', 'false');

    container.appendChild(header);
    container.appendChild(variantsBox);
    return container;
  }

  /* ================================ Страница дисциплины ================================ */

  static async renderSubjectPage(data, scheduleData) {
    const renderer = new HomeworkRenderer(Array.isArray(scheduleData) ? scheduleData : []);
    const root = document.createElement('div');
    root.classList.add('materials-subject-page');

    const subjectName = String((data && data.subject) || 'Предмет');
    const requestedKind = String((data && data.kind) || 'other');
    const requestedKeyRaw = data && data.subjectKey ? String(data.subjectKey) : HomeworkRenderer.subjectKeyFrom(subjectName);
    const requestedKey = String(requestedKeyRaw).split('|').pop();
    const requestedLanguage = data && data.language ? String(data.language) : null;
    const group = String((data && data.group) || HomeworkRenderer.getCurrentGroup());

    const heading = document.createElement('div');
    heading.classList.add('materials-subject-page-header');
    const title = document.createElement('h2');
    const titleParts = [HomeworkRenderer.displaySubjectName(subjectName)];
    if (requestedKind !== 'other') titleParts.push(HomeworkRenderer.getLessonKindName(requestedKind));
    if (requestedLanguage) titleParts.push(requestedLanguage);
    title.textContent = titleParts.join(' · ');
    const description = document.createElement('p');
    description.textContent = 'Прошедшие занятия и текущая пара. Можно посмотреть или добавить материалы.';
    heading.appendChild(title);
    heading.appendChild(description);
    root.appendChild(heading);

    const [textResult, imageResult] = await Promise.all([
      HomeworkRenderer.fetchTexts('userGroup', group),
      HomeworkRenderer.fetchImages('userGroup', group),
    ]);
    const serverTexts = HomeworkRenderer.getResultArray(textResult, 'texts');
    const serverImages = HomeworkRenderer.getResultArray(imageResult, 'images');
    const allEvents = new Map();
    const now = new Date();

    const addEvent = (event) => {
      if (!event || !event.startTime || !event.summary) return;
      const start = HomeworkRenderer.toDate(event.startTime);
      if (!start || start > now) return; // будущие пары в материалах не показываем
      const descriptor = HomeworkRenderer.describeEvent(event);
      if (descriptor.subjectKey !== requestedKey) return;
      if (requestedKind !== 'other' && descriptor.kind !== requestedKind) return;
      if (requestedLanguage && descriptor.language !== requestedLanguage) return;
      allEvents.set(HomeworkRenderer.eventIdentity(event), event);
    };

    renderer.scheduleData.forEach(addEvent);
    serverTexts.forEach((record) => {
      if (HomeworkRenderer.isServiceRecord(record)) return;
      addEvent(HomeworkRenderer.eventFromRecord(record));
    });
    serverImages.forEach((record) => {
      if (HomeworkRenderer.isServiceRecord(record)) return;
      addEvent(HomeworkRenderer.eventFromRecord(record));
    });

    const occurrences = Array.from(allEvents.values()).sort((a, b) =>
      (HomeworkRenderer.getEventTimestamp(b) || 0) - (HomeworkRenderer.getEventTimestamp(a) || 0)
    );

    if (occurrences.length === 0) {
      root.appendChild(renderer._createEmptyMessage('Прошедших занятий с данными материалами не найдено.'));
      return root;
    }

    const list = document.createElement('div');
    list.classList.add('materials-occurrence-list');
    for (const event of occurrences) {
      list.appendChild(renderer._createOccurrenceCard(event, list, now));
    }
    root.appendChild(list);
    return root;
  }

  _createOccurrenceCard(event, ownerContainer, now = new Date()) {
    const descriptor = HomeworkRenderer.describeEvent(event);
    const ongoing = HomeworkRenderer.isOngoing(descriptor, now);

    const card = document.createElement('article');
    card.classList.add('materials-occurrence', `materials-occurrence--${descriptor.kind}`);
    if (ongoing) card.classList.add('materials-occurrence--now');
    card.style.setProperty('--lesson-kind-color', descriptor.color);

    const top = document.createElement('div');
    top.classList.add('materials-occurrence-top');

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.classList.add('materials-occurrence-open');

    const name = document.createElement('span');
    name.classList.add('materials-occurrence-name');
    name.textContent = `${descriptor.kindName} · ${HomeworkRenderer.formatDate(descriptor.start)}`;

    const meta = document.createElement('span');
    meta.classList.add('materials-occurrence-meta');
    const metaParts = [
      `${HomeworkRenderer.formatTime(descriptor.start)}–${HomeworkRenderer.formatTime(descriptor.end)}`,
    ];
    if (descriptor.subgroup) metaParts.push(`${descriptor.subgroup}-я подгруппа`);
    if (descriptor.languageLabel) metaParts.push(descriptor.languageLabel);
    meta.textContent = metaParts.join(' · ');

    openButton.appendChild(name);
    openButton.appendChild(meta);
    openButton.addEventListener('click', () => this._navigate('lesson', { event, source: 'materials' }));
    top.appendChild(openButton);

    if (ongoing) {
      const nowBadge = document.createElement('span');
      nowBadge.classList.add('materials-now-badge');
      nowBadge.textContent = 'Идёт сейчас';
      top.appendChild(nowBadge);
    }

    const actions = document.createElement('div');
    actions.classList.add('materials-occurrence-actions');
    const addHomework = this._createAddButton(event, 'homework', 'Добавить ДЗ', { source: 'materials' });
    const addMaterial = this._createAddButton(event, 'material', 'Добавить материал', { source: 'materials' });
    actions.appendChild(addHomework);
    actions.appendChild(addMaterial);
    top.appendChild(actions);
    card.appendChild(top);

    const postsContainer = document.createElement('div');
    postsContainer.classList.add('materials-occurrence-posts');
    card.appendChild(postsContainer);

    this._loadEventContent(event, false).then((content) => {
      if (!ownerContainer.contains(card)) return;
      this._clearChildren(postsContainer);
      const materialPosts = HomeworkRenderer.buildPosts(content.texts, content.images, 'material');
      const homeworkPosts = HomeworkRenderer.buildPosts(content.texts, content.images, 'homework');
      materialPosts.forEach((post) => postsContainer.appendChild(this._createPostSnippet(event, post, 'material', { source: 'materials' })));
      homeworkPosts.forEach((post) => postsContainer.appendChild(this._createPostSnippet(event, post, 'homework', { source: 'materials' })));
    }).catch((error) => console.warn('Не удалось загрузить публикации пары:', error));

    return card;
  }

  /* ================================ Страница занятия ================================ */

  /**
   * Содержимое страницы занятия: переключатель «Сегодняшнее ДЗ / ДЗ на следующее
   * занятие», переключатель дней для материалов, сами публикации и кнопки добавления.
   */
  static async renderLessonContents(event, options = {}) {
    const renderer = new HomeworkRenderer(HomeworkRenderer._currentSchedule());
    const root = document.createElement('div');
    root.classList.add('lesson-materials-content');

    const descriptor = HomeworkRenderer.describeEvent(event);

    if (HomeworkRenderer.isHomeworkKind(descriptor.kind)) {
      const homeworkSection = await renderer._createLessonHomeworkSection(descriptor, options);
      if (homeworkSection) root.appendChild(homeworkSection);
    } else {
      const notice = document.createElement('section');
      notice.classList.add('lesson-content-section', 'lesson-content-section--notice');
      const text = document.createElement('p');
      text.classList.add('lesson-content-empty');
      text.textContent = descriptor.kind === 'lecture'
        ? 'Домашние задания ведутся только по практикам и лабораторным, поэтому у лекций их нет.'
        : 'По этому занятию домашние задания не ведутся.';
      notice.appendChild(text);
      root.appendChild(notice);
    }

    root.appendChild(await renderer._createLessonMaterialsSection(descriptor, options));
    return root;
  }

  static _currentSchedule() {
    try {
      if (typeof CurrentGroup !== 'undefined' && CurrentGroup) {
        if (typeof groupData !== 'undefined' && groupData && Array.isArray(groupData[CurrentGroup])) {
          return groupData[CurrentGroup];
        }
        if (typeof window !== 'undefined' && window.groupData && Array.isArray(window.groupData[CurrentGroup])) {
          return window.groupData[CurrentGroup];
        }
      }
    } catch (_) {
      // Ниже вернём пустой массив.
    }
    return [];
  }

  /** Все пары той же дисциплины, вида занятия и языка (+ подгруппа при необходимости) */
  _occurrencesFor(descriptor, options = {}) {
    const list = (this.scheduleData || [])
      .filter((event) => event && event.startTime && event.endTime)
      .map((event) => HomeworkRenderer.describeEvent(event))
      .filter((item) => item.kind === descriptor.kind)
      .filter((item) => item.subjectKey === descriptor.subjectKey)
      .filter((item) => (!descriptor.language ? true : item.language === descriptor.language))
      .filter((item) => item.start && item.end)
      .filter((item) => (options.ignoreSubgroup ? true : HomeworkRenderer.isEventForSubgroup(item.event, HomeworkRenderer.getUserSubgroup())))
      .sort((a, b) => a.start - b.start);
    return list;
  }

  _homeworkOccurrences(descriptor) {
    const filtered = this._occurrencesFor(descriptor, { ignoreSubgroup: false });
    if (filtered.length > 0) return filtered;
    return this._occurrencesFor(descriptor, { ignoreSubgroup: true });
  }

  /**
   * Секция домашнего задания на странице занятия.
   *
   * Переключатель: «ДЗ на эту пару» / «ДЗ на следующую пару» — то есть домашнее задание,
   * прикреплённое к открытой паре или к следующей такой же паре в расписании.
   * Какую вкладку открыть первой, решает источник перехода: из списка ДЗ — «эта пара»,
   * из расписания и материалов — «следующая пара» (чтобы удобно было задать ДЗ вперёд).
   */
  async _createLessonHomeworkSection(descriptor, options = {}) {
    const section = document.createElement('section');
    section.classList.add('lesson-content-section', 'lesson-content-section--homework');

    const heading = document.createElement('div');
    heading.classList.add('lesson-content-heading');
    const title = document.createElement('h2');
    title.textContent = 'Домашнее задание';
    heading.appendChild(title);
    section.appendChild(heading);

    const occurrences = this._homeworkOccurrences(descriptor);
    const thisOccurrence = descriptor;
    const nextOccurrence = occurrences.find((item) => item.start > thisOccurrence.start) || null;

    /* Переключатель над блоком домашнего задания */
    const toggle = document.createElement('div');
    toggle.classList.add('lesson-homework-toggle', 'flex-container', 'radio-container');

    const thisButton = document.createElement('button');
    thisButton.type = 'button';
    thisButton.classList.add('radio-button');
    thisButton.textContent = 'ДЗ на эту пару';

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.classList.add('radio-button');
    nextButton.textContent = 'ДЗ на следующую пару';

    toggle.appendChild(thisButton);
    toggle.appendChild(nextButton);
    section.appendChild(toggle);

    const note = document.createElement('p');
    note.classList.add('lesson-occurrence-note');
    section.appendChild(note);

    const postsContainer = document.createElement('div');
    postsContainer.classList.add('lesson-content-posts');
    section.appendChild(postsContainer);

    const actions = document.createElement('div');
    actions.classList.add('lesson-content-actions');
    section.appendChild(actions);

    const source = options.source || 'materials';
    // ✓ Из расписания открывается ДЗ ИМЕННО НА ЭТУ пару: раньше первой показывалась
    //   вкладка «на следующую пару», из-за чего задание выглядело «сдвинутым».
    let currentTarget = (source === 'homework' || source === 'schedule')
      ? 'this'
      : (nextOccurrence ? 'next' : 'this');

    const draw = async () => {
      const occurrence = currentTarget === 'next' ? nextOccurrence : thisOccurrence;
      thisButton.classList.toggle('selected', currentTarget === 'this');
      nextButton.classList.toggle('selected', currentTarget === 'next');
      thisButton.setAttribute('aria-pressed', String(currentTarget === 'this'));
      nextButton.setAttribute('aria-pressed', String(currentTarget === 'next'));
      this._clearChildren(postsContainer);
      this._clearChildren(actions);

      if (!occurrence) {
        note.textContent = 'Следующая такая же пара не найдена в расписании — добавьте ДЗ к текущей паре.';
        const empty = document.createElement('p');
        empty.classList.add('lesson-content-empty');
        empty.textContent = 'Добавлять ДЗ на следующую пару пока не для чего.';
        postsContainer.appendChild(empty);
        const fallback = this._createAddButton(thisOccurrence.event, 'homework', `Добавить ДЗ на эту пару (${HomeworkRenderer.formatDate(thisOccurrence.start)})`, { source });
        fallback.classList.add('lesson-content-add');
        actions.appendChild(fallback);
        return;
      }

      const timeLabel = `${HomeworkRenderer.formatDate(occurrence.start)} · ${HomeworkRenderer.formatTime(occurrence.start)}–${HomeworkRenderer.formatTime(occurrence.end)}`;
      const ongoingLabel = HomeworkRenderer.isOngoing(occurrence, new Date()) ? ' · идёт сейчас' : '';
      const prefix = currentTarget === 'next' ? 'Следующая пара' : 'Эта пара';
      note.textContent = `${prefix}: ${timeLabel}${ongoingLabel}`;

      const addButton = this._createAddButton(
        occurrence.event,
        'homework',
        currentTarget === 'next' ? 'Добавить ДЗ на следующую пару' : 'Добавить ДЗ на эту пару',
        { source }
      );
      addButton.classList.add('lesson-content-add');
      actions.appendChild(addButton);

      const content = await this._loadEventContent(occurrence.event, false);
      if (!HomeworkRenderer.isRenderAlive(postsContainer)) return;
      const posts = HomeworkRenderer.buildPosts(content.texts, content.images, 'homework');
      if (posts.length === 0) {
        const empty = document.createElement('p');
        empty.classList.add('lesson-content-empty');
        empty.textContent = currentTarget === 'next'
          ? 'На следующую пару домашнее задание ещё не задано.'
          : 'К этой паре домашнее задание не прикреплено.';
        postsContainer.appendChild(empty);
        return;
      }
      for (const post of posts) {
        postsContainer.appendChild(this._createPostSnippet(occurrence.event, post, 'homework', { source: currentTarget === 'next' ? 'homework' : source }));
      }
    };

    thisButton.addEventListener('click', () => { currentTarget = 'this'; draw(); });
    nextButton.addEventListener('click', () => { currentTarget = 'next'; draw(); });

    await draw();
    return section;
  }

  /** Секция материалов с переключателем дней (как недели в расписании) */
  async _createLessonMaterialsSection(descriptor, options = {}) {
    const source = options.source || 'materials';
    const section = document.createElement('section');
    section.classList.add('lesson-content-section', 'lesson-content-section--material');

    const heading = document.createElement('div');
    heading.classList.add('lesson-content-heading');
    const title = document.createElement('h2');
    title.textContent = 'Материалы';
    heading.appendChild(title);
    section.appendChild(heading);

    const allOccurrences = this._occurrencesFor(descriptor, { ignoreSubgroup: true });
    const now = new Date();
    const available = allOccurrences.filter((item) => item.start <= now);
    const days = available.slice(-HomeworkRenderer.DAY_SWITCH_LIMIT);

    /* Переключатель дней над блоком материалов */
    const daySwitch = document.createElement('div');
    daySwitch.classList.add('radio-week-container', 'flex-container', 'lesson-day-switch');

    const note = document.createElement('p');
    note.classList.add('lesson-occurrence-note');

    const postsContainer = document.createElement('div');
    postsContainer.classList.add('lesson-content-posts');

    const actions = document.createElement('div');
    actions.classList.add('lesson-content-actions');

    if (days.length === 0) {
      daySwitch.remove();
      const empty = document.createElement('p');
      empty.classList.add('lesson-content-empty');
      empty.textContent = 'Эта пара ещё не проходила, поэтому материалов пока нет.';
      section.appendChild(empty);
      return section;
    }

    const ongoingIndex = days.findIndex((item) => HomeworkRenderer.isOngoing(item, now));
    let selectedIndex = ongoingIndex >= 0 ? ongoingIndex : days.length - 1;

    const draw = async () => {
      const selected = days[selectedIndex];
      daySwitch.querySelectorAll('.lesson-day-button').forEach((button) => {
        const isSelected = Number(button.dataset.index) === selectedIndex;
        button.classList.toggle('selected', isSelected);
        button.setAttribute('aria-pressed', String(isSelected));
      });

      this._clearChildren(postsContainer);
      this._clearChildren(actions);

      const timeLabel = `${HomeworkRenderer.formatDate(selected.start)} · ${HomeworkRenderer.formatTime(selected.start)}–${HomeworkRenderer.formatTime(selected.end)}`;
      const ongoingLabel = HomeworkRenderer.isOngoing(selected, new Date()) ? ' · идёт сейчас' : '';
      const subgroupLabel = selected.subgroup ? ` · ${selected.subgroup}-я подгруппа` : '';
      note.textContent = `${selected.kindName}: ${timeLabel}${subgroupLabel}${ongoingLabel}`;

      const addButton = this._createAddButton(selected.event, 'material', 'Добавить материал', { source });
      addButton.classList.add('lesson-content-add');
      actions.appendChild(addButton);

      const content = await this._loadEventContent(selected.event, false);
      if (!HomeworkRenderer.isRenderAlive(postsContainer)) return;
      const posts = HomeworkRenderer.buildPosts(content.texts, content.images, 'material');
      if (posts.length === 0) {
        const empty = document.createElement('p');
        empty.classList.add('lesson-content-empty');
        empty.textContent = 'К этому занятию пока нет материалов.';
        postsContainer.appendChild(empty);
        return;
      }
      for (const post of posts) {
        postsContainer.appendChild(this._createPostSnippet(selected.event, post, 'material', { source }));
      }
    };

    days.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('radio-week-button', 'lesson-day-button');
      button.dataset.index = String(index);
      button.textContent = `${HomeworkRenderer.formatDate(item.start).slice(0, 5)} ${HomeworkRenderer.shortDayName(item.start)}`;
      if (HomeworkRenderer.isOngoing(item, now)) button.classList.add('current-week-button');
      button.addEventListener('click', () => { selectedIndex = index; draw(); });
      daySwitch.appendChild(button);
    });

    section.appendChild(daySwitch);
    section.appendChild(note);
    section.appendChild(postsContainer);
    section.appendChild(actions);

    await draw();
    return section;
  }

  /* ================================ Публикации ================================ */

  static buildPosts(texts, images, type) {
    const groups = new Map();
    const getOrCreate = (key, record) => {
      if (!groups.has(key)) {
        groups.set(key, {
          postId: record.postId || key,
          textIds: [],
          imageIds: [],
          textContent: '',
          textType: String(record.textType || ''),
          author: record.author || '',
          authorEmail: record.authorEmail || '',
          userId: record.userId || '',
          userGroup: record.userGroup || '',
          userSubgroup: record.userSubgroup || null,
          targetSubgroup: record.targetSubgroup ?? null,
          subject: String(record.subject || ''),
          teacher: String(record.teacher || ''),
          subjectTimestamp: Number(record.subjectTimestamp) || 0,
          moderation: '',
          reportCount: Number(record.reportCount) || 0,
          reportedBy: Array.isArray(record.reportedBy) ? record.reportedBy.slice() : [],
          isAdmin: record.isAdmin === true || record.authorIsAdmin === true,
          timestamp: Number(record.timestamp) || 0,
          images: [],
        });
      }
      return groups.get(key);
    };

    (Array.isArray(texts) ? texts : []).forEach((text, index) => {
      if (String(text.textType || '') !== type) return;
      const key = text.postId || text.textId || `legacy-text-${type}-${text.timestamp || index}`;
      const post = getOrCreate(key, text);
      post.textContent = String(text.textContent || '');
      post.author = text.author || post.author;
      post.authorEmail = text.authorEmail || post.authorEmail;
      post.userId = text.userId || post.userId;
      post.userGroup = text.userGroup || post.userGroup;
      post.textType = text.textType === 'homework' ? 'homework' : (post.textType || 'material');
      post.subject = text.subject || post.subject;
      post.teacher = text.teacher || post.teacher;
      post.subjectTimestamp = Number(text.subjectTimestamp) || post.subjectTimestamp;
      post.reportCount = Math.max(post.reportCount, Number(text.reportCount) || 0);
      if (Array.isArray(text.reportedBy)) post.reportedBy = text.reportedBy.slice();
      if (text.moderation === 'pending') post.moderation = 'pending';
      else if (!post.moderation) post.moderation = String(text.moderation || '');
      if (text.textId) post.textIds.push(String(text.textId));
      post.timestamp = Number(text.timestamp) || post.timestamp;
    });

    (Array.isArray(images) ? images : []).forEach((image, index) => {
      if (String(image.imageType || '') !== type) return;
      const key = image.postId || image.textId || `legacy-images-${type}`;
      const post = getOrCreate(key, image);
      post.images.push(image);
      post.author = image.author || post.author;
      post.authorEmail = image.authorEmail || post.authorEmail;
      post.userId = image.userId || post.userId;
      post.reportCount = Math.max(post.reportCount, Number(image.reportCount) || 0);
      if (Array.isArray(image.reportedBy)) post.reportedBy = image.reportedBy.slice();
      if (image.moderation === 'pending') post.moderation = 'pending';
      else if (!post.moderation) post.moderation = String(image.moderation || '');
      if (image.imageId) post.imageIds.push(String(image.imageId));
      if (!post.teacher && image.teacher) post.teacher = String(image.teacher).trim();
      post.timestamp = Number(image.timestamp) || post.timestamp;
    });

    return Array.from(groups.values())
      .filter((post) => post.textContent.trim() || post.images.length > 0)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /** Прочитать публикации одной пары (онлайн либо из локального кэша) */
  async _loadEventContent(event, filterToUserSubgroup = false) {
    const timestamp = HomeworkRenderer.getEventTimestamp(event);
    if (!timestamp) return { texts: [], images: [] };

    const [textResult, imageResult] = await Promise.all([
      HomeworkRenderer.fetchTexts('subjectTimestamp', timestamp),
      HomeworkRenderer.fetchImages('subjectTimestamp', timestamp),
    ]);

    const summary = String(event.summary || '').trim();
    const eventSubgroup = HomeworkRenderer.getEventSubgroup(event);
    const userSubgroup = HomeworkRenderer.getUserSubgroup();
    const forTargetSubgroup = (record) => {
      const target = HomeworkRenderer.getRecordSubgroup(record);
      if (filterToUserSubgroup && target !== null && target !== userSubgroup) return false;
      if (eventSubgroup !== null && target !== null && eventSubgroup !== target) return false;
      return true;
    };

    // ✓ Разные группы могут слушать один предмет в одно и то же время у разных
    // преподавателей. Сверяем преподавателя, иначе чужие ДЗ видны всем группам.
    const eventTeacher = HomeworkRenderer.getEventTeacher(event);
    const forTeacher = (record) => {
      if (typeof window.isPostForTeacher === 'function') return window.isPostForTeacher(record, eventTeacher);
      const recordTeacher = String((record && record.teacher) || '').trim();
      if (!recordTeacher || !eventTeacher) return true; // старые публикации не отсекаем
      return recordTeacher.toLowerCase() === eventTeacher.toLowerCase();
    };

    const texts = HomeworkRenderer.getResultArray(textResult, 'texts').filter((text) =>
      !HomeworkRenderer.isServiceRecord(text)
      && String(text.subject || '').trim() === summary && forTargetSubgroup(text) && forTeacher(text)
    );
    const images = HomeworkRenderer.getResultArray(imageResult, 'images').filter((image) =>
      String(image.subject || '').trim() === summary && forTargetSubgroup(image) && forTeacher(image)
    );

    return { texts, images };
  }

  static async fetchTexts(parameter, value) {
    if (window.contentCache && typeof window.contentCache.getTexts === 'function') {
      return window.contentCache.getTexts(parameter, value);
    }
    if (window.database && typeof window.database.getTexts === 'function') {
      return window.database.getTexts(parameter, value);
    }
    return { success: false, texts: [] };
  }

  static async fetchImages(parameter, value) {
    if (window.contentCache && typeof window.contentCache.getImages === 'function') {
      return window.contentCache.getImages(parameter, value);
    }
    if (window.database && typeof window.database.getImages === 'function') {
      return window.database.getImages(parameter, value);
    }
    return { success: false, images: [] };
  }

  static getResultArray(result, key) {
    return result && Array.isArray(result[key]) ? result[key] : [];
  }

  /* ================================ Прочее ================================ */

  static getCurrentGroup() {
    try {
      if (typeof CurrentGroup !== 'undefined' && CurrentGroup) return String(CurrentGroup);
    } catch (_) { /* пусто */ }
    try {
      const data = JSON.parse(localStorage.getItem('userData') || 'null');
      return String((data && data.userGroup) || '');
    } catch (_) {
      return '';
    }
  }

  static getRecordSubgroup(record) {
    if (!record) return null;
    const value = record.targetSubgroup ?? record.subgroup;
    if (Number(value) === 1 || Number(value) === 2) return Number(value);
    const subject = String(record.subject || '');
    const patterns = [
      /(?:п\/г|подгрупп[аы]?|подгр\.?)\s*[:№#]?\s*(1|2)\b/i,
      /\b(1|2)\s*(?:п\/г|подгрупп[аы]?|подгр\.?)/i,
      /,\s*(1|2)(?:\s|$)/,
    ];
    for (const pattern of patterns) {
      const match = subject.match(pattern);
      if (match) return Number(match[1]);
    }
    return null;
  }

  /**
   * Служебная запись: обращение в поддержку или ответ администрации.
   * Такие записи живут только в разделе «Обратная связь» и не должны превращаться
   * в предмет «Обратная связь» в материалах.
   */
  static isServiceRecord(record) {
    if (!record) return false;
    const type = String(record.textType || record.imageType || '').toLowerCase();
    if (type === 'feedback' || type === 'feedbackanswer') return true;
    return String(record.subject || '').trim().toLowerCase() === 'обратная связь';
  }

  static eventFromRecord(record) {
    if (HomeworkRenderer.isServiceRecord(record)) return null;
    if (!record || !record.subject || !record.subjectTimestamp) return null;
    let timestamp = Number(record.subjectTimestamp);
    if (timestamp > 100_000_000_000) timestamp = Math.floor(timestamp / 1000);
    const startTime = new Date(timestamp * 1000);
    if (Number.isNaN(startTime.getTime())) return null;
    return {
      uid: `server:${record.subjectTimestamp}:${record.subject}`,
      summary: String(record.subject),
      description: record.description || '',
      location: record.location || '',
      startTime,
      endTime: new Date(startTime.getTime() + 90 * 60 * 1000),
      targetSubgroup: HomeworkRenderer.getRecordSubgroup(record),
      _fromServer: true,
    };
  }

  _eventStorageKey(event) {
    return `${HomeworkRenderer.eventIdentity(event)}::${HomeworkRenderer.getEventSubgroup(event) || 'all'}`;
  }

  _readCompleted() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return new Set();
      const raw = window.localStorage.getItem(this._getStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []);
    } catch (_) {
      return new Set();
    }
  }

  _writeCompleted() {
    try {
      window.localStorage.setItem(this._getStorageKey(), JSON.stringify(Array.from(this._completed)));
    } catch (error) {
      console.warn('Не удалось сохранить отметку о выполненном ДЗ:', error);
    }
  }

  _getStorageKey() {
    let scope = 'default';
    try {
      const user = window.auth && window.auth.getCurrentUser && window.auth.getCurrentUser();
      if (user && user.uid) scope = `user-${encodeURIComponent(user.uid)}`;
      else scope = `group-${encodeURIComponent(HomeworkRenderer.getCurrentGroup() || 'default')}`;
    } catch (_) {
      scope = `group-${encodeURIComponent(HomeworkRenderer.getCurrentGroup() || 'default')}`;
    }
    return `${this.options.storageKeyPrefix}:${scope}`;
  }

  _createAddButton(event, type, label, options = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('materials-add-inline');
    button.textContent = label;
    button.addEventListener('click', (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      this._navigate('addmatr', { event, fixedType: type, source: options.source || null });
    });
    return button;
  }

  _createEmptyMessage(text) {
    const empty = document.createElement('div');
    empty.classList.add('homework-empty');
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    empty.appendChild(paragraph);
    return empty;
  }

  _navigate(page, data) {
    const navigate = typeof window !== 'undefined' && typeof window.navigateTo === 'function'
      ? window.navigateTo
      : (typeof navigateTo === 'function' ? navigateTo : null);
    if (!navigate) {
      console.warn(`Не найдена функция navigateTo для страницы ${page}`);
      return;
    }
    Promise.resolve(navigate(page, data)).catch((error) => console.warn(`Не удалось открыть страницу ${page}:`, error));
  }

  _clearChildren(element) {
    while (element && element.firstChild) element.removeChild(element.firstChild);
  }

  /**
   * Нужен ли ещё этот узел. Во время первой отрисовки дерево может быть ещё не вставлено
   * в документ — это нормально; удалённым считаем только тот узел, который уже был в документе
   * и после асинхронной работы из него пропал.
   */
  static isRenderAlive(node) {
    if (!node) return false;
    if (node.isConnected) { node.__wasInDocument = true; return true; }
    return node.__wasInDocument !== true;
  }

  _observeRootRemoval() {
    if (typeof MutationObserver !== 'function' || !document.documentElement) return;
    this._observer = new MutationObserver(() => {
      if (!this._root) return;
      if (this._root.isConnected) this._hasBeenConnected = true;
      else if (this._hasBeenConnected) this.destroy();
    });
    this._observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  _scheduleRefresh() {
    if (!this._root || this._selectedMode !== 'homework') return;
    if (this._refreshTimer !== null) clearTimeout(this._refreshTimer);

    const now = new Date();
    let delay = Math.max(1_000, Number(this.options.refreshInterval) || 60_000);
    const boundaries = [new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)];
    for (const event of this.scheduleData) {
      if (!event) continue;
      const start = HomeworkRenderer.toDate(event.startTime);
      const end = HomeworkRenderer.toDate(event.endTime);
      if (start && start > now) boundaries.push(start);
      if (end && end > now) boundaries.push(end);
    }
    for (const boundary of boundaries) {
      delay = Math.min(delay, Math.max(250, boundary.getTime() - now.getTime() + 100));
    }

    this._refreshTimer = setTimeout(() => {
      this._refreshTimer = null;
      if (!this._root) return;
      if (this._root.isConnected) this._hasBeenConnected = true;
      else if (this._hasBeenConnected) {
        this.destroy();
        return;
      }
      if (this._selectedMode === 'homework') this._renderHomeworkDays(new Date());
      this._scheduleRefresh();
    }, delay);
  }
}

/* Список администраторов нужен для значка «Админ» в публикациях. */
if (typeof window !== 'undefined' && window.database && typeof window.database.getAdminIds !== 'function') {
  window.database.getAdminIds = async function getAdminIds() {
    try {
      const snapshot = await this.db.collection('admindata').get();
      const ids = [];
      snapshot.forEach((doc) => {
        ids.push(doc.id);
        const data = doc.data() || {};
        if (data.userId) ids.push(String(data.userId));
        if (data.uid) ids.push(String(data.uid));
        if (data.userEmail) ids.push(String(data.userEmail));
      });
      return { success: true, ids: Array.from(new Set(ids.filter(Boolean))) };
    } catch (error) {
      return { success: false, ids: [], message: `Ошибка получения списка администраторов: ${error && error.message ? error.message : error}` };
    }
  };
}

/* Поддерживается классический script-тег из index.html и обращение window.HomeworkRenderer. */
if (typeof window !== 'undefined') window.HomeworkRenderer = HomeworkRenderer;
