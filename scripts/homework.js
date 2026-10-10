
// Отрисовка текущего домашнего задания
/*
 * HomeworkRenderer
 *
 * Builds a list of the next upcoming occurrence of every unique subject.
 * The renderer uses DOM elements + appendChild (no HTML string interpolation),
 * checks homework through the same database API as the lesson page, and stores
 * the user's completion checkpoints in localStorage.
 *
 * Usage:
 *   const renderer = new HomeworkRenderer(groupData[CurrentGroup]);
 *   homeworkContainer.appendChild(renderer.render());
 */
class HomeworkRenderer {
  constructor(events, options = {}) {
    this.scheduleData = Array.isArray(events) ? events : [];
    this.options = {
      refreshInterval: 60_000,
      retryDelay: 60_000,
      storageKeyPrefix: 'homework-checkpoints-v1',
      hasHomework: null,
      ...options,
    };

    this._root = null;
    this._refreshTimer = null;
    this._observer = null;
    this._hasBeenConnected = false;
    this._homeworkCache = new Map();
    this._completed = this._readCompleted();
  }

  /** Создаёт и возвращает корневой DOM-контейнер списка. */
  render() {
    this.destroy();
    this._hasBeenConnected = false;

    this._root = document.createElement('div');
    this._root.classList.add('homework-renderer');

    this._renderContent(new Date());
    this._observeRootRemoval();
    this._scheduleRefresh();

    return this._root;
  }

