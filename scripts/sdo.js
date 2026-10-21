/* ============================================================================================
 * СДО КГУ (Moodle) — клиент веб-сервисов и интерфейс вкладки
 * --------------------------------------------------------------------------------------------
 * • Авторизация: POST /login/token.php (service=moodle_mobile_app), данные — только form-urlencoded,
 *   чтобы запрос оставался «простым» и не требовал предварительного CORS-запроса (preflight).
 * • Все вызовы: POST /webservice/rest/server.php с wstoken, wsfunction, moodlewsrestformat=json.
 * • Логин и пароль хранятся ТОЛЬКО на этом устройстве (localStorage) и никуда, кроме СДО КГУ,
 *   не передаются. Отдельный вход нужен на каждом устройстве — так и задумано.
 * • Никакой периодической синхронизации: запросы идут только когда пользователь открыл вкладку
 *   или страницу курса/задания.
 * • Администрирования СДО здесь нет — только права обычного студента.
 * ========================================================================================== */

const SDO_BASE_URL = 'https://sdo.kosgos.ru';
const SDO_SERVICE = 'moodle_mobile_app';
const SDO_CREDENTIALS_KEY = 'sdoCredentials';   // { username, password } — только это устройство
const SDO_SESSION_KEY = 'sdoSession';           // { token, privatetoken, user, functions, savedAt }
const SDO_COURSES_KEY = 'sdoCourses';           // последний удачный список курсов (для офлайна)
const SDO_CACHE_TTL = 10 * 60 * 1000;           // 10 минут — курсы и дедлайны не запрашиваем чаще

/* ------------------------------------- Мелкие помощники ------------------------------------- */

function sdoEscape(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ✓ Мягкое приведение HTML из СДО к безопасному тексту: переносы строк и ссылки сохраняем,
//   всё остальное — только текст (никаких чужих скриптов и стилей в разметке приложения).
function sdoHtmlToText(html) {
  const source = String(html || '');
  if (!source.trim()) return '';
  const holder = document.createElement('div');
  holder.innerHTML = source
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  Array.from(holder.querySelectorAll('a')).forEach((link) => {
    const href = link.getAttribute('href') || '';
    const text = (link.textContent || '').trim() || href;
    const safe = document.createElement('span');
    safe.textContent = text;
    if (/^https?:\/\//i.test(href)) {
      safe.className = 'sdo-inline-link';
      safe.dataset.sdoLink = href;
      safe.title = href;
    }
    link.replaceWith(safe);
  });
  Array.from(holder.querySelectorAll('br')).forEach((br) => br.replaceWith(document.createTextNode('\n')));
  Array.from(holder.querySelectorAll('p, div, li, h1, h2, h3, h4, tr')).forEach((node) => {
    node.appendChild(document.createTextNode('\n'));
  });
  const text = holder.textContent || '';
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// ✓ Ссылки внутри преобразованного текста делаем кликабельными (открываются в браузере)
function sdoBindInlineLinks(root) {
  if (!root) return;
  Array.from(root.querySelectorAll('.sdo-inline-link')).forEach((node) => {
    if (node.dataset.sdoBound === 'true') return;
    node.dataset.sdoBound = 'true';
    node.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (typeof openLink === 'function') openLink(node.dataset.sdoLink);
      else window.open(node.dataset.sdoLink, '_blank');
    });
  });
}

