/*
 * HomeworkRenderer
 *
 * One page with two modes:
 *  - «Домашнее задание»: next not-yet-finished occurrence of each subject/type
 *    for the signed-in user's subgroup.
 *  - «Материалы»: subject index assembled from the schedule and Firestore data,
 *    including both subgroups and historical entries stored on the server.
 *
 * DOM is built with createElement + appendChild. The renderer returns its root
 * synchronously; Firestore/cache content fills in asynchronously.
 */
class HomeworkRenderer {
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
    this._homeworkCache = new Map();
    this._completed = this._readCompleted();
  }

  /** Build and return the root DOM element. */
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

  /**
   * Pick the next not-yet-finished occurrence for each subject + lesson kind.
   * Including lesson kind in the key prevents a lecture from hiding a lab with
   * the same subject name (the bug that hid e.g. Saturday labs).
   */
  getUpcomingUniqueEvents(now = new Date(), filterToUserSubgroup = true) {
    const candidates = this.scheduleData
      .map((event) => {
        if (!event || !event.startTime || !event.endTime) return null;
        const start = HomeworkRenderer.toDate(event.startTime);
        const end = HomeworkRenderer.toDate(event.endTime);
        if (!start || !end || end <= start || end <= now) return null;
        if (filterToUserSubgroup && !HomeworkRenderer.isEventForSubgroup(event, HomeworkRenderer.getUserSubgroup())) return null;

        const details = HomeworkRenderer.getEventDetails(event);
        const subject = details.subject || 'Занятие без названия';
        const kind = HomeworkRenderer.getLessonKind(event);
        const subjectKey = HomeworkRenderer.normalize(subject);
        const subgroup = HomeworkRenderer.getEventSubgroup(event);

        return {
          event,
          start,
          end,
          subject,
          kind,
          kindName: HomeworkRenderer.getLessonKindName(kind),
          subgroup,
          subjectKey: `${kind}|${subjectKey}|${subgroup || 'all'}`,
          dateKey: HomeworkRenderer.formatDateKey(start),
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

  static toDate(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());

    // subjectTimestamp в Firestore — Unix seconds, а расписание содержит Date.
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
        // Use native parsing below.
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

  static dayName(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    return ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][value.getDay()];
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

  static normalize(value) {
    return String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU');
  }

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
      /\b(1|2)\s*(?:п\/г|подгрупп[аы]?|подгр\.?)/i,        // «1 подгруппа»
      /,\s*(1|2)(?:\s|$)/,                                  // короткий хвост «, 1»
    ];
    for (const pattern of patterns) {
      const marked = searchable.match(pattern);
      if (marked) return Number(marked[1]);
    }
    return null;
  }

  static getUserSubgroup() {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || 'null');
      const value = userData && (userData.userSubgroup || (userData.snapshot && userData.snapshot.userSubgroup));
      return Number(value) === 2 ? 2 : 1;
    } catch (_) {
      return 1;
    }
  }

  static isEventForSubgroup(event, subgroup) {
    const eventSubgroup = HomeworkRenderer.getEventSubgroup(event);
    return eventSubgroup === null || Number(eventSubgroup) === Number(subgroup);
  }

  static getEventTimestamp(event) {
    const start = HomeworkRenderer.toDate(event && event.startTime);
    return start ? Math.floor(start.getTime() / 1000) : null;
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

  _renderContent(now) {
    if (!this._listContainer) return;
    this._clearChildren(this._listContainer);
    if (this._selectedMode === 'materials') {
      this._renderMaterialsIndex();
    } else {
      this._renderHomeworkDays(now);
    }
  }

  _renderHomeworkDays(now) {
    const uniqueEvents = this.getUpcomingUniqueEvents(now, true);
    if (uniqueEvents.length === 0) {
      this._listContainer.appendChild(this._createEmptyMessage('В ближайшее время у вашей подгруппы нет пар.'));
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

  _createHomeworkItem(item) {
    // Wrapper отделяет строку занятия от сниппетов: сниппет занимает всю ширину
    // и не сжимает название/текст внутри горизонтальной карточки пары.
    const wrapper = document.createElement('div');
    wrapper.classList.add('homework-item-wrapper');

    const card = document.createElement('article');
    card.classList.add('homework-item', `homework-item--${item.kind}`);
    card.style.setProperty('--lesson-kind-color', HomeworkRenderer.getLessonColor(item.kind));
    card.dataset.kind = item.kind;

    const header = document.createElement('div');
    header.classList.add('homework-item-header');

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.classList.add('homework-item-open');
    openButton.title = 'Открыть информацию о занятии';
    openButton.addEventListener('click', () => this._navigate('lesson', item.event));

    const title = document.createElement('span');
    title.classList.add('homework-item-subject');
    title.textContent = item.subject;

    const meta = document.createElement('span');
    meta.classList.add('homework-item-meta');
    const subgroupText = item.subgroup ? ` · ${item.subgroup}-я подгруппа` : '';
    meta.textContent = `${item.kindName} · ${HomeworkRenderer.formatTime(item.start)}–${HomeworkRenderer.formatTime(item.end)}${subgroupText}`;

    openButton.appendChild(title);
    openButton.appendChild(meta);

    const status = document.createElement('div');
    status.classList.add('homework-status', 'homework-status--loading');
    status.title = 'Проверяем наличие домашнего задания';
    status.setAttribute('aria-live', 'polite');
    status.appendChild(this._createDot());

    header.appendChild(openButton);
    header.appendChild(status);
    card.appendChild(header);
    wrapper.appendChild(card);

    const postsContainer = document.createElement('div');
    postsContainer.classList.add('homework-assignment-list');
    wrapper.appendChild(postsContainer);

    const addButton = this._createAddButton(item.event, 'homework', 'Добавить ДЗ');
    addButton.classList.add('homework-add-button');
    wrapper.appendChild(addButton);

    this._loadEventContent(item.event, true).then((content) => {
      if (!wrapper.contains(status)) return;
      const homeworkPosts = HomeworkRenderer.buildPosts(content.texts, content.images, 'homework');
      this._drawCheckpoint(status, item.event, homeworkPosts.length > 0);
      this._clearChildren(postsContainer);

      if (homeworkPosts.length === 0) return;
      for (const post of homeworkPosts) {
        postsContainer.appendChild(this._createPostSnippet(item.event, post, 'homework'));
      }
    }).catch((error) => {
      console.warn('Не удалось загрузить домашнее задание пары:', error);
      if (wrapper.contains(status)) this._drawCheckpoint(status, item.event, false);
    });

    return wrapper;
  }

  _drawCheckpoint(status, event, hasHomework) {
    this._clearChildren(status);
    status.className = 'homework-status';

    if (!hasHomework) {
      status.classList.add('homework-status--empty');
      status.title = 'Домашнее задание не опубликовано';
      status.appendChild(this._createDot());
      return;
    }

    status.classList.add('homework-status--available');
    const key = this._eventStorageKey(event);
    const completed = this._completed.has(key);
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('homework-checkpoint');
    if (completed) button.classList.add('homework-checkpoint--completed');
    button.setAttribute('aria-pressed', String(completed));
    button.setAttribute('aria-label', completed ? 'Отметить ДЗ невыполненным' : 'Отметить ДЗ выполненным');
    button.title = completed ? 'ДЗ выполнено' : 'Отметить ДЗ выполненным';

    const mark = document.createElement('span');
    mark.classList.add('homework-checkpoint-mark');
    mark.textContent = completed ? '✓' : '';
    button.appendChild(mark);

    button.addEventListener('click', (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      if (this._completed.has(key)) this._completed.delete(key);
      else this._completed.add(key);
      this._writeCompleted();
      this._drawCheckpoint(status, event, true);
    });

    status.appendChild(button);
  }

  _createDot() {
    const dot = document.createElement('span');
    dot.classList.add('homework-status-dot');
    dot.setAttribute('aria-hidden', 'true');
    return dot;
  }

  async _renderMaterialsIndex() {
    const loading = document.createElement('p');
    loading.classList.add('homework-loading');
    loading.textContent = 'Загружаю список предметов…';
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
    const subjects = new Map();

    const addEvent = (event, sourceRecord = null) => {
      if (!event || !event.summary) return;
      const details = HomeworkRenderer.getEventDetails(event);
      const kind = HomeworkRenderer.getLessonKind(event);
      const key = `${kind}|${HomeworkRenderer.normalize(details.subject)}`;
      if (!subjects.has(key)) {
        subjects.set(key, {
          subject: details.subject || 'Занятие без названия',
          kind,
          kindName: HomeworkRenderer.getLessonKindName(kind),
          events: [],
          subgroups: new Set(),
          hasServerData: false,
        });
      }
      const item = subjects.get(key);
      const eventKey = HomeworkRenderer.eventIdentity(event);
      if (!item.events.some((saved) => HomeworkRenderer.eventIdentity(saved) === eventKey)) item.events.push(event);
      const subgroup = HomeworkRenderer.getEventSubgroup(event) || HomeworkRenderer.getRecordSubgroup(sourceRecord);
      if (subgroup) item.subgroups.add(subgroup);
      if (sourceRecord) item.hasServerData = true;
    };

    for (const event of this.scheduleData) addEvent(event);
    for (const record of texts) addEvent(HomeworkRenderer.eventFromRecord(record), record);
    for (const record of images) addEvent(HomeworkRenderer.eventFromRecord(record), record);

    if (subjects.size === 0) {
      this._listContainer.appendChild(this._createEmptyMessage('В расписании и материалах пока нет занятий.'));
      return;
    }

    const ordered = Array.from(subjects.values()).sort((a, b) => {
      const aStart = a.events.reduce((latest, event) => Math.max(latest, HomeworkRenderer.getEventTimestamp(event) || 0), 0);
      const bStart = b.events.reduce((latest, event) => Math.max(latest, HomeworkRenderer.getEventTimestamp(event) || 0), 0);
      return bStart - aStart;
    });

    const list = document.createElement('div');
    list.classList.add('materials-subject-list');
    for (const subject of ordered) {
      list.appendChild(this._createSubjectButton(subject));
    }
    this._listContainer.appendChild(list);
  }

  _createSubjectButton(subject) {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('materials-subject-button', `materials-subject-button--${subject.kind}`);
    button.style.setProperty('--lesson-kind-color', HomeworkRenderer.getLessonColor(subject.kind));

    const heading = document.createElement('span');
    heading.classList.add('materials-subject-title');
    heading.textContent = subject.subject;

    const meta = document.createElement('span');
    meta.classList.add('materials-subject-meta');
    const subgroups = Array.from(subject.subgroups).sort().map((value) => `${value}-я подгруппа`).join(', ');
    const occurrenceCount = subject.events.length;
    meta.textContent = `${subject.kindName} · ${occurrenceCount} ${HomeworkRenderer.lessonWord(occurrenceCount)}${subgroups ? ` · ${subgroups}` : ''}`;

    const arrow = document.createElement('span');
    arrow.classList.add('materials-subject-arrow');
    arrow.textContent = '›';

    button.appendChild(heading);
    button.appendChild(meta);
    button.appendChild(arrow);
    button.addEventListener('click', () => this._navigate('subject', {
      subject: subject.subject,
      kind: subject.kind,
      group: HomeworkRenderer.getCurrentGroup(),
    }));
    return button;
  }

  /** Read a single lesson's texts and image records (online or from IndexedDB). */
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

    const texts = HomeworkRenderer.getResultArray(textResult, 'texts').filter((text) =>
      String(text.subject || '').trim() === summary && forTargetSubgroup(text)
    );
    const images = HomeworkRenderer.getResultArray(imageResult, 'images').filter((image) =>
      String(image.subject || '').trim() === summary && forTargetSubgroup(image)
    );

    return { texts, images };
  }

  _createPostSnippet(event, post, type) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('homework-post');
    wrapper.classList.add(type === 'material' ? 'homework-post--material' : 'homework-post--homework');

    const disclosure = document.createElement('details');
    disclosure.classList.add('homework-post-details');

    const summary = document.createElement('summary');
    summary.classList.add('homework-post-snippet');
    const preview = String(post.textContent || '').trim().replace(/\s+/g, ' ');
    const previewText = document.createElement('span');
    previewText.classList.add('homework-post-snippet-text');
    previewText.textContent = preview
      ? (preview.length > 150 ? `${preview.slice(0, 150)}…` : preview)
      : `Прикреплено ${post.images.length} ${HomeworkRenderer.imageWord(post.images.length)}`;
    summary.appendChild(previewText);

    if (post.images.length > 0 && preview) {
      const imageCount = document.createElement('span');
      imageCount.classList.add('homework-post-image-count');
      imageCount.textContent = `📷 ${post.images.length}`;
      summary.appendChild(imageCount);
    }

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
          if (window.imageViewer) window.imageViewer.open(imageUrl);
          else window.openImageViewer && window.openImageViewer(imageUrl);
        });
        imageGrid.appendChild(image);
        if (window.contentCache) window.contentCache.cacheImage(imageUrl);
      });
      fullContent.appendChild(imageGrid);
    }

    const authorLine = document.createElement('span');
    authorLine.classList.add('homework-post-author');
    const date = post.timestamp ? new Date(Number(post.timestamp)) : null;
    authorLine.textContent = [post.author || 'Автор не указан', date && !Number.isNaN(date.getTime()) ? HomeworkRenderer.formatDate(date) : '']
      .filter(Boolean).join(' · ');
    fullContent.appendChild(authorLine);

    disclosure.appendChild(summary);
    disclosure.appendChild(fullContent);
    wrapper.appendChild(disclosure);

    const addButton = this._createAddButton(event, type, type === 'homework' ? 'Добавить ДЗ' : 'Добавить материал');
    addButton.classList.add('homework-post-add');
    wrapper.appendChild(addButton);
    return wrapper;
  }

  _createAddButton(event, type, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('materials-add-inline');
    button.textContent = label;
    button.addEventListener('click', (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
      this._navigate('addmatr', { event, fixedType: type });
    });
    return button;
  }

  static async renderLessonContents(event) {
    const renderer = new HomeworkRenderer([]);
    const root = document.createElement('div');
    root.classList.add('lesson-materials-content');
    const content = await renderer._loadEventContent(event, false);
    const groups = [
      { key: 'homework', title: 'Домашнее задание' },
      { key: 'material', title: 'Материалы' },
    ];

    for (const group of groups) {
      const section = document.createElement('section');
      section.classList.add('lesson-content-section', `lesson-content-section--${group.key}`);
      const heading = document.createElement('div');
      heading.classList.add('lesson-content-heading');
      const title = document.createElement('h2');
      title.textContent = group.title;
      const add = renderer._createAddButton(event, group.key, group.key === 'homework' ? '+' : '+');
      add.title = group.key === 'homework' ? 'Добавить домашнее задание' : 'Добавить материал';
      heading.appendChild(title);
      heading.appendChild(add);
      section.appendChild(heading);

      const posts = HomeworkRenderer.buildPosts(content.texts, content.images, group.key);
      if (posts.length === 0) {
        const empty = document.createElement('p');
        empty.classList.add('lesson-content-empty');
        empty.textContent = group.key === 'homework'
          ? 'К этому занятию пока не прикреплено домашнее задание.'
          : 'К этому занятию пока нет материалов.';
        section.appendChild(empty);
      } else {
        const postsContainer = document.createElement('div');
        postsContainer.classList.add('lesson-content-posts');
        posts.forEach((post) => postsContainer.appendChild(renderer._createPostSnippet(event, post, group.key)));
        section.appendChild(postsContainer);
      }
      root.appendChild(section);
    }
    return root;
  }

  static async renderSubjectPage(data, scheduleData) {
    const renderer = new HomeworkRenderer(Array.isArray(scheduleData) ? scheduleData : []);
    const root = document.createElement('div');
    root.classList.add('materials-subject-page');

    const subjectName = String((data && data.subject) || 'Предмет');
    const requestedKind = String((data && data.kind) || 'other');
    const group = String((data && data.group) || HomeworkRenderer.getCurrentGroup());

    const heading = document.createElement('div');
    heading.classList.add('materials-subject-page-header');
    const title = document.createElement('h2');
    title.textContent = subjectName;
    const description = document.createElement('p');
    description.textContent = 'Прошедшие занятия и публикации. Текущее занятие также отображается.';
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

    const addEvent = (event) => {
      if (!event || !event.startTime || !event.summary) return;
      const start = HomeworkRenderer.toDate(event.startTime);
      if (!start || start > new Date()) return; // не показываем будущие встречи;
      const details = HomeworkRenderer.getEventDetails(event);
      if (HomeworkRenderer.normalize(details.subject) !== HomeworkRenderer.normalize(subjectName)) return;
      if (requestedKind !== 'other' && HomeworkRenderer.getLessonKind(event) !== requestedKind) return;
      allEvents.set(HomeworkRenderer.eventIdentity(event), event);
    };

    renderer.scheduleData.forEach(addEvent);
    serverTexts.forEach((record) => addEvent(HomeworkRenderer.eventFromRecord(record)));
    serverImages.forEach((record) => addEvent(HomeworkRenderer.eventFromRecord(record)));

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
      list.appendChild(renderer._createOccurrenceCard(event, list));
    }
    root.appendChild(list);
    return root;
  }

  _createOccurrenceCard(event, ownerContainer) {
    const start = HomeworkRenderer.toDate(event.startTime);
    const end = HomeworkRenderer.toDate(event.endTime);
    const kind = HomeworkRenderer.getLessonKind(event);
    const details = HomeworkRenderer.getEventDetails(event);
    const subgroup = HomeworkRenderer.getEventSubgroup(event);

    const card = document.createElement('article');
    card.classList.add('materials-occurrence', `materials-occurrence--${kind}`);
    card.style.setProperty('--lesson-kind-color', HomeworkRenderer.getLessonColor(kind));

    const top = document.createElement('div');
    top.classList.add('materials-occurrence-top');
    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.classList.add('materials-occurrence-open');
    const name = document.createElement('span');
    name.classList.add('materials-occurrence-name');
    name.textContent = `${HomeworkRenderer.getLessonKindName(kind)} · ${HomeworkRenderer.formatDate(start)}`;
    const meta = document.createElement('span');
    meta.classList.add('materials-occurrence-meta');
    meta.textContent = `${HomeworkRenderer.formatTime(start)}${end ? `–${HomeworkRenderer.formatTime(end)}` : ''}${subgroup ? ` · ${subgroup}-я подгруппа` : ''}`;
    openButton.appendChild(name);
    openButton.appendChild(meta);
    openButton.addEventListener('click', () => this._navigate('lesson', event));

    const addHomework = this._createAddButton(event, 'homework', 'Добавить ДЗ');
    const addMaterial = this._createAddButton(event, 'material', 'Добавить материал');
    top.appendChild(openButton);
    top.appendChild(addHomework);
    top.appendChild(addMaterial);
    card.appendChild(top);

    const postsContainer = document.createElement('div');
    postsContainer.classList.add('materials-occurrence-posts');
    card.appendChild(postsContainer);

    this._loadEventContent(event, false).then((content) => {
      if (!ownerContainer.contains(card)) return;
      this._clearChildren(postsContainer);
      const materialPosts = HomeworkRenderer.buildPosts(content.texts, content.images, 'material');
      const homeworkPosts = HomeworkRenderer.buildPosts(content.texts, content.images, 'homework');
      materialPosts.forEach((post) => postsContainer.appendChild(this._createPostSnippet(event, post, 'material')));
      homeworkPosts.forEach((post) => postsContainer.appendChild(this._createPostSnippet(event, post, 'homework')));
    }).catch((error) => console.warn('Не удалось загрузить публикации пары:', error));

    return card;
  }

  static buildPosts(texts, images, type) {
    const groups = new Map();
    const getOrCreate = (key, record) => {
      if (!groups.has(key)) {
        groups.set(key, {
          postId: record.postId || key,
          textContent: '',
          author: record.author || '',
          userGroup: record.userGroup || '',
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
      post.userGroup = text.userGroup || post.userGroup;
      post.timestamp = Number(text.timestamp) || post.timestamp;
    });

    (Array.isArray(images) ? images : []).forEach((image, index) => {
      if (String(image.imageType || '') !== type) return;
      const key = image.postId || image.textId || `legacy-images-${type}`;
      const post = getOrCreate(key, image);
      post.images.push(image);
      post.author = image.author || post.author;
      post.timestamp = Number(image.timestamp) || post.timestamp;
    });

    return Array.from(groups.values())
      .filter((post) => post.textContent.trim() || post.images.length > 0)
      .sort((a, b) => b.timestamp - a.timestamp);
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

  static getCurrentGroup() {
    try {
      if (typeof CurrentGroup !== 'undefined' && CurrentGroup) return String(CurrentGroup);
    } catch (_) {}
    try {
      const data = JSON.parse(localStorage.getItem('userData') || 'null');
      return String((data && data.userGroup) || '');
    } catch (_) {
      return '';
    }
  }

  static eventFromRecord(record) {
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

  static eventIdentity(event) {
    const timestamp = HomeworkRenderer.getEventTimestamp(event) || 0;
    return `${timestamp}::${String((event && event.summary) || '').trim()}`;
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

// Поддерживается классический script-tag из index.html и обращение window.HomeworkRenderer.
if (typeof window !== 'undefined') window.HomeworkRenderer = HomeworkRenderer;