  /** Останавливает таймеры и наблюдатель, например, при ручном размонтировании. */
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
  }

  /**
   * Возвращает список ближайших ещё не завершившихся занятий: для каждого
   * названия предмета берётся только первое по времени вхождение.
   */
  getUpcomingUniqueEvents(now = new Date()) {
    const validEvents = this.scheduleData
      .map((event) => {
        if (!event || !event.startTime || !event.endTime) return null;

        const start = HomeworkRenderer.toDate(event.startTime);
        const end = HomeworkRenderer.toDate(event.endTime);
        if (!start || !end || end <= start || end <= now) return null;

        const subject = this._getSubject(event);
        const normalizedSubject = subject
          .normalize('NFKC')
          .replace(/\s+/g, ' ')
          .trim()
          .toLocaleLowerCase('ru-RU');

        return {
          event,
          start,
          end,
          subject: subject || 'Занятие без названия',
          subjectKey: normalizedSubject || this._getEventKey(event),
          dateKey: HomeworkRenderer.formatDateKey(start),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    const seenSubjects = new Set();
    const uniqueEvents = [];

    for (const item of validEvents) {
      if (seenSubjects.has(item.subjectKey)) continue;
      seenSubjects.add(item.subjectKey);
      uniqueEvents.push(item);
    }

    return uniqueEvents;
  }

  /** Преобразует Date, строку или timestamp в дату с учётом justifyDate проекта. */
  static toDate(value) {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    // Используем тот же нормализатор дат, что и ScheduleRenderer, если он есть.
    if (typeof justifyDate === 'function') {
      try {
        const justified = justifyDate(value);
        const date = justified instanceof Date ? justified : new Date(justified);
        if (!Number.isNaN(date.getTime())) return date;
      } catch (_) {
        // Переходим к обычному разбору даты.
      }
    }

    // Unix timestamp в секундах (если передан именно он, а не миллисекунды).
    if (typeof value === 'number' && Math.abs(value) < 100_000_000_000) {
      const secondsDate = new Date(value * 1000);
      return Number.isNaN(secondsDate.getTime()) ? null : secondsDate;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /** Ключ дня в локальном часовом поясе: YYYY-MM-DD. */
  static formatDateKey(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  _renderContent(now) {
    if (!this._root) return;
    this._clearChildren(this._root);

    const uniqueEvents = this.getUpcomingUniqueEvents(now);
    if (uniqueEvents.length === 0) {
      const emptyContainer = document.createElement('div');
      emptyContainer.classList.add('homework-empty');

      const message = document.createElement('p');
      message.textContent = 'В ближайшее время учебных занятий нет.';
      emptyContainer.appendChild(message);
      this._root.appendChild(emptyContainer);
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
    const hasRemainingToday = groups.some((group) => group.dateKey === todayKey);
    // Сегодня выделяется, пока в нём есть пары. После последней пары выделяется
    // первый следующий учебный день.
    const highlightedDateKey = hasRemainingToday ? todayKey : groups[0].dateKey;

    for (const group of groups) {
      this._root.appendChild(
        this._createDayElement(group, now, group.dateKey === highlightedDateKey)
      );
    }
  }

  _createDayElement(group, now, highlighted) {
    const dayContainer = document.createElement('section');
    dayContainer.classList.add('homework-day');
    if (highlighted) dayContainer.classList.add('homework-day--highlighted');
    dayContainer.dataset.date = group.dateKey;

    const header = document.createElement('div');
    header.classList.add('homework-day-header');
    if (highlighted) header.classList.add('homework-day-header--highlighted');

    const offset = HomeworkRenderer.daysBetween(now, group.date);
    const offsetLabel = document.createElement('span');
    offsetLabel.classList.add('homework-day-offset');
    offsetLabel.textContent = offset === 0
      ? 'Сегодня'
      : `Через ${offset} ${HomeworkRenderer.dayWord(offset)}`;
    offsetLabel.dataset.daysUntil = String(offset);

    const dateLabel = document.createElement('span');
    dateLabel.classList.add('homework-day-date');
    dateLabel.textContent = `${HomeworkRenderer.dayName(group.date)}, ${HomeworkRenderer.formatDate(group.date)}`;

    header.appendChild(offsetLabel);
    header.appendChild(dateLabel);
    dayContainer.appendChild(header);

    const eventsContainer = document.createElement('div');
    eventsContainer.classList.add('homework-day-events');

    for (const item of group.events) {
      eventsContainer.appendChild(this._createLessonElement(item));
    }

    dayContainer.appendChild(eventsContainer);
    return dayContainer;
  }

  _createLessonElement(item) {
    const card = document.createElement('article');
    card.classList.add('homework-item');

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.classList.add('homework-item-open');
    openButton.title = `Открыть материалы и домашнее задание: ${item.subject}`;

    const subject = document.createElement('span');
    subject.classList.add('homework-item-subject');
    subject.textContent = item.subject;

    const details = this._getEventDetails(item.event);
    const meta = document.createElement('span');
    meta.classList.add('homework-item-meta');

    const timeText = `${HomeworkRenderer.formatTime(item.start)}–${HomeworkRenderer.formatTime(item.end)}`;
    meta.textContent = details.type ? `${timeText} · ${details.type}` : timeText;

    openButton.appendChild(subject);
    openButton.appendChild(meta);
    openButton.addEventListener('click', () => this._openLesson(item.event));

    const status = document.createElement('div');
    status.classList.add('homework-status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-label', 'Статус домашнего задания');

    card.appendChild(openButton);
    card.appendChild(status);
    this._updateHomeworkStatus(item.event, status);

    return card;
  }

  _updateHomeworkStatus(event, statusElement) {
    const key = this._getEventKey(event);
    const cached = this._homeworkCache.get(key);

    if (cached && cached.state === 'loaded') {
      this._drawHomeworkStatus(statusElement, event, cached);
      return;
    }

    if (cached && cached.state === 'error' && Date.now() - cached.checkedAt < this.options.retryDelay) {
      this._drawHomeworkStatus(statusElement, event, cached);
      return;
    }

    this._drawHomeworkStatus(statusElement, event, { state: 'loading' });
    this._getHomeworkStatus(event).then((result) => {
      // Не обновляем уже удалённую карточку после следующего рендера.
      if (this._root && this._root.contains(statusElement)) {
        this._drawHomeworkStatus(statusElement, event, result);
      }
    });
  }

  _getHomeworkStatus(event) {
    const key = this._getEventKey(event);
    const cached = this._homeworkCache.get(key);

    if (cached && cached.state === 'loaded') return Promise.resolve(cached);
    if (cached && cached.state === 'loading') return cached.promise;
    if (cached && cached.state === 'error' && Date.now() - cached.checkedAt < this.options.retryDelay) {
      return Promise.resolve(cached);
    }

    const loadingEntry = {
      state: 'loading',
      checkedAt: Date.now(),
      promise: null,
    };

    loadingEntry.promise = this._queryHasHomework(event)
      .then((hasHomework) => {
        const result = hasHomework === null
          ? { state: 'error', checkedAt: Date.now() }
          : { state: 'loaded', hasHomework, checkedAt: Date.now() };
        this._homeworkCache.set(key, result);
        return result;
      })
      .catch((error) => {
        console.warn('Не удалось проверить наличие домашнего задания:', error);
        const result = { state: 'error', checkedAt: Date.now() };
        this._homeworkCache.set(key, result);
        return result;
      });

    this._homeworkCache.set(key, loadingEntry);
    return loadingEntry.promise;
  }

  async _queryHasHomework(event) {
    if (typeof this.options.hasHomework === 'function') {
      const result = await this.options.hasHomework(event);
      return typeof result === 'boolean' ? result : null;
    }

    if (typeof window === 'undefined') return null;

    try {
      if (window.auth && typeof window.auth.isAuthenticated === 'function' && !window.auth.isAuthenticated()) {
        return false;
      }

      if (!window.database || typeof window.database.getTexts !== 'function') return null;

      const start = HomeworkRenderer.toDate(event.startTime);
      if (!start) return null;
      const timestamp = Math.floor(start.getTime() / 1000);
      const response = await window.database.getTexts('subjectTimestamp', Number(timestamp));
      const texts = Array.isArray(response) ? response : response && response.texts;
      if (!Array.isArray(texts)) return null;

      const eventSummary = String(event.summary || '').trim();
      return texts.some((text) =>
        text &&
        String(text.subject || '').trim() === eventSummary &&
        String(text.textType || '').toLocaleLowerCase('ru-RU') === 'homework'
      );
    } catch (error) {
      console.warn('Ошибка при загрузке домашнего задания:', error);
      return null;
    }
  }

  _drawHomeworkStatus(statusElement, event, result) {
    this._clearChildren(statusElement);
    statusElement.className = 'homework-status';

    if (result.state === 'loading') {
      statusElement.classList.add('homework-status--loading');
      statusElement.title = 'Проверяем наличие домашнего задания';
      statusElement.appendChild(this._createStatusDot());
      return;
    }

    if (result.state === 'error') {
      statusElement.classList.add('homework-status--error');
      statusElement.title = 'Не удалось проверить наличие домашнего задания';
      statusElement.appendChild(this._createStatusDot());
      return;
    }

    if (!result.hasHomework) {
      statusElement.classList.add('homework-status--empty');
      statusElement.title = 'Домашнее задание не опубликовано';
      statusElement.appendChild(this._createStatusDot());
      return;
    }

    statusElement.classList.add('homework-status--available');
    const eventKey = this._getEventKey(event);
    const completed = this._completed.has(eventKey);

    const checkpoint = document.createElement('button');
    checkpoint.type = 'button';
    checkpoint.classList.add('homework-checkpoint');
    if (completed) checkpoint.classList.add('homework-checkpoint--completed');
    checkpoint.setAttribute('aria-pressed', String(completed));
    checkpoint.setAttribute(
      'aria-label',
      completed ? 'Отметить домашнее задание невыполненным' : 'Отметить домашнее задание выполненным'
    );
    checkpoint.title = completed ? 'Домашнее задание выполнено' : 'Отметить домашнее задание выполненным';

    const checkmark = document.createElement('span');
    checkmark.classList.add('homework-checkpoint-mark');
    checkmark.textContent = completed ? '✓' : '';
    checkpoint.appendChild(checkmark);

    checkpoint.addEventListener('click', (clickEvent) => {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();

      if (this._completed.has(eventKey)) {
        this._completed.delete(eventKey);
      } else {
        this._completed.add(eventKey);
      }
      this._writeCompleted();
      this._drawHomeworkStatus(statusElement, event, {
        state: 'loaded',
        hasHomework: true,
      });
    });

    statusElement.appendChild(checkpoint);
  }

  _createStatusDot() {
    const dot = document.createElement('span');
    dot.classList.add('homework-status-dot');
    dot.setAttribute('aria-hidden', 'true');
    return dot;
  }

  _getEventDetails(event) {
    let extracted = {};
    if (typeof ScheduleRenderer !== 'undefined' && ScheduleRenderer &&
        typeof ScheduleRenderer.extractElementData === 'function') {
      try {
        extracted = ScheduleRenderer.extractElementData(event) || {};
      } catch (_) {
        extracted = {};
      }
    }

    return {
      subject: String(extracted.subject || this._extractSubjectFromSummary(event.summary) || ''),
      type: String(extracted.name || ''),
    };
  }

  _getSubject(event) {
    const details = this._getEventDetails(event);
    return details.subject.trim() || this._extractSubjectFromSummary(event && event.summary);
  }

  _extractSubjectFromSummary(summary) {
    const text = String(summary || '').trim();
    if (!text) return '';

    // Формат совпадает с тем, который разбирает ScheduleRenderer:
    // «лек. Название предмета (тип), подгруппа».
    const match = text.match(/ (.*?)(?=\(|,[^,]*$|$)/);
    return match && match[1] ? match[1].trim() : text;
  }

  _getEventKey(event) {
    const start = HomeworkRenderer.toDate(event && event.startTime);
    const timestamp = start ? Math.floor(start.getTime() / 1000) : 'no-time';
    const summary = String((event && event.summary) || this._getSubject(event) || 'lesson').trim();
    return `${timestamp}::${summary}`;
  }

  async _openLesson(event) {
    const navigator = typeof window !== 'undefined' && typeof window.navigateTo === 'function'
      ? window.navigateTo
      : (typeof navigateTo === 'function' ? navigateTo : null);

    if (!navigator) {
      console.warn('Функция navigateTo не найдена: невозможно открыть занятие.');
      return;
    }

    try {
      await navigator('lesson', event);
    } catch (error) {
      console.warn('Не удалось открыть занятие:', error);
    }
  }

  _readCompleted() {
    if (typeof window === 'undefined' || !window.localStorage) return new Set();
    try {
      const raw = window.localStorage.getItem(this._getStorageKey());
      if (!raw) return new Set();
      const value = JSON.parse(raw);
      return new Set(Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []);
    } catch (error) {
      console.warn('Не удалось прочитать локальные отметки домашних заданий:', error);
      return new Set();
    }
  }

  _writeCompleted() {
    try {
      window.localStorage.setItem(this._getStorageKey(), JSON.stringify(Array.from(this._completed)));
    } catch (error) {
      console.warn('Не удалось сохранить локальные отметки домашних заданий:', error);
    }
  }

  _getStorageKey() {
    if (this.options.storageKey) return this.options.storageKey;
    return `${this.options.storageKeyPrefix}:${this._getStorageScope()}`;
  }

  _getStorageScope() {
    try {
      if (window.auth && typeof window.auth.getCurrentUser === 'function') {
        const user = window.auth.getCurrentUser();
        if (user && user.uid) return `user-${encodeURIComponent(user.uid)}`;
      }
    } catch (_) {
      // Перейдём к данным локального профиля.
    }

    try {
      const userData = JSON.parse(window.localStorage.getItem('userData') || 'null');
      const userGroup = userData && (
        userData.snapshot && userData.snapshot.userGroup
          ? userData.snapshot.userGroup
          : userData.userGroup
      );
      if (userGroup) return `group-${encodeURIComponent(userGroup)}`;
    } catch (_) {
      // Используем общий локальный scope.
    }

    try {
      if (typeof CurrentGroup !== 'undefined' && CurrentGroup) {
        return `group-${encodeURIComponent(CurrentGroup)}`;
      }
    } catch (_) {
      // CurrentGroup может отсутствовать на отдельных страницах.
    }

    return 'default';
  }

  _observeRootRemoval() {
    if (typeof MutationObserver !== 'function' || !document.documentElement) return;

    this._observer = new MutationObserver(() => {
      if (!this._root) return;
      if (this._root.isConnected) {
        this._hasBeenConnected = true;
      } else if (this._hasBeenConnected) {
        this.destroy();
      }
    });

    this._observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  _scheduleRefresh() {
    if (!this._root) return;
    if (this._refreshTimer !== null) clearTimeout(this._refreshTimer);

    const now = new Date();
    let delay = Math.max(1_000, Number(this.options.refreshInterval) || 60_000);

    // Перерисовываемся вскоре после начала/окончания пары и обязательно в полночь.
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

      if (this._root.isConnected) {
        this._hasBeenConnected = true;
      } else if (this._hasBeenConnected) {
        this.destroy();
        return;
      }

      this._renderContent(new Date());
      this._scheduleRefresh();
    }, delay);
  }

  _clearChildren(element) {
    while (element && element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  static formatDate(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}.${month}.${year}`;
  }

  static formatTime(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  static dayName(date) {
    const value = HomeworkRenderer.toDate(date);
    if (!value) return '';
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[value.getDay()];
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
    const abs = Math.abs(number);
    const lastTwo = abs % 100;
    const last = abs % 10;
    if (lastTwo >= 11 && lastTwo <= 14) return 'дней';
    if (last === 1) return 'день';
    if (last >= 2 && last <= 4) return 'дня';
    return 'дней';
  }
}

// Удобно для обычных (не module) script-тегов и вызова из UI-кода.
if (typeof window !== 'undefined') {
  window.HomeworkRenderer = HomeworkRenderer;
}