function sdoFormatDate(timestamp) {
  const value = Number(timestamp);
  if (!value) return '';
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function sdoFormatDateTime(timestamp) {
  const value = Number(timestamp);
  if (!value) return '';
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ✓ «через 2 дня», «сегодня, 18:00», «просрочено 3 дня назад»
function sdoFormatDeadline(timestamp) {
  const value = Number(timestamp);
  if (!value) return 'без срока';
  const now = Date.now();
  const diff = value * 1000 - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  if (diff < 0) {
    const pastDays = Math.abs(days);
    if (pastDays >= 1) return `просрочено ${pastDays} ${SDOText.plural(pastDays, 'день', 'дня', 'дней')} назад`;
    const pastHours = Math.max(1, Math.abs(hours));
    return `просрочено ${pastHours} ${SDOText.plural(pastHours, 'час', 'часа', 'часов')} назад`;
  }
  if (minutes < 60) return `через ${Math.max(1, minutes)} ${SDOText.plural(Math.max(1, minutes), 'минуту', 'минуты', 'минут')}`;
  if (hours < 24) return `через ${hours} ${SDOText.plural(hours, 'час', 'часа', 'часов')}`;
  if (days === 1) return `завтра, ${sdoFormatDateTime(value).split(', ')[1]}`;
  if (days < 7) return `через ${days} ${SDOText.plural(days, 'день', 'дня', 'дней')}`;
  return sdoFormatDate(value);
}

// ✓ Коды и тексты ошибок СДО — объясняем их по-русски, а не «как пришло из Moodle»
const SDO_ERROR_TEXT = [
  ['invalidlogin', 'Неверный логин или пароль СДО'],
  ['invalidusername', 'Неверный логин или пароль СДО'],
  ['wrongpassword', 'Неверный логин или пароль СДО'],
  ['cannotcreatetoken', 'СДО не выдаёт токен для этого способа входа. Если вы заходите через ЭИОС, войдите логином и паролем, выданными именно в СДО'],
  ['enablewsdescription', 'На сервере СДО отключены веб-службы — вход из приложения невозможен'],
  ['servicenotavailable', 'Сервис СДО для мобильных приложений недоступен'],
  ['sitemaintenance', 'СДО КГУ временно недоступно — идут технические работы'],
  ['usernotconfirmed', 'Учётная запись СДО не подтверждена'],
  ['userautherror', 'СДО не смогло подтвердить учётную запись'],
  ['invalidtoken', 'Сессия СДО истекла'],
  ['accessexception', 'У этой учётной записи нет доступа к веб-службам СДО'],
  ['iprestriction', 'Доступ к СДО с этого адреса запрещён администратором'],
  ['passwordpolicy', 'Пароль СДО не принят — возможно, его нужно сменить на сайте СДО'],
  ['forcelogin', 'СДО требует вход через браузер'],
];

/** Разобрать ошибку СДО: вернуть русский текст и, если есть, исходный код ошибки. */
function sdoExplainError(payload, fallback) {
  const data = payload || {};
  const code = String(data.errorcode || data.exception || '').toLowerCase();
  const raw = [data.error, data.message, data.debuginfo].filter(Boolean).map((item) => String(item)).join(' ');
  let known = SDO_ERROR_TEXT.find(([key]) => code === key || raw.toLowerCase().includes(key));
  if (!known && /not supported by login\/token/i.test(raw)) {
    known = SDO_ERROR_TEXT.find(([key]) => key === 'cannotcreatetoken');
  }
  const base = known ? known[1] : (raw || fallback || 'СДО вернуло ошибку');
  return { message: base, code: code || (known ? known[0] : '') };
}

const SDOText = {
  plural(number, one, few, many) {
    const value = Math.abs(number) % 100;
    const last = value % 10;
    if (value > 10 && value < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  },
};

function sdoFileSize(bytes) {
  const value = Number(bytes);
  if (!value) return '';
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} КБ`;
  return `${(value / (1024 * 1024)).toFixed(1)} МБ`;
}

// ✓ Тип элемента курса — человеческим языком и с понятной иконкой
const SDO_MODULE_KIND = {
  assign: { label: 'Задание', icon: '📝' },
  resource: { label: 'Файл', icon: '📄' },
  url: { label: 'Ссылка', icon: '🔗' },
  page: { label: 'Страница', icon: '📃' },
  folder: { label: 'Папка', icon: '📁' },
  quiz: { label: 'Тест', icon: '🧩' },
  forum: { label: 'Форум', icon: '💬' },
  book: { label: 'Книга', icon: '📚' },
  choice: { label: 'Опрос', icon: '📊' },
  feedback: { label: 'Анкета', icon: '📋' },
  lesson: { label: 'Урок', icon: '🎓' },
  label: { label: 'Подпись', icon: '🏷' },
  scorm: { label: 'Курс SCORM', icon: '🗂' },
  lti: { label: 'Внешний инструмент', icon: '🧰' },
  chat: { label: 'Чат', icon: '💬' },
  workshop: { label: 'Семинар', icon: '🛠' },
  data: { label: 'База данных', icon: '🗄' },
  glossary: { label: 'Глоссарий', icon: '📖' },
  attendance: { label: 'Посещаемость', icon: '✅' },
  bigbluebuttonbn: { label: 'Конференция', icon: '🎥' },
  zoom: { label: 'Конференция', icon: '🎥' },
  h5pactivity: { label: 'H5P', icon: '🎮' },
};

function sdoModuleKind(modName) {
  return SDO_MODULE_KIND[String(modName || '').toLowerCase()] || { label: String(modName || 'Элемент'), icon: '📌' };
}

/* ============================ Клиент веб-сервисов СДО (Moodle) ============================ */

class SDOClient {
  /* ------------------------------ Состояние ------------------------------ */

  static state = {
    token: '',
    user: null,
    functions: [],
    courses: [],
    ready: false,
    error: '',
    loading: false,
    promise: null,
    deadlines: [],
    deadlinesLoaded: false,
    lastSync: 0,
    coursesByClass: {},          // кэш курсов по подборкам (Все / Текущие / …)
    activeClassification: 'all',
  };

  static listeners = new Set();

  static onChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  static emit() {
    this.listeners.forEach((listener) => {
      try { listener(this.state); } catch (err) { console.warn('[СДО] слушатель упал:', err); }
    });
  }

  /* ------------------------------ Хранилище ------------------------------ */

  static readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (_) { return fallback; }
  }

  static writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; }
  }

  static credentials() {
    const saved = this.readJson(SDO_CREDENTIALS_KEY, {});
    return {
      username: String(saved.username || ''),
      password: String(saved.password || ''),
    };
  }

  static hasCredentials() {
    const saved = this.credentials();
    return Boolean(saved.username && saved.password);
  }

  static saveCredentials(username, password) {
    this.writeJson(SDO_CREDENTIALS_KEY, { username: String(username || '').trim(), password: String(password || '') });
  }

  static forget() {
    try {
      localStorage.removeItem(SDO_CREDENTIALS_KEY);
      localStorage.removeItem(SDO_SESSION_KEY);
      localStorage.removeItem(SDO_COURSES_KEY);
    } catch (_) { /* хранилище недоступно — просто работаем дальше */ }
    this.state.token = '';
    this.state.user = null;
    this.state.functions = [];
    this.state.courses = [];
    this.state.coursesByClass = {};
    this.state.activeClassification = 'all';
    this.state.ready = false;
    this.state.error = '';
    this.state.deadlines = [];
    this.state.deadlinesLoaded = false;
    this.state.promise = null;
    this.emit();
  }

  static restoreSession() {
    const saved = this.readJson(SDO_SESSION_KEY, null);
    if (saved && saved.token) {
      this.state.token = String(saved.token);
      this.state.privatetoken = String(saved.privatetoken || '');
      this.state.user = saved.user || null;
      this.state.functions = Array.isArray(saved.functions) ? saved.functions : [];
      return true;
    }
    return false;
  }

  static saveSession() {
    this.writeJson(SDO_SESSION_KEY, {
      token: this.state.token,
      privatetoken: this.state.privatetoken || '',
      user: this.state.user,
      functions: this.state.functions,
      savedAt: Date.now(),
    });
  }

  /* ------------------------------ Сеть ------------------------------ */

  static get offline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }

  /**
   * Один вызов веб-сервиса СДО.
   * Только application/x-www-form-urlencoded: такой запрос не требует preflight,
   * поэтому шансов пройти CORS заметно больше.
   */
  static async call(wsfunction, params = {}, options = {}) {
    if (this.offline) {
      return { success: false, offline: true, message: 'Нет подключения к интернету' };
    }
    const body = new URLSearchParams();
    body.set('wstoken', this.state.token || '');
    body.set('wsfunction', wsfunction);
    body.set('moodlewsrestformat', 'json');
    Object.keys(params || {}).forEach((key) => SDOClient.appendParam(body, key, params[key]));

    let response;
    try {
      response = await (window.fetchWithTimeout || window.fetch.bind(window))(`${SDO_BASE_URL}/webservice/rest/server.php`, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        mode: 'cors',
        timeout: 15000,
      });
    } catch (error) {
      return { success: false, network: true, message: `СДО не отвечает (${error && error.message ? error.message : 'сеть недоступна'})` };
    }

    const raw = await response.text().catch(() => '');
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = null; }

    if (!data) {
      return {
        success: false,
        http: response.status,
        message: response.status === 0 || response.status >= 400
          ? `СДО ответило кодом ${response.status} (частая причина — запрет CORS или блокировка по региону)`
          : 'СДО вернуло непонятный ответ',
      };
    }
    if (data.exception || data.errorcode) {
      const code = String(data.errorcode || data.exception || '');
      const explained = sdoExplainError(data, 'СДО вернуло ошибку');
      const message = explained.message;
      // ✓ Токен протух — пробуем один раз перелогиниться сохранёнными данными
      if (code === 'invalidtoken' && options.retry !== false && this.hasCredentials()) {
        const relogin = await this.login();
        if (relogin.success) return this.call(wsfunction, params, { ...options, retry: false });
        this.forget();
        return { success: false, expired: true, message: 'Сессия СДО закончилась — войдите заново' };
      }
      return { success: false, code, message };
    }
    return { success: true, data };
  }

  // ✓ Moodle любит параметры-массивы вида options[ids][0]
  static appendParam(body, key, value) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => this.appendParam(body, `${key}[${index}]`, item));
      return;
    }
    if (typeof value === 'object') {
      Object.keys(value).forEach((child) => this.appendParam(body, `${key}[${child}]`, value[child]));
      return;
    }
    body.append(key, String(value));
  }

  /** Вход в СДО: получаем токен и сразу узнаём, кто это и какие функции доступны. */
  static async login(username, password) {
    const credentials = username && password
      ? { username: String(username).trim(), password: String(password) }
      : this.credentials();
    if (!credentials.username || !credentials.password) {
      return { success: false, message: 'Укажите логин и пароль от СДО' };
    }
    if (this.offline) {
      return { success: false, offline: true, message: 'Нет подключения к интернету' };
    }

    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);
    body.set('service', SDO_SERVICE);

    let response;
    try {
      response = await (window.fetchWithTimeout || window.fetch.bind(window))(`${SDO_BASE_URL}/login/token.php`, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        mode: 'cors',
        timeout: 15000,
      });
    } catch (error) {
      return { success: false, network: true, message: `СДО не отвечает (${error && error.message ? error.message : 'сеть недоступна'})` };
    }

    const raw = await response.text().catch(() => '');
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = null; }

    if (!data) {
      return {
        success: false,
        http: response.status,
        message: response.status === 404
          ? 'СДО ответило 404: на сервере отключён вход по токену (login/token.php)'
          : `СДО ответило кодом ${response.status} (частая причина — запрет CORS или блокировка по региону)`,
      };
    }
    if (data.error || data.errorcode || data.exception) {
      const explained = sdoExplainError(data, 'Не удалось войти в СДО');
      return { success: false, code: explained.code, message: explained.message };
    }
    if (!data.token) {
      return { success: false, message: 'СДО не выдало токен. Проверьте логин и пароль' };
    }

    this.state.token = String(data.token);
    this.state.privatetoken = String(data.privatetoken || '');
    this.state.error = '';
    if (username && password) this.saveCredentials(credentials.username, credentials.password);

    const info = await this.call('core_webservice_get_site_info', {}, { retry: false });
    if (info.success && info.data) {
      this.state.user = {
        userId: info.data.userid,
        fullName: info.data.fullname,
        siteName: info.data.sitename,
        siteUrl: info.data.siteurl,
        userPictureUrl: info.data.userpictureurl,
      };
      this.state.functions = Array.isArray(info.data.functions)
        ? info.data.functions.map((item) => String(item.name || ''))
        : [];
      this.state.ready = true;
      this.saveSession();
      this.emit();
      return { success: true, user: this.state.user, message: `Вы вошли как ${this.state.user.fullName}` };
    }

    // ✓ Токен получен, но сервис не отдаёт информацию о пользователе — всё равно считаем вход успешным
    this.state.ready = true;
    this.saveSession();
    this.emit();
    return { success: true, user: this.state.user, message: 'Вход выполнен' };
  }

  /**
   * Гарантировать рабочую сессию СДО: берем сохранённый токен, при необходимости
   * автоматически логинимся сохранёнными логином и паролем.
   */
  static async ensureSession(options = {}) {
    if (this.state.ready && this.state.token) return { success: true, user: this.state.user, message: 'Сессия СДО активна' };
    if (this.state.promise) return this.state.promise;

    const force = options.force === true;
    if (!force) this.restoreSession();

    const run = async () => {
      if (this.state.token && !force) {
        const info = await this.call('core_webservice_get_site_info', {}, { retry: false });
        if (info.success && info.data) {
          this.state.user = {
            userId: info.data.userid,
            fullName: info.data.fullname,
            siteName: info.data.sitename,
            siteUrl: info.data.siteurl,
            userPictureUrl: info.data.userpictureurl,
          };
          this.state.functions = Array.isArray(info.data.functions)
            ? info.data.functions.map((item) => String(item.name || ''))
            : [];
          this.state.ready = true;
          this.state.error = '';
          this.saveSession();
          this.emit();
          return { success: true, user: this.state.user, message: 'Сессия СДО активна' };
        }
        if (info.network || info.offline || info.http) {
          this.state.promise = null;
          return { success: false, ...info };
        }
      }
      if (!this.hasCredentials()) {
        this.state.promise = null;
        return { success: false, needLogin: true, message: 'Нужно войти в СДО' };
      }
      const result = await this.login();
      this.state.promise = null;
      return result;
    };

    this.state.promise = run();
    return this.state.promise;
  }

  static hasFunction(name) {
    if (!Array.isArray(this.state.functions) || this.state.functions.length === 0) return true;
    return this.state.functions.includes(name);
  }

  /**
   * Ссылка на файл СДО, пригодная для открытия в браузере.
   * Web-сервис отдаёт файлы по адресу /webservice/pluginfile.php — такому адресу
   * нужен токен, иначе браузер покажет «необходимо войти».
   */
  static fileUrl(url) {
    const text = String(url || '');
    if (!text) return '';
    if (!/webservice\/pluginfile\.php/i.test(text)) return text;
    if (/[?&]token=/.test(text) || !this.state.token) return text;
    return `${text}${text.includes('?') ? '&' : '?'}token=${encodeURIComponent(this.state.token)}`;
  }

  /* ------------------------------ Данные ------------------------------ */

  // ✓ Те же подборки, что на странице «Мои курсы» в СДО
  static CLASSIFICATIONS = [
    { id: 'all', label: 'Все' },
    { id: 'inprogress', label: 'Текущие' },
    { id: 'future', label: 'Предстоящие' },
    { id: 'past', label: 'Прошедшие' },
    { id: 'favourite', label: 'Помеченные' },
    { id: 'hidden', label: 'Скрытые' },
  ];

  /**
   * Список курсов пользователя.
   * classification — подборка: all / inprogress / future / past / favourite / hidden (как в СДО).
   * Сначала пробуем «классификацию» (точно такой же запрос делает страница «Мои курсы»),
   * при неудаче — общий список курсов пользователя.
   */
  static async getCourses(options = {}) {
    const settings = options || {};
    const classification = String(settings.classification || 'all');
    const force = settings.force === true;

    if (!force && this.state.coursesByClass[classification]) {
      this.state.courses = this.state.coursesByClass[classification];
      return { success: true, courses: this.state.courses, cached: true };
    }

    const session = await this.ensureSession();
    if (!session.success) return session;

    const userId = this.state.user && this.state.user.userId ? this.state.user.userId : 0;
    let list = null;
    let failure = null;

    // ✓ Основной путь: постраничный запрос по подборке (limit=0 в разных версиях
    //   Moodle понимается по-разному, поэтому листаем страницами по 50 курсов)
    if (this.hasFunction('core_course_get_enrolled_courses_by_timeline_classification')) {
      let offset = 0;
      let collected = [];
      for (let page = 0; page < 12; page += 1) {
        /* eslint-disable no-await-in-loop */
        const response = await this.call('core_course_get_enrolled_courses_by_timeline_classification', {
          classification,
          offset,
          limit: 50,
          sort: 'fullname',
        });
        if (!response || !response.success) { failure = response; break; }
        const chunk = Array.isArray(response.data)
          ? response.data
          : (response.data && Array.isArray(response.data.courses) ? response.data.courses : []);
        collected = collected.concat(chunk);
        const next = response.data && Number(response.data.nextoffset);
        if (chunk.length === 0 || !next || next <= offset) break;
        offset = next;
      }
      if (collected.length > 0) list = collected;
    }

    // ✓ Резервный путь: полный список курсов пользователя
    if (!list && userId && this.hasFunction('core_enrol_get_users_courses')) {
      const response = await this.call('core_enrol_get_users_courses', { userid: userId });
      if (response && response.success && Array.isArray(response.data)) list = response.data;
      else if (response && !response.success) failure = response;
    }

    if (!list) {
      const cached = this.readJson(SDO_COURSES_KEY, []);
      if (Array.isArray(cached) && cached.length) {
        this.state.courses = cached;
        return { success: true, courses: cached, cached: true };
      }
      return { success: false, message: failure && failure.message ? failure.message : 'Не удалось получить курсы' };
    }

    const courses = list
      .map((course) => ({
        id: Number(course.id),
        shortName: String(course.shortname || ''),
        fullName: String(course.fullname || 'Курс без названия'),
        category: String(course.categoryname || course.category || ''),
        summary: String(course.summary || ''),
        progress: course.progress === null || course.progress === undefined ? null : Number(course.progress),
        hasProgress: course.hasprogress !== undefined ? Boolean(course.hasprogress) : null,
        startDate: Number(course.startdate) || 0,
        endDate: Number(course.enddate) || 0,
        lastAccess: Number(course.lastaccess) || 0,
        favourite: Boolean(course.isfavourite),
        hidden: Boolean(course.hidden),
        courseUrl: `${SDO_BASE_URL}/course/view.php?id=${course.id}`,
        // ✓ Нормализованное имя — по нему ищем курс по названию предмета из расписания
        key: SDOClient.normalizeName(course.fullname || course.shortname || ''),
      }))
      .filter((course) => course.id)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));

    this.state.coursesByClass[classification] = courses;
    this.state.activeClassification = classification;
    this.state.courses = courses;
    this.state.lastSync = Date.now();
    if (classification === 'all') this.writeJson(SDO_COURSES_KEY, courses);
    return { success: true, courses };
  }

  /** События календаря СДО (сроки сдачи тестов, вебинаров и других активностей). */
  static async getCalendarEvents() {
    if (!this.hasFunction('core_calendar_get_calendar_upcoming_view')) return [];
    try {
      const result = await this.call('core_calendar_get_calendar_upcoming_view', { courseid: 0, limit: 40 });
      if (!result || !result.success) return [];
      const events = result.data && Array.isArray(result.data.events) ? result.data.events : [];
      const names = {};
      (this.state.courses || []).forEach((course) => { names[course.id] = course.fullName; });
      return events
        .filter((event) => String(event.modulename || '') && Number(event.timestart))
        .map((event) => {
          const courseId = Number(event.courseid) || 0;
          return {
            courseId,
            courseName: names[courseId] || '',
            courseKey: SDOClient.normalizeName(names[courseId] || ''),
            assignId: 0,
            cmid: Number(event.instance) || 0,
            name: String(event.name || 'Событие'),
            dueDate: Number(event.timestart) || 0,
            source: 'calendar',
            moduleName: String(event.modulename || ''),
            eventType: String(event.eventtype || ''),
            url: courseId ? `${SDO_BASE_URL}/course/view.php?id=${courseId}` : '',
          };
        });
    } catch (_) { return []; }
  }

  /** Содержимое курса: разделы и элементы. */
  static async getCourseContents(courseId) {
    const cached = this.readJson(`sdoContents_${courseId}`, null);
    const fresh = cached && (Date.now() - Number(cached.at || 0) < SDO_CACHE_TTL);
    if (fresh && Array.isArray(cached.sections)) return { success: true, sections: cached.sections, cached: true };

    const session = await this.ensureSession();
    if (!session.success) return session;

    const result = await this.call('core_course_get_contents', { courseid: Number(courseId) });
    if (!result || !result.success) {
      if (cached && Array.isArray(cached.sections)) return { success: true, sections: cached.sections, cached: true, stale: true };
      return { success: false, message: result ? result.message : 'Не удалось получить содержимое курса' };
    }

    const sections = (Array.isArray(result.data) ? result.data : []).map((section, index) => ({
      id: Number(section.id),
      name: String(section.name || '').trim() || `Раздел ${index + 1}`,
      summary: String(section.summary || ''),
      modules: (Array.isArray(section.modules) ? section.modules : []).map((module) => ({
        id: Number(module.id),
        name: String(module.name || 'Элемент курса'),
        modName: String(module.modname || ''),
        description: String(module.description || ''),
        url: String(module.url || ''),
        visible: module.visible !== 0,
        availability: String(module.availabilityinfo || ''),
        // ✓ Отметка о выполнении: 0 — не выполнено, 1 — выполнено, 2 — зачтено, 3 — незачтено
        completion: Number(module.completion) || 0,
        completionState: module.completiondata && module.completiondata.state !== undefined
          ? Number(module.completiondata.state) : null,
        contents: (Array.isArray(module.contents) ? module.contents : []).map((file) => ({
          type: String(file.type || ''),
          fileName: String(file.filename || ''),
          filePath: String(file.filepath || ''),
          fileSize: Number(file.filesize) || 0,
          fileUrl: String(file.fileurl || ''),
          timeModified: Number(file.timemodified) || 0,
          mimeType: String(file.mimetype || ''),
        })),
      })),
    }));

    this.writeJson(`sdoContents_${courseId}`, { at: Date.now(), sections });
    return { success: true, sections };
  }

  /** Задания курса с дедлайнами (сроки сдачи). */
  static async getAssignments(courseIds) {
    const ids = Array.isArray(courseIds) ? courseIds : [courseIds];
    if (ids.length === 0) return { success: true, assignments: [] };
    const result = await this.call('mod_assign_get_assignments', { courseids: ids });
    if (!result || !result.success) return result;

    const courses = result.data && Array.isArray(result.data.courses) ? result.data.courses : [];
    const assignments = [];
    courses.forEach((course) => {
      const list = Array.isArray(course.assignments) ? course.assignments : [];
      list.forEach((item) => {
        assignments.push({
          courseId: Number(course.id),
          courseName: String(course.fullname || ''),
          courseKey: SDOClient.normalizeName(course.fullname || ''),
          assignId: Number(item.id),
          cmid: Number(item.cmid) || 0,
          name: String(item.name || 'Задание'),
          intro: String(item.intro || ''),
          dueDate: Number(item.duedate) || 0,
          cutoffDate: Number(item.cutoffdate) || 0,
          allowFrom: Number(item.allowsubmissionsfromdate) || 0,
          noSubmissions: Number(item.nosubmissions) || 0,
          teamSubmission: Number(item.teamsubmission) || 0,
          requiresSubmission: Number(item.submissiondrafts) || 0,
          grade: item.grade === null || item.grade === undefined ? null : Number(item.grade),
          url: item.cmid ? `${SDO_BASE_URL}/mod/assign/view.php?id=${item.cmid}` : '',
        });
      });
    });
    return { success: true, assignments };
  }

  /** Сводка по всем дедлайнам (для синхронизации с домашними заданиями приложения). */
  static async getDeadlines(options = {}) {
    if (!options.force && this.state.deadlinesLoaded && this.state.deadlines.length >= 0 && Date.now() - this.state.lastSync < SDO_CACHE_TTL) {
      return { success: true, deadlines: this.state.deadlines };
    }
    const courses = await this.getCourses({ force: options.force === true });
    if (!courses.success) return courses;

    const ids = courses.courses.map((course) => course.id);
    const result = await this.getAssignments(ids);
    if (!result.success) return { success: false, message: result.message };

    const now = Math.floor(Date.now() / 1000);
    const calendar = await this.getCalendarEvents();
    // ✓ События календаря дополняют задания: тесты и другие активности тоже имеют сроки
    const knownKeys = new Set(result.assignments.map((item) => `${item.courseId}|${item.name}|${item.dueDate}`));
    const calendarEvents = Array.isArray(calendar) ? calendar : [];
    const extra = calendarEvents.filter((item) => !knownKeys.has(`${item.courseId}|${item.name}|${item.dueDate}`));
    const deadlines = result.assignments.concat(extra)
      .map((item) => ({
        ...item,
        overdue: item.dueDate > 0 && item.dueDate < now,
        submitted: false,
        gradingStatus: '',
      }))
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate - b.dueDate;
      });

    this.state.deadlines = deadlines;
    this.state.deadlinesLoaded = true;
    this.state.lastSync = Date.now();
    return { success: true, deadlines };
  }

  /** Статус сдачи конкретного задания. */
  static async getSubmissionStatus(assignId) {
    const result = await this.call('mod_assign_get_submission_status', { assignid: Number(assignId) });
    if (!result || !result.success) return result;
    const data = result.data || {};
    const lastAttempt = data.lastattempt || {};
    const submission = lastAttempt.submission || {};
    const team = lastAttempt.teamsubmission || {};
    const feedback = data.feedback || {};
    const plugins = Array.isArray(data.plugins) ? data.plugins : [];

    const onlineTextPlugin = plugins.find((plugin) => String(plugin.type || '') === 'onlinetext');
    const filePlugin = plugins.find((plugin) => String(plugin.type || '') === 'file');
    const editor = onlineTextPlugin && Array.isArray(onlineTextPlugin.editorfields)
      ? onlineTextPlugin.editorfields.find((field) => field.name === 'onlinetext') || onlineTextPlugin.editorfields[0]
      : null;
    const fileArea = filePlugin && Array.isArray(filePlugin.fileareas)
      ? filePlugin.fileareas.find((area) => area.area === 'submission_files') || filePlugin.fileareas[0]
      : null;

    return {
      success: true,
      status: {
        submitted: Boolean(submission.status === 'submitted' || team.status === 'submitted' || lastAttempt.submitted),
        status: String(submission.status || team.status || 'new'),
        timeModified: Number(submission.timemodified || team.timemodified) || 0,
        gradingStatus: String(submission.gradingstatus || team.gradingstatus || ''),
        canSubmit: Boolean(lastAttempt.cansubmit),
        canEdit: Boolean(lastAttempt.caneditowner),
        isLocked: Boolean(lastAttempt.locked),
        grade: feedback.graded && feedback.grade ? String(feedback.grade.grade) : '',
        gradeForDisplay: data.gradefordisplay || '',
        feedbackComment: sdoHtmlToText(feedback.plugins && feedback.plugins.length
          ? (feedback.plugins[0].editorfields ? (feedback.plugins[0].editorfields[0] || {}).text : '')
          : ''),
        onlineTextSupported: Boolean(editor),
        onlineText: editor ? String(editor.text || '') : '',
        onlineTextFormat: editor ? Number(editor.format) || 1 : 1,
        fileSupported: Boolean(fileArea),
        files: (fileArea && Array.isArray(fileArea.files) ? fileArea.files : []).map((file) => ({
          fileName: String(file.filename || ''),
          fileSize: Number(file.filesize) || 0,
          fileUrl: String(file.fileurl || ''),
          timeModified: Number(file.timemodified) || 0,
        })),
      },
    };
  }

  /**
   * Отправить ответ на задание: текст, прикреплённые файлы (черновик) или и то, и другое.
   * filesItemId — идентификатор черновика, полученный от /webservice/upload.php.
   */
  static async submitAssignment(assignId, options = {}) {
    const settings = options || {};
    const params = { assignmentid: Number(assignId) };
    if (settings.text !== undefined && settings.text !== null) {
      params['plugindata[onlinetext_editor][text]'] = String(settings.text);
      params['plugindata[onlinetext_editor][format]'] = 1;
    }
    if (settings.filesItemId !== undefined && settings.filesItemId !== null) {
      params['plugindata[files_filemanager]'] = Number(settings.filesItemId);
    }
    const result = await this.call('mod_assign_save_submission', params);
    if (!result || !result.success) return result;
    if (result.data && Array.isArray(result.data.warnings) && result.data.warnings.length) {
      const warning = result.data.warnings[0];
      return { success: false, message: warning.message || 'СДО не приняло ответ' };
    }
    return { success: true, message: 'Ответ отправлен в СДО' };
  }

  /**
   * Загрузить файл в черновик СДО (тот же механизм, что использует официальное приложение Moodle).
   * Возвращает itemid черновика — его затем передаём в submitAssignment.
   */
  static async uploadDraftFile(file, itemId) {
    if (!file) return { success: false, message: 'Файл не выбран' };
    const session = await this.ensureSession();
    if (!session.success) return session;

    const form = new FormData();
    form.append('token', this.state.token);
    form.append('file', file, file.name || 'file');
    form.append('filearea', 'draft');
    form.append('itemid', String(itemId === undefined ? 0 : itemId));

    let response;
    try {
      response = await (window.fetchWithTimeout || window.fetch.bind(window))(`${SDO_BASE_URL}/webservice/upload.php`, {
        method: 'POST',
        body: form,
        credentials: 'omit',
        mode: 'cors',
        timeout: 45000,
      });
    } catch (error) {
      return { success: false, network: true, message: `СДО не отвечает (${error && error.message ? error.message : 'сеть недоступна'})` };
    }
    const raw = await response.text().catch(() => '');
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch (_) { data = null; }
    if (!data) return { success: false, http: response.status, message: `СДО не приняло файл (код ${response.status})` };
    if (data.error || data.exception) return { success: false, message: String(data.message || data.error || 'СДО не приняло файл') };
    const item = Array.isArray(data) ? data[0] : data;
    return { success: true, itemId: Number(item && item.itemid) || 0, message: 'Файл загружен в СДО' };
  }

  /* ------------------------------ Сопоставление с расписанием ------------------------------ */

  /** Нормализация названия: регистр, мусорные символы и служебные слова убираем. */
  static normalizeName(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^а-яa-z0-9\s]/g, ' ')
      .replace(/\b(лек|пр|лаб|лабораторная|лабораторные|практика|практические|практическое|лекция|лекции|занятие|занятия|курс|модуль|пз|лк|лб)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Найти курс СДО по названию предмета из расписания.
   * Общий алгоритм сравнения названий (без привязки к конкретным дисциплинам):
   * считаем, сколько значимых слов предмета встретилось в названии курса.
   */
  static findCourseBySubject(subject, courses) {
    const list = Array.isArray(courses) ? courses : this.state.courses;
    if (!list || list.length === 0 || !subject) return null;
    const target = this.normalizeName(subject);
    if (!target) return null;
    const targetWords = target.split(' ').filter((word) => word.length > 2);
    if (targetWords.length === 0) return null;

    let best = null;
    list.forEach((course) => {
      const name = course.key || this.normalizeName(course.fullName);
      if (!name) return;
      let score = 0;
      if (name === target) score = 100;
      else if (name.includes(target) || target.includes(name)) score = 80;
      else {
        targetWords.forEach((word) => {
          if (name.includes(word)) score += 20;
        });
      }
      if (score > 0 && (!best || score > best.score)) best = { course, score };
    });
    return best && best.score >= 40 ? best.course : null;
  }

  /** Ближайшие дедлайны по конкретному предмету (из уже загруженного списка). */
  static deadlinesForSubject(subject, options = {}) {
    const list = this.state.deadlines || [];
    if (!list.length || !subject) return [];
    const course = this.findCourseBySubject(subject);
    const now = Math.floor(Date.now() / 1000);
    let matched = list.filter((item) => (course ? item.courseId === course.id : item.courseKey && this.normalizeName(subject).split(' ').some((word) => word.length > 2 && item.courseKey.includes(word))));
    if (!options.includeOverdue) matched = matched.filter((item) => !item.dueDate || item.dueDate >= now - 86400 * 3);
    return matched
      .sort((a, b) => (a.dueDate || Infinity) - (b.dueDate || Infinity))
      .slice(0, Number(options.limit) || 5);
  }

  /** URL книги оценок курса (ведомость успеваемости) — открывается в браузере. */
  static gradeUrl(courseId) {
    return `${SDO_BASE_URL}/grade/report/user/index.php?id=${courseId}`;
  }
}

window.SDOClient = SDOClient;

/* ============================ Интерфейс: общий каркас ============================ */

const SDOUI = {
  /**
   * Заголовок-карточка с состоянием подключения и кнопкой выхода из СДО.
   * Используется и на вкладке, и на страницах курса/задания.
   */
  buildHeader(options = {}) {
    const settings = options || {};
    const wrap = document.createElement('div');
    wrap.className = 'sdo-header';

    const user = SDOClient.state.user;
    const title = document.createElement('p');
    title.className = 'sdo-header-title';
    title.textContent = user && user.fullName ? user.fullName : 'СДО КГУ';
    wrap.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'sdo-header-subtitle';
    const parts = [];
    if (user && user.siteName) parts.push(user.siteName);
    if (SDOClient.state.lastSync) parts.push(`обновлено ${sdoFormatDateTime(Math.floor(SDOClient.state.lastSync / 1000))}`);
    subtitle.textContent = parts.join(' · ') || 'sdo.kosgos.ru';
    wrap.appendChild(subtitle);

    if (settings.exit !== false) {
      const exit = document.createElement('button');
      exit.type = 'button';
      exit.className = 'sdo-exit-button';
      exit.textContent = 'Выйти из СДО';
      exit.addEventListener('click', async () => {
        if (!window.confirm('Выйти из СДО на этом устройстве? Сохранённый пароль будет удалён.')) return;
        SDOClient.forget();
        if (typeof showNotification === 'function') showNotification('Данные СДО удалены с этого устройства', 'success');
        if (typeof closeAllSubpages === 'function') closeAllSubpages();
        if (settings.onExit) { await settings.onExit(); return; }
        if (typeof generatePage === 'function') await generatePage('nav-sdo');
      });
      wrap.appendChild(exit);
    }
    return wrap;
  },

  /** Плашка состояния: загрузка / ошибка / пусто. */
  buildNotice(message, kind = 'info', options = {}) {
    const notice = document.createElement('div');
    notice.className = `sdo-notice sdo-notice--${kind}`;
    const text = document.createElement('p');
    text.className = 'sdo-notice-text';
    text.textContent = String(message || '');
    notice.appendChild(text);

    if (options.actionLabel && typeof options.onAction === 'function') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sdo-notice-button';
      button.textContent = options.actionLabel;
      button.addEventListener('click', () => options.onAction(button));
      notice.appendChild(button);
    }
    if (options.hint) {
      const hint = document.createElement('p');
      hint.className = 'sdo-notice-hint';
      hint.textContent = String(options.hint);
      notice.appendChild(hint);
    }
    return notice;
  },

  buildSpinner(text) {
    const wrap = document.createElement('div');
    wrap.className = 'sdo-loading';
    const spinner = document.createElement('span');
    spinner.className = 'sdo-spinner';
    const label = document.createElement('p');
    label.textContent = String(text || 'Загружаю…');
    wrap.appendChild(spinner);
    wrap.appendChild(label);
    return wrap;
  },

  /**
   * ✓ Встроенный предпросмотр файла: полноэкранное окно с документом.
   * Закрывается крестиком или системной кнопкой «назад» (через ModalBack).
   */
  openFilePreview(url, title) {
    if (!url) return;
    const overlay = document.createElement('div');
    overlay.className = 'sdo-file-preview';

    const toolbar = document.createElement('div');
    toolbar.className = 'sdo-file-preview-bar';
    const label = document.createElement('span');
    label.className = 'sdo-file-preview-title';
    label.textContent = String(title || 'Просмотр файла');
    const actions = document.createElement('span');
    actions.className = 'sdo-file-preview-actions';

    const external = document.createElement('button');
    external.type = 'button';
    external.className = 'sdo-file-preview-button';
    external.textContent = 'Открыть в новой вкладке';
    external.addEventListener('click', () => { if (typeof openLink === 'function') openLink(url); });

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'sdo-file-preview-button sdo-file-preview-close';
    close.textContent = '✕ Закрыть';

    actions.appendChild(external);
    actions.appendChild(close);
    toolbar.appendChild(label);
    toolbar.appendChild(actions);

    const frame = document.createElement('iframe');
    frame.className = 'sdo-file-preview-frame';
    frame.src = url;
    frame.title = String(title || 'Предпросмотр файла');

    overlay.appendChild(toolbar);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);

    let backId = null;
    const shutdown = () => {
      if (backId !== null && window.ModalBack && typeof window.ModalBack.remove === 'function') {
        window.ModalBack.remove(backId);
      }
      overlay.remove();
    };
    close.addEventListener('click', shutdown);
    if (window.ModalBack && typeof window.ModalBack.push === 'function') {
      backId = window.ModalBack.push(shutdown);
    }
  },

  /** Карточка курса: название, категория, прогресс, кнопка открытия. */
  buildCourseCard(course, onOpen) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'sdo-course-card';
    card.dataset.courseId = String(course.id);

    const head = document.createElement('div');
    head.className = 'sdo-course-card-head';

    const name = document.createElement('p');
    name.className = 'sdo-course-name';
    name.textContent = course.fullName || 'Курс без названия';
    head.appendChild(name);

    const arrow = document.createElement('span');
    arrow.className = 'sdo-course-arrow';
    arrow.textContent = '›';
    head.appendChild(arrow);
    card.appendChild(head);

    const metaParts = [];
    if (course.shortName) metaParts.push(course.shortName);
    if (course.category) metaParts.push(course.category);
    if (course.startDate) metaParts.push(`с ${sdoFormatDate(course.startDate)}`);
    if (metaParts.length) {
      const meta = document.createElement('p');
      meta.className = 'sdo-course-meta';
      meta.textContent = metaParts.join(' · ');
      card.appendChild(meta);
    }

    if (course.progress !== null && course.progress !== undefined) {
      const progressWrap = document.createElement('div');
      progressWrap.className = 'sdo-progress';
      const bar = document.createElement('div');
      bar.className = 'sdo-progress-bar';
      const fill = document.createElement('div');
      fill.className = 'sdo-progress-fill';
      fill.style.width = `${Math.max(0, Math.min(100, course.progress))}%`;
      bar.appendChild(fill);
      const label = document.createElement('span');
      label.className = 'sdo-progress-label';
      label.textContent = `${Math.round(course.progress)}%`;
      progressWrap.appendChild(bar);
      progressWrap.appendChild(label);
      card.appendChild(progressWrap);
    }

    if (typeof onOpen === 'function') card.addEventListener('click', () => onOpen(course));
    return card;
  },

  /** Блок «дедлайн»: дата, остаток времени, кнопка перехода к заданию. */
  buildDeadlineRow(item, onOpen) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'sdo-deadline-row' + (item.overdue ? ' sdo-deadline-row--overdue' : '');

    const icon = document.createElement('span');
    icon.className = 'sdo-deadline-icon';
    icon.textContent = item.overdue ? '⚠' : '⏳';
    row.appendChild(icon);

    const body = document.createElement('span');
    body.className = 'sdo-deadline-body';
    const name = document.createElement('span');
    name.className = 'sdo-deadline-name';
    name.textContent = item.name || 'Задание';
    body.appendChild(name);
    const meta = document.createElement('span');
    meta.className = 'sdo-deadline-meta';
    const metaParts = [];
    if (item.courseName) metaParts.push(item.courseName);
    metaParts.push(item.dueDate ? `${sdoFormatDeadline(item.dueDate)} (${sdoFormatDateTime(item.dueDate)})` : 'без срока');
    meta.textContent = metaParts.join(' · ');
    body.appendChild(meta);
    row.appendChild(body);

    if (typeof onOpen === 'function') row.addEventListener('click', () => onOpen(item));
    return row;
  },
};

window.SDOUI = SDOUI;

/* ============================ Интерфейс: страницы ============================ */

const SDOPages = {
  /**
   * Форма входа в СДО.
   * Логин и пароль уходят только на sdo.kosgos.ru и сохраняются только на этом устройстве.
   */
  buildLoginForm(options = {}) {
    const settings = options || {};
    const wrap = document.createElement('div');
    wrap.className = 'sdo-login';

    const icon = document.createElement('div');
    icon.className = 'sdo-login-icon';
    icon.textContent = '🎓';
    wrap.appendChild(icon);

    const title = document.createElement('p');
    title.className = 'sdo-login-title';
    title.textContent = 'Вход в СДО КГУ';
    wrap.appendChild(title);

    const description = document.createElement('p');
    description.className = 'sdo-login-description';
    description.textContent = 'Войдите в СДО под своей учётной записью КГУ. Логин и пароль отправляются только на сервер sdo.kosgos.ru и хранятся только на этом устройстве — ни в базу приложения, ни администраторам они не попадают.';
    wrap.appendChild(description);

    const form = document.createElement('form');
    form.className = 'sdo-login-form';
    form.autocomplete = 'on';

    const loginField = document.createElement('div');
    loginField.className = 'sdo-field';
    const loginInput = document.createElement('input');
    loginInput.type = 'text';
    loginInput.id = 'sdo-input-login';
    loginInput.autocomplete = 'username';
    loginInput.required = true;
    const loginLabel = document.createElement('label');
    loginLabel.setAttribute('for', 'sdo-input-login');
    loginLabel.textContent = 'Логин СДО';
    loginField.appendChild(loginInput);
    loginField.appendChild(loginLabel);
    form.appendChild(loginField);

    const passwordField = document.createElement('div');
    passwordField.className = 'sdo-field';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'sdo-input-password';
    passwordInput.autocomplete = 'current-password';
    passwordInput.required = true;
    const passwordLabel = document.createElement('label');
    passwordLabel.setAttribute('for', 'sdo-input-password');
    passwordLabel.textContent = 'Пароль СДО';
    const eye = document.createElement('button');
    eye.type = 'button';
    eye.className = 'sdo-password-eye';
    eye.title = 'Показать пароль';
    eye.textContent = '👁';
    eye.addEventListener('click', () => {
      const shown = passwordInput.type === 'text';
      passwordInput.type = shown ? 'password' : 'text';
      eye.textContent = shown ? '👁' : '🙈';
      eye.title = shown ? 'Показать пароль' : 'Скрыть пароль';
    });
    passwordField.appendChild(passwordInput);
    passwordField.appendChild(passwordLabel);
    passwordField.appendChild(eye);
    form.appendChild(passwordField);

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'sdo-login-submit';
    submit.textContent = 'Войти';
    form.appendChild(submit);

    const status = document.createElement('p');
    status.className = 'sdo-login-status';
    form.appendChild(status);

    const openSite = document.createElement('button');
    openSite.type = 'button';
    openSite.className = 'sdo-login-link';
    openSite.textContent = 'Открыть СДО в браузере';
    openSite.addEventListener('click', () => {
      if (typeof openLink === 'function') openLink(`${SDO_BASE_URL}/login/index.php`);
      else window.open(`${SDO_BASE_URL}/login/index.php`, '_blank');
    });
    form.appendChild(openSite);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = loginInput.value.trim();
      const password = passwordInput.value;
      if (!username || !password) {
        status.textContent = 'Заполните логин и пароль';
        status.className = 'sdo-login-status sdo-login-status--error';
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Вхожу…';
      status.className = 'sdo-login-status';
      status.textContent = 'Проверяю данные в СДО…';
      const result = await SDOClient.login(username, password);
      submit.disabled = false;
      submit.textContent = 'Войти';
      if (!result.success) {
        status.className = 'sdo-login-status sdo-login-status--error';
        status.textContent = result.message || 'Не удалось войти';
        return;
      }
      status.className = 'sdo-login-status';
      status.textContent = 'Готово';
      if (typeof showNotification === 'function') showNotification(result.message || 'Вход в СДО выполнен', 'success');
      if (settings.onSuccess) await settings.onSuccess();
    });

    wrap.appendChild(form);
    return wrap;
  },

  /**
   * Страница курса: разделы — раскрывающиеся блоки, внутри — элементы курса.
   * Задания показываются с дедлайном и ведут на страницу задания.
   */
  async buildCoursePage(container, data) {
    const courseId = Number(data && data.courseId);
    container.innerHTML = '';
    container.appendChild(SDOUI.buildHeader({ onExit: async () => { if (typeof closeAllSubpages === 'function') closeAllSubpages(); } }));

    const course = (SDOClient.state.courses || []).find((item) => Number(item.id) === courseId);
    const title = document.createElement('h3');
    title.className = 'sdo-page-title';
    title.textContent = (course && course.fullName) || (data && data.courseName) || 'Курс';
    container.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'sdo-page-actions';
    const openCourse = document.createElement('button');
    openCourse.type = 'button';
    openCourse.className = 'sdo-page-action';
    openCourse.textContent = 'Открыть курс в СДО';
    openCourse.addEventListener('click', () => {
      if (typeof openLink === 'function') openLink(`${SDO_BASE_URL}/course/view.php?id=${courseId}`);
    });
    const openGrades = document.createElement('button');
    openGrades.type = 'button';
    openGrades.className = 'sdo-page-action';
    openGrades.textContent = 'Оценки по курсу';
    openGrades.addEventListener('click', () => {
      if (typeof openLink === 'function') openLink(SDOClient.gradeUrl(courseId));
    });
    actions.appendChild(openCourse);
    actions.appendChild(openGrades);
    container.appendChild(actions);

    const content = document.createElement('div');
    content.className = 'sdo-course-content';
    const spinner = SDOUI.buildSpinner('Загружаю содержимое курса…');
    content.appendChild(spinner);
    container.appendChild(content);

    const result = await SDOClient.getCourseContents(courseId);
    content.innerHTML = '';
    if (!result.success) {
      content.appendChild(SDOUI.buildNotice(result.message || 'Не удалось загрузить курс', 'error', {
        actionLabel: 'Повторить',
        onAction: () => SDOPages.buildCoursePage(container, data),
        hint: 'Если ошибка повторяется — скорее всего сервер СДО запрещает запросы из приложения (CORS). Откройте курс кнопкой «Открыть курс в СДО».',
      }));
      return;
    }
    if (result.cached) content.appendChild(SDOUI.buildNotice('Показаны сохранённые данные курса', 'info'));

    const sections = result.sections || [];
    if (sections.length === 0) {
      content.appendChild(SDOUI.buildNotice('В этом курсе пока нет доступных разделов', 'info'));
      return;
    }

    sections.forEach((section, index) => {
      const block = document.createElement('details');
      block.className = 'sdo-section';
      if (index === 0) block.open = true;
      const summary = document.createElement('summary');
      summary.className = 'sdo-section-summary';
      const summaryName = document.createElement('span');
      summaryName.className = 'sdo-section-name';
      summaryName.textContent = section.name;
      const count = document.createElement('span');
      count.className = 'sdo-section-count';
      const modules = (section.modules || []).filter((module) => module.modName !== 'label');
      count.textContent = `${modules.length} ${SDOText.plural(modules.length, 'элемент', 'элемента', 'элементов')}`;
      summary.appendChild(summaryName);
      summary.appendChild(count);
      block.appendChild(summary);

      const list = document.createElement('div');
      list.className = 'sdo-section-body';

      (section.modules || []).forEach((module) => {
        const kind = sdoModuleKind(module.modName);
        if (module.modName === 'label') {
          const labelText = sdoHtmlToText(module.description);
          if (labelText) {
            const label = document.createElement('p');
            label.className = 'sdo-section-label';
            label.textContent = labelText;
            sdoBindInlineLinks(label);
            list.appendChild(label);
          }
          return;
        }
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'sdo-module-row';
        if (module.visible === false) row.classList.add('sdo-module-row--hidden');

        const icon = document.createElement('span');
        icon.className = 'sdo-module-icon';
        icon.textContent = kind.icon;
        row.appendChild(icon);

        const body = document.createElement('span');
        body.className = 'sdo-module-body';
        const name = document.createElement('span');
        name.className = 'sdo-module-name';
        name.textContent = module.name || 'Элемент курса';
        body.appendChild(name);
        const meta = document.createElement('span');
        meta.className = 'sdo-module-meta';
        const metaParts = [kind.label];
        const filesCount = (module.contents || []).length;
        if (filesCount) metaParts.push(`${filesCount} ${SDOText.plural(filesCount, 'файл', 'файла', 'файлов')}`);
        if (module.availability) metaParts.push('есть условия доступа');
        if (module.visible === false) metaParts.push('скрыто');
        meta.textContent = metaParts.join(' · ');
        body.appendChild(meta);
        row.appendChild(body);

        // ✓ Галочка о выполнении — как на странице курса в самом СДО
        if (module.completionState === 1 || module.completionState === 2) {
          const done = document.createElement('span');
          done.className = 'sdo-module-done';
          done.title = 'Элемент выполнен';
          done.textContent = '✓';
          row.appendChild(done);
        } else if (module.completion === 1 || module.completion === 2) {
          const todo = document.createElement('span');
          todo.className = 'sdo-module-todo';
          todo.title = 'Требуется выполнение';
          todo.textContent = '○';
          row.appendChild(todo);
        }

        const arrow = document.createElement('span');
        arrow.className = 'sdo-module-arrow';
        arrow.textContent = '›';
        row.appendChild(arrow);

        row.addEventListener('click', async () => {
          if (module.modName === 'assign') {
            if (typeof navigateTo === 'function') {
              await navigateTo('sdoassign', {
                courseId,
                courseName: (course && course.fullName) || '',
                cmid: module.id,
                moduleName: module.name,
                intro: module.description,
              });
              return;
            }
          }
          if (typeof navigateTo === 'function') {
            await navigateTo('sdomodule', {
              courseId,
              courseName: (course && course.fullName) || '',
              module,
            });
          }
        });

        list.appendChild(row);
      });

      if ((section.modules || []).length === 0) {
        const empty = document.createElement('p');
        empty.className = 'sdo-section-empty';
        empty.textContent = 'В этом разделе пока ничего нет';
        list.appendChild(empty);
      }
      block.appendChild(list);
      content.appendChild(block);
    });
  },

  /**
   * Страница элемента курса (файл, ссылка, страница, тест и т.д.).
   * Файлы открываются в браузере, описание показывается текстом.
   */
  async buildModulePage(container, data) {
    const module = (data && data.module) || {};
    const kind = sdoModuleKind(module.modName);
    container.innerHTML = '';
    container.appendChild(SDOUI.buildHeader({ onExit: async () => { if (typeof closeAllSubpages === 'function') closeAllSubpages(); } }));

    const card = document.createElement('div');
    card.className = 'sdo-module-card';

    const head = document.createElement('div');
    head.className = 'sdo-module-card-head';
    const icon = document.createElement('span');
    icon.className = 'sdo-module-card-icon';
    icon.textContent = kind.icon;
    const titleWrap = document.createElement('span');
    const title = document.createElement('p');
    title.className = 'sdo-page-title';
    title.textContent = module.name || 'Элемент курса';
    const subtitle = document.createElement('p');
    subtitle.className = 'sdo-module-card-subtitle';
    const subtitleParts = [kind.label];
    if (data && data.courseName) subtitleParts.push(data.courseName);
    subtitle.textContent = subtitleParts.join(' · ');
    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);
    head.appendChild(icon);
    head.appendChild(titleWrap);
    card.appendChild(head);

    const description = sdoHtmlToText(module.description);
    if (description) {
      const text = document.createElement('p');
      text.className = 'sdo-module-description';
      text.textContent = description;
      sdoBindInlineLinks(text);
      card.appendChild(text);
    }
    container.appendChild(card);

    const files = Array.isArray(module.contents) ? module.contents : [];
    if (files.length) {
      const filesTitle = document.createElement('p');
      filesTitle.className = 'sdo-block-title';
      filesTitle.textContent = 'Материалы';
      container.appendChild(filesTitle);

      const list = document.createElement('div');
      list.className = 'sdo-file-list';
      files.forEach((file) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'sdo-file-row';
        const iconFile = document.createElement('span');
        iconFile.className = 'sdo-file-icon';
        iconFile.textContent = /pdf/i.test(file.mimeType) || /\.pdf$/i.test(file.fileName) ? '📕'
          : /(image)/i.test(file.mimeType) ? '🖼'
          : /(url|link)/i.test(file.type) ? '🔗'
          : '📄';
        row.appendChild(iconFile);
        const body = document.createElement('span');
        body.className = 'sdo-file-body';
        const name = document.createElement('span');
        name.className = 'sdo-file-name';
        name.textContent = file.fileName || 'Файл';
        const meta = document.createElement('span');
        meta.className = 'sdo-file-meta';
        const metaParts = [];
        if (file.fileSize) metaParts.push(sdoFileSize(file.fileSize));
        if (file.timeModified) metaParts.push(sdoFormatDate(file.timeModified));
        meta.textContent = metaParts.join(' · ');
        body.appendChild(name);
        body.appendChild(meta);
        row.appendChild(body);
        row.addEventListener('click', () => {
          const url = module.modName === 'url' && module.url
            ? module.url
            : SDOClient.fileUrl(file.fileUrl || module.url || '');
          if (!url) return;
          // ✓ Предпросмотр: изображения открываются в просмотрщике приложения,
          //   PDF — во встроенном окне; остальные файлы скачиваются как раньше
          const fileName = String(file.fileName || '');
          const isImage = /(image)/i.test(String(file.mimeType || '')) || /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName);
          const isPdf = /pdf/i.test(String(file.mimeType || '')) || /\.pdf$/i.test(fileName);
          if (isImage && window.imageViewer && typeof window.imageViewer.open === 'function') {
            window.imageViewer.open(url, { title: fileName || 'Просмотр изображения' });
            return;
          }
          if (isPdf && SDOUI && typeof SDOUI.openFilePreview === 'function') {
            SDOUI.openFilePreview(url, fileName);
            return;
          }
          if (typeof openLink === 'function') openLink(url);
        });
        list.appendChild(row);
      });
      container.appendChild(list);
    }

    if (module.url) {
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'sdo-primary-button sdo-primary-button--full';
      open.textContent = module.modName === 'url' ? 'Перейти по ссылке' : 'Открыть в СДО';
      open.addEventListener('click', () => {
        if (typeof openLink === 'function') openLink(module.url);
      });
      container.appendChild(open);
    }
  },

  /**
   * Страница задания: дедлайн, статус сдачи, форма ответа (текст и файлы).
   * Здесь же — «черновик из приложения»: текст последнего ДЗ по этому предмету
   * можно одной кнопкой перенести в ответ СДО.
   */
  async buildAssignPage(container, data) {
    const settings = data || {};
    container.innerHTML = '';
    container.appendChild(SDOUI.buildHeader({ onExit: async () => { if (typeof closeAllSubpages === 'function') closeAllSubpages(); } }));

    const title = document.createElement('h3');
    title.className = 'sdo-page-title';
    title.textContent = settings.moduleName || 'Задание';
    container.appendChild(title);

    const body = document.createElement('div');
    body.className = 'sdo-assign-body';
    const spinner = SDOUI.buildSpinner('Загружаю задание…');
    body.appendChild(spinner);
    container.appendChild(body);

    // ✓ Находим сам assign: сначала в загруженных дедлайнах, иначе — по содержимому курса
    let assignment = (SDOClient.state.deadlines || []).find((item) => item.cmid === Number(settings.cmid));
    if (!assignment && settings.courseId) {
      const loaded = await SDOClient.getAssignments([Number(settings.courseId)]);
      if (loaded.success) {
        assignment = loaded.assignments.find((item) => item.cmid === Number(settings.cmid));
        if (assignment) SDOClient.state.deadlines = (SDOClient.state.deadlines || []).concat([assignment]);
      }
    }
    if (!assignment) {
      body.innerHTML = '';
      body.appendChild(SDOUI.buildNotice('Не удалось найти задание в СДО. Откройте его в браузере.', 'error', {
        actionLabel: 'Открыть в СДО',
        onAction: () => { if (typeof openLink === 'function') openLink(`${SDO_BASE_URL}/mod/assign/view.php?id=${Number(settings.cmid)}`); },
      }));
      return;
    }

    const status = await SDOClient.getSubmissionStatus(assignment.assignId);
    body.innerHTML = '';

    const badgeWrap = document.createElement('div');
    badgeWrap.className = 'sdo-assign-badges';
    const now = Math.floor(Date.now() / 1000);
    const overdue = assignment.dueDate > 0 && assignment.dueDate < now;
    const badge = document.createElement('span');
    badge.className = 'sdo-badge' + (overdue ? ' sdo-badge--danger' : ' sdo-badge--info');
    badge.textContent = assignment.dueDate
      ? `${sdoFormatDeadline(assignment.dueDate)} · ${sdoFormatDateTime(assignment.dueDate)}`
      : 'Без срока сдачи';
    badgeWrap.appendChild(badge);

    if (status.success && status.status) {
      const state = status.status;
      const stateBadge = document.createElement('span');
      if (state.submitted) {
        stateBadge.className = 'sdo-badge sdo-badge--success';
        stateBadge.textContent = state.grade ? `Сдано · оценка ${state.grade}` : 'Сдано';
      } else {
        stateBadge.className = 'sdo-badge sdo-badge--warn';
        stateBadge.textContent = 'Не сдано';
      }
      badgeWrap.appendChild(stateBadge);
      if (assignment.cutoffDate && assignment.cutoffDate < now) {
        const closed = document.createElement('span');
        closed.className = 'sdo-badge sdo-badge--danger';
        closed.textContent = 'Приём работ закрыт';
        badgeWrap.appendChild(closed);
      }
    }
    const courseBadge = document.createElement('span');
    courseBadge.className = 'sdo-badge sdo-badge--muted';
    courseBadge.textContent = assignment.courseName || (settings.courseName || 'Курс');
    badgeWrap.appendChild(courseBadge);
    if (assignment.allowFrom && assignment.allowFrom > now) {
      const fromBadge = document.createElement('span');
      fromBadge.className = 'sdo-badge sdo-badge--muted';
      fromBadge.textContent = `Открыто с ${sdoFormatDateTime(assignment.allowFrom)}`;
      badgeWrap.appendChild(fromBadge);
    }
    body.appendChild(badgeWrap);

    const intro = sdoHtmlToText(assignment.intro);
    if (intro) {
      const text = document.createElement('p');
      text.className = 'sdo-module-description';
      text.textContent = intro;
      sdoBindInlineLinks(text);
      body.appendChild(text);
    }

    if (status.success && status.status && status.status.files && status.status.files.length) {
      const filesTitle = document.createElement('p');
      filesTitle.className = 'sdo-block-title';
      filesTitle.textContent = 'Отправленные файлы';
      body.appendChild(filesTitle);
      const list = document.createElement('div');
      list.className = 'sdo-file-list';
      status.status.files.forEach((file) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'sdo-file-row';
        const icon = document.createElement('span');
        icon.className = 'sdo-file-icon';
        icon.textContent = '📎';
        const fileBody = document.createElement('span');
        fileBody.className = 'sdo-file-body';
        const name = document.createElement('span');
        name.className = 'sdo-file-name';
        name.textContent = file.fileName;
        const meta = document.createElement('span');
        meta.className = 'sdo-file-meta';
        meta.textContent = [sdoFileSize(file.fileSize), sdoFormatDateTime(file.timeModified)].filter(Boolean).join(' · ');
        fileBody.appendChild(name);
        fileBody.appendChild(meta);
        row.appendChild(icon);
        row.appendChild(fileBody);
        row.addEventListener('click', () => {
          if (file.fileUrl && typeof openLink === 'function') openLink(SDOClient.fileUrl(file.fileUrl));
        });
        list.appendChild(row);
      });
      body.appendChild(list);
    }

    if (status.success && status.status && status.status.gradeForDisplay) {
      const grade = document.createElement('p');
      grade.className = 'sdo-assign-grade';
      grade.textContent = `Оценка в СДО: ${sdoHtmlToText(status.status.gradeForDisplay) || status.status.grade}`;
      body.appendChild(grade);
    }

    const state = status.success ? status.status : null;
    if (state && state.isLocked) {
      body.appendChild(SDOUI.buildNotice('Ответ заблокирован преподавателем', 'warn'));
    } else if (assignment.noSubmissions === 1) {
      body.appendChild(SDOUI.buildNotice('Это задание не требует ответа на сервере — оценка ставится вручную', 'info'));
    } else if (!(state && state.canSubmit) && !(state && state.submitted)) {
      body.appendChild(SDOUI.buildNotice('СДО не разрешает отправку ответа по этому заданию — откройте его кнопкой ниже', 'warn'));
    } else {
      body.appendChild(this.buildSubmitForm(assignment, state));
    }

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'sdo-primary-button';
    open.textContent = 'Открыть задание в СДО';
    open.addEventListener('click', () => {
      const url = assignment.url || `${SDO_BASE_URL}/mod/assign/view.php?id=${assignment.cmid}`;
      if (typeof openLink === 'function') openLink(url);
    });
    container.appendChild(open);
  },

  /** Форма ответа на задание: текст, файлы, черновик из приложения. */
  buildSubmitForm(assignment, state) {
    const form = document.createElement('div');
    form.className = 'sdo-submit';

    const title = document.createElement('p');
    title.className = 'sdo-block-title';
    title.textContent = 'Ответ на задание';
    form.appendChild(title);

    const canText = !state || state.onlineTextSupported !== false;
    const canFiles = !state || state.fileSupported !== false;
    const textarea = document.createElement('textarea');
    textarea.className = 'sdo-submit-text';
    textarea.placeholder = 'Текст ответа…';
    textarea.value = state && state.onlineText ? state.onlineText : '';
    form.appendChild(textarea);

    // ✓ Если СДО принимает только файлы (как в курсе «Алгоритмизация и программирование»),
    //   текст всё равно можно отправить — он уйдёт отдельным файлом «Ответ.txt».
    if (!canText && canFiles) {
      const hint = document.createElement('p');
      hint.className = 'sdo-submit-notice';
      hint.textContent = 'Задание принимает только файлы — текст ответа будет отправлен файлом «Ответ.txt»';
      form.appendChild(hint);
    } else if (!canText && !canFiles) {
      const hint = document.createElement('p');
      hint.className = 'sdo-submit-notice';
      hint.textContent = 'СДО не принимает ответ по этому заданию через API — отправьте его кнопкой «Открыть задание в СДО»';
      form.appendChild(hint);
    }

    // ✓ Черновик из приложения: последнее домашнее задание по этому предмету
    const draftHost = document.createElement('div');
    draftHost.className = 'sdo-draft-host';
    form.appendChild(draftHost);
    this.fillDrafts(draftHost, assignment, textarea);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'sdo-file-input';
    fileInput.multiple = true;
    const fileButton = document.createElement('button');
    fileButton.type = 'button';
    fileButton.className = 'sdo-secondary-button';
    fileButton.textContent = 'Прикрепить файлы';
    fileButton.addEventListener('click', () => fileInput.click());
    form.appendChild(fileInput);
    form.appendChild(fileButton);

    const chosen = document.createElement('p');
    chosen.className = 'sdo-file-chosen';
    chosen.textContent = 'Файлы не выбраны';
    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      chosen.textContent = files.length
        ? files.map((file) => file.name).join(', ')
        : 'Файлы не выбраны';
    });
    form.appendChild(chosen);

    const actions = document.createElement('div');
    actions.className = 'sdo-submit-actions';
    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'sdo-primary-button';
    submit.textContent = state && state.submitted ? 'Обновить ответ' : 'Отправить в СДО';
    actions.appendChild(submit);
    const openHint = document.createElement('p');
    openHint.className = 'sdo-submit-hint';
    openHint.textContent = 'Если СДО не принимает ответ из приложения, отправьте его кнопкой «Открыть задание в СДО» — так ответ точно дойдёт.';
    form.appendChild(actions);
    form.appendChild(openHint);
    actions.appendChild(submit);

    submit.addEventListener('click', async () => {
      const text = textarea.value.trim();
      const files = Array.from(fileInput.files || []);
      // ✓ Текст без поддержки онлайн-ответа отправляем файлом — иначе он просто потеряется
      if (text && !canText && canFiles && typeof File !== 'undefined') {
        files.push(new File([text], 'Ответ.txt', { type: 'text/plain' }));
      }
      if (files.length === 0 && (!text || !canText)) {
        if (typeof showNotification === 'function') showNotification('Добавьте текст ответа или файл', 'error');
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Отправляю…';
      let itemId = null;
      if (files.length) {
        for (let index = 0; index < files.length; index += 1) {
          /* eslint-disable no-await-in-loop */
          const upload = await SDOClient.uploadDraftFile(files[index], itemId === null ? 0 : itemId);
          if (!upload.success) {
            submit.disabled = false;
            submit.textContent = 'Отправить в СДО';
            if (typeof showNotification === 'function') showNotification(upload.message || 'Файл не загрузился', 'error');
            return;
          }
          itemId = upload.itemId || itemId;
        }
      }
      const params = {};
      if (text && canText) params.text = text;
      if (itemId !== null) params.filesItemId = itemId;
      const result = await SDOClient.submitAssignment(assignment.assignId, params);
      submit.disabled = false;
      submit.textContent = 'Отправить в СДО';
      if (typeof showNotification === 'function') showNotification(result.message || 'Готово', result.success ? 'success' : 'error');
      if (result.success && typeof SDOPages.buildAssignPage === 'function') {
        const host = form.parentElement;
        if (host) {
          await SDOPages.buildAssignPage(host, {
            courseId: assignment.courseId,
            courseName: assignment.courseName,
            cmid: assignment.cmid,
            moduleName: assignment.name,
          });
        }
      }
    });

    return form;
  },

  /** Тексты домашних заданий приложения по этому предмету — одним нажатием в ответ СДО. */
  async fillDrafts(host, assignment, textarea) {
    const subject = assignment.courseName || '';
    let texts = [];
    try {
      const source = (window.contentCache && typeof window.contentCache.getTexts === 'function')
        ? window.contentCache
        : window.database;
      if (source && typeof source.getTexts === 'function') {
        const result = await source.getTexts('subject', subject);
        if (result && result.success && Array.isArray(result.texts)) texts = result.texts;
      }
    } catch (_) { /* нет доступа к материалам — просто не показываем черновики */ }

    const homeworks = texts
      .filter((item) => String(item.textType || '') === 'homework' && String(item.textContent || '').trim())
      .sort((a, b) => Number(b.timestamp) || 0 - (Number(a.timestamp) || 0))
      .slice(0, 3);
    if (homeworks.length === 0) return;

    const title = document.createElement('p');
    title.className = 'sdo-draft-title';
    title.textContent = 'Черновик из приложения';
    host.appendChild(title);

    homeworks.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'sdo-draft-row';
      const text = document.createElement('p');
      text.className = 'sdo-draft-text';
      text.textContent = String(item.textContent || '').slice(0, 120);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sdo-draft-button';
      button.textContent = 'Вставить в ответ';
      button.addEventListener('click', () => {
        const current = textarea.value.trim();
        textarea.value = current ? `${current}\n\n${String(item.textContent || '')}` : String(item.textContent || '');
        if (typeof showNotification === 'function') showNotification('Текст ДЗ добавлен в ответ', 'success');
      });
      row.appendChild(text);
      row.appendChild(button);
      host.appendChild(row);
    });
  },
};

window.SDOPages = SDOPages;

/* ============================ Блок СДО внутри страницы пары ============================ */

/**
 * Блок «Задания в СДО по этой дисциплине» на странице пары.
 * Возвращает DOM-элемент (или null, если СДО не подключено либо курс не найден).
 */
async function buildSdoLessonBlock(subject) {
  if (!SDOClient.hasCredentials()) return null;
  const block = document.createElement('div');
  block.className = 'sdo-lesson-block';

  const head = document.createElement('div');
  head.className = 'sdo-lesson-head';
  const icon = document.createElement('span');
  icon.className = 'sdo-lesson-icon';
  icon.textContent = '🎓';
  const title = document.createElement('p');
  title.className = 'sdo-lesson-title';
  title.textContent = 'СДО КГУ';
  head.appendChild(icon);
  head.appendChild(title);
  block.appendChild(head);

  const body = document.createElement('div');
  body.className = 'sdo-lesson-body';
  const spinner = SDOUI.buildSpinner('Ищу задания в СДО…');
  body.appendChild(spinner);
  block.appendChild(body);

  const session = await SDOClient.ensureSession();
  if (!session.success) {
    body.innerHTML = '';
    body.appendChild(SDOUI.buildNotice(session.message || 'СДО недоступно', 'warn', {
      actionLabel: 'Открыть СДО',
      onAction: async () => { if (typeof generatePage === 'function') await generatePage('nav-sdo'); },
    }));
    if (typeof sdoBindLessonBlock === 'function') sdoBindLessonBlock(block, subject);
    return block;
  }

  const courses = await SDOClient.getCourses();
  if (!courses.success) {
    body.innerHTML = '';
    body.appendChild(SDOUI.buildNotice(courses.message || 'Курсы СДО не загрузились', 'warn'));
    return block;
  }

  const course = SDOClient.findCourseBySubject(subject, courses.courses);
  if (!course) {
    body.innerHTML = '';
    body.appendChild(SDOUI.buildNotice('Курс этой дисциплины в СДО не найден', 'info', {
      actionLabel: 'Все курсы',
      onAction: async () => { if (typeof generatePage === 'function') await generatePage('nav-sdo'); },
    }));
    return block;
  }

  let deadlines = SDOClient.deadlinesForSubject(subject, { limit: 4 });
  if (deadlines.length === 0) {
    const loaded = await SDOClient.getAssignments([course.id]);
    if (loaded.success) {
      const now = Math.floor(Date.now() / 1000);
      SDOClient.state.deadlines = (SDOClient.state.deadlines || [])
        .filter((item) => item.courseId !== course.id)
        .concat(loaded.assignments.map((item) => ({ ...item, overdue: item.dueDate > 0 && item.dueDate < now })));
      SDOClient.state.deadlinesLoaded = true;
      deadlines = SDOClient.deadlinesForSubject(subject, { limit: 4 });
    }
  }

  body.innerHTML = '';
  const courseRow = document.createElement('button');
  courseRow.type = 'button';
  courseRow.className = 'sdo-lesson-course';
  courseRow.textContent = `${course.fullName} ›`;
  courseRow.addEventListener('click', async () => {
    if (typeof navigateTo === 'function') await navigateTo('sdocourse', { courseId: course.id });
  });
  body.appendChild(courseRow);

  if (deadlines.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'sdo-lesson-empty';
    empty.textContent = 'Заданий с дедлайнами по этому курсу нет';
    body.appendChild(empty);
    return block;
  }

  deadlines.forEach((item) => {
    body.appendChild(SDOUI.buildDeadlineRow(item, async () => {
      if (typeof navigateTo === 'function') {
        await navigateTo('sdoassign', {
          courseId: item.courseId,
          courseName: item.courseName,
          cmid: item.cmid,
          moduleName: item.name,
        });
      }
    }));
  });

  return block;
}

window.buildSdoLessonBlock = buildSdoLessonBlock;
