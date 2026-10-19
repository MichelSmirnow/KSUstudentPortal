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
      applyTeacherImageFallback(teacherElement.querySelector('.teacher-image'));

      // ✓ Добавляем обработчик нажатия на учителя
      teacherElement.addEventListener('click', async () => {
        await navigateTo('teacher', teacher);
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
      const InstituteContainer = document.createElement('details');
      InstituteContainer.classList.add('kafeder-institute');
      InstituteContainer.innerHTML = `
      <summary class="institute-title" style="background-image: url(${instituteStyle.backgroundImage});">
        <div class="institute-background-image" style="background-image: linear-gradient(${instituteStyle.backgroundGradient}) !important;"></div>
        <div class="institute-title-info"><div class="institute-title-info-subcontainer" style="${instituteStyle.textShadow ? `text-shadow: ${instituteStyle.textShadow};` : ''}">
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


  // Основной метод рендера
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

// ✓ Если расписание невозможно получить из-за отсутствия интернет-соединения
function generateNoEthernetContainer() {
  const ethernetContainer = document.createElement('div');
  ethernetContainer.style.width = 'calc(100% - 20px)';
  ethernetContainer.style.margin = '0 auto';
  ethernetContainer.innerHTML = `
  <p style="font-size: 20px; margin-bottom: -5px;"><b>Нет подключения к интернету</b></p>
  <p>1) Если у вас выключен интернет, попробуйте подключиться к сети и обновить данную страницу</p>
  <p>2) Если у вас выключен VPN или PROXY сервис, попробуйте отключить его и обновить страницу</p>
  <p style="color: #333 !important; font-size: 13px !important;">Код ошибки (для тестировщиков): ETH0</p>
  <img style="width: 100%; margin-top: -30px; filter: drop-shadow(0 10px 5px rgba(2, 8, 61, 0.35));" src="images/supbanners/noEthernet.png" />`;
  return ethernetContainer;
}

/* ======== Расписание ЭЙОС: почему не загрузилось и как загрузить вручную ======== */

// ✓ Прочитать файл, который пользователь принёс сам (File или Blob)
function readSheduleFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('Файл не выбран')); return; }
    if (typeof file.text === 'function') {
      file.text().then(resolve).catch(() => reject(new Error('Не удалось прочитать файл')));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsText(file);
  });
}

// ✓ Панель «расписание не загрузилось»: честная причина вместо «нет интернета»
// и три способа загрузить расписание вручную — они работают всегда, потому что
// не требуют запроса к ЭЙОС из страницы-файла.
function generateSheduleUnavailableContainer(options) {
  const settings = options || {};
  const sheduleID = settings.sheduleID;
  const sheduleType = settings.sheduleType || 'group';
  const cacheKey = settings.cacheKey !== undefined ? settings.cacheKey : sheduleID;
  const link = typeof window.buildSheduleLink === 'function'
    ? window.buildSheduleLink(sheduleType, sheduleID)
    : undefined;

  const container = document.createElement('div');
  container.classList.add('shedule-fallback');

  const title = document.createElement('p');
  title.classList.add('shedule-fallback-title');
  title.innerHTML = 'Расписание не загрузилось из ЭЙОС';
  container.appendChild(title);

  const reason = document.createElement('p');
  reason.classList.add('shedule-fallback-reason');
  // ✓ Показываем настоящую причину сбоя запроса (её записывает ICSParser.fetch), без догадок
  const fetchError = window.lastSheduleFetchError ? String(window.lastSheduleFetchError) : '';
  reason.textContent = fetchError
    ? `ЭЙОС не ответил на запрос: ${fetchError}`
    : 'ЭЙОС не ответил на запрос';
  container.appendChild(reason);

  if (sheduleID !== undefined && sheduleID !== null && sheduleID !== '') {
    const meta = document.createElement('p');
    meta.classList.add('shedule-fallback-meta');
    meta.textContent = sheduleType === 'teacher'
      ? `Код расписания в ЭЙОС: ${sheduleID}`
      : `Расписание: ${sheduleID}`;
    container.appendChild(meta);
  }

  const explain = document.createElement('p');
  explain.classList.add('shedule-fallback-explain');
  explain.innerHTML = 'Запрос к <b>eios.kosgos.ru</b> не прошёл: сервер не ответил или соединение '
    + 'прервалось. Загрузите расписание вручную — оно сохранится на устройстве и дальше будет '
    + 'открываться как обычно.';
  container.appendChild(explain);

  const hint = document.createElement('p');
  hint.classList.add('shedule-fallback-hint');
  hint.innerHTML = '<b>Как загрузить:</b> 1) «Скачать файл расписания» — браузер сохранит файл '
    + '.ics в папку «Загрузки». 2) «Выбрать файл расписания» — укажите этот файл (или просто '
    + 'перетащите его сюда). Если файл открылся текстом — скопируйте текст и нажмите '
    + '«Вставить текст расписания», затем «Сохранить расписание».';
  container.appendChild(hint);

  const actions = document.createElement('div');
  actions.classList.add('shedule-fallback-actions');

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.classList.add('account-standartButton');
  retryButton.textContent = 'Повторить загрузку';
  retryButton.addEventListener('click', async () => {
    retryButton.disabled = true;
    retryButton.textContent = 'Загружаем…';
    if (typeof settings.onRetry === 'function') { await settings.onRetry(); return; }
    const fresh = await fetchShedule(sheduleID, sheduleType);
    if (fresh && Array.isArray(fresh) && fresh.length) {
      groupData[cacheKey] = fresh;
      await refreshCurrentPage();
      return;
    }
    retryButton.disabled = false;
    retryButton.textContent = 'Повторить загрузку';
    showNotification('ЭЙОС снова не ответил — воспользуйтесь загрузкой файла', 'error');
  });
  actions.appendChild(retryButton);

  if (link) {
    const downloadButton = document.createElement('button');
    downloadButton.type = 'button';
    downloadButton.classList.add('account-standartButton');
    downloadButton.textContent = 'Скачать файл расписания (.ics)';
    downloadButton.addEventListener('click', () => {
      // Обычный переход по ссылке: браузер просто скачивает файл расписания
      window.open(link, '_blank');
      showNotification('Файл сохраняется в папку «Загрузки», затем нажмите «Выбрать файл расписания»', 'info');
    });
    actions.appendChild(downloadButton);
  }

  const fileLabel = document.createElement('label');
  fileLabel.classList.add('account-standartButton', 'shedule-fallback-file');
  fileLabel.textContent = 'Выбрать файл расписания…';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.ics,text/calendar,text/plain';
  fileInput.hidden = true;
  fileLabel.appendChild(fileInput);
  actions.appendChild(fileLabel);

  const pasteButton = document.createElement('button');
  pasteButton.type = 'button';
  pasteButton.classList.add('account-standartButton');
  pasteButton.textContent = 'Вставить текст расписания';
  actions.appendChild(pasteButton);

  container.appendChild(actions);

  const pasteBox = document.createElement('div');
  pasteBox.classList.add('shedule-fallback-paste');
  pasteBox.hidden = true;
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'BEGIN:VCALENDAR … — вставьте сюда содержимое расписания';
  const savePastedButton = document.createElement('button');
  savePastedButton.type = 'button';
  savePastedButton.classList.add('account-standartButton');
  savePastedButton.textContent = 'Сохранить расписание';
  pasteBox.appendChild(textarea);
  pasteBox.appendChild(savePastedButton);
  container.appendChild(pasteBox);

  pasteButton.addEventListener('click', () => {
    pasteBox.hidden = !pasteBox.hidden;
    if (!pasteBox.hidden) textarea.focus();
  });

  // ✓ Общий путь для файла, перетаскивания и вставленного текста
  const applySheduleText = async (text) => {
    const result = await window.importSheduleFromText(text, sheduleID, sheduleType);
    if (!result || result.success !== true) {
      showNotification((result && result.message) || 'Не удалось прочитать расписание', 'error');
      return false;
    }
    if (cacheKey !== undefined && cacheKey !== null) groupData[cacheKey] = result.events;
    showNotification(`Расписание загружено вручную и сохранено: занятий — ${result.count}`, 'success');
    if (typeof settings.onImported === 'function') { await settings.onImported(result.events); return true; }
    await refreshCurrentPage();
    return true;
  };

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try { await applySheduleText(await readSheduleFile(file)); }
    catch (error) { showNotification(error.message || 'Не удалось прочитать файл', 'error'); }
    fileInput.value = '';
  });

  savePastedButton.addEventListener('click', async () => {
    savePastedButton.disabled = true;
    await applySheduleText(textarea.value);
    savePastedButton.disabled = false;
  });

  // ✓ Файл можно просто перетащить на панель
  container.addEventListener('dragover', (event) => {
    event.preventDefault();
    container.classList.add('shedule-fallback--drop');
  });
  container.addEventListener('dragleave', () => container.classList.remove('shedule-fallback--drop'));
  container.addEventListener('drop', async (event) => {
    event.preventDefault();
    container.classList.remove('shedule-fallback--drop');
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) return;
    try { await applySheduleText(await readSheduleFile(file)); }
    catch (error) { showNotification(error.message || 'Не удалось прочитать файл', 'error'); }
  });

  return container;
}

// ✓ Если пользователь не авторизован, а для функции требуется авторизация
function generateNoAuthContainer() {
  const noAuthContainer = document.createElement('div');
  noAuthContainer.style.width = 'calc(100% - 20px)';
  noAuthContainer.style.margin = '0 auto';
  noAuthContainer.innerHTML = `
  <b>Эта функция доступна только авторизованным пользователям :/</b>
  <p>Пройдите регистрацию или войдите в уже существующий аккаунт, чтобы использовать все функции приложения</p>
  <button class="guest-button" onclick="(async () => { await window.auth.logout(); auth.endSession(); })();">Перейти на страницу авторизации</button>
  <p style="color: #333 !important; font-size: 13px !important;">Код ошибки (для тестировщиков): NOAUTH</p>
  <img style="width: 100%; margin-top: -30px; filter: drop-shadow(0 10px 5px rgba(2, 8, 61, 0.35)); src="images/supbanners/ " />`;
  return noAuthContainer;
}


/* ======== Преподаватели: заглушка фото и поиск по данным расписания ======== */

// ✓ Заглушка «человек-аккаунт-профиль», если фото преподавателя не нашлось
const TEACHER_DUMMY_IMAGE = 'images/teachers/no-photo.jpg';

// ✓ Если фото не загрузилось — мгновенно подставляем заглушку
function applyTeacherImageFallback(imageElement) {
  if (!imageElement || imageElement.dataset.teacherFallback === 'ready') return imageElement || null;
  imageElement.dataset.teacherFallback = 'ready';
  imageElement.addEventListener('error', () => {
    if (imageElement.dataset.teacherFallback === 'applied') return;
    imageElement.dataset.teacherFallback = 'applied';
    imageElement.src = TEACHER_DUMMY_IMAGE;
  });
  if (imageElement.complete && imageElement.naturalWidth === 0) {
    imageElement.dataset.teacherFallback = 'applied';
    imageElement.src = TEACHER_DUMMY_IMAGE;
  }
  return imageElement;
}

// ✓ Нормализация ФИО: «ё» → «е», пробелы, точки, регистр
function normalizeTeacherName(value) {
  return String(value || '')
    .replace(/\u0451/g, '\u0435').replace(/\u0401/g, '\u0415')
    .replace(/\./g, '. ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ✓ «Марголина Н.Л.» и «Марголина Наталия Львовна» → «марголина н л»
function teacherInitialsKey(value) {
  const parts = String(value || '').replace(/\./g, ' . ').split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const surname = normalizeTeacherName(parts[0]);
  const letters = parts.slice(1).filter((part) => part !== '.').map((part) => part[0].toLowerCase());
  if (!surname || letters.length < 2) return null;
  return `${surname} ${letters.join(' ')}`;
}

// ✓ Найти преподавателя по строке расписания («Ф И.О.»), ключу или полному ФИО
function findTeacherRecord(query) {
  const raw = String(query || '').trim();
  if (!raw || typeof teachersData === 'undefined') return null;
  const byKey = new Map();
  const byFull = new Map();
  const byInitials = new Map();
  Object.entries(teachersData).forEach(([instituteName, departments]) => {
    Object.entries(departments).forEach(([departmentName, teachersObj]) => {
      Object.entries(teachersObj).forEach(([key, teacher]) => {
        const record = { ...teacher, key, instituteName, departmentName };
        const full = normalizeTeacherName(teacher.fullName);
        const initials = teacherInitialsKey(teacher.fullName);
        // Один человек может числиться на двух кафедрах — берём карточку с более полными данными
        record.teacherScore = (record.sheduleCode ? 2 : 0)
          + ((Array.isArray(record.courses) && record.courses.length) ? 1 : 0)
          + (record.academicDegree ? 1 : 0);
        const put = (map, mapKey) => {
          if (!mapKey) return;
          const previous = map.get(mapKey);
          if (!previous || record.teacherScore > (previous.teacherScore || 0)) map.set(mapKey, record);
        };
        put(byKey, key);
        put(byFull, full);
        put(byInitials, initials);
      });
    });
  });
  // Строка из расписания может содержать «хвост» («Киприна Л.Ю. группа: 26-ИСбо-4») — берём и укороченные варианты
  const words = raw.split(/\s+/).filter(Boolean);
  const variants = new Set([raw]);
  for (let length = Math.min(4, words.length); length >= 2; length -= 1) {
    variants.add(words.slice(0, length).join(' '));
  }
  const attempts = [];
  variants.forEach((variant) => {
    attempts.push(variant, normalizeTeacherName(variant), teacherInitialsKey(variant));
  });
  for (const attempt of attempts) {
    if (!attempt) continue;
    if (byKey.has(attempt)) return byKey.get(attempt);
    if (byFull.has(attempt)) return byFull.get(attempt);
    if (byInitials.has(attempt)) return byInitials.get(attempt);
  }
  return null;
}

// ✓ Вкладка «Информация»: все общедоступные сведения о преподавателе
function generateTeacherInfoContainer(teacher) {
  const block = (title, body) => (body ? `<div class="teacher-subpage-section"><p class="teacher-subpage-section-title">${title}</p>${body}</div>` : '');
  const row = (label, value) => (value ? `<p class="teacher-subpage-row"><span>${label}</span><b>${value}</b></p>` : '');
  const courses = Array.isArray(teacher.courses) ? teacher.courses.filter(Boolean) : [];

  const common = [
    row('Учёная степень', teacher.academicDegree),
    row('Учёное звание', teacher.academicTitle),
    row('Должность', teacher.workPost),
    row('Институт', teacher.instituteName),
    row('Кафедра', teacher.departmentName),
  ].join('');

  const contacts = [
    row('Электронная почта', teacher.email),
    row('Телефон', teacher.phone),
    row('Адрес', teacher.address),
  ].join('');

  const coursesList = courses.length
    ? `<div class="teacher-course-list">${courses.map((course) => `<span class="teacher-course">${course}</span>`).join('')}</div>`
    : `<p class="teacher-subpage-empty">Список дисциплин пока не заполнен</p>`;

  const extra = Array.isArray(teacher.extra) && teacher.extra.length
    ? `<ul class="teacher-subpage-list">${teacher.extra.map((item) => `<li>${item}</li>`).join('')}</ul>`
    : '';

  return `
    ${block('Общие сведения', common)}
    ${block('Дисциплины', coursesList)}
    ${block('Контакты', contacts)}
    ${block('Образование', teacher.education ? `<p>${teacher.education}</p>` : '')}
    ${block('Опыт работы', teacher.experience ? `<p>${teacher.experience}</p>` : '')}
    ${block('Профессиональные интересы', teacher.interests ? `<p>${teacher.interests}</p>` : '')}
    ${block('Дополнительно', extra)}
    ${teacher.sheduleCode ? `<p class="teacher-subpage-hint">Код расписания в ЭЙОС: ${teacher.sheduleCode}</p>` : ''}
  `;
}

/* ======== Генерация основного контента страницы (нижнее навигационное меню) ======== */

// ✓ Объявление кнопок закрепленного интерфейса
let navOpened = 'nav-shedule'; // Текущая открытая страниsца навигационного меню
const navPosition = {          // Расположение кнопок слева направо
  'web': 0,
  'nav-kafeder': 1,
  'nav-homework': 2,
  'nav-shedule': 3,
  'nav-sdo': 4,
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

  } else if (id === 'nav-homework') {
    generatePageContentContainer.innerHTML = `
      <div class="relative-container" id="subcontainer">
        <div class="flex-container info-container">
          <div class="banner-half">
            <h3>Материалы и задания</h3>
            <p>Домашние задания и учебные материалы по занятиям</p>
          </div>
          <img class="banner-half" src="images/supbanners/homework.png"/>
        </div>
        <div id="homework-container"></div>
      </div>`;

    const homeworkContainer =
      generatePageContentContainer.querySelector('#homework-container');

    if (!window.auth.isAuthenticated()) {
      homeworkContainer.appendChild(generateNoAuthContainer());
    } else {
      try {
        if (!groupData[CurrentGroup]) {
          groupData[CurrentGroup] = await fetchShedule(CurrentGroup, 'group');
        }

        if (!groupData[CurrentGroup]) {
          homeworkContainer.appendChild(generateSheduleUnavailableContainer({
            sheduleID: CurrentGroup,
            sheduleType: 'group',
            cacheKey: CurrentGroup,
          }));
        } else {
          const renderer = new window.HomeworkRenderer(groupData[CurrentGroup]);
          homeworkContainer.appendChild(renderer.render());
        }
      } catch (err) {
        homeworkContainer.innerHTML = generateErrorContainer(err);
      }
    }

    return generatePageContentContainer;
  } else if (id === 'nav-shedule') {   // ✓ Окно расписания
    const sheduleContainer = document.createElement('div');
    sheduleContainer.id = 'shedule-container';
    // ✓ Кнопка «Создать» — только у старост, профоргов, культоргов и администраторов
    setTimeout(mountScheduleCreateButton, 0);
    exitBlock: { try {
      if (!groupData[CurrentGroup]) {
        groupData[CurrentGroup] = await fetchShedule(CurrentGroup, 'group');
        if (!groupData[CurrentGroup]) {
          sheduleContainer.appendChild(generateSheduleUnavailableContainer({
            sheduleID: CurrentGroup,
            sheduleType: 'group',
            cacheKey: CurrentGroup,
          }));
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

  } else if (id === 'nav-sdo') {       // ✓ Окно СДО КГУ (Moodle)

    generatePageContentContainer.innerHTML = `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>СДО КГУ</h3>
          <p>Курсы, задания, материалы и сроки сдачи из системы дистанционного обучения</p>
        </div>
        <img class="banner-half" src="images/supbanners/sdo.png"/>
      </div>
      <div id="sdo-container"></div>
    </div>`;

    const sdoContainer = generatePageContentContainer.querySelector('#sdo-container');

    // ✓ Гость не получает доступ вообще
    if (!window.auth.isAuthenticated()) {
      sdoContainer.appendChild(generateNoAuthContainer());
      return generatePageContentContainer;
    }
    // ✓ Без интернета вкладка не работает
    if (navigator.onLine === false) {
      sdoContainer.appendChild(generateNoEthernetContainer());
      return generatePageContentContainer;
    }

    await renderSdoPage(sdoContainer);
    return generatePageContentContainer;

  } else if (id === 'nav-account') {   // Окно аккаунта

    generatePageContentContainer.innerHTML = `
    <div class="flex-container info-container">
      <div class="banner-half">
        <h3>Сервисы</h3>
        <p>Дополнительные опции приложения</p>
      </div>
      <img class="banner-half" src="images/supbanners/services.png"/>
    </div>
    <button onclick="navigateTo('adminpanel')" class="account-service-button" id="account-service-admin">
      <img src="images/ui/admin.png" />  
      <div class="account-service-button-subcontainer"><p><b>Панель администратора</b></p><p style="font-size: 13px;">Управление приложением</p></div>
    </button>
    <button onclick="(async () => { await navigateTo('profile'); })();" class="account-service-button" id="account-service-profile">
      <img src="images/ui/settings.png" />  
      <div class="account-service-button-subcontainer"><p><b>Настройки</b></p><p style="font-size: 13px;">Профиль, достижения, данные, стилизация</p></div>
    </button>
    <button onclick="(async () => { await navigateTo('feedback'); })();" class="account-service-button" id="account-service-callback">
      <img src="images/ui/callback.png" />  
      <div class="account-service-button-subcontainer"><p><b>Обратная связь</b></p><p style="font-size: 13px;">Задать вопрос администрации</p></div>
    </button>
    `;
    // ✓ Отдельной кнопки «Фидбек» у администраторов здесь больше нет: это та же самая обратная связь.
    // Ответы на обращения живут в единственной вкладке «Фидбек» панели администратора.

  } else if (id === 'notifications') { // ✓ События и уведомления по дням
    generatePageContentContainer.innerHTML = `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Объявления</h3>
          <p>События и уведомления от старосты, профорга, культорга и администраторов</p>
        </div>
        <img class="banner-half" src="images/supbanners/notifications.png"/>
      </div>
    </div>
    `;
    await renderNotificationsPage(generatePageContentContainer.querySelector('#subcontainer'));
    return generatePageContentContainer;
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
    `;
    return generatePageContentContainer;
  } else { // Страница не найдена, ошибка 404
    return `
    <img src="images/supbanners/404.jpg" class="banner-half" style="width: 100% !important;"/>
    <h1>Пустая страница</h1>
    <p>Тут пока ничего нету прикинь</p>
    `;
  }
  return generatePageContentContainer;
}

// ✓ Функция генерации страницы 
async function generatePage(id, skip) {
  if (!id) throw new Error('Страницы не существует');
  animationInProgress = true;
  if (LOADING_ANIMATIONS) flag.loading = true;
  // ✓ Кнопка создания события живёт только на странице расписания
  if (id !== 'nav-shedule' && typeof unmountScheduleCreateButton === 'function') unmountScheduleCreateButton();
  // ✓ Открытие новой страницы всегда начинается с верха: страница не «скачет» от предыдущей
  resetScrollPositions();
  appState.page = "home";
  history.replaceState( { page: "home" }, "", "#home" );
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
    // ✓ Первичный рендер заменяет содержимое, а не дописывается к нему:
    //   иначе при повторной инициализации страница показывалась дважды подряд.
    containerMain.innerHTML = '';
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
    resetScrollPositions({ keepSubpage: true });
    animationInProgress = false;
  }, 500);
}


/* ======== Генерация перекрывающего контента страницы ======== */

// Генерация перекрывающего контента на перекрывающем окне
/* ============================================================================================
 * Вкладка «СДО КГУ»: вход, список курсов, ближайшие дедлайны
 * ========================================================================================== */

/**
 * Точка входа вкладки СДО.
 * Первый вход — форма логина и пароля; дальше — автоматический вход сохранёнными данными.
 */
async function renderSdoPage(container) {
  if (!container) return;
  container.innerHTML = '';
  if (typeof window.SDOClient === 'undefined') {
    container.appendChild(window.SDOUI.buildNotice('Модуль СДО не загружен', 'error'));
    return;
  }
  if (!window.SDOClient.hasCredentials()) {
    container.appendChild(window.SDOPages.buildLoginForm({
      onSuccess: async () => { await renderSdoCourses(container, { force: true }); },
    }));
    return;
  }
  await renderSdoCourses(container);
}

/** Список курсов СДО и ближайшие сроки сдачи. */
async function renderSdoCourses(container, options = {}) {
  const settings = options || {};
  container.innerHTML = '';
  const spinner = window.SDOUI.buildSpinner('Подключаюсь к СДО…');
  container.appendChild(spinner);

  const session = await window.SDOClient.ensureSession();
  if (!session.success) {
    container.innerHTML = '';
    if (session.needLogin) {
      container.appendChild(window.SDOPages.buildLoginForm({
        onSuccess: async () => { await renderSdoCourses(container, { force: true }); },
      }));
      return;
    }
    container.appendChild(window.SDOUI.buildNotice(session.message || 'СДО недоступно', 'error', {
      actionLabel: 'Повторить',
      onAction: async () => { await renderSdoCourses(container, { force: true }); },
      hint: 'Если ошибка повторяется — сервер СДО запрещает прямые запросы из приложения (CORS). В этом случае открывайте курсы кнопками «Открыть в СДО».',
    }));
    return;
  }

  const sortMode = settings.sort === 'recent' ? 'recent' : 'name';
  let courses = await window.SDOClient.getCourses({
    force: settings.force === true,
    classification: settings.classification || 'all',
  });
  container.innerHTML = '';
  container.appendChild(window.SDOUI.buildHeader({ onExit: async () => { await renderSdoPage(container); } }));

  // ✓ Такие же подборки, как на странице «Мои курсы» в СДО
  const tabs = document.createElement('div');
  tabs.className = 'flex-container radio-container sdo-tabs';
  const activeTab = String(settings.classification || 'all');
  const drawTabs = () => {
    tabs.innerHTML = '';
    (window.SDOClient.CLASSIFICATIONS || []).forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'radio-button' + (item.id === activeTab ? ' selected' : '');
      button.textContent = item.label;
      button.addEventListener('click', async () => {
        if (item.id === activeTab) return;
        await renderSdoCourses(container, { classification: item.id, sort: sortMode });
      });
      tabs.appendChild(button);
    });
  };
  drawTabs();
  container.appendChild(tabs);

  if (!courses.success) {
    container.appendChild(window.SDOUI.buildNotice(courses.message || 'Курсы СДО не загрузились', 'error', {
      actionLabel: 'Повторить',
      onAction: async () => { await renderSdoCourses(container, { force: true, classification: 'all', sort: sortMode }); },
    }));
    return;
  }

  // ✓ Сортировка: по названию (как в СДО) или по последнему посещению
  const sortTabs = document.createElement('div');
  sortTabs.className = 'flex-container radio-container sdo-tabs sdo-tabs--sort';
  [['name', 'По названию'], ['recent', 'Недавние']].forEach(([id, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'radio-button' + (id === sortMode ? ' selected' : '');
    button.textContent = label;
    button.addEventListener('click', async () => {
      if (id === sortMode) return;
      await renderSdoCourses(container, { classification: activeTab, sort: id });
    });
    sortTabs.appendChild(button);
  });
  container.appendChild(sortTabs);

  if (sortMode === 'recent' && courses.courses) {
    courses = { success: true, courses: [...courses.courses].sort((a, b) => (b.lastAccess || 0) - (a.lastAccess || 0)) };
  }

  // ✓ Поиск по курсам — сверху, чтобы не прокручивать длинный список
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'sdo-search';
  search.placeholder = 'Поиск по курсам';
  container.appendChild(search);

  // ✓ Ближайшие сроки сдачи: догружаются следом, одним запросом по всем курсам
  const deadlinesHost = document.createElement('div');
  deadlinesHost.className = 'sdo-deadlines';
  container.appendChild(deadlinesHost);
  const deadlineSpinner = window.SDOUI.buildSpinner('Загружаю сроки сдачи…');
  deadlinesHost.appendChild(deadlineSpinner);

  const listHost = document.createElement('div');
  listHost.className = 'sdo-course-list';
  container.appendChild(listHost);

  const drawCourses = (filter) => {
    const query = window.SDOClient.normalizeName(filter || '');
    const filtered = courses.courses.filter((course) => {
      if (!query) return true;
      return course.key.includes(query) || String(course.shortName || '').toLowerCase().includes(query);
    });
    listHost.innerHTML = '';
    if (filtered.length === 0) {
      listHost.appendChild(window.SDOUI.buildNotice('Курсов по такому запросу нет', 'info'));
      return;
    }
    const title = document.createElement('p');
    title.className = 'sdo-block-title';
    title.textContent = `Мои курсы (${filtered.length})`;
    listHost.appendChild(title);
    filtered.forEach((course) => {
      listHost.appendChild(window.SDOUI.buildCourseCard(course, async (selected) => {
        if (typeof navigateTo === 'function') await navigateTo('sdocourse', { courseId: selected.id });
      }));
    });
  };

  search.addEventListener('input', () => drawCourses(search.value));
  drawCourses('');

  // ✓ Обновить список курсов по кнопке
  const refresh = document.createElement('button');
  refresh.type = 'button';
  refresh.className = 'sdo-secondary-button';
  refresh.textContent = 'Обновить курсы';
  refresh.addEventListener('click', async () => {
    await renderSdoCourses(container, { force: true, classification: activeTab, sort: sortMode });
  });
  container.appendChild(refresh);

  // ✓ Дедлайны тянем в фоне, чтобы список курсов появился сразу
  (async () => {
    const result = await window.SDOClient.getDeadlines({ force: settings.force === true });
    deadlinesHost.innerHTML = '';
    if (!result.success) {
      deadlinesHost.appendChild(window.SDOUI.buildNotice(result.message || 'Сроки сдачи не загрузились', 'warn', {
        actionLabel: 'Повторить',
        onAction: async () => { await renderSdoCourses(container, { force: true }); },
      }));
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const upcoming = (result.deadlines || [])
      .filter((item) => item.dueDate && item.dueDate >= now - 86400)
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 8);
    const title = document.createElement('p');
    title.className = 'sdo-block-title';
    title.textContent = 'Ближайшие сроки сдачи';
    deadlinesHost.appendChild(title);
    if (upcoming.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'sdo-lesson-empty';
      empty.textContent = 'Ближайших дедлайнов нет — можно выдохнуть';
      deadlinesHost.appendChild(empty);
      return;
    }
    upcoming.forEach((item) => {
      deadlinesHost.appendChild(window.SDOUI.buildDeadlineRow(item, async (selected) => {
        if (typeof navigateTo === 'function') {
          await navigateTo('sdoassign', {
            courseId: selected.courseId,
            courseName: selected.courseName,
            cmid: selected.cmid,
            moduleName: selected.name,
          });
        }
      }));
    });
  })();
}

async function generateSubpageContent(id, data) {
  if (!data) { }

  // ✓ Получить данные о преподавателе (полная карточка из teachersData)
  function extractTeachersData(teacher) {
    return findTeacherRecord(teacher);
  }

  // ✓ Отформатировать дату публикации
  function formatDateCustom(inputDate) {
    const date = new Date(inputDate);
    if (isNaN(date.getTime())) { return "Некорректная дата"; }
    const pad = (num) => String(num).padStart(2, '0');
    const seconds = pad(date.getSeconds());
    const minutes = pad(date.getMinutes());
    const hours = pad(date.getHours());
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${hours}:${minutes}:${seconds}, ${day}.${month}.${year}`;
  }

  // Сгенерировать контент материалов/домашних заданий
  function generateMaterialsData(datas) {
    const generateMaterialsContainer = document.createElement('div');
    datas.forEach((object, index) => {
      const dataSubcontainer = document.createElement('div');
      dataSubcontainer.classList.add('materials-info-container');
      const prenormalizedData = new Date(object.timestamp);
      const normalizedData = formatDateCustom(prenormalizedData);
      dataSubcontainer.innerHTML = `
      <div class="flex-container">
        <p class="materials-author">${object.author}</p> | 
        <p class="materials-material">${object.userGroup}</p>
      </div>
      <p class="materials-content">${object.textContent}</p>
      <div class="flex-container">
        <p class="materials-id">${object.textId}</p>
        <p class="materials-data">${normalizedData}</p>
      </div>`;
      generateMaterialsContainer.appendChild(dataSubcontainer);
    });
    return generateMaterialsContainer.innerHTML;
  }

  const generatePageContentContainer = document.createElement('div');
  generatePageContentContainer.id = 'subpage';
  if (id === 'lesson') { // ✓ Перекравающее окно информации о занятии (data - элемент расписания)

    // ✓ data может быть как самим занятием, так и объектом { event, source }.
    // Источник перехода решает, какую вкладку домашнего задания открыть первой:
    // из списка ДЗ — «ДЗ на эту пару», из расписания и материалов — «ДЗ на следующую пару».
    const lessonSource = data && data.event ? (data.source || 'schedule') : 'schedule';
    const lessonData = data && data.event ? data.event : data;

    // ✓ Получаем данные о занятии и преподавателе для отображения
    generatePageContentContainer.style.position = 'relative';
    const extractedData = ScheduleRenderer.extractElementData(lessonData);
    const teacherRecord = extractTeachersData(extractedData.teacher);
    const teacherData = teacherRecord || { fullName: extractedData.teacher || 'Преподаватель С.', image: TEACHER_DUMMY_IMAGE };

    // ✓ По клику на фото или имя преподавателя открываем его страницу
    const bindLessonTeacherLinks = () => {
      const photo = generatePageContentContainer.querySelector('.materials-teacher');
      const name = generatePageContentContainer.querySelector('.materials-teacher-name');
      [photo, name].forEach((node) => {
        if (!node || node.dataset.teacherLink === 'ready') return;
        node.dataset.teacherLink = 'ready';
        node.classList.add('materials-teacher-clickable');
        node.addEventListener('click', async (event) => {
          event.stopPropagation();
          if (!teacherRecord) return;
          await navigateTo('teacher', teacherRecord);
        });
      });
      applyTeacherImageFallback(photo);
    };
    const extractedSubject = extractedData.subject 
      ? ((extractedData.subject).length > 66
        ? `${(extractedData.subject).substring(0,66)}...`
        : extractedData.subject)
      : `Безымянная пара`;

    // Если пользователь авторизован, показываем материалы
    if (window.auth.isAuthenticated()) {

      // ✓ Наполняем контейнер контентом
      generatePageContentContainer.innerHTML = `
      <div class="info-container"><div class="relative-container" style="height: 200px !important">
        <img class="materials-teacher" src="${teacherData.image}"/>
        <div class="materials-teacher-info" style="border-left: 5px solid ${extractedData.subjectMatchColor ? extractedData.subjectMatchColor : `rgb(0,0,0)`}">
          <p class="materials-teacher-name"><span>${teacherData.fullName ? teacherData.fullName : `Преподаватель С.`}<span></p>
          <p><b>${extractedSubject}</b></p>
          <p><span style="font-size: 14px;">${extractedData.name ? extractedData.name : `Занятие`}</span></p>
          <p><span style="font-size: 14px;">Аудитория - </span><b>${extractedData.room ? extractedData.room : `Туалет`}</b></p>
        </div>
      </div></div>`;

      bindLessonTeacherLinks();

      // Сначала добавьте сюда существующую верхнюю карточку преподавателя и пары.
      generatePageContentContainer.appendChild(
        await window.HomeworkRenderer.renderLessonContents(lessonData, { source: lessonSource })
      );

      // ✓ СДО КГУ: задания и сроки сдачи по этой дисциплине подгружаются следом
      if (typeof window.buildSdoLessonBlock === 'function') {
        const sdoBlockHost = document.createElement('div');
        generatePageContentContainer.appendChild(sdoBlockHost);
        window.buildSdoLessonBlock(extractedData.subject || extractedSubject)
          .then((sdoBlock) => {
            if (!sdoBlockHost.isConnected) return;
            if (sdoBlock) { sdoBlockHost.innerHTML = ''; sdoBlockHost.appendChild(sdoBlock); }
            else sdoBlockHost.remove();
          })
          .catch(() => { if (sdoBlockHost.isConnected) sdoBlockHost.remove(); });
      }

    } else { // ✓ Если пользовать не авторизован, намекаем ему зарегистрироваться
      generatePageContentContainer.innerHTML = `
      <div class="info-container"><div class="relative-container" style="height: 200px !important">
        <img class="materials-teacher" src="${teacherData.image}"/>
        <div class="materials-teacher-info" style="border-left: 5px solid ${extractedData.subjectMatchColor ? extractedData.subjectMatchColor : `rgb(0,0,0)`}">
          <p class="materials-teacher-name"><span>${teacherData.fullName ? teacherData.fullName : `Преподаватель С.`}<span></p>
          <p><b>${extractedSubject}</b></p>
          <p><span style="font-size: 14px;">${extractedData.name ? extractedData.name : `Занятие`}</span></p>
          <p><span style="font-size: 14px;">Аудитория - </span><b>${extractedData.room ? extractedData.room : `Туалет`}</b></p>
        </div>
      </div></div>`;
      bindLessonTeacherLinks();
      generatePageContentContainer.appendChild(generateNoAuthContainer());
    }

  } else if (id === 'teacher') { // ✓ Страница преподавателя: вкладки «Информация» и «Расписание»
    const teacherData = data || {};
    const teacherPlace = [teacherData.instituteName, teacherData.departmentName].filter(Boolean);

    // ✓ Шапка — та же карточка, что и в окне информации о паре (ui.js: lesson),
    // только фото крупнее. Разметка и классы берутся из перекрывающего окна занятия.
    const teacherHeader = document.createElement('div');
    teacherHeader.classList.add('info-container');
    const teacherDegreeLine = [teacherData.academicDegree, teacherData.academicTitle].filter(Boolean).join(', ');
    teacherHeader.innerHTML = `
      <div class="relative-container teacher-subpage-hero" style="height: 200px !important">
        <img class="materials-teacher" src="${teacherData.image || TEACHER_DUMMY_IMAGE}" alt="${teacherData.fullName || 'Преподаватель'}">
        <div class="materials-teacher-info" style="border-left: 5px solid #667eea">
          <p class="materials-teacher-name"><span>${teacherData.fullName || 'Преподаватель'}</span></p>
          ${teacherData.workPost ? `<p><b>${teacherData.workPost}</b></p>` : ''}
          ${teacherDegreeLine ? `<p><span style="font-size: 14px;">${teacherDegreeLine}</span></p>` : ''}
          ${teacherPlace.length ? `<p><span style="font-size: 13px;">${teacherPlace.join(' · ')}</span></p>` : ''}
        </div>
      </div>`;
    applyTeacherImageFallback(teacherHeader.querySelector('.materials-teacher'));
    generatePageContentContainer.appendChild(teacherHeader);

    // ✓ Две переключаемые вкладки — тот же вид, что и в других разделах приложения
    const teacherTabs = document.createElement('div');
    teacherTabs.classList.add('flex-container', 'radio-container', 'teacher-subpage-tabs');

    const teacherInfoTab = document.createElement('button');
    teacherInfoTab.type = 'button';
    teacherInfoTab.classList.add('radio-button', 'selected');
    teacherInfoTab.textContent = 'Информация';

    const teacherScheduleTab = document.createElement('button');
    teacherScheduleTab.type = 'button';
    teacherScheduleTab.classList.add('radio-button');
    teacherScheduleTab.textContent = 'Расписание';

    teacherTabs.appendChild(teacherInfoTab);
    teacherTabs.appendChild(teacherScheduleTab);
    generatePageContentContainer.appendChild(teacherTabs);

    const teacherInfoPane = document.createElement('div');
    teacherInfoPane.classList.add('teacher-subpage-pane');
    teacherInfoPane.innerHTML = generateTeacherInfoContainer(teacherData);

    const teacherSchedulePane = document.createElement('div');
    teacherSchedulePane.classList.add('teacher-subpage-pane');
    teacherSchedulePane.hidden = true;

    generatePageContentContainer.appendChild(teacherInfoPane);
    generatePageContentContainer.appendChild(teacherSchedulePane);

    // ✓ Расписание подгружается один раз — при первом открытии вкладки
    // Ключ кэша привязан к коду расписания: у одного преподавателя может быть
    // несколько карточек (разные кафедры), и расписание у них общее.
    let teacherScheduleRequested = false;
    const teacherScheduleKey = `teacher:${teacherData.sheduleCode || teacherData.fullName || ''}`;
    async function ensureTeacherSchedule(force = false) {
      if (teacherScheduleRequested && !force) return;
      teacherScheduleRequested = true;
      teacherSchedulePane.innerHTML = `<p class="teacher-subpage-loading">Загружаем расписание преподавателя…</p>`;

      if (!teacherData.sheduleCode) {
        teacherSchedulePane.innerHTML = `
          <div class="teacher-subpage-note">
            <p><b>Код расписания не указан</b></p>
            <p style="font-size: 13px;">Для этого преподавателя в базе ЭЙОС пока нет кода расписания, поэтому пары недоступны.</p>
          </div>`;
        return;
      }

      let teacherSchedule;
      let teacherFetchError = '';
      try {
        if (force) delete groupData[teacherScheduleKey];
        if (!groupData[teacherScheduleKey]) {
          groupData[teacherScheduleKey] = await fetchShedule(teacherData.sheduleCode, 'teacher');
        }
        teacherSchedule = groupData[teacherScheduleKey];
      } catch (error) {
        teacherFetchError = (error && error.message) ? error.message : String(error);
        console.warn('Не удалось получить расписание преподавателя:', error);
      }

      teacherSchedulePane.innerHTML = '';
      if (!teacherSchedule || !Array.isArray(teacherSchedule) || teacherSchedule.length === 0) {
        // Здесь важно не подменять причину: раньше на любую неудачу показывалась
        // заглушка «нет подключения к интернету», поэтому реальная ошибка терялась.
        if (teacherFetchError) {
          const errorNote = document.createElement('p');
          errorNote.classList.add('teacher-subpage-note');
          errorNote.style.fontSize = '13px';
          errorNote.textContent = `Ошибка запроса: ${teacherFetchError}`;
          teacherSchedulePane.appendChild(errorNote);
        }
        teacherSchedulePane.appendChild(generateSheduleUnavailableContainer({
          sheduleID: teacherData.sheduleCode,
          sheduleType: 'teacher',
          cacheKey: teacherScheduleKey,
          // «Повторить» — снова идём в сеть, «импорт» — показываем то, что уже сохранено
          onRetry: async () => { teacherScheduleRequested = false; await ensureTeacherSchedule(true); },
          onImported: async () => { teacherScheduleRequested = false; await ensureTeacherSchedule(); },
        }));
        return;
      }

      const teacherScheduleRenderer = new ScheduleRenderer(teacherSchedule);
      teacherSchedulePane.appendChild(teacherScheduleRenderer.render('week', true));
    }

    const setTeacherTab = (mode) => {
      const infoActive = mode === 'info';
      teacherInfoTab.classList.toggle('selected', infoActive);
      teacherScheduleTab.classList.toggle('selected', !infoActive);
      teacherInfoPane.hidden = !infoActive;
      teacherSchedulePane.hidden = infoActive;
      if (!infoActive) ensureTeacherSchedule();
    };

    teacherInfoTab.addEventListener('click', () => setTeacherTab('info'));
    teacherScheduleTab.addEventListener('click', () => setTeacherTab('schedule'));
  } else if (id === 'profile') { // ✓ Личный кабинет: профиль, достижения и настройки
    if (!window.auth.isAuthenticated()) {
      generatePageContentContainer.innerHTML = `
      <div class="info-container">
        <div>
          <p><b>Анонимный гость</b></p>
          <p>Почта не указана</p>
        </div>
      </div>`;
      return generatePageContentContainer;
    }
    await renderProfileSubpage(generatePageContentContainer, data);

  } else if (id === 'eventcreate') { // ✓ Создание события или уведомления
    await renderEventCreateSubpage(generatePageContentContainer, data);
  } else if (id === 'eventshow') {   // ✓ Полная информация о событии или уведомлении
    await renderEventShowSubpage(generatePageContentContainer, data);
  } else if (id === 'sdocourse') {   // ✓ Курс СДО: разделы и элементы курса
    await window.SDOPages.buildCoursePage(generatePageContentContainer, data);
  } else if (id === 'sdomodule') {   // ✓ Элемент курса СДО: файл, ссылка, страница, тест
    await window.SDOPages.buildModulePage(generatePageContentContainer, data);
  } else if (id === 'sdoassign') {   // ✓ Задание СДО: дедлайн, статус сдачи и отправка ответа
    await window.SDOPages.buildAssignPage(generatePageContentContainer, data);
  } else if (id === 'userprofile') { // ✓ Предосмотр чужого аккаунта (почты не видно)
    await renderUserProfileSubpage(generatePageContentContainer, data);

  } else if (id === 'feedback') { // ✓ Обратная связь: вопрос как публикация и ответ администрации
    await renderFeedbackSubpage(generatePageContentContainer);

  } else if (id === 'addmatr') { // ✓ Публикация материала/ДЗ (в том числе редактирование)
    const addData = data && data.event
      ? data
      : { event: data, fixedType: null };
    const lessonEvent = addData.event;
    const fixedType = addData.fixedType === 'homework' || addData.fixedType === 'material'
      ? addData.fixedType
      : null;
    const editData = addData.edit && typeof addData.edit === 'object' ? addData.edit : null;
    const returnSource = addData.source || 'materials';
    let imageUploader = null;
    const destroyUploader = () => { if (imageUploader && typeof imageUploader.destroy === 'function') imageUploader.destroy(); };
    /**
     * Закрыть страницу публикации и вернуться туда, откуда пришли:
     *  • если публикация открывалась поверх другой страницы — просто закрываем её (шаг назад);
     *  • если открывалась с главной — закрываем все перекрывающие окна и уходим на главную.
     */
    const backToLesson = async () => {
      destroyUploader();
      const previous = (history.state && history.state.previous) ? history.state.previous : null;
      const previousPage = previous && previous.page ? String(previous.page) : '';
      if (previousPage && previousPage !== 'addmatr') {
        if (previousPage === 'home') { closeAllSubpages(); return; }
        history.back();
        return;
      }
      // Совсем некуда возвращаться — открываем страницу пары
      await navigateTo('lesson', { event: lessonEvent, source: returnSource });
    };

    // ✓ Шапка страницы публикации: сразу видно, к какой паре прикрепляем материал
    const addHeader = document.createElement('div');
    addHeader.classList.add('info-container');
    let addHeaderSubject = 'Занятие';
    let addHeaderMeta = '';
    try {
      const extractedForHeader = ScheduleRenderer.extractElementData(lessonEvent);
      addHeaderSubject = extractedForHeader.subject || lessonEvent.summary || 'Занятие';
      const startForHeader = justifyDate(lessonEvent.startTime);
      addHeaderMeta = `${extractedForHeader.name || 'Занятие'} · ${ScheduleRenderer.formatDate(startForHeader)} · ${extractedForHeader.startTime}`;
    } catch (error) { addHeaderSubject = lessonEvent.summary || 'Занятие'; }
    addHeader.innerHTML = `
      <p><b>${addHeaderSubject}</b></p>
      <p style="font-size: 13px;">${addHeaderMeta}</p>`;
    generatePageContentContainer.appendChild(addHeader);

    if (editData) {
      const editNote = document.createElement('p');
      editNote.classList.add('materials-edit-note');
      editNote.textContent = 'Редактирование публикации: после нажатия «Опубликовать» старая версия удаляется, а новая снова отправляется на проверку администрации.';
      generatePageContentContainer.appendChild(editNote);
    }

    // ✓ Всё, что заполняет пользователь, собрано в одну карточку: аккуратные отступы и рамки
    const compose = document.createElement('div');
    compose.classList.add('info-container', 'materials-compose');
    generatePageContentContainer.appendChild(compose);

    const textLabel = document.createElement('p');
    textLabel.classList.add('materials-compose-label');
    textLabel.textContent = 'Текст публикации';
    compose.appendChild(textLabel);

    const textarea = document.createElement('textarea');
    textarea.classList.add('materials-textarea');
    textarea.setAttribute('aria-label', 'Текст публикации');
    textarea.placeholder = 'Задание, пояснение или описание материалов…';
    if (editData) textarea.value = String(editData.textContent || '');
    compose.appendChild(textarea);

    if (fixedType) {
      const typeNote = document.createElement('p');
      typeNote.classList.add('materials-fixed-type-note');
      typeNote.textContent = fixedType === 'homework'
        ? 'Публикация: домашнее задание'
        : 'Публикация: материал';
      compose.appendChild(typeNote);
    } else {
      const radioGroup = document.createElement('div');
      radioGroup.classList.add('materials-select-group');
      const currentType = editData && editData.textType === 'homework' ? 'homework' : 'material';
      radioGroup.innerHTML = `
        <label><input type="radio" name="task-type" value="material" ${currentType === 'material' ? 'checked' : ''}> Материал</label>
        <label><input type="radio" name="task-type" value="homework" ${currentType === 'homework' ? 'checked' : ''}> Домашнее задание</label>`;
      compose.appendChild(radioGroup);
    }

    const uploaderContainer = document.createElement('div');
    uploaderContainer.classList.add('materials-image-uploader-container');
    compose.appendChild(uploaderContainer);
    imageUploader = new window.PostimagesUploader(uploaderContainer, {
      maxImages: 10,
    });

    // ✓ При редактировании показываем уже прикреплённые изображения: их можно снять или добавить новые
    if (editData && Array.isArray(editData.images) && editData.images.length > 0
      && typeof imageUploader.addRemoteImages === 'function') {
      imageUploader.addRemoteImages(editData.images);
    }

    const submitButton = document.createElement('button');
    submitButton.type = 'button';
    submitButton.id = 'materials-submit';
    submitButton.classList.add('account-standartButton');
    submitButton.textContent = editData ? 'Опубликовать заново' : 'Опубликовать';
    submitButton.addEventListener('click', async () => {
      const restoreButton = () => {
        submitButton.disabled = false;
        submitButton.textContent = editData ? 'Опубликовать заново' : 'Опубликовать';
      };
      submitButton.disabled = true;
      submitButton.textContent = 'Публикация...';

      if (typeof imageUploader.isUploading === 'function' && imageUploader.isUploading()) {
        showNotification('Дождитесь окончания загрузки изображений на Postimages', 'info');
        restoreButton();
        return;
      }

      const textContent = textarea.value.trim();
      const images = imageUploader.getImages();
      if (!textContent && images.length === 0) {
        showNotification('Добавьте текст или изображение', 'info');
        restoreButton();
        return;
      }

      // ✓ Проверяем, не заблокирован ли аккаунт администрацией (запрет на публикацию)
      try {
        const blockState = window.UserBadges && typeof window.UserBadges.getBlockState === 'function'
          ? await window.UserBadges.getBlockState()
          : { blocked: false };
        if (blockState.blocked) {
          showNotification(blockState.reason
            ? `Публикация недоступна: аккаунт заблокирован (${blockState.reason})`
            : 'Публикация недоступна: аккаунт заблокирован администрацией', 'error');
          restoreButton();
          return;
        }
      } catch (error) { /* если роли не загрузились — публикацию не блокируем */ }

      let textType = fixedType || 'material';
      if (!fixedType) {
        const selectedType = generatePageContentContainer.querySelector(
          '.materials-select-group input[type="radio"]:checked'
        );
        if (selectedType) textType = selectedType.value;
      }

      // ✓ Редактирование: старая версия публикации удаляется только сейчас, при публикации
      if (editData) {
        const removal = await window.database.deletePosts({
          postId: editData.postId,
          textIds: editData.textIds,
          imageIds: editData.imageIds,
        });
        if (!removal || (removal.success !== true && removal.deleted === 0)) {
          showNotification((removal && removal.message) || 'Не удалось заменить прежнюю версию публикации', 'error');
          restoreButton();
          return;
        }
      }

      let userData = {};
      try { userData = JSON.parse(localStorage.getItem('userData') || '{}'); } catch (_) {}

      const start = justifyDate(lessonEvent.startTime);
      // ✓ Преподаватель пары: по нему публикация привязывается к своей группе.
      // Без этого задания разных групп с одинаковым предметом и временем смешивались.
      let lessonTeacher = '';
      try {
        const extractedForTeacher = ScheduleRenderer.extractElementData(lessonEvent);
        lessonTeacher = (extractedForTeacher && extractedForTeacher.teacher) ? extractedForTeacher.teacher : '';
      } catch (error) { lessonTeacher = ''; }

      const result = await window.database.saveMaterialPost({
        textContent,
        images,
        subject: lessonEvent.summary,
        teacher: lessonTeacher,
        subjectTimestamp: Math.floor(start.getTime() / 1000),
        textType,
        userGroup: CurrentGroup || userData.userGroup || 'Группа не выбрана',
        userSubgroup: getActiveSubgroup(),
        targetSubgroup: window.HomeworkRenderer.getEventSubgroup(lessonEvent),
      });

      if (!result || result.success !== true) {
        const rawMessage = (result && result.message) ? String(result.message) : '';
        const permissionDenied = (result && result.error === 'permission-denied')
          || /insufficient permissions|permission denied/i.test(rawMessage);
        showNotification(
          permissionDenied
            ? 'Firestore отклонил публикацию: похоже, в консоли Firebase опубликованы старые правила. Опубликуйте firestore.rules из проекта.'
            : (rawMessage || 'Не удалось сохранить публикацию'),
          'error'
        );
        restoreButton();
        return;
      }

      destroyUploader();
      showNotification(editData
        ? 'Публикация обновлена и отправлена на проверку администрации'
        : 'Публикация сохранена и отправлена на проверку администрации', 'success');
      if (window.Achievements && typeof window.Achievements.evaluate === 'function') {
        window.Achievements.evaluate().catch(() => { /* достижения не мешают публикации */ });
      }
      await backToLesson();
      // ✓ Сразу показываем опубликованный пост: обновляем и страницу под окном, и окно пары
      await refreshAfterPublish(lessonEvent, returnSource);
    });

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.id = 'materials-back';
    closeButton.classList.add('account-standartButton');
    closeButton.textContent = editData ? 'Отменить редактирование' : 'Отмена';
    closeButton.addEventListener('click', async () => { await backToLesson(); });

    const composeActions = document.createElement('div');
    composeActions.classList.add('materials-compose-actions');
    composeActions.appendChild(submitButton);
    composeActions.appendChild(closeButton);
    compose.appendChild(composeActions);
  } else if (id === 'adminpanel') { // ✓ Панель администратора: модерация, пользователи, ответы, фидбек
    generatePageContentContainer.appendChild(await window.AdminPanel.render(data));
  } else if (id === 'subject') {
    let events = Array.isArray(groupData[CurrentGroup])
      ? groupData[CurrentGroup]
      : [];

    if (events.length === 0) {
      groupData[CurrentGroup] = await fetchShedule(CurrentGroup, 'group');
      events = Array.isArray(groupData[CurrentGroup])
        ? groupData[CurrentGroup]
        : [];
    }

    generatePageContentContainer.appendChild(
      await window.HomeworkRenderer.renderSubjectPage(data, events)
    );
  }

  // ✓ Добавляем филлер в конце для увеличения высоты страницы
  const fillerDiv = document.createElement('div');
  fillerDiv.setAttribute("style", "height: 100px; width: 100%;")
  generatePageContentContainer.appendChild(fillerDiv);
  return generatePageContentContainer;
}

// ✓ Функция генерации перекрывающего окна
async function generateSubpage(id, options) {
  // ✓ На перекрывающем окне кнопка создания события не нужна
  if (typeof unmountScheduleCreateButton === 'function') unmountScheduleCreateButton();
  // Новая подстраница всегда открывается сверху (мягкое переключение subpage→subpage при этом сохраняется)
  resetScrollPositions({ keepMain: true });
  if (!id) throw new Error('Страницы не существует');
  const settings = options || {};
  const data = settings.data !== undefined ? settings.data : options;
  const alreadyOpened = containerUpward.classList.contains('visible');
  animationInProgress = true;
  if (LOADING_ANIMATIONS) flag.loading = true;

  // ✓ Мягкое переключение subpage → subpage: окно не мигает и не «переезжает» заново
  if (alreadyOpened && settings.soft !== false) {
    containerUpward.classList.add('subpage-fading');
    const content = await generateSubpageContent(id, data);
    setTimeout(() => {
      containerUpward.innerHTML = '';
      containerUpward.appendChild(content);
      if (!settings.keepScroll) resetScrollPositions({ keepMain: true });
      containerUpward.classList.remove('subpage-fading');
      animationInProgress = false;
      if (LOADING_ANIMATIONS) flag.loading = false;
    }, 160);
    return;
  }

  containerUpward.innerHTML = '';
  // ✓ Новая страница открывается сверху
  resetScrollPositions({ keepMain: true });

  // ✓ Заполняем родительский контейнер сгенерированным контентом
  const a = await generateSubpageContent(id, data);
  containerUpward.appendChild(a);

  // ✓ Показываем полученный контейнер
  setTimeout(() => {
    containerUpward.classList.remove('hidden');
    containerUpward.classList.add('visible');
  }, 10);
  animationInProgress = false;
  if (LOADING_ANIMATIONS) flag.loading = false;
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

/* ======== ✓ Функции возврата по странице ======== */

// ✓ Инициализация главной страницы
let appState = { page: "home" };
history.replaceState( { page: "home" }, "", "#home" );

// ✓ Обработка перехода на виртуальную страницу
async function navigateTo(page, data) {
  // ✓ Запоминаем, откуда пришли: нужен для возврата после публикации материала
  const previous = (appState && appState.page)
    ? { page: appState.page, data: appState.data }
    : { page: 'home' };
  const state = { page, ...data, previous };
  history.pushState( state, "", `#${page}` ); // Добавляем страницу в историю браузера/WebView
  appState.page = page;
  appState.data = data;
  await generateSubpage(page, { data, soft: containerUpward.classList.contains('visible') });
}

// ✓ Обновить текущую открытую страницу (используется после действий с публикациями)
async function refreshCurrentPage() {
  try {
    if (appState && appState.page && appState.page !== 'home') {
      // Мягкое обновление: прокрутку пользователя не сбрасываем
      await generateSubpage(appState.page, { data: appState.data, soft: true, keepScroll: true });
      return;
    }
    const target = navOpened || 'nav-shedule';
    const content = await generatePageContent(target);
    containerMain.innerHTML = '';
    containerMain.appendChild(content);
  } catch (error) {
    console.warn('Не удалось обновить страницу:', error);
  }
}

// ✓ Общие функции для остальных модулей (admin.js, homework.js)
window.navigateTo = navigateTo;
window.generatePage = generatePage;
window.refreshCurrentPage = refreshCurrentPage;

// ✓ Обработка нажатия системной кнопки возврата по странице
window.addEventListener("popstate", async function (event) {
  const state = event.state;
  if (state && state.page) { // ✓ Отрисовываем предыдущую виртуальную страницу
    appState.page = state.page;
    appState.data = state;
    if (appState.page !== 'home') {
      await generateSubpage(state.page, { data: state, soft: containerUpward.classList.contains('visible') });
    } else {
      appState.page = "home";
      history.replaceState( { page: "home" }, "", "#home" );
      containerUpward.classList.remove('visible');
      containerUpward.classList.add('hidden');
      setTimeout(() => { containerUpward.innerHTML = ''; }, 350);
      // ✓ Вернулись из события/материала на расписание — кнопка создания снова на месте
      if (typeof syncScheduleCreateButton === 'function') setTimeout(syncScheduleCreateButton, 370);
    }
    
  } else { // ✓ Если состояние отсутствует, возвращаемся на главную
    appState.page = "home";
    history.replaceState( { page: "home" }, "", "#home" );
    containerUpward.classList.remove('visible');
    containerUpward.classList.add('hidden');
    setTimeout(() => { containerUpward.innerHTML = ''; }, 350);
    if (typeof syncScheduleCreateButton === 'function') setTimeout(syncScheduleCreateButton, 370);
  }
});


/* ============================================================================================
 * Обновление 16.10.2026: личный кабинет, достижения, обратная связь, переходы
 * ========================================================================================== */

// Максимум групп, которые пользователь может держать в быстром переключателе
const GROUP_VIEW_LIMIT = 7;
// После отвеченного обращения новые вопросы не принимаются (как просили в задаче).
// Флаг оставлен переключателем, чтобы поведение легко было изменить позже.
const FEEDBACK_LOCK_ABOUT_ANSWER = true;
// Ключи localStorage
const FAVORITE_GROUPS_KEY = 'kgFavoriteGroups';
const THEME_PREFERENCE_KEY = 'kgThemePreference';

/* ---------------------------------- Общие помощники ---------------------------------- */

// ✓ Экранирование текста перед вставкой в разметку
function escapeHtmlText(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ✓ «Сколько уже зарегистрирован»: 0 лет — не пишем, 0 месяцев — не пишем, 0 дней — в часах
function formatMembershipDuration(registeredAt, now) {
  const from = Number(registeredAt) || 0;
  if (!from) return 'неизвестно';
  const start = new Date(from);
  const end = now ? new Date(now) : new Date();
  if (Number.isNaN(start.getTime()) || end < start) return 'только что';

  const parts = [];
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  let hours = end.getHours() - start.getHours();

  if (hours < 0) { hours += 24; days -= 1; }
  if (days < 0) {
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += previousMonth;
    months -= 1;
  }
  if (months < 0) { months += 12; years -= 1; }

  const plural = (number, one, few, many) => {
    const value = Math.abs(number) % 100;
    const last = value % 10;
    if (value > 10 && value < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  };

  if (years > 0) parts.push(`${years} ${plural(years, 'год', 'года', 'лет')}`);
  if (months > 0) parts.push(`${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`);
  if (days > 0) parts.push(`${days} ${plural(days, 'день', 'дня', 'дней')}`);
  if (parts.length === 0) parts.push(`${hours} ${plural(hours, 'час', 'часа', 'часов')}`);
  return parts.join(' ');
}

// ✓ Дата в формате ДД.ММ.ГГГГ
function formatDateText(value) {
  const date = Number(value) ? new Date(Number(value)) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

// ✓ Объём локальных данных в КБ/МБ
function formatStorageSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} КБ`;
  return `${(value / (1024 * 1024)).toFixed(2)} МБ`;
}

// ✓ Подгруппа, с которой работает приложение: своя группа — своя подгруппа,
//   чужая группа — всегда первая подгруппа
function getActiveSubgroup() {
  const explicit = Number(window.CurrentSubgroup);
  if (explicit === 1 || explicit === 2) return explicit;
  try {
    const data = JSON.parse(localStorage.getItem('userData') || '{}') || {};
    const value = Number(data.userSubgroup);
    if (value === 1 || value === 2) return value;
  } catch (_) { /* нет данных — считаем первой подгруппой */ }
  return 1;
}

// ✓ Своя группа и своя подгруппа (их нельзя потерять при переключении групп)
function getOwnGroupData() {
  let data = {};
  try { data = JSON.parse(localStorage.getItem('userData') || '{}') || {}; } catch (_) { data = {}; }
  const ownGroup = String(data.userGroup || CurrentGroup || '');
  const ownSubgroup = Number(data.userSubgroup) === 2 ? 2 : 1;
  const ownLanguage = String(data.userLanguage || '');
  return { ownGroup, ownSubgroup, ownLanguage };
}

// ✓ Установить текущую группу (для своего аккаунта вернём свою подгруппу)
function setActiveGroup(groupName) {
  const own = getOwnGroupData();
  CurrentGroup = groupName;
  window.CurrentGroup = groupName;
  window.CurrentSubgroup = groupName === own.ownGroup ? own.ownSubgroup : 1;
  const headerGroup = document.getElementById('header-group');
  if (headerGroup) {
    headerGroup.textContent = groupName === own.ownGroup
      ? `${groupName}(${own.ownSubgroup})`
      : groupName;
    headerGroup.title = groupName === own.ownGroup
      ? `Подгруппа ${own.ownSubgroup}`
      : 'Чужая группа: показывается первая подгруппа';
  }
  return window.CurrentSubgroup;
}

/* ----------------------- Предпочитаемые группы (до 7) для шапки ----------------------- */

// ✓ Группы своего института и курса — значение по умолчанию
function getDefaultFavoriteGroups(groupName) {
  const info = typeof getGroupInfo === 'function' ? getGroupInfo(groupName) : null;
  let siblingGroups = [];
  if (info) {
    const container = groupsID[info.education]
      && groupsID[info.education][info.institute]
      && groupsID[info.education][info.institute][info.course];
    if (container) siblingGroups = Object.keys(container);
  }
  const ordered = siblingGroups.includes(groupName)
    ? [groupName].concat(siblingGroups.filter((name) => name !== groupName))
    : siblingGroups.slice();
  if (ordered.length === 0 && groupName) ordered.push(groupName);
  return ordered.slice(0, GROUP_VIEW_LIMIT);
}

// ✓ Список групп из быстрого переключателя: аккаунт → localStorage → значения по умолчанию
function getFavoriteGroupList(account) {
  const own = getOwnGroupData();
  let stored = [];
  if (account && Array.isArray(account.favoriteGroups) && account.favoriteGroups.length > 0) {
    stored = account.favoriteGroups.map(String);
  } else {
    try {
      const local = JSON.parse(localStorage.getItem(FAVORITE_GROUPS_KEY) || '[]');
      if (Array.isArray(local)) stored = local.map(String);
    } catch (_) { stored = []; }
  }
  stored = stored.filter((name) => typeof getGroupID(name) !== 'undefined');
  if (stored.length === 0) stored = getDefaultFavoriteGroups(own.ownGroup);
  const list = [own.ownGroup].concat(stored)
    .filter((name, index, array) => name && array.indexOf(name) === index)
    .slice(0, GROUP_VIEW_LIMIT);
  // Быстрый переключатель совместим со старым механизмом (favoriteGroups)
  const map = {};
  list.forEach((name) => { map[name] = getGroupID(name); });
  favoriteGroups = map;
  return list;
}

// ✓ Выпадающий список выбранных групп в правой части шапки
function buildHeaderGroupMenu(account) {
  const host = document.getElementById('header-right');
  if (!host) return;
  const old = document.getElementById('header-group-menu');
  if (old) old.remove();

  const groups = getFavoriteGroupList(account);
  const menu = document.createElement('div');
  menu.id = 'header-group-menu';
  menu.className = 'header-group-menu hidden';
  groups.forEach((name) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'header-group-item' + (name === CurrentGroup ? ' selected' : '');
    const own = getOwnGroupData();
    item.textContent = name === own.ownGroup ? `${name}(${own.ownSubgroup})` : name;
    item.addEventListener('click', async () => {
      closeHeaderGroupMenu();
      if (name === CurrentGroup) return;
      await changeCurrentGroup(name);
    });
    menu.appendChild(item);
  });
  if (groups.length < GROUP_VIEW_LIMIT) {
    const hint = document.createElement('p');
    hint.className = 'header-group-hint';
    hint.textContent = `Можно выбрать до ${GROUP_VIEW_LIMIT} групп в настройках профиля`;
    menu.appendChild(hint);
  } else {
    const hint = document.createElement('p');
    hint.className = 'header-group-hint';
    hint.textContent = `Показаны первые ${GROUP_VIEW_LIMIT} групп из настроек профиля`;
    menu.appendChild(hint);
  }
  host.appendChild(menu);
}

function openHeaderGroupMenu() {
  const menu = document.getElementById('header-group-menu');
  if (menu) menu.classList.remove('hidden');
}

function closeHeaderGroupMenu() {
  const menu = document.getElementById('header-group-menu');
  if (menu) menu.classList.add('hidden');
}

function toggleHeaderGroupMenu() {
  const menu = document.getElementById('header-group-menu');
  if (!menu) return;
  if (menu.classList.contains('hidden')) openHeaderGroupMenu();
  else closeHeaderGroupMenu();
}

// ✓ Сменить группу просмотра (расписание и материалы перерисовываются как раньше)
async function changeCurrentGroup(groupName) {
  if (!groupName) return;
  setActiveGroup(groupName);
  if (navOpened === 'nav-shedule' && LOADING_ANIMATIONS) flag.loading = true;

  if (navOpened === 'nav-shedule') {
    const sheduleContainer = document.getElementById('shedule-container');
    try {
      const dayButton = document.getElementById('shedule-day');
      const moduleSelected = (dayButton && dayButton.classList.contains('selected')) ? 'day' : 'week';
      groupData[groupName] = await fetchShedule(groupName, 'group');
      if (!groupData[groupName]) {
        setTimeout(() => {
          if (!sheduleContainer) return;
          sheduleContainer.innerHTML = '';
          sheduleContainer.appendChild(generateSheduleUnavailableContainer({
            sheduleID: groupName,
            sheduleType: 'group',
            cacheKey: groupName,
          }));
        }, 500);
      } else {
        setTimeout(() => {
          if (!sheduleContainer) return;
          const renderer = new ScheduleRenderer(groupData[groupName]);
          const sheduleFiller = renderer.render(moduleSelected);
          sheduleContainer.innerHTML = '';
          sheduleContainer.appendChild(sheduleFiller);
        }, 500);
      }
    } catch (err) { if (DEBUG_MODE) console.warn('Ошибка смены расписания: ', err); }
    setTimeout(() => { flag.loading = false; }, 1000);
  } else if (navOpened === 'nav-homework') {
    // Материалы и домашние задания тоже привязаны к группе
    await generatePage('nav-homework');
  }
  await refocusSheduleView();
}

// ✓ После смены группы — снова показать текущий день недели под панелью недель
async function refocusSheduleView() {
  if (navOpened !== 'nav-shedule') return;
  const weekSelector = document.querySelector('.radio-week-container');
  if (!weekSelector) return;
  if (typeof window.centerWeekSelector === 'function') window.centerWeekSelector(weekSelector);
  if (typeof window.scrollSheduleToToday !== 'function' || typeof window.scrollSheduleToTop !== 'function') return;
  const sheduleContainer = document.getElementById('shedule-container');
  const currentWeekButton = weekSelector.querySelector('.radio-week-button.selected.current-week-button');
  if (currentWeekButton && sheduleContainer) window.scrollSheduleToToday(sheduleContainer);
  else window.scrollSheduleToTop();
}

/* -------------------------- Сброс прокрутки при открытии страниц -------------------------- */

// ✓ Сбрасываем прокрутку всех контейнеров: новая страница всегда открывается сверху
function resetScrollPositions(options) {
  const settings = options || {};
  if (settings.keepMain) { /* основной контейнер не трогаем */ }
  else {
    [containerMain, containerTranslate, containerUpward].forEach((node) => {
      if (!node) return;
      try { node.scrollTop = 0; node.scrollLeft = 0; } catch (_) { /* контейнер недоступен */ }
    });
  }
  if (settings.keepSubpage) { /* перекрывающее окно не трогаем */ }
  else if (containerUpward) {
    // Обнуляем и сам контейнер, и все прокручиваемые блоки внутри перекрывающего окна
    try { containerUpward.scrollTop = 0; containerUpward.scrollLeft = 0; } catch (_) { /* ок */ }
    if (typeof containerUpward.querySelectorAll === 'function') {
      Array.prototype.forEach.call(
        containerUpward.querySelectorAll('div, section, article, main'),
        (node) => {
          try { if (node.scrollTop) node.scrollTop = 0; if (node.scrollLeft) node.scrollLeft = 0; }
          catch (_) { /* блок недоступен */ }
        },
      );
    }
  }
  // Прокрутка самой страницы: окно, корневой элемент и тело — в разных браузерах это разные узлы
  try { window.scrollTo(0, 0); } catch (_) { /* в некоторых WebView недоступно */ }
  try {
    if (document.scrollingElement) { document.scrollingElement.scrollTop = 0; document.scrollingElement.scrollLeft = 0; }
    if (document.documentElement) { document.documentElement.scrollTop = 0; document.documentElement.scrollLeft = 0; }
    if (document.body) { document.body.scrollTop = 0; document.body.scrollLeft = 0; }
  } catch (_) { /* ок */ }
}

/* ------------------------------ Возврат после публикации ------------------------------ */

// ✓ Закрыть все перекрывающие окна и вернуться на главную
function closeAllSubpages() {
  appState.page = 'home';
  appState.data = undefined;
  history.replaceState({ page: 'home' }, '', '#home');
  if (containerUpward) {
    containerUpward.classList.remove('visible');
    containerUpward.classList.add('hidden');
    setTimeout(() => { containerUpward.innerHTML = ''; }, 350);
  }
  // ✓ Вернулись к расписанию — кнопка создания снова на месте
  if (typeof syncScheduleCreateButton === 'function') setTimeout(syncScheduleCreateButton, 360);
}

/**
 * Возврат со страницы публикации материала/ДЗ.
 * Если страница публикации была открыта ПОВЕРХ другой страницы — просто закрываем её
 * (шаг назад по истории), и пользователь возвращается туда, откуда пришёл.
 * Если предыдущей страницы нет — закрываем все перекрывающие окна и уходим на главную.
 */
function returnAfterPublish(fallbackSubpage, fallbackData) {
  const current = history.state;
  const previous = current && current.previous ? current.previous : null;
  const previousPage = previous && previous.page ? String(previous.page) : '';
  if (previousPage && previousPage !== 'addmatr' && previousPage !== 'home') {
    history.back(); // popstate отрисует предыдущую страницу
    return 'back';
  }
  if (previousPage === 'home' || !previousPage) {
    closeAllSubpages();
    return 'home';
  }
  if (fallbackSubpage) {
    navigateTo(fallbackSubpage, fallbackData);
    return 'fallback';
  }
  closeAllSubpages();
  return 'home';
}

/* ---------------------------- Личный кабинет: данные профиля ---------------------------- */

// ✓ Собрать всё, что нужно для карточки профиля
async function loadProfileData(user) {
  const result = {
    account: {},
    userdata: {},
    admin: { isAdmin: false },
    admindata: {},
    language: '',
    registeredAt: 0,
  };
  if (!user) return result;

  try {
    const accountResult = await window.database.getAccount(user.uid);
    result.account = (accountResult && accountResult.account) ? accountResult.account : {};
  } catch (_) { /* офлайн — показываем локальные данные */ }

  try {
    const profile = await window.database.getUserdata(user.uid);
    result.userdata = (profile && profile.success && profile.profile) ? profile.profile : {};
  } catch (_) { result.userdata = {}; }

  try {
    const adminResult = await window.database.getAdmin(user.uid);
    result.admin = adminResult || { isAdmin: false };
  } catch (_) { result.admin = { isAdmin: false }; }

  if (result.admin && result.admin.isAdmin === true) {
    try {
      const doc = await window.database.db.collection('admindata').doc(String(user.uid)).get();
      result.admindata = (doc && typeof doc.data === 'function') ? (doc.data() || {}) : {};
    } catch (_) { result.admindata = {}; }
  }

  const metadata = user.metadata || {};
  result.registeredAt = Number(result.account.registeredAt)
    || (metadata.creationTime ? Date.parse(metadata.creationTime) : 0)
    || Date.now();
  result.language = result.account.userLanguage || getOwnGroupData().ownLanguage || '';
  return result;
}

/* ------------------------------ Экраны окна авторизации ------------------------------ */

const AUTH_FORM_IDS = {
  register: 'register-form',
  login: 'login-form',
  additional: 'additional-form',
  verify: 'verify-form',
  reset: 'reset-sent-form',
  unverified: 'unverified-form',
};

// ✓ Показать нужный экран окна авторизации (остальные прячем)
function switchAuthForm(name) {
  const authRoot = document.getElementById('auth-container');
  if (!authRoot) return null;
  Object.values(AUTH_FORM_IDS).forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.classList.add('form-hidden');
  });
  const target = document.getElementById(AUTH_FORM_IDS[name] || '');
  if (target) target.classList.remove('form-hidden');
  return target;
}

// ✓ Подставить почту в текст экрана
function setAuthEmailText(nodeId, email) {
  const node = document.getElementById(nodeId);
  if (node) node.textContent = email || 'указанную вами почту';
}

/**
 * Подтверждена ли почта текущего аккаунта.
 * Настоящий флаг Firebase (emailVerified) либо отметка администратора в userdata —
 * она нужна потому, что клиентский Firebase не позволяет менять подтверждение
 * чужого аккаунта (для этого нужен Admin SDK на сервере).
 */
async function isAccountVerified() {
  const user = window.auth.getCurrentUser();
  if (!user) return false;
  const reloaded = await window.auth.reloadUser().catch(() => null);
  if ((reloaded && reloaded.verified === true) || user.emailVerified === true) return true;
  try {
    const profile = await window.database.getUserdata(user.uid);
    return Boolean(profile && profile.success === true && profile.profile && profile.profile.emailVerifiedByAdmin === true);
  } catch (_) { return false; }
}

// ✓ Имя в шапке: кликабельный текст без «коробки» — только тень и подсветка
function applyHeaderName(user, isAdmin) {
  const headerName = document.querySelector('#header-name');
  if (!headerName) return;
  if (user && user.displayName) {
    headerName.innerHTML = isAdmin
      ? `🛡️ ${escapeHtmlText(user.displayName)} <span id="admin-mark">Админ</span>`
      : `🧑 ${escapeHtmlText(user.displayName)}`;
  } else {
    headerName.textContent = '🕵🏻 Гостевой режим';
  }
  if (!headerName.dataset.profileBound) {
    headerName.dataset.profileBound = 'true';
    headerName.classList.add('header-name-link');
    headerName.title = 'Открыть личный кабинет';
    headerName.addEventListener('click', () => {
      if (typeof navigateTo === 'function') navigateTo('profile');
    });
  }
}

// ✓ Красочные подписи статусов и ролей
const STATUS_LABELS = {
  student: 'Студент',
  starosta: 'Староста',
  proforg: 'Профорг',
  kultorg: 'Культорг',
  teacher: 'Преподаватель',
};

function buildStatusBadge(statusKey, text) {
  const badge = document.createElement('span');
  badge.className = `profile-status profile-status--${statusKey}`;
  badge.textContent = text;
  return badge;
}

/* ============================ Личный кабинет и обратная связь ============================ */

// ✓ Настройки профиля: группа, подгруппа, язык (те же селекторы, что при регистрации)
function buildAccountSelectors(container) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="group-selector">
      <div class="form-group">
        <div class="input-wrapper account-input-wrapper">
          <input type="text" id="account-input-group" readonly required>
          <label for="account-input-group">Группа</label><span class="focus-border"></span>
        </div>
      </div>
      <div id="account-input-groupDropdown" class="auth-input-dropdown">
        <div id="account-input-groupContent" class="auth-input-dropdownContent"></div>
      </div>
    </div>
    <div class="group-selector">
      <div class="form-group">
        <div class="input-wrapper account-input-wrapper">
          <input type="text" id="account-input-subgroup" readonly required>
          <label for="account-input-subgroup">Подгруппа</label><span class="focus-border"></span>
        </div>
      </div>
      <div id="account-input-subgroupDropdown" class="auth-input-dropdown">
        <div id="account-input-subgroupContent" class="auth-input-dropdownContent"></div>
      </div>
    </div>
    <div class="group-selector">
      <div class="form-group">
        <div class="input-wrapper account-input-wrapper">
          <input type="text" id="account-input-language" readonly required>
          <label for="account-input-language">Изучаемый язык</label><span class="focus-border"></span>
        </div>
      </div>
      <div id="account-input-languageDropdown" class="auth-input-dropdown">
        <div id="account-input-languageContent" class="auth-input-dropdownContent"></div>
      </div>
    </div>`;
  // Селекторы групп, подгрупп и языка ищут элементы через document.getElementById, поэтому разметку
  // сначала подключаем к странице (в скрытый узел), и только потом переносим в кабинет.
  const buildHost = document.createElement('div');
  buildHost.style.display = 'none';
  (document.body || container).appendChild(buildHost);
  buildHost.appendChild(wrapper);

  const groupInstance = new groupSelector('account-input-group', 'account-input-groupDropdown', 'account-input-groupContent');
  const subgroupInstance = new subgroupSelector('account-input-subgroup', 'account-input-subgroupDropdown', 'account-input-subgroupContent');
  const languageInstance = new languageSelector('account-input-language', 'account-input-languageDropdown', 'account-input-languageContent');

  container.appendChild(wrapper);
  if (buildHost.parentNode) buildHost.parentNode.removeChild(buildHost);
  return { groupInstance, subgroupInstance, languageInstance };
}

// ✓ Поле ввода со «глазиком» — копия стиля окна авторизации
function buildPasswordField(options) {
  const settings = options || {};
  const inputId = settings.id || `account-password-${Math.random().toString(36).slice(2, 7)}`;
  const group = document.createElement('div');
  group.className = 'form-group account-form-group';
  group.innerHTML = `
    <div class="input-wrapper account-input-wrapper">
      <input type="password" id="${inputId}" placeholder="${escapeHtmlText(settings.placeholder || '')}">
      <label for="${inputId}">${escapeHtmlText(settings.label || 'Пароль')}</label><span class="focus-border"></span>
      <button type="button" class="password-toggle account-password-toggle" id="${inputId}-toggle">
        <span class="eye-icon"></span>
      </button>
    </div>`;
  const input = group.querySelector('input');
  const toggle = group.querySelector('.password-toggle');
  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const eyeIcon = toggle.querySelector('.eye-icon');
    if (eyeIcon) eyeIcon.classList.toggle('show-password', isPassword);
  });
  return { group, input };
}

// ✓ Строка «подпись — значение» для карточки профиля
function buildProfileRow(container, label, value) {
  const row = document.createElement('p');
  row.className = 'profile-row';
  const labelNode = document.createElement('span');
  labelNode.className = 'profile-row-label';
  labelNode.textContent = label;
  const valueNode = document.createElement('span');
  valueNode.className = 'profile-row-value';
  if (value instanceof Node) valueNode.appendChild(value);
  else valueNode.textContent = value === undefined || value === null || value === '' ? '—' : String(value);
  row.appendChild(labelNode);
  row.appendChild(valueNode);
  container.appendChild(row);
  return row;
}

// ✓ Данные приложения: объём локальной базы и кнопки очистки
function buildAppDataSection(container) {
  const box = document.createElement('div');
  box.className = 'account-data-box';

  const sizeRow = document.createElement('div');
  sizeRow.className = 'account-data-size';
  sizeRow.innerHTML = '<span>Объём локальной базы</span><b id="account-data-size-value">считаю…</b>';
  box.appendChild(sizeRow);

  const refreshSize = async () => {
    const valueNode = sizeRow.querySelector('#account-data-size-value');
    if (!valueNode) return;
    try {
      const bytes = typeof measureLocalDatabaseSize === 'function' ? await measureLocalDatabaseSize() : 0;
      valueNode.textContent = formatStorageSize(bytes);
    } catch (_) { valueNode.textContent = 'недоступно'; }
  };

  const actions = [
    {
      title: 'Очистить расписание',
      text: 'Убирает сохранённые расписания групп и преподавателей с устройства. При подключении к интернету они загрузятся заново.',
      button: 'Очистить расписание',
      danger: false,
      run: async () => {
        const result = typeof window.clearLocalShedules === 'function'
          ? await window.clearLocalShedules()
          : { cleared: [], failed: ['group', 'teacher'] };
        groupData = {};
        if (typeof window.contentCache === 'object' && window.contentCache && typeof window.contentCache.clearMemory === 'function') {
          window.contentCache.clearMemory();
        }
        return (result.cleared || []).length > 0
          ? { message: 'Сохранённые расписания удалены с устройства', type: 'success' }
          : { message: 'Не удалось очистить расписания', type: 'error' };
      },
    },
    {
      title: 'Очистить оперативную память',
      text: 'Выгружает расписания и кэш публикаций из памяти приложения. Локальные файлы остаются на месте.',
      button: 'Очистить память',
      danger: false,
      run: async () => {
        groupData = {};
        if (window.contentCache && typeof window.contentCache.clearMemory === 'function') window.contentCache.clearMemory();
        return { message: 'Оперативная память освобождена от расписаний и кэша', type: 'success' };
      },
    },
    {
      title: 'Очистить всю локальную базу',
      text: 'Полностью стирает локальные расписания и кэш изображений. Настройки аккаунта и группа останутся на месте.',
      button: 'Очистить всё',
      danger: true,
      run: async () => {
        if (typeof window.clearLocalShedules === 'function') await window.clearLocalShedules();
        if (window.contentCache && typeof window.contentCache.clearAll === 'function') await window.contentCache.clearAll();
        groupData = {};
        return { message: 'Локальная база приложения очищена', type: 'success' };
      },
    },
  ];

  actions.forEach((action) => {
    const row = document.createElement('div');
    row.className = 'account-data-action';
    const textBox = document.createElement('div');
    textBox.className = 'account-data-text';
    const title = document.createElement('p');
    title.className = 'account-data-title';
    title.textContent = action.title;
    const text = document.createElement('p');
    text.className = 'account-data-description';
    text.textContent = action.text;
    textBox.appendChild(title);
    textBox.appendChild(text);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = action.danger ? 'account-awairButton' : 'account-standartButton';
    button.textContent = action.button;
    button.addEventListener('click', async () => {
      button.disabled = true;
      const result = await action.run();
      button.disabled = false;
      showNotification((result && result.message) || 'Готово', (result && result.type) || 'info');
      await refreshSize(); // объём базы обновляется сразу после очистки
    });

    row.appendChild(textBox);
    row.appendChild(button);
    box.appendChild(row);
  });

  container.appendChild(box);
  refreshSize();
  return { refreshSize };
}

// ✓ Выбор предпочитаемых групп (не больше семи)
function buildFavoriteGroupsEditor(container, account) {
  const selected = getFavoriteGroupList(account);
  const box = document.createElement('div');
  box.className = 'account-groups-box';
  box.appendChild(Object.assign(document.createElement('p'), {
    className: 'account-data-description',
    textContent: `Отметьте до ${GROUP_VIEW_LIMIT} групп — они появятся в выпадающем меню в шапке приложения. По умолчанию предлагаются группы вашего института и курса.`,
  }));

  const own = getOwnGroupData();
  const info = typeof getGroupInfo === 'function' ? getGroupInfo(own.ownGroup) : null;
  const education = info ? info.education : Object.keys(groupsID)[0];
  const institute = info ? info.institute : Object.keys(groupsID[education] || {})[0];
  const course = info ? info.course : Object.keys((groupsID[education] || {})[institute] || {})[0];
  const available = (groupsID[education] && groupsID[education][institute] && groupsID[education][institute][course])
    ? Object.keys(groupsID[education][institute][course])
    : [];

  const list = document.createElement('div');
  list.className = 'account-groups-list';
  const checkboxes = [];
  available.forEach((name) => {
    const label = document.createElement('label');
    label.className = 'account-groups-item' + (selected.includes(name) ? ' selected' : '');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = name;
    input.checked = selected.includes(name);
    if (name === own.ownGroup) input.disabled = true; // своя группа всегда остаётся
    input.addEventListener('change', () => {
      const checked = checkboxes.filter((node) => node.checked);
      if (checked.length > GROUP_VIEW_LIMIT) {
        input.checked = false;
        showNotification(`Можно выбрать не больше ${GROUP_VIEW_LIMIT} групп`, 'error');
        return;
      }
      label.classList.toggle('selected', input.checked);
      hint.textContent = `Выбрано ${checkboxes.filter((node) => node.checked).length} из ${GROUP_VIEW_LIMIT}`;
    });
    checkboxes.push(input);
    const text = document.createElement('span');
    text.textContent = name === own.ownGroup ? `${name} (ваша группа)` : name;
    label.appendChild(input);
    label.appendChild(text);
    list.appendChild(label);
  });
  box.appendChild(list);

  const hint = document.createElement('p');
  hint.className = 'account-data-description';
  hint.textContent = `Выбрано ${selected.length} из ${GROUP_VIEW_LIMIT}`;
  box.appendChild(hint);

  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'account-standartButton';
  save.textContent = 'Сохранить список групп';
  save.addEventListener('click', async () => {
    const chosen = checkboxes.filter((node) => node.checked).map((node) => node.value).slice(0, GROUP_VIEW_LIMIT);
    save.disabled = true;
    try { localStorage.setItem(FAVORITE_GROUPS_KEY, JSON.stringify(chosen)); } catch (_) { /* нет доступа */ }
    const result = await window.database.updateAccount({ favoriteGroups: chosen });
    save.disabled = false;
    showNotification(result && result.success === true
      ? 'Список групп сохранён'
      : 'Список сохранён локально, облачная синхронизация недоступна', result && result.success === true ? 'success' : 'info');
    const accountResult = await window.database.getAccount(window.auth.getCurrentUser().uid).catch(() => null);
    buildHeaderGroupMenu(accountResult && accountResult.account ? accountResult.account : { favoriteGroups: chosen });
  });
  box.appendChild(save);

  container.appendChild(box);
  return box;
}

// ✓ Карточка профиля: логин, почта, статусы, группа, институт, дата регистрации
function buildProfileCard(container, user, profile) {
  const card = document.createElement('div');
  card.className = 'info-container profile-card';

  const head = document.createElement('div');
  head.className = 'profile-head';
  const name = document.createElement('p');
  name.className = 'profile-name';
  name.textContent = user.displayName || 'Без логина';
  head.appendChild(name);

  const statuses = document.createElement('div');
  statuses.className = 'profile-statuses';
  if (profile.admin && profile.admin.isAdmin === true) {
    // Красный значок администратора. Подписи «не админ» нет вовсе.
    statuses.appendChild(buildStatusBadge('admin', 'Администратор'));
  }
  const role = String(profile.userdata.role || '');
  if (role && STATUS_LABELS[role]) statuses.appendChild(buildStatusBadge(role, STATUS_LABELS[role]));
  else if (!role) statuses.appendChild(buildStatusBadge('student', STATUS_LABELS.student));
  if (profile.userdata.customTag) statuses.appendChild(buildStatusBadge('tag', String(profile.userdata.customTag)));
  if (profile.userdata.blocked) statuses.appendChild(buildStatusBadge('blocked', 'Аккаунт заблокирован'));
  head.appendChild(statuses);
  card.appendChild(head);

  const account = profile.account || {};
  const own = getOwnGroupData();
  const group = account.userGroup || own.ownGroup || '—';
  const subgroup = Number(account.userSubgroup) === 2 ? 2 : (Number(account.userSubgroup) === 1 ? 1 : own.ownSubgroup);
  const language = account.userLanguage || own.ownLanguage || '';
  const groupInfo = typeof getGroupInfo === 'function' ? getGroupInfo(group) : null;

  buildProfileRow(card, 'Логин', user.displayName || '—');
  buildProfileRow(card, 'Почта', user.email || '—');
  buildProfileRow(card, 'Группа', `${group} · ${subgroup}-я подгруппа`);
  buildProfileRow(card, 'Форма обучения', groupInfo ? groupInfo.education : 'не определена');
  buildProfileRow(card, 'Институт', groupInfo ? groupInfo.institute : 'не определён');
  buildProfileRow(card, 'Курс', groupInfo ? groupInfo.course : 'не определён');
  buildProfileRow(card, 'Изучаемый язык', language || 'не выбран');
  buildProfileRow(card, 'Дата регистрации', `${formatDateText(profile.registeredAt)} · с нами ${formatMembershipDuration(profile.registeredAt)}`);
  if (profile.admin && profile.admin.isAdmin === true) {
    const moderations = Number(profile.admindata.moderationsCount) || 0;
    const answers = Number(profile.admindata.feedbackAnsweredCount) || 0;
    buildProfileRow(card, 'Статистика администратора', `модераций: ${moderations} · ответов в поддержке: ${answers}`);
  }
  container.appendChild(card);
  return card;
}

// ✓ Личный кабинет: профиль, достижения, настройки, данные приложения
async function renderProfileSubpage(container, options) {
  const settings = options || {};
  const user = window.auth.getCurrentUser();
  if (!user) {
    container.innerHTML = `
      <div class="info-container">
        <p><b>Анонимный гость</b></p>
        <p>Чтобы открыть личный кабинет, войдите в аккаунт</p>
      </div>`;
    return container;
  }

  const profile = await loadProfileData(user);
  const layout = document.createElement('div');
  layout.className = 'profile-layout';

  const main = document.createElement('div');
  main.className = 'profile-main-column';
  layout.appendChild(main);

  const achievementsColumn = document.createElement('div');
  achievementsColumn.className = 'profile-achievements-column';
  achievementsColumn.id = 'profile-achievements';
  layout.appendChild(achievementsColumn);

  buildProfileCard(main, user, profile);
  window.Achievements.render(achievementsColumn, {
    achievements: profile.account.achievements,
    meta: profile.account.achievementsMeta,
  });
  // Достижения считаем при каждом входе в кабинет: условия проверяет база
  if (window.Achievements && typeof window.Achievements.evaluate === 'function') {
    window.Achievements.evaluate().then((result) => {
      if (result && result.added && result.added.length > 0) {
        window.Achievements.render(achievementsColumn, {
          achievements: result.achievements,
          meta: result.meta,
        });
      }
    }).catch(() => { /* не критично для кабинета */ });
  }

  /* ------------------------------ 1. Оформление ------------------------------ */
  const themeSection = document.createElement('details');
  themeSection.className = 'profile-section';
  if (settings.openSection === 'theme') themeSection.open = true;
  themeSection.innerHTML = '<summary><b>Оформление</b></summary>';
  const themeBox = document.createElement('div');
  themeBox.className = 'profile-section-body';
  const themeRow = document.createElement('label');
  themeRow.className = 'account-toggle';
  const themeInput = document.createElement('input');
  themeInput.type = 'checkbox';
  themeInput.id = 'account-theme-toggle';
  try { themeInput.checked = localStorage.getItem(THEME_PREFERENCE_KEY) === 'dark'; } catch (_) { /* нет доступа */ }
  themeInput.addEventListener('change', () => {
    try { localStorage.setItem(THEME_PREFERENCE_KEY, themeInput.checked ? 'dark' : 'light'); } catch (_) { /* нет доступа */ }
    showNotification('Переключение темы появится в одном из следующих обновлений — выбор сохранён', 'info');
  });
  const themeText = document.createElement('span');
  themeText.innerHTML = '<b>Тёмная тема</b><br/><span class="account-data-description">Заготовка: сам переключатель уже на месте, оформление добавим позже</span>';
  themeRow.appendChild(themeInput);
  themeRow.appendChild(themeText);
  themeBox.appendChild(themeRow);
  themeSection.appendChild(themeBox);
  main.appendChild(themeSection);

  /* --------------------------- 2. Настройки профиля --------------------------- */
  const profileSection = document.createElement('details');
  profileSection.className = 'profile-section';
  profileSection.open = settings.openSection === 'profile' || !settings.openSection;
  profileSection.innerHTML = '<summary><b>Настройки профиля</b></summary>';
  const profileBody = document.createElement('div');
  profileBody.className = 'profile-section-body';
  profileSection.appendChild(profileBody);

  // Логин
  const nameRow = document.createElement('div');
  nameRow.className = 'account-setting-row';
  nameRow.innerHTML = '<p class="account-setting-title">Логин (публичное имя)</p>';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'account-text-input';
  nameInput.maxLength = 40;
  nameInput.value = user.displayName || '';
  const nameButton = document.createElement('button');
  nameButton.type = 'button';
  nameButton.className = 'account-standartButton';
  nameButton.textContent = 'Сменить логин';
  nameButton.addEventListener('click', async () => {
    nameButton.disabled = true;
    const result = await window.auth.updateDisplayName(nameInput.value);
    nameButton.disabled = false;
    if (result && result.success) {
      await window.database.updateAccount({ userName: result.name });
      const adminState = await window.database.getAdmin(user.uid).catch(() => null);
      applyHeaderName(window.auth.getCurrentUser(), Boolean(adminState && adminState.isAdmin === true));
      showNotification('Логин обновлён', 'success');
      await refreshCurrentPage();
    } else {
      showNotification((result && result.message) || 'Не удалось изменить логин', 'error');
    }
  });
  nameRow.appendChild(nameInput);
  nameRow.appendChild(nameButton);
  profileBody.appendChild(nameRow);

  // Пароль
  const passwordRow = document.createElement('div');
  passwordRow.className = 'account-setting-row';
  passwordRow.innerHTML = '<p class="account-setting-title">Смена пароля</p>';
  const currentPassword = buildPasswordField({ label: 'Текущий пароль', placeholder: 'Текущий пароль' });
  const newPassword = buildPasswordField({ label: 'Новый пароль', placeholder: 'Новый пароль' });
  const passwordButton = document.createElement('button');
  passwordButton.type = 'button';
  passwordButton.className = 'account-standartButton';
  passwordButton.textContent = 'Сменить пароль';
  passwordButton.addEventListener('click', async () => {
    passwordButton.disabled = true;
    const result = await window.auth.changePassword(currentPassword.input.value, newPassword.input.value);
    passwordButton.disabled = false;
    if (result && result.success) {
      currentPassword.input.value = '';
      newPassword.input.value = '';
      showNotification('Пароль обновлён', 'success');
    } else {
      showNotification((result && result.message) || 'Не удалось сменить пароль', 'error');
    }
  });
  passwordRow.appendChild(currentPassword.group);
  passwordRow.appendChild(newPassword.group);
  passwordRow.appendChild(passwordButton);
  profileBody.appendChild(passwordRow);

  // Почта: восстановление пароля и (если поддерживается) смена адреса
  const emailRow = document.createElement('div');
  emailRow.className = 'account-setting-row';
  emailRow.innerHTML = `<p class="account-setting-title">Почта: <b>${escapeHtmlText(user.email || '')}</b></p>`;
  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'account-standartButton';
  resetButton.textContent = 'Письмо для восстановления пароля';
  resetButton.addEventListener('click', async () => {
    resetButton.disabled = true;
    const result = await window.auth.sendPasswordResetEmail(user.email);
    resetButton.disabled = false;
    showNotification((result && result.message) || 'Письмо отправлено', result && result.success ? 'success' : 'error');
  });
  emailRow.appendChild(resetButton);

  if (window.auth.canChangeEmail && window.auth.canChangeEmail()) {
    const newEmailField = document.createElement('div');
    newEmailField.className = 'form-group account-form-group';
    newEmailField.innerHTML = `
      <div class="input-wrapper account-input-wrapper">
        <input type="email" id="account-input-newEmail" placeholder="Новая почта">
        <label for="account-input-newEmail">Новая почта</label><span class="focus-border"></span>
      </div>`;
    const emailButton = document.createElement('button');
    emailButton.type = 'button';
    emailButton.className = 'account-standartButton';
    emailButton.textContent = 'Сменить почту';
    emailButton.addEventListener('click', async () => {
      const input = newEmailField.querySelector('input');
      emailButton.disabled = true;
      const result = await window.auth.requestEmailChange(input.value, '');
      emailButton.disabled = false;
      showNotification((result && result.message) || 'Готово', result && result.success ? 'success' : 'error');
    });
    emailRow.appendChild(newEmailField);
    emailRow.appendChild(emailButton);
    emailRow.appendChild(Object.assign(document.createElement('p'), {
      className: 'account-data-description',
      textContent: 'Новая почта заработает после перехода по ссылке из письма — так требует Firebase.',
    }));
  }
  profileBody.appendChild(emailRow);

  // Группа, подгруппа, язык
  const groupRow = document.createElement('div');
  groupRow.className = 'account-setting-row';
  groupRow.innerHTML = '<p class="account-setting-title">Группа, подгруппа и язык</p>';
  const selectors = buildAccountSelectors(groupRow);
  const groupCurrent = profile.account.userGroup || getOwnGroupData().ownGroup;
  const subgroupCurrent = Number(profile.account.userSubgroup) === 2 ? 2 : 1;
  if (groupCurrent) {
    const groupInput = groupRow.querySelector('#account-input-group');
    if (groupInput) groupInput.value = groupCurrent;
  }
  // ✓ Строку подключаем к окну настроек заранее: выбор подгруппы и языка подсвечивает
  // элементы списка, а они должны быть уже в документе (иначе подсветка не находилась и была ошибка).
  profileBody.appendChild(groupRow);
  if (subgroupCurrent) selectors.subgroupInstance.selectGroup(subgroupCurrent === 2 ? '2 (Б) подгруппа' : '1 (А) подгруппа');
  if (profile.language) selectors.languageInstance.selectGroup(profile.language);

  const groupSave = document.createElement('button');
  groupSave.type = 'button';
  groupSave.className = 'account-standartButton';
  groupSave.textContent = 'Сохранить группу и язык';
  groupSave.addEventListener('click', async () => {
    const group = (groupRow.querySelector('#account-input-group').value || '').trim();
    const subgroupRaw = (groupRow.querySelector('#account-input-subgroup').value || '').trim();
    const languageRaw = (groupRow.querySelector('#account-input-language').value || '').trim();
    const subgroup = subgroupRaw === '2 (Б) подгруппа' ? 2 : (subgroupRaw === '1 (А) подгруппа' ? 1 : 0);
    const language = LANGUAGES_LIST.includes(languageRaw) ? languageRaw : '';
    if (!group) { showNotification('Выберите группу', 'error'); return; }
    if (!subgroup) { showNotification('Выберите подгруппу', 'error'); return; }
    if (!language) { showNotification('Выберите изучаемый язык', 'error'); return; }

    groupSave.disabled = true;
    try { localStorage.setItem('userData', JSON.stringify({ userGroup: group, userSubgroup: subgroup, userLanguage: language })); } catch (_) { /* нет доступа */ }
    const result = await window.database.saveAccount(group, subgroup, language);
    groupSave.disabled = false;
    if (result && result.success === true) showNotification('Данные обучения обновлены', 'success');
    else showNotification('Сохранено на устройстве, облачная синхронизация недоступна', 'info');
    setActiveGroup(group);
    await refreshCurrentPage();
  });
  groupRow.appendChild(groupSave);

  // Предпочитаемые группы
  const favoriteRow = document.createElement('div');
  favoriteRow.className = 'account-setting-row';
  favoriteRow.innerHTML = '<p class="account-setting-title">Группы в быстром доступе</p>';
  buildFavoriteGroupsEditor(favoriteRow, profile.account);
  profileBody.appendChild(favoriteRow);

  // Выход
  const logoutRow = document.createElement('div');
  logoutRow.className = 'account-setting-row account-setting-row--inline';
  const logoutText = document.createElement('p');
  logoutText.className = 'account-data-description';
  logoutText.textContent = 'Выйти можно в любой момент — аккаунт и достижения сохранятся.';
  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'account-standartButton';
  logoutButton.textContent = 'Выйти из аккаунта';
  logoutButton.addEventListener('click', async () => {
    await window.auth.logout();
    auth.endSession();
  });
  logoutRow.appendChild(logoutText);
  logoutRow.appendChild(logoutButton);
  profileBody.appendChild(logoutRow);

  main.appendChild(profileSection);

  /* --------------------------- 3. Данные приложения --------------------------- */
  const dataSection = document.createElement('details');
  dataSection.className = 'profile-section';
  if (settings.openSection === 'data') dataSection.open = true;
  dataSection.innerHTML = '<summary><b>Данные приложения</b></summary>';
  const dataBody = document.createElement('div');
  dataBody.className = 'profile-section-body';
  buildAppDataSection(dataBody);
  dataSection.appendChild(dataBody);
  main.appendChild(dataSection);

  /* ------------------------------ Опасная зона ------------------------------ */
  const dangerSection = document.createElement('details');
  dangerSection.className = 'profile-section profile-section--danger';
  dangerSection.innerHTML = '<summary><b>Удаление аккаунта</b></summary>';
  const dangerBody = document.createElement('div');
  dangerBody.className = 'profile-section-body';
  dangerBody.appendChild(Object.assign(document.createElement('p'), {
    className: 'account-data-description',
    textContent: 'ВНИМАНИЕ! Действие необратимо: удаляются аккаунт, все ваши публикации и достижения. Для подтверждения введите пароль.',
  }));
  const deletePassword = buildPasswordField({ label: 'Пароль аккаунта', placeholder: 'Пароль аккаунта' });
  dangerBody.appendChild(deletePassword.group);
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'account-awairButton';
  deleteButton.textContent = 'Удалить аккаунт безвозвратно';
  deleteButton.addEventListener('click', async () => {
    const password = deletePassword.input.value;
    if (!password) { showNotification('Введите пароль аккаунта', 'error'); return; }
    deleteButton.disabled = true;
    const reauth = await window.auth.reauthenticate(password);
    if (!reauth.success) {
      deleteButton.disabled = false;
      showNotification(reauth.message || 'Неверный пароль', 'error');
      return;
    }
    await window.database.deleteUserContent().catch(() => { /* публикации могли быть удалены ранее */ });
    await window.database.deleteAccountData().catch(() => { /* профиль мог отсутствовать */ });
    const result = await window.auth.deleteAccount(password);
    deleteButton.disabled = false;
    if (result && result.success) {
      showNotification('Аккаунт удалён', 'success');
      auth.endSession(); // возвращаем окно авторизации
    } else {
      showNotification((result && result.message) || 'Не удалось удалить аккаунт', 'error');
    }
  });
  dangerBody.appendChild(deleteButton);
  dangerSection.appendChild(dangerBody);
  main.appendChild(dangerSection);

  container.appendChild(layout);
  return container;
}

// ✓ Предосмотр аккаунта: то, что видят другие пользователи (почты здесь нет)
async function renderUserProfileSubpage(container, data) {
  const targetUid = String((data && (data.userId || data.uid)) || '');
  const hero = document.createElement('div');
  hero.className = 'info-container profile-card';
  container.appendChild(hero);

  if (!targetUid) {
    hero.innerHTML = '<p>Аккаунт не найден</p>';
    return container;
  }

  const current = window.auth.getCurrentUser();
  const isMine = Boolean(current && String(current.uid) === targetUid);

  // Основа карточки: данные публикации (имя и группа автора) + запись accounts
  const fallbackName = String((data && data.userName) || 'Пользователь');
  let account = {};
  let userdata = {};
  let admin = { isAdmin: false };
  let admindata = {};
  let registeredAt = 0;

  try {
    const accountResult = await window.database.getAccount(targetUid);
    account = (accountResult && accountResult.account) ? accountResult.account : {};
  } catch (_) { account = {}; }
  try {
    const profile = await window.database.getUserdata(targetUid);
    userdata = (profile && profile.success && profile.profile) ? profile.profile : {};
  } catch (_) { userdata = {}; }
  try {
    const adminResult = await window.database.getAdmin(targetUid);
    admin = adminResult || { isAdmin: false };
  } catch (_) { admin = { isAdmin: false }; }
  if (admin && admin.isAdmin === true) {
    try {
      const doc = await window.database.db.collection('admindata').doc(targetUid).get();
      admindata = (doc && typeof doc.data === 'function') ? (doc.data() || {}) : {};
    } catch (_) { admindata = {}; }
  }
  registeredAt = Number(account.registeredAt) || 0;

  const displayName = account.userName || fallbackName;
  hero.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'profile-head';
  const name = document.createElement('p');
  name.className = 'profile-name';
  name.textContent = displayName;
  head.appendChild(name);

  const statuses = document.createElement('div');
  statuses.className = 'profile-statuses';
  if (admin && admin.isAdmin === true) statuses.appendChild(buildStatusBadge('admin', 'Администратор'));
  const role = String(userdata.role || '');
  statuses.appendChild(buildStatusBadge(role && STATUS_LABELS[role] ? role : 'student',
    role && STATUS_LABELS[role] ? STATUS_LABELS[role] : STATUS_LABELS.student));
  if (userdata.customTag) statuses.appendChild(buildStatusBadge('tag', String(userdata.customTag)));
  if (isMine) statuses.appendChild(buildStatusBadge('self', 'Это вы'));
  head.appendChild(statuses);
  hero.appendChild(head);

  const own = getOwnGroupData();
  const group = account.userGroup || '';
  const groupInfo = group && typeof getGroupInfo === 'function' ? getGroupInfo(group) : null;
  const subgroup = Number(account.userSubgroup) === 2 ? 2 : (Number(account.userSubgroup) === 1 ? 1 : 0);

  buildProfileRow(hero, 'Логин', displayName);
  buildProfileRow(hero, 'Группа', group ? `${group}${subgroup ? ` · ${subgroup}-я подгруппа` : ''}` : 'не указана');
  buildProfileRow(hero, 'Форма обучения', groupInfo ? groupInfo.education : 'не определена');
  buildProfileRow(hero, 'Институт', groupInfo ? groupInfo.institute : 'не определён');
  buildProfileRow(hero, 'Курс', groupInfo ? groupInfo.course : 'не определён');
  buildProfileRow(hero, 'Изучаемый язык', account.userLanguage || 'не указан');
  buildProfileRow(hero, 'Дата регистрации', registeredAt
    ? `${formatDateText(registeredAt)} · с нами ${formatMembershipDuration(registeredAt)}`
    : 'неизвестна');
  if (admin && admin.isAdmin === true) {
    buildProfileRow(hero, 'Статистика администратора',
      `модераций: ${Number(admindata.moderationsCount) || 0} · ответов в поддержке: ${Number(admindata.feedbackAnsweredCount) || 0}`);
  }
  // Почта намеренно не показывается: её не должен видеть никто, кроме владельца аккаунта

  const layout = document.createElement('div');
  layout.className = 'profile-layout';
  const postsColumn = document.createElement('div');
  postsColumn.className = 'profile-main-column';
  const achievementsColumn = document.createElement('div');
  achievementsColumn.className = 'profile-achievements-column';
  layout.appendChild(postsColumn);
  layout.appendChild(achievementsColumn);
  container.appendChild(layout);

  window.Achievements.render(achievementsColumn, {
    achievements: account.achievements,
    meta: account.achievementsMeta,
  });

  const postsBox = document.createElement('div');
  postsBox.className = 'info-container profile-posts';
  postsBox.innerHTML = '<p class="account-data-title">Публикации</p><p class="account-data-description">Загружаю…</p>';
  postsColumn.appendChild(postsBox);

  try {
    const postsResult = await window.database.getPostsByUser(targetUid);
    const texts = (postsResult && Array.isArray(postsResult.texts)) ? postsResult.texts : [];
    const images = (postsResult && Array.isArray(postsResult.images)) ? postsResult.images : [];
    const posts = texts
      .filter((text) => text && text.textType !== 'feedback' && text.textType !== 'feedbackAnswer')
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    postsBox.innerHTML = '';
    postsBox.appendChild(Object.assign(document.createElement('p'), {
      className: 'account-data-title',
      textContent: `Публикации (${posts.length})`,
    }));

    if (posts.length === 0) {
      postsBox.appendChild(Object.assign(document.createElement('p'), {
        className: 'account-data-description',
        textContent: 'Публикаций пока нет',
      }));
    }
    posts.slice(0, 50).forEach((post) => {
      const item = document.createElement('div');
      item.className = 'profile-post';
      const postImages = images.filter((image) => String(image.postId || image.textId || '') === String(post.postId || post.textId || ''));
      const snippet = String(post.textContent || '').slice(0, 180);
      item.innerHTML = `
        <p class="profile-post-subject">${escapeHtmlText(post.subject || 'Без предмета')}</p>
        <p class="profile-post-meta">${escapeHtmlText(formatDateText(post.timestamp))}${postImages.length ? ` · изображений: ${postImages.length}` : ''}${post.textType === 'homework' ? ' · домашнее задание' : ' · материал'}</p>
        <p class="profile-post-text">${escapeHtmlText(snippet || 'Без текста')}</p>`;
      postsBox.appendChild(item);
    });
  } catch (error) {
    postsBox.innerHTML = '';
    postsBox.appendChild(Object.assign(document.createElement('p'), {
      className: 'account-data-description',
      textContent: 'Не удалось загрузить публикации пользователя',
    }));
  }

  return container;
}

// ✓ Обратная связь: вопрос как публикация + ответ администрации
async function renderFeedbackSubpage(container) {
  const user = window.auth.getCurrentUser();
  const head = document.createElement('div');
  head.className = 'flex-container info-container';
  head.innerHTML = `
    <div class="banner-half">
      <h3>Обратная связь</h3>
      <p>Задайте вопрос администрации: он уходит как публикация и приходит с ответом сюда же</p>
    </div>`;
  container.appendChild(head);

  if (!user) {
    const guest = document.createElement('div');
    guest.className = 'info-container';
    guest.innerHTML = '<p>Обратная связь доступна только авторизованным пользователям.</p>';
    container.appendChild(guest);
    return container;
  }

  const accountResult = await window.database.getAccount(user.uid).catch(() => null);
  const account = (accountResult && accountResult.account) ? accountResult.account : {};
  const hidden = Array.isArray(account.hiddenFeedback) ? account.hiddenFeedback.map(String) : [];

  const status = document.createElement('p');
  status.className = 'feedback-page-status';
  status.textContent = 'Загружаю обращения…';
  container.appendChild(status);

  const list = document.createElement('div');
  list.className = 'feedback-list';
  container.appendChild(list);

  const composerHost = document.createElement('div');
  composerHost.className = 'feedback-composer-host';
  container.appendChild(composerHost);

  let uploader = null;
  const buildComposer = (locked, reason) => {
    composerHost.innerHTML = '';
    if (uploader && typeof uploader.destroy === 'function') { uploader.destroy(); uploader = null; }
    if (locked) {
      const note = document.createElement('div');
      note.className = 'info-container feedback-locked';
      note.innerHTML = `<p><b>${escapeHtmlText(reason)}</b></p>
        <p class="account-data-description">Чтобы отправить новое обращение, удалите прошлое через троеточие у вопроса — у администрации оно останется.</p>`;
      composerHost.appendChild(note);
      return;
    }

    const box = document.createElement('div');
    box.className = 'info-container feedback-composer';
    box.innerHTML = '<p class="account-data-title">Новый вопрос</p><p class="account-data-description">Опишите ситуацию и, если нужно, приложите изображение. Вопрос уйдёт администрации.</p>';

    const textarea = document.createElement('textarea');
    textarea.className = 'materials-textarea';
    textarea.placeholder = 'Ваш вопрос администрации';
    box.appendChild(textarea);

    const uploaderHost = document.createElement('div');
    uploaderHost.className = 'materials-image-uploader-container';
    box.appendChild(uploaderHost);
    uploader = new window.PostimagesUploader(uploaderHost, { maxImages: 5 });

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'account-standartButton';
    submit.textContent = 'Отправить вопрос';
    submit.addEventListener('click', async () => {
      const text = textarea.value.trim();
      const images = typeof uploader.getImages === 'function' ? uploader.getImages() : [];
      if (!text && images.length === 0) { showNotification('Напишите вопрос или приложите изображение', 'error'); return; }
      if (typeof uploader.isUploading === 'function' && uploader.isUploading()) {
        showNotification('Дождитесь окончания загрузки изображений', 'info');
        return;
      }
      submit.disabled = true;
      const own = getOwnGroupData();
      const result = await window.database.saveMaterialPost({
        textContent: text,
        images,
        subject: 'Обратная связь',
        teacher: '',
        subjectTimestamp: Math.floor(Date.now() / 1000),
        textType: 'feedback',
        userGroup: own.ownGroup || 'Группа не выбрана',
        userSubgroup: own.ownSubgroup,
        targetSubgroup: null,
      });
      submit.disabled = false;
      if (result && result.success === true) {
        showNotification('Вопрос отправлен администрации', 'success');
        await draw();
      } else {
        showNotification((result && result.message) || 'Не удалось отправить вопрос', 'error');
      }
    });
    box.appendChild(submit);
    composerHost.appendChild(box);
  };

  const draw = async () => {
    status.textContent = 'Загружаю обращения…';
    list.innerHTML = '';
    const result = await window.database.getFeedbackThreads();
    if (!result || result.success !== true) {
      status.textContent = (result && result.message) || 'Не удалось загрузить обращения';
      return;
    }
    const myThreads = (result.threads || []).filter((thread) => {
      const owner = String(thread.question && thread.question.userId || '');
      return owner === String(user.uid) && !hidden.includes(String(thread.postId));
    });
    status.textContent = myThreads.length === 0
      ? 'Обращений пока нет'
      : `Ваши обращения: ${myThreads.length}`;

    myThreads.forEach((thread) => {
      list.appendChild(window.FeedbackView.buildThread(thread, {
        showOwner: false,
        canDelete: true,
        onDelete: async (target) => {
          const hidden2 = await window.database.hideFeedbackThread(target.postId);
          showNotification((hidden2 && hidden2.message) || 'Обращение удалено', hidden2 && hidden2.success ? 'success' : 'error');
          if (hidden2 && hidden2.success) {
            const index = hidden.indexOf(String(target.postId));
            if (index !== -1) hidden.splice(index, 1);
            hidden.push(String(target.postId));
            await draw();
          }
        },
      }));
    });

    const answered = myThreads.some((thread) => thread.answered);
    const pending = myThreads.some((thread) => !thread.answered);
    if (myThreads.length === 0) buildComposer(false, '');
    else if (pending) buildComposer(true, 'Ваш вопрос находится в обработке');
    else if (answered) buildComposer(FEEDBACK_LOCK_ABOUT_ANSWER, 'Обращение обработано: новые вопросы отправить нельзя');
  };

  await draw();
  return container;
}

/* ============================ Аутентификация и инициализация ============================ */

// ✓ Основные контейнеры приложения
const authContainer = document.getElementById("auth");
const sessionContainer = document.getElementById("session");
const authContainerContent = authContainer.innerHTML;
const sessionContainerContent = sessionContainer.innerHTML;

// ✓ Функции аутентификации
class AuthProcessor {

  // ✓ Функция инициализации сессии
  static async startSession() {
    // ✓ Сессия инициализируется один раз: повторный вызов только перерисовывает текущую страницу
    if (AuthProcessor.sessionStarted === true) {
      if (typeof refreshCurrentPage === 'function') await refreshCurrentPage();
      return;
    }
    AuthProcessor.sessionStarted = true;
    if (DEBUG_MODE) console.log("🔓 Инициализация сессии пользователя");
    flag.loading = true;

    // ✓ Очищаем историю перемещений
    appState = { page: "home" };
    history.replaceState( { page: "home" }, "", "#home" );

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
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    CurrentGroup = userData.userGroup ? userData.userGroup : '26-ИСбо-4';
    window.CurrentGroup = CurrentGroup; // Группа нужна модулям материалов и администрирования
    const userSubroup = userData.userSubgroup ? userData.userSubgroup : 1;
    // ✓ Своя группа показывается со своей подгруппой, чужая — без неё (и считается по первой подгруппе)
    window.CurrentSubgroup = userSubroup;
    const headerGroupNode = document.getElementById('header-group');
    if (headerGroupNode) {
      headerGroupNode.textContent = `${CurrentGroup}(${userSubroup})`;
      if (userData.userLanguage) headerGroupNode.title = `Изучаемый язык: ${userData.userLanguage}`;
    }

    // ✓ Данные аккаунта для выпадающего списка групп и достижений
    const sessionUser = window.auth.getCurrentUser();
    let sessionAccount = {};
    try {
      const accountResult = await window.database.getAccount(sessionUser.uid);
      sessionAccount = (accountResult && accountResult.account) ? accountResult.account : {};
    } catch (error) { sessionAccount = {}; }

    // ✓ Выпадающее меню выбранных групп в шапке (вместо перебора по клику)
    buildHeaderGroupMenu(sessionAccount);
    groupChange.addEventListener('click', (event) => {
      event.stopPropagation();
      if (DEBUG_MODE) console.log('📌 Нажата кнопка ', groupChange.id);
      toggleHeaderGroupMenu();
    });
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (target && target.closest && target.closest('#header-right')) return;
      closeHeaderGroupMenu();
    });

    // ✓ Обновляем имя в шапке (клик по имени открывает личный кабинет)
    const user = sessionUser; let userAdmin;
    try { userAdmin = await window.database.getAdmin(user.uid); } catch {}
    applyHeaderName(user, Boolean(userAdmin && userAdmin.isAdmin === true));

    // ✓ Проверяем достижения при каждом входе в приложение
    if (window.Achievements && typeof window.Achievements.evaluate === 'function') {
      window.Achievements.evaluate().catch(() => { /* достижения не мешают работе приложения */ });
    }

    // ✓ Загружаем расписание и генерируем страницу
    try {
      if (DEBUG_MODE) console.log("✅ Сессия успешно инициализирована");
      await generatePage("nav-shedule", true);
    } catch (error) {
      if (DEBUG_MODE) console.error("❌ Ошибка при рендере страницы сессии:", error);
      showNotification(`Ошибка при загрузке страницы: ${error}`, "error");
    }

    // ✓ События, уведомления и заметки: одно чтение при входе, без постоянных запросов.
    //   После загрузки расписание перерисовывается один раз, чтобы показать события и заметки.
    try {
      await EventRoles.ensure();
      const [events] = await Promise.all([EventCenter.ensureLoaded(), NotesCenter.ensureLoaded()]);
      Promise.resolve(NotesCenter.flushPending()).catch(() => { /* ничего страшного */ });
      if (Array.isArray(events) && events.length > 0 && navOpened === 'nav-shedule'
        && typeof changeSheduleTypeContent === 'function') {
        // ✓ Обновляем только список дней, шапка страницы остаётся одна
        const weekButton = document.getElementById('shedule-week');
        changeSheduleTypeContent(weekButton && weekButton.classList.contains('selected') ? 'week' : 'day');
      }
      NoticeBanner.startOnce();
    } catch (error) {
      if (DEBUG_MODE) console.warn('События и заметки недоступны:', error && error.message);
    }

    setTimeout(() => { containerLoading.style.zIndex = '7'; flag.loading = false; }, 250);
  }

  // ✓ Функция завершения сессии и открытия окна авторизации
  endSession() {
    if (DEBUG_MODE) console.log("🔐 Завершение сессии пользователя");
    AuthProcessor.sessionStarted = false;
    flag.loading = true;
    groupData = {}; localStorage.clear(); // ✓ Очищаем пользовательские сохраненные данные
    window.CurrentGroup = undefined;
    window.CurrentSubgroup = undefined;
    closeHeaderGroupMenu();          // ✓ Прячем выпадающий список групп
    closeAllSubpages();              // ✓ Закрываем перекрывающие окна
    if (typeof unmountScheduleCreateButton === 'function') unmountScheduleCreateButton();
    const noticeHost = document.querySelector('.notice-banner-host');
    if (noticeHost) noticeHost.remove();
    // ✓ Сбрасываем кэш событий, ролей и заметок: следующий аккаунт увидит только своё
    if (typeof EventRoles !== 'undefined') EventRoles.checked = false;
    if (typeof EventCenter !== 'undefined') { EventCenter.loaded = false; EventCenter.list = []; EventCenter.loadingPromise = null; }
    if (typeof NotesCenter !== 'undefined') { NotesCenter.loaded = false; NotesCenter.byDate = {}; NotesCenter.loadingPromise = null; }
    if (typeof NoticeBanner !== 'undefined') { NoticeBanner.queue = []; NoticeBanner.showing = false; }
    this.renderAuth(false); // ✓ Генерируем окно авторизации
    flag.loading = false;
  }

  // ✓ Функция рендера и добавления обработчиков нажатия элементов авторизации
  renderAuth(progressed) {

    // ✓ Обьявление элементов авторизации 
    authContainer.innerHTML = authContainerContent;
    const registerForm = document.getElementById("register-form");
    const loginForm = document.getElementById("login-form");
    const AdditionalForm = document.getElementById("additional-form");
    const verifyForm = document.getElementById("verify-form");
    const resetSentForm = document.getElementById("reset-sent-form");
    const unverifiedForm = document.getElementById("unverified-form");
    verifyForm && resetSentForm && unverifiedForm;
    const toggleToLogin = document.getElementById("auth-button-toggleLogin");
    const toggleToRegister = document.getElementById("auth-button-toggleRegister");
    const backOnTrack = document.getElementById('auth-button-backOnTrack');
    const recoverPasswordButton = document.getElementById('auth-button-recoverPassword');
    const guestModeButton1 = document.getElementById("auth-button-guestMode1");
    const guestModeButton2 = document.getElementById("auth-button-guestMode2");
    const showAuthForm = (name) => switchAuthForm(name);
    let prefillAdditionalForm = () => {}; // ✓ Заполняется ниже, когда созданы селекторы группы/подгруппы/языка

    sessionContainer.classList.add('hidden');
    sessionContainer.classList.remove('visible');
    setTimeout(() => { 
      authContainer.classList.remove('hidden'); 
      authContainer.classList.add('visible');
      sessionContainer.style.display = 'none';
    }, 200);
    if (progressed) { // ✓ Если пользователь начал регистрацию но не допрошел ее
      showAuthForm('additional');
      backOnTrack.innerHTML = 'Выйти из аккаунта';
      prefillAdditionalForm();
    } else {
      showAuthForm('login');
    }

    // ✓ Инициализируем кнопки переключения между режимами авторизации
    toggleToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthForm('login');
    });
    toggleToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      showAuthForm('register');
    });
    backOnTrack.addEventListener("click", async(e) => {
      e.preventDefault();
      showAuthForm('register');
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
      const policy = document.querySelector("#auth-chechmark-policy").checked;

      // ✓ Валидация полей ввода и совпадения паролей
      if (!username || !email || !password || !passwordAgain) {
        showNotification("Необходимо заполнить все регистрационные поля", "error"); return;
      }
      if (password !== passwordAgain) {
        showNotification("Введенные пароли не совпадают", "error"); return;
      }
      if (policy !== true) {
        showNotification("Необходимо согласиться с политикой конфиденциальности", "error"); return;
      }

      // ✓ Отключаем кнопку на время осуществения связи с сервером
      const submitButton = registerForm.querySelector("button[type='submit']");
      submitButton.disabled = true; toggleToLogin.disabled = true; toggleToRegister.disabled = true;
      submitButton.textContent = "Загрузка...";

      // ✓ Вызываем метод регистрации из класса Authentication
      const result = await window.auth.register(email, password, username);
      if (result.success) { // ✓ Регистрация прошла: показываем экран подтверждения почты
        showNotification(result.message, "success");
        registerForm.reset();
        setAuthEmailText('auth-verify-email', (result.user && result.user.email) ? result.user.email : email);
        setTimeout(() => { showAuthForm('verify'); }, 200);
      } else { // ✓ Если произошла ошибка во время авторизации
        showNotification(result.message, "error");
        submitButton.textContent = "Зарегистрироваться";
      }
      submitButton.disabled = false; toggleToLogin.disabled = false; toggleToRegister.disabled = false;
    });

    // ✓ Экран подтверждения почты после регистрации: отправка письма, проверка, отмена
    verifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = verifyForm.querySelector("button[type='submit']");
      submitButton.disabled = true;
      submitButton.textContent = 'Проверяю…';
      const check = await window.auth.checkEmailVerified();
      submitButton.disabled = false;
      submitButton.textContent = 'Я подтвердил(а) почту';
      if (check && check.verified) {
        showNotification('Почта подтверждена', 'success');
        showAuthForm('additional');
        prefillAdditionalForm();
      } else {
        showNotification('Почта пока не подтверждена: перейдите по ссылке из письма и попробуйте снова', 'error');
      }
    });

    document.getElementById('auth-button-verifyAgain').addEventListener('click', async () => {
      const result = await window.auth.sendEmailVerification();
      showNotification((result && result.message) || 'Письмо отправлено повторно', result && result.success ? 'success' : 'error');
    });

    document.getElementById('auth-button-cancelRegistration').addEventListener('click', async () => {
      const result = await window.auth.cancelRegistration();
      if (result && result.success) {
        showNotification('Регистрация отменена, аккаунт удалён', 'success');
        showAuthForm('login'); // ✓ Возвращаемся в окно авторизации
      } else {
        showNotification((result && result.message) || 'Не удалось отменить регистрацию', 'error');
      }
    });

    // ✓ Восстановление пароля: кнопка в форме входа
    recoverPasswordButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const emailField = document.getElementById('auth-input-loginEmail');
      const email = (emailField && emailField.value ? emailField.value : '').trim();
      if (!email) {
        showNotification('Введите почту в поле выше — мы отправим на неё ссылку для восстановления', 'info');
        if (emailField) emailField.focus();
        return;
      }
      recoverPasswordButton.disabled = true;
      const result = await window.auth.sendPasswordResetEmail(email);
      recoverPasswordButton.disabled = false;
      if (result && result.success) {
        setAuthEmailText('auth-reset-email', email);
        showAuthForm('reset');
        showNotification('Ссылка для восстановления отправлена', 'success');
      } else {
        showNotification((result && result.message) || 'Не удалось отправить письмо', 'error');
      }
    });

    document.getElementById('auth-button-backToLogin').addEventListener('click', () => {
      showAuthForm('login');
    });

    // ✓ Экран неподтверждённой почты: проверка, повторная отправка, выход без удаления аккаунта
    unverifiedForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitButton = unverifiedForm.querySelector("button[type='submit']");
      submitButton.disabled = true;
      submitButton.textContent = 'Проверяю…';
      const check = await window.auth.checkEmailVerified();
      submitButton.disabled = false;
      submitButton.textContent = 'Я подтвердил(а) почту';
      if (check && check.verified) {
        showNotification('Почта подтверждена, входим в аккаунт', 'success');
        await completeSignIn();
      } else {
        showNotification('Почта пока не подтверждена', 'error');
      }
    });

    document.getElementById('auth-button-unverifiedAgain').addEventListener('click', async () => {
      const result = await window.auth.sendEmailVerification();
      showNotification((result && result.message) || 'Письмо отправлено', result && result.success ? 'success' : 'error');
    });

    document.getElementById('auth-button-unverifiedLogout').addEventListener('click', async () => {
      await window.auth.logout(); // Аккаунт НЕ удаляем: пользователь просто выходит
      showNotification('Вы вышли из аккаунта. При следующем входе письмо придёт снова', 'info');
      showAuthForm('login');
    });

    // ✓ Обработка ввода формы дополнительной информации
    const groupSelectorInstance = new groupSelector('auth-input-group', 'auth-input-groupDropdown', 'auth-input-groupContent');
    const subgroupSelectorInstance = new subgroupSelector('auth-input-subgroup', 'auth-input-subgroupDropdown', 'auth-input-subgroupContent');
    const languageSelectorInstance = new languageSelector('auth-input-language', 'auth-input-languageDropdown', 'auth-input-languageContent');
    groupSelectorInstance && subgroupSelectorInstance && languageSelectorInstance;

    // ✓ Предзаполнить форму дополнительных данных тем, что уже известно
    prefillAdditionalForm = function prefillAdditionalForm() {
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem('userData') || '{}') || {}; } catch (_) { saved = {}; }

      if (saved.userGroup) {
        const groupInput = document.getElementById('auth-input-group');
        if (groupInput) groupInput.value = saved.userGroup;
      }
      if (Number(saved.userSubgroup) === 1 || Number(saved.userSubgroup) === 2) {
        subgroupSelectorInstance.selectGroup(Number(saved.userSubgroup) === 2 ? '2 (Б) подгруппа' : '1 (А) подгруппа');
      }
      if (saved.userLanguage && LANGUAGES_LIST.includes(saved.userLanguage)) {
        languageSelectorInstance.selectGroup(saved.userLanguage);
      }
      ['auth-input-group', 'auth-input-subgroup', 'auth-input-language'].forEach((id) => {
        const element = document.getElementById(id);
        if (element && element.value) element.classList.add('input-preselected');
      });
    };

    AdditionalForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Обьявление значений введенных элементов
      const userGroup = document.querySelector("#auth-input-group").value.trim();
      const userSubgroupUnstandarted = document.querySelector("#auth-input-subgroup").value.trim();
      const userSubgroup = (userSubgroupUnstandarted == '1 (А) подгруппа') ? 1 : ((userSubgroupUnstandarted == '2 (Б) подгруппа') ? 2 : 0);
      const userLanguageUnstandarted = document.querySelector("#auth-input-language").value.trim();
      const userLanguage = LANGUAGES_LIST.includes(userLanguageUnstandarted) ? userLanguageUnstandarted : '';

      // Валидация введенных значений
      if (!userGroup || typeof userGroup !== 'string') { showNotification('Необходимо ввести вашу группу обучения', 'error'); return; }
      if (!userSubgroup) { showNotification('Необходимо выбрать вашу подгруппу', 'error'); return; }
      if (!userLanguage) { showNotification('Необходимо выбрать изучаемый язык', 'error'); return; }

      // Сохраняем пользовательские данные в локальное хранилище
      localStorage.setItem('userData', JSON.stringify({ userGroup, userSubgroup, userLanguage }));
      try { await window.database.saveAccount(userGroup, userSubgroup, userLanguage);
      } catch (error) { showNotification(`Ошибка облачного сохранения данных аккаунта, используется файл локального сохранения`, 'error'); }

      // ✓ Запускаем сессию
      const submitButton = AdditionalForm.querySelector("button[type='submit']");
      submitButton.disabled = true; backOnTrack.disabled = true;
      submitButton.textContent = "Загрузка...";
      setTimeout(async() => {
        await AuthProcessor.startSession();
      }, 200);
    });

    /**
     * Продолжение входа после проверки почты: либо форма дополнительных данных,
     * либо запуск сессии. Используется и обычным входом, и экраном подтверждения почты.
     */
    const completeSignIn = async () => {
      let accountAdditionalData = undefined;
      const currentAccountUser = window.auth.getCurrentUser();
      const userID = currentAccountUser && currentAccountUser.uid ? currentAccountUser.uid : '';
      try { accountAdditionalData = await window.database.getAccount(userID);
      } catch { showNotification(`Ошибка облачной загрузки данных аккаунта, используется файл локального сохранения`, 'error'); }

      const account = accountAdditionalData && accountAdditionalData.account ? accountAdditionalData.account : null;
      const accountIsComplete = Boolean(account && account.userGroup && account.userSubgroup && account.userLanguage);

      if (!accountIsComplete) { // ✓ Данных нет вовсе либо они неполные (например, не выбран изучаемый язык)
        const partially = {
          userGroup: (account && account.userGroup) || '',
          userSubgroup: Number(account && account.userSubgroup) === 2 ? 2 : (Number(account && account.userSubgroup) === 1 ? 1 : ''),
          userLanguage: (account && account.userLanguage) || '',
        };
        localStorage.setItem('userData', JSON.stringify(partially));
        showNotification(account
          ? 'Данные аккаунта заполнены не до конца — дополните их, пожалуйста'
          : 'Данные аккаунта не найдены, необходимо пройти форму дополнительных данных', 'info');
        registerForm.reset();
        setTimeout(() => {
          showAuthForm('additional');
          backOnTrack.innerHTML = 'Выйти из аккаунта';
          prefillAdditionalForm();
        }, 200);
      } else { // ✓ Аккаунт заполнен полностью — переносим данные в локальное хранилище
        const userGroup = account.userGroup;
        const userSubgroup = Number(account.userSubgroup) === 2 ? 2 : 1;
        const userLanguage = account.userLanguage;
        const data2save = { userGroup, userSubgroup, userLanguage };
        localStorage.setItem('userData', JSON.stringify(data2save));
        setTimeout(async() => {
          await AuthProcessor.startSession();
        }, 200);
      }
    };

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
        // ✓ Без подтверждённой почты в приложение не пускаем
        const verified = await isAccountVerified();
        if (!verified) {
          setAuthEmailText('auth-unverified-email', (result.user && result.user.email) || email);
          showAuthForm('unverified');
          showNotification(result.message || 'Почта не подтверждена: письмо отправлено повторно', 'info');
          submitButton.disabled = false; toggleToLogin.disabled = false; toggleToRegister.disabled = false;
          return;
        }
        showNotification(result.message, "success");
        await completeSignIn();
      } else { // ✓ Если произошла ошибка во время авторизации
        showNotification(result.message, "error");
        submitButton.textContent = "Войти";
      }
      submitButton.disabled = false; toggleToLogin.disabled = false; toggleToRegister.disabled = false;
    });

    // ✓ Обработка запуска гостевого режима
    async function guestModeEventListener() {
      console.log("🕵🏻 Включен гостевой режим");
      if (localStorage.getItem('userData')) { // ✓ Если это не первый случай запуска гостевого режима
        await AuthProcessor.startSession();
      } else { // ✓ Если человек еще ни разу не запускал гостевой режим
        showAuthForm('additional');
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
      const unsubscribe = window.auth.auth.onAuthStateChanged(() => { unsubscribe(); resolve(); });
    });
    const currentUser = window.auth.getCurrentUser();

    // ✓ Аккаунт с неподтверждённой почтой в приложение не пускаем:
    //   показываем экран подтверждения (письмо отправляем заново) без входа в сессию
    if (currentUser) {
      const verified = await isAccountVerified();
      if (!verified) {
        if (currentUser.emailVerified !== true) {
          try { await window.auth.sendEmailVerification(); }
          catch (error) { console.warn('Письмо для подтверждения не отправлено:', error && error.code); }
        }
        setAuthEmailText('auth-unverified-email', currentUser.email || '');
        showNotification('Почта не подтверждена: вход в приложение закрыт, письмо отправлено заново', 'info');
        this.renderAuth(false);
        switchAuthForm('unverified');
        flag.loading = false;
        return;
      }
    }

    // ✓ Пробуем получить данные аккаунта
    let userData;
    try { userData = await window.database.getAccount(currentUser.uid); } catch {}
    if (DEBUG_MODE) console.log(userData);

    // ✓ Проверяем различные вариации наличия данных
    if (currentUser && localStorage.getItem('userData')) { // ✓ Если вход в аккаунт выполнен и есть локальное сохранение
      const userStorageData = JSON.parse(localStorage.getItem('userData') || '{}');
      const storageComplete = Boolean(userStorageData.userGroup && userStorageData.userSubgroup && userStorageData.userLanguage);

      if ((userData.success !== true || !userData.account) && storageComplete) { // ✓ На сервере нет данных, но локально они полные
        try { await window.database.saveAccount(userStorageData);
        } catch { showNotification(`Нет доступа к серверу, вход в аккаунт осуществлен локально`, 'info'); }
      }
      if (!storageComplete) { // ✓ Локальные данные заполнены не до конца (нет группы, подгруппы или языка)
        showNotification(`Данные аккаунта заполнены не до конца, необходимо заного пройти ввод данных`, 'info');
        this.renderAuth(true); flag.loading = false; return;
      }
      try { // ✓ Досылаем на сервер те данные, которых там не хватает
        const account = userData.account || {};
        if (!account.userGroup || !account.userSubgroup || !account.userLanguage) {
          const answer = await window.database.saveAccount(userStorageData);
          if (answer && answer.success !== true) { showNotification(`Ошибка облачной синхронизации данных аккаунта: ${answer.message}`, 'error'); }
        }
      } catch { showNotification(`Нет подключения к интернету или сервер недоступен, используется оффлайн-режим`, 'info'); }
      if (DEBUG_MODE) console.log("✅ Пользователь авторизован: ", currentUser.email);
      await AuthProcessor.startSession();

    } else if (currentUser && userData.success === true) { // ✓ Если вход в аккаунт выполнен и есть доступ к облачным данным
      const account = userData.account || {};
      if (!account.userGroup || !account.userSubgroup || !account.userLanguage) { // ✓ Данных не хватает — просим заполнить форму
        showNotification(`Данные аккаунта заполнены не до конца, необходимо заного пройти ввод данных`, 'info');
        this.renderAuth(true); flag.loading = false; return;
      }

      // ✓ Сохраняем локально пользовательские данные
      const userGroup = account.userGroup;
      const userSubgroup = Number(account.userSubgroup) === 2 ? 2 : 1;
      const userLanguage = account.userLanguage;
      const data2save = { userGroup, userSubgroup, userLanguage };
      if (localStorage.getItem('userData') !== JSON.stringify(data2save)) { // ✓ Если сохранения не совпадают
        localStorage.setItem('userData', JSON.stringify(data2save));
      }
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

/* ============================================================================================
 * Обновление 17.10.2026: события, уведомления и пользовательские заметки
 *
 * • Создавать события и уведомления могут только администраторы, старосты, профорги
 *   и культорги. Права проверяются и здесь, и правилами Firestore.
 * • Событие — с датой, временем начала и конца, местом и описанием. Показывается
 *   в расписании синей меткой; если пересекается с парой — тонкой полоской поверх неё.
 * • Уведомление — только описание. Показывается баннером внизу экрана при входе.
 * • Заметки — личные дела пользователя на день, работают локально и синхронизируются.
 * • Никаких постоянных запросов к Firebase: события, уведомления и заметки читаются
 *   один раз при старте сессии и обновляются только действиями пользователя.
 * ========================================================================================== */

const EVENTS_COLLECTION = 'events';
const NOTES_COLLECTION = 'notes';
const EVENTS_CACHE_KEY = 'kgEventsCache';
const NOTES_CACHE_KEY = 'kgNotesCache';
const READ_NOTICES_KEY = 'kgReadNotices';
const EVENTS_LIMIT = 120;          // сколько последних записей читаем за один раз
const NOTES_FETCH_LIMIT = 400;     // сколько заметок пользователя читаем

// ✓ Названия ролей для подписи на событии
const EVENT_ROLE_LABELS = {
  admin: 'Администратор',
  starosta: 'Староста',
  proforg: 'Профорг',
  kultorg: 'Культорг',
};

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (_) { return fallback; }
}

function writeJsonStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (_) { return false; }
}

function formatClock(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatDayKey(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDayTitle(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return '';
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
    'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return 'Сегодня';
  if (isYesterday) return 'Вчера';
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/* ------------------------------------------------------------------------------------------
 * Роли: кто может создавать события и уведомления
 * ---------------------------------------------------------------------------------------- */

const EventRoles = {
  role: '',
  isAdmin: false,
  group: '',
  checked: false,

  async ensure(force) {
    if (this.checked && !force) return this;
    const user = window.auth && typeof window.auth.getCurrentUser === 'function' ? window.auth.getCurrentUser() : null;
    const own = typeof getOwnGroupData === 'function' ? getOwnGroupData() : { ownGroup: '' };
    this.group = own.ownGroup || '';
    if (!user) { this.role = ''; this.isAdmin = false; this.checked = true; return this; }

    try {
      const adminResult = await window.database.getAdmin(user.uid);
      this.isAdmin = Boolean(adminResult && adminResult.isAdmin === true);
    } catch (_) { this.isAdmin = false; }

    try {
      const profile = await window.database.getUserdata(user.uid);
      const data = profile && profile.success ? (profile.data || {}) : {};
      this.role = String(data.role || '').toLowerCase();
    } catch (_) { this.role = ''; }

    this.checked = true;
    return this;
  },

  // ✓ Староста, профорг, культорг или администратор
  canPublish() {
    return this.isAdmin || ['starosta', 'proforg', 'kultorg'].includes(this.role);
  },

  // ✓ Подпись роли: у администратора приоритет, иначе должность
  label() {
    if (this.isAdmin) return EVENT_ROLE_LABELS.admin;
    return EVENT_ROLE_LABELS[this.role] || 'Пользователь';
  },

  // ✓ Выбирать «глобально / для группы» может только администратор
  canChooseScope() {
    return this.isAdmin;
  },
};

/* ------------------------------------------------------------------------------------------
 * События и уведомления
 * ---------------------------------------------------------------------------------------- */

const EventCenter = {
  list: [],
  loaded: false,
  loadingPromise: null,
  listeners: [],

  // ✓ Прочитать события один раз за сессию (свежие записи + локальный кэш для офлайна)
  async ensureLoaded(force) {
    if (this.loaded && !force) return this.list;
    if (this.loadingPromise && !force) return this.loadingPromise;

    this.loadingPromise = (async () => {
      const cached = readJsonStorage(EVENTS_CACHE_KEY, []);
      if (Array.isArray(cached) && cached.length) this.list = cached;

      const db = window.database && window.database.db ? window.database.db : null;
      if (!db) { this.loaded = true; return this.list; }

      try {
        const snapshot = await db.collection(EVENTS_COLLECTION)
          .orderBy('timestamp', 'desc')
          .limit(EVENTS_LIMIT)
          .get();
        const items = [];
        snapshot.forEach((doc) => {
          const data = doc.data() || {};
          items.push({ ...data, eventId: data.eventId || doc.id });
        });
        this.list = items;
        writeJsonStorage(EVENTS_CACHE_KEY, items);
      } catch (error) {
        console.warn('Не удалось загрузить события, показываем сохранённые:', error && error.message);
      }

      this.loaded = true;
      this.listeners.forEach((callback) => { try { callback(this.list); } catch (_) { /* ок */ } });
      return this.list;
    })();

    return this.loadingPromise;
  },

  // ✓ Подписка на обновление списка (расписание перерисовывается один раз)
  onChange(callback) {
    if (typeof callback === 'function' && !this.listeners.includes(callback)) this.listeners.push(callback);
  },

  // ✓ События, которые видит пользователь: глобальные + своей группы
  visibleForMe() {
    const own = getOwnGroupData();
    const group = own.ownGroup || '';
    return this.list
      .filter((item) => item && item.eventId)
      .filter((item) => {
        if (String(item.scope) === 'global') return true;
        return String(item.group || '') === String(group || '');
      })
      // ✓ Вместо преподавателя у записи показывается тег роли и логин автора
      .map((item) => ({
        ...item,
        ownerRoleLabel: this.roleLabel(item),
        ownerLogin: String(item.ownerLogin || ''),
      }))
      .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
  },

  // ✓ События на конкретный день (для расписания)
  eventsForDay(dateKey) {
    return this.visibleForMe().filter((item) => {
      const value = item.kind === 'event' ? item.startTime : item.timestamp;
      return formatDayKey(value) === dateKey;
    });
  },

  // ✓ Понятная подпись роли для карточки
  roleLabel(item) {
    const role = String((item && item.ownerRole) || '').toLowerCase();
    if (role === 'admin') return EVENT_ROLE_LABELS.admin;
    if (role === 'starosta' || role === 'proforg' || role === 'kultorg') return EVENT_ROLE_LABELS[role];
    return 'Пользователь';
  },

  // ✓ Строка автора: тег роли и логин, как подпись преподавателя у пары
  authorLine(item) {
    if (!item) return '';
    const role = this.roleLabel(item);
    const login = String(item.ownerLogin || '').trim();
    return login ? `${role} · ${login}` : role;
  },

  // ✓ Создание события или уведомления
  async create(input) {
    const user = window.auth.getCurrentUser();
    if (!user) return { success: false, message: 'Пользователь не авторизован' };
    const roles = await EventRoles.ensure();
    if (!roles.canPublish()) return { success: false, message: 'Создавать события могут только старосты, профорги, культорги и администраторы' };

    const data = input || {};
    const kind = data.kind === 'notice' ? 'notice' : 'event';
    const description = String(data.description || '').trim();
    const title = String(data.title || '').trim() || (kind === 'notice' ? 'Уведомление' : 'Событие');
    if (!description) return { success: false, message: 'Добавьте описание' };

    let startTime = 0;
    let endTime = 0;
    if (kind === 'event') {
      startTime = Number(data.startTime) || 0;
      endTime = Number(data.endTime) || 0;
      if (!startTime || !endTime) return { success: false, message: 'Укажите дату и время события' };
      if (endTime <= startTime) return { success: false, message: 'Конец события должен быть позже начала' };
    }

    const scope = roles.canChooseScope() && data.scope === 'global' ? 'global' : 'group';
    const own = getOwnGroupData();
    const payload = {
      eventId: `ev_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      kind,
      title: title.slice(0, 120),
      place: kind === 'event' ? String(data.place || '').trim().slice(0, 120) : '',
      description: description.slice(0, 3000),
      ownerUid: String(user.uid),
      ownerName: user.displayName || 'Пользователь',
      ownerLogin: String(user.email || '').split('@')[0] || '',
      ownerRole: roles.isAdmin ? 'admin' : roles.role,
      scope,
      group: scope === 'group' ? (own.ownGroup || '') : '',
      startTime: kind === 'event' ? startTime : 0,
      endTime: kind === 'event' ? endTime : 0,
      timestamp: Date.now(),
      reportCount: 0,
      reportedBy: [],
    };

    try {
      await window.database.db.collection(EVENTS_COLLECTION).doc(payload.eventId).set(payload);
    } catch (error) {
      return { success: false, message: `Не удалось сохранить: ${error && error.message ? error.message : error}` };
    }

    this.list = [payload, ...this.list.filter((item) => item.eventId !== payload.eventId)];
    writeJsonStorage(EVENTS_CACHE_KEY, this.list);
    this.listeners.forEach((callback) => { try { callback(this.list); } catch (_) { /* ок */ } });
    return { success: true, item: payload, message: kind === 'event' ? 'Событие опубликовано' : 'Уведомление опубликовано' };
  },

  // ✓ Обновить своё событие (только владелец)
  async update(eventId, input) {
    const user = window.auth.getCurrentUser();
    if (!user) return { success: false, message: 'Пользователь не авторизован' };
    const current = this.list.find((item) => item.eventId === eventId);
    if (!current) return { success: false, message: 'Событие не найдено' };
    if (String(current.ownerUid) !== String(user.uid)) return { success: false, message: 'Изменять может только автор' };

    const data = input || {};
    const patch = {
      title: String(data.title || '').trim().slice(0, 120) || current.title,
      place: current.kind === 'event' ? String(data.place || '').trim().slice(0, 120) : '',
      description: String(data.description || '').trim().slice(0, 3000) || current.description,
    };
    if (current.kind === 'event') {
      const startTime = Number(data.startTime) || Number(current.startTime);
      const endTime = Number(data.endTime) || Number(current.endTime);
      if (endTime <= startTime) return { success: false, message: 'Конец события должен быть позже начала' };
      patch.startTime = startTime;
      patch.endTime = endTime;
    }

    try {
      await window.database.db.collection(EVENTS_COLLECTION).doc(eventId).update(patch);
    } catch (error) {
      return { success: false, message: `Не удалось обновить: ${error && error.message ? error.message : error}` };
    }

    this.list = this.list.map((item) => (item.eventId === eventId ? { ...item, ...patch } : item));
    writeJsonStorage(EVENTS_CACHE_KEY, this.list);
    this.listeners.forEach((callback) => { try { callback(this.list); } catch (_) { /* ок */ } });
    return { success: true, message: 'Событие обновлено' };
  },

  // ✓ Удалить событие (владелец или администратор)
  async remove(eventId) {
    const user = window.auth.getCurrentUser();
    if (!user) return { success: false, message: 'Пользователь не авторизован' };
    const current = this.list.find((item) => item.eventId === eventId);
    if (!current) return { success: false, message: 'Событие не найдено' };
    const roles = await EventRoles.ensure();
    if (String(current.ownerUid) !== String(user.uid) && !roles.isAdmin) {
      return { success: false, message: 'Удалить может только автор или администратор' };
    }
    try {
      await window.database.db.collection(EVENTS_COLLECTION).doc(eventId).delete();
    } catch (error) {
      return { success: false, message: `Не удалось удалить: ${error && error.message ? error.message : error}` };
    }
    this.list = this.list.filter((item) => item.eventId !== eventId);
    writeJsonStorage(EVENTS_CACHE_KEY, this.list);
    this.listeners.forEach((callback) => { try { callback(this.list); } catch (_) { /* ок */ } });
    return { success: true, message: 'Событие удалено' };
  },

  // ✓ Жалоба на событие: после 7 жалоб оно удаляется
  async report(eventId) {
    const user = window.auth.getCurrentUser();
    if (!user) return { success: false, message: 'Пользователь не авторизован' };
    const current = this.list.find((item) => item.eventId === eventId);
    if (!current) return { success: false, message: 'Событие не найдено' };
    if (String(current.ownerUid) === String(user.uid)) return { success: false, message: 'На своё событие жаловаться нельзя' };
    const reportedBy = Array.isArray(current.reportedBy) ? current.reportedBy.slice() : [];
    if (reportedBy.includes(String(user.uid))) return { success: false, message: 'Вы уже пожаловались на это событие' };
    reportedBy.push(String(user.uid));
    const reportCount = (Number(current.reportCount) || 0) + 1;
    try {
      // ✓ Сначала фиксируем саму жалобу: правила Firebase разрешают удаление только
      //   после того, как седьмой пожаловавшийся уже записан в reportedBy.
      await window.database.db.collection(EVENTS_COLLECTION).doc(eventId).update({ reportCount, reportedBy });
      if (reportCount >= 7) {
        await window.database.db.collection(EVENTS_COLLECTION).doc(eventId).delete();
        this.list = this.list.filter((item) => item.eventId !== eventId);
      } else {
        this.list = this.list.map((item) => (item.eventId === eventId ? { ...item, reportCount, reportedBy } : item));
      }
    } catch (error) {
      return { success: false, message: `Не удалось отправить жалобу: ${error && error.message ? error.message : error}` };
    }
    writeJsonStorage(EVENTS_CACHE_KEY, this.list);
    return { success: true, message: reportCount >= 7 ? 'Жалоба принята: событие удалено' : 'Жалоба отправлена' };
  },

  // ✓ Открыть подстраницу события
  open(eventId) {
    if (typeof navigateTo === 'function') navigateTo('eventshow', { eventId }).catch(() => {});
  },
};

window.EventCenter = EventCenter;
window.EventRoles = EventRoles;
window.ScheduleExtras = {
  eventsForDay: (dateKey) => EventCenter.eventsForDay(dateKey),
  notesForDay: (dateKey) => NotesCenter.buildDayNotes(dateKey),
};
window.openScheduleEvent = (eventId) => EventCenter.open(eventId);

/* ------------------------------------------------------------------------------------------
 * Пользовательские заметки на день
 * ---------------------------------------------------------------------------------------- */

const NotesCenter = {
  byDate: {},
  loaded: false,
  loadingPromise: null,
  editingDate: '',

  _key() {
    const user = window.auth && typeof window.auth.getCurrentUser === 'function' ? window.auth.getCurrentUser() : null;
    return `${NOTES_CACHE_KEY}:${user ? user.uid : 'guest'}`;
  },

  _loadLocal() {
    const saved = readJsonStorage(this._key(), null);
    if (saved && typeof saved === 'object') this.byDate = saved;
  },

  _saveLocal() {
    writeJsonStorage(this._key(), this.byDate);
  },

  async ensureLoaded(force) {
    if (this.loaded && !force) return this.byDate;
    if (this.loadingPromise && !force) return this.loadingPromise;
    this.loadingPromise = (async () => {
      this._loadLocal();
      const user = window.auth && typeof window.auth.getCurrentUser === 'function' ? window.auth.getCurrentUser() : null;
      const db = window.database && window.database.db ? window.database.db : null;
      if (!user || !db) { this.loaded = true; return this.byDate; }
      try {
        const snapshot = await db.collection(NOTES_COLLECTION)
          .where('userId', '==', String(user.uid))
          .limit(NOTES_FETCH_LIMIT)
          .get();
        const remote = {};
        snapshot.forEach((doc) => {
          const data = doc.data() || {};
          const date = String(data.date || '');
          if (!date) return;
          if (!remote[date]) remote[date] = [];
          remote[date].push({
            noteId: data.noteId || doc.id,
            text: String(data.text || ''),
            done: data.done === true,
            timestamp: Number(data.timestamp) || 0,
          });
        });
        // ✓ Локальные незасинхронизированные записи сохраняем: они появятся после выхода в сеть
        Object.keys(this.byDate).forEach((date) => {
          const local = this.byDate[date] || [];
          const merged = (remote[date] || []).slice();
          local.forEach((note) => {
            if (note.pending && !merged.some((item) => item.noteId === note.noteId)) merged.push(note);
          });
          remote[date] = merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        });
        this.byDate = remote;
        this._saveLocal();
      } catch (error) {
        console.warn('Заметки: работаем только локально —', error && error.message);
      }
      this.loaded = true;
      return this.byDate;
    })();
    return this.loadingPromise;
  },

  getForDay(dateKey) {
    return Array.isArray(this.byDate[dateKey]) ? this.byDate[dateKey] : [];
  },

  _setDay(dateKey, list) {
    this.byDate[dateKey] = list;
    this._saveLocal();
  },

  async add(dateKey) {
    const note = {
      noteId: `note_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      text: '',
      done: false,
      timestamp: Date.now(),
      pending: true,
    };
    this._setDay(dateKey, [...this.getForDay(dateKey), note]);
    return note;
  },

  async saveText(dateKey, noteId, text) {
    const list = this.getForDay(dateKey).map((note) => (
      note.noteId === noteId ? { ...note, text: String(text || '').slice(0, 500) } : note
    ));
    this._setDay(dateKey, list);
    await this._push(dateKey, noteId);
  },

  async toggleDone(dateKey, noteId) {
    const list = this.getForDay(dateKey).map((note) => (
      note.noteId === noteId ? { ...note, done: !note.done } : note
    ));
    this._setDay(dateKey, list);
    await this._push(dateKey, noteId);
  },

  async remove(dateKey, noteId) {
    const list = this.getForDay(dateKey).filter((note) => note.noteId !== noteId);
    this._setDay(dateKey, list);
    const db = window.database && window.database.db ? window.database.db : null;
    if (!db) return;
    try { await db.collection(NOTES_COLLECTION).doc(String(noteId)).delete(); }
    catch (error) { console.warn('Заметка удалена локально, сервер недоступен:', error && error.message); }
  },

  async _push(dateKey, noteId) {
    const note = this.getForDay(dateKey).find((item) => item.noteId === noteId);
    if (!note) return;
    const user = window.auth && typeof window.auth.getCurrentUser === 'function' ? window.auth.getCurrentUser() : null;
    const db = window.database && window.database.db ? window.database.db : null;
    if (!user || !db) return;
    if (!String(note.text || '').trim()) return; // пустую заметку на сервер не отправляем
    try {
      await db.collection(NOTES_COLLECTION).doc(String(note.noteId)).set({
        noteId: String(note.noteId),
        userId: String(user.uid),
        date: dateKey,
        text: String(note.text || '').slice(0, 500),
        done: note.done === true,
        timestamp: Number(note.timestamp) || Date.now(),
      }, { merge: true });
      const list = this.getForDay(dateKey).map((item) => (
        item.noteId === noteId ? { ...item, pending: false } : item
      ));
      this._setDay(dateKey, list);
    } catch (error) {
      console.warn('Заметка сохранена локально, синхронизация не прошла:', error && error.message);
    }
  },

  // ✓ Отправить на сервер всё, что было сделано без сети (вызывается при появлении сети и при входе)
  async flushPending() {
    const dates = Object.keys(this.byDate || {});
    for (let index = 0; index < dates.length; index += 1) {
      const dateKey = dates[index];
      const pending = (this.byDate[dateKey] || []).filter((note) => note && note.pending && String(note.text || '').trim());
      for (let order = 0; order < pending.length; order += 1) {
        await this._push(dateKey, pending[order].noteId);
      }
    }
  },

  /**
   * Блок заметок в дне расписания.
   * Если заметок нет — только «+» в правом нижнем углу дня.
   * Если есть — контейнер со списком и «выемка» с плюсиком по центру.
   */
  buildDayNotes(dateKey) {
    const notes = this.getForDay(dateKey);
    const host = document.createElement('div');
    host.className = 'day-notes';
    if (notes.length === 0) host.classList.add('day-notes--empty');

    if (notes.length > 0) {
      const box = document.createElement('div');
      box.className = 'day-notes-box';
      notes.forEach((note) => box.appendChild(this._buildNoteRow(dateKey, note)));
      host.appendChild(box);
    }

    const trough = document.createElement('button');
    trough.type = 'button';
    trough.className = 'day-notes-add';
    trough.title = 'Добавить заметку';
    trough.setAttribute('aria-label', 'Добавить заметку');
    trough.textContent = '+';
    trough.addEventListener('click', async (event) => {
      event.stopPropagation();
      const note = await NotesCenter.add(dateKey);
      this.editingDate = dateKey;
      this._refreshDay(dateKey);
      setTimeout(() => {
        const row = document.querySelector(`[data-note-id="${note.noteId}"] .day-note-input`);
        if (row) { row.focus(); row.textContent = ''; }
      }, 30);
    });
    host.appendChild(trough);
    return host;
  },

  _buildNoteRow(dateKey, note) {
    const row = document.createElement('div');
    row.className = 'day-note' + (note.done ? ' day-note--done' : '');
    row.dataset.noteId = note.noteId;

    const check = document.createElement('button');
    check.type = 'button';
    check.className = 'day-note-check';
    check.title = note.done ? 'Вернуть в работу' : 'Отметить выполненным';
    check.setAttribute('aria-label', note.done ? 'Вернуть в работу' : 'Отметить выполненным');
    check.textContent = note.done ? '✓' : '';
    check.addEventListener('click', async (event) => {
      event.stopPropagation();
      await NotesCenter.toggleDone(dateKey, note.noteId);
      this._refreshDay(dateKey);
    });
    row.appendChild(check);

    const input = document.createElement('div');
    input.className = 'day-note-input';
    input.contentEditable = 'true';
    input.spellcheck = false;
    input.textContent = note.text || '';
    input.dataset.placeholder = 'Новое дело…';

    const commit = async () => {
      const text = (input.textContent || '').replace(/\u00a0/g, ' ').trim();
      if (!text) {
        // ✓ Стерли весь текст и ушли из поля — заметка удаляется сама
        await NotesCenter.remove(dateKey, note.noteId);
        this._refreshDay(dateKey);
        return;
      }
      if (text !== note.text) await NotesCenter.saveText(dateKey, note.noteId, text);
    };
    input.addEventListener('blur', () => {
      row.classList.remove('day-note--editing');
      commit();
    });

    // ✓ Кнопка удаления показывается при заходе в заметку
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'day-note-remove';
    removeButton.title = 'Удалить заметку';
    removeButton.setAttribute('aria-label', 'Удалить заметку');
    removeButton.textContent = '×';
    removeButton.addEventListener('mousedown', (event) => { event.preventDefault(); });
    removeButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      await NotesCenter.remove(dateKey, note.noteId);
      this._refreshDay(dateKey);
    });
    row.appendChild(removeButton);

    input.addEventListener('focus', () => row.classList.add('day-note--editing'));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); input.blur(); }
    });
    row.appendChild(input);
    return row;
  },

  _refreshDay(dateKey) {
    const nodes = document.querySelectorAll(`[data-shedule-date="${dateKey}"]`);
    nodes.forEach((dayNode) => {
      const old = dayNode.querySelector('.day-notes');
      const fresh = this.buildDayNotes(dateKey);
      if (old && old.parentNode) old.parentNode.replaceChild(fresh, old);
      else dayNode.appendChild(fresh);
      // сохраняем фокус в поле, если пользователь продолжает печатать
      if (this.editingDate === dateKey) {
        const input = fresh.querySelector('.day-note-input');
        if (input) input.focus();
      }
    });
  },
};

window.NotesCenter = NotesCenter;

// ✓ Сеть вернулась — один раз досылаем заметки, сделанные офлайн (без опросов и таймеров)
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('online', () => {
    Promise.resolve(NotesCenter.flushPending()).catch(() => { /* отправим при следующем входе */ });
  });
}

/* ------------------------------------------------------------------------------------------
 * Подстраница создания события или уведомления
 * ---------------------------------------------------------------------------------------- */

async function renderEventCreateSubpage(container, data) {
  const roles = await EventRoles.ensure();
  if (!roles.canPublish()) {
    const denied = document.createElement('div');
    denied.className = 'info-container';
    denied.innerHTML = '<p><b>Недоступно</b></p><p style="font-size: 14px;">Создавать события и уведомления могут только старосты, профорги, культорги и администраторы. Ваша роль: '
      + escapeHtmlText(roles.label()) + '.</p>';
    container.appendChild(denied);
    return;
  }

  const editId = data && data.eventId ? String(data.eventId) : '';
  const editing = editId ? EventCenter.list.find((item) => item.eventId === editId) : null;
  let kind = editing ? editing.kind : ((data && data.kind === 'notice') ? 'notice' : 'event');

  const header = document.createElement('div');
  header.className = 'info-container';
  header.innerHTML = `<p><b>${editing ? 'Редактирование' : 'Новая запись'}</b></p>
    <p style="font-size: 13px;">От имени: ${escapeHtmlText(roles.label())} · ${escapeHtmlText(roles.group || 'группа не выбрана')}</p>`;
  container.appendChild(header);

  // ✓ Переключатель «Событие / Уведомление» — как выбор материала или ДЗ
  const switchBox = document.createElement('div');
  switchBox.className = 'flex-container radio-container event-kind-switch';
  const eventButton = document.createElement('button');
  eventButton.type = 'button';
  eventButton.className = 'radio-button';
  eventButton.textContent = 'Событие';
  const noticeButton = document.createElement('button');
  noticeButton.type = 'button';
  noticeButton.className = 'radio-button';
  noticeButton.textContent = 'Уведомление';
  switchBox.appendChild(eventButton);
  switchBox.appendChild(noticeButton);
  container.appendChild(switchBox);

  const form = document.createElement('div');
  form.className = 'info-container event-form';
  container.appendChild(form);

  const drawForm = () => {
    eventButton.classList.toggle('selected', kind === 'event');
    noticeButton.classList.toggle('selected', kind === 'notice');
    form.innerHTML = '';

    const titleLabel = document.createElement('label');
    titleLabel.className = 'event-form-label';
    titleLabel.textContent = kind === 'event' ? 'Название события' : 'Заголовок уведомления';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'account-text-input';
    titleInput.maxLength = 120;
    titleInput.placeholder = kind === 'event' ? 'Например: Встреча с куратором' : 'Например: Собрание группы';
    titleInput.value = editing ? String(editing.title || '') : '';
    form.appendChild(titleLabel);
    form.appendChild(titleInput);

    let startInput; let endInput; let placeInput;
    if (kind === 'event') {
      const dateLabel = document.createElement('label');
      dateLabel.className = 'event-form-label';
      dateLabel.textContent = 'Дата, начало и конец';
      form.appendChild(dateLabel);

      const row = document.createElement('div');
      row.className = 'event-form-row';
      const dateField = document.createElement('input');
      dateField.type = 'date';
      dateField.className = 'account-text-input';
      const now = new Date();
      const dateValue = editing && editing.startTime ? new Date(Number(editing.startTime)) : now;
      dateField.value = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;

      startInput = document.createElement('input');
      startInput.type = 'time';
      startInput.className = 'account-text-input';
      startInput.value = editing && editing.startTime ? formatClock(editing.startTime) : '14:00';

      endInput = document.createElement('input');
      endInput.type = 'time';
      endInput.className = 'account-text-input';
      endInput.value = editing && editing.endTime ? formatClock(editing.endTime) : '15:30';

      row.appendChild(dateField);
      row.appendChild(startInput);
      row.appendChild(endInput);
      form.appendChild(row);

      const placeLabel = document.createElement('label');
      placeLabel.className = 'event-form-label';
      placeLabel.textContent = 'Место';
      placeInput = document.createElement('input');
      placeInput.type = 'text';
      placeInput.className = 'account-text-input';
      placeInput.maxLength = 120;
      placeInput.placeholder = 'Например: ауд. А-12 или холл 2 этажа';
      placeInput.value = editing ? String(editing.place || '') : '';
      form.appendChild(placeLabel);
      form.appendChild(placeInput);

      form._readDate = () => {
        const dateParts = String(dateField.value || '').split('-').map(Number);
        if (dateParts.length !== 3 || dateParts.some((value) => !value)) return { startTime: 0, endTime: 0 };
        const build = (timeValue) => {
          const parts = String(timeValue || '').split(':').map(Number);
          if (parts.length !== 2) return 0;
          return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], parts[0], parts[1], 0, 0).getTime();
        };
        return { startTime: build(startInput.value), endTime: build(endInput.value) };
      };
    } else {
      form._readDate = () => ({ startTime: 0, endTime: 0 });
    }

    const descLabel = document.createElement('label');
    descLabel.className = 'event-form-label';
    descLabel.textContent = 'Описание';
    const description = document.createElement('textarea');
    description.className = 'materials-textarea';
    description.placeholder = kind === 'event' ? 'Что будет происходить, что взять с собой' : 'Текст уведомления для группы';
    description.value = editing ? String(editing.description || '') : '';
    form.appendChild(descLabel);
    form.appendChild(description);

    // ✓ Администратор может сделать запись глобальной, остальные — только для своей группы
    let scopeSelect = null;
    if (roles.canChooseScope()) {
      const scopeLabel = document.createElement('label');
      scopeLabel.className = 'event-form-label';
      scopeLabel.textContent = 'Кому показывать';
      scopeSelect = document.createElement('select');
      scopeSelect.className = 'account-text-input';
      scopeSelect.innerHTML = '<option value="group">Только моей группе</option><option value="global">Всем пользователям</option>';
      scopeSelect.value = editing && editing.scope === 'global' ? 'global' : 'group';
      form.appendChild(scopeLabel);
      form.appendChild(scopeSelect);
    }

    const submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'account-standartButton';
    submit.textContent = editing ? 'Сохранить изменения' : 'Опубликовать';
    submit.addEventListener('click', async () => {
      submit.disabled = true;
      const timing = form._readDate();
      const payload = {
        kind,
        title: titleInput.value,
        place: placeInput ? placeInput.value : '',
        description: description.value,
        scope: scopeSelect ? scopeSelect.value : 'group',
        startTime: timing.startTime,
        endTime: timing.endTime,
      };
      const result = editing
        ? await EventCenter.update(editId, payload)
        : await EventCenter.create(payload);
      submit.disabled = false;
      showNotification(result.message || (result.success ? 'Готово' : 'Не удалось сохранить'), result.success ? 'success' : 'error');
      if (!result.success) return;
      if (editing) {
        await refreshCurrentPage();
        if (typeof navigateTo === 'function') await navigateTo('eventshow', { eventId: editId });
        return;
      }
      closeAllSubpages();
      await refreshCurrentPage();
    });
    form.appendChild(submit);
  };

  eventButton.addEventListener('click', () => { kind = 'event'; drawForm(); });
  noticeButton.addEventListener('click', () => { kind = 'notice'; drawForm(); });
  drawForm();
}

/* ------------------------------------------------------------------------------------------
 * Подстраница события или уведомления
 * ---------------------------------------------------------------------------------------- */

async function renderEventShowSubpage(container, data) {
  const eventId = String((data && data.eventId) || '');
  await EventCenter.ensureLoaded();
  const item = EventCenter.list.find((entry) => entry.eventId === eventId);
  if (!item) {
    container.innerHTML = '<div class="info-container"><p><b>Запись не найдена</b></p><p style="font-size:14px;">Возможно, её удалили.</p></div>';
    return;
  }
  const user = window.auth.getCurrentUser();
  const roles = await EventRoles.ensure();
  const isOwner = Boolean(user && String(item.ownerUid) === String(user.uid));
  const isAdmin = Boolean(roles.isAdmin);
  const isEvent = item.kind === 'event';

  const card = document.createElement('div');
  card.className = 'info-container event-view' + (isEvent ? ' event-view--event' : ' event-view--notice');

  const title = document.createElement('h3');
  title.className = 'event-view-title';
  title.textContent = item.title || (isEvent ? 'Событие' : 'Уведомление');
  card.appendChild(title);

  const meta = document.createElement('p');
  meta.className = 'event-view-meta';
  const parts = [EventCenter.authorLine({
    ownerRole: item.ownerRole,
    ownerLogin: item.ownerLogin || '',
  })];
  if (isEvent) {
    const start = new Date(Number(item.startTime));
    parts.push(`${formatDayTitle(item.startTime)} · ${formatClock(item.startTime)}–${formatClock(item.endTime)}`);
    if (item.place) parts.push(item.place);
  } else {
    parts.push(formatDayTitle(item.timestamp));
  }
  parts.push(String(item.scope) === 'global' ? 'всем пользователям' : `группа ${item.group || '—'}`);
  meta.textContent = parts.join(' · ');
  card.appendChild(meta);

  // ✓ Автор записи: клик открывает предосмотр аккаунта
  const author = document.createElement('p');
  author.className = 'event-view-author feedback-author-link';
  author.textContent = `Автор: ${item.ownerName || 'Пользователь'}`;
  author.title = 'Открыть профиль автора';
  author.addEventListener('click', () => {
    if (typeof navigateTo === 'function') navigateTo('userprofile', { userId: String(item.ownerUid), userName: item.ownerName || '' });
  });
  card.appendChild(author);

  if (item.description) {
    const description = document.createElement('p');
    description.className = 'event-view-description';
    description.textContent = item.description;
    card.appendChild(description);
  }

  // ✓ Под описанием — тот же автор, но уже как ссылка: открывает предосмотр аккаунта
  const authorInDescription = document.createElement('button');
  authorInDescription.type = 'button';
  authorInDescription.className = 'event-view-author-link';
  authorInDescription.innerHTML = `Автор: <b>${escapeHtmlText(item.ownerName || 'Пользователь')}</b> · ${escapeHtmlText(EventCenter.authorLine(item))}`;
  authorInDescription.addEventListener('click', () => {
    if (typeof navigateTo === 'function') navigateTo('userprofile', { userId: String(item.ownerUid), userName: item.ownerName || '' });
  });
  card.appendChild(authorInDescription);

  const actions = document.createElement('div');
  actions.className = 'event-view-actions';

  if (isOwner || isAdmin) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'account-awairButton';
    remove.textContent = 'Удалить';
    remove.addEventListener('click', async () => {
      if (!window.confirm('Удалить эту запись?')) return;
      const result = await EventCenter.remove(eventId);
      showNotification(result.message, result.success ? 'success' : 'error');
      if (result.success) { closeAllSubpages(); await refreshCurrentPage(); }
    });
    actions.appendChild(remove);
  }

  if (isOwner) {
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'account-standartButton';
    edit.textContent = 'Редактировать';
    edit.addEventListener('click', async () => {
      if (typeof navigateTo === 'function') await navigateTo('eventcreate', { eventId });
    });
    actions.appendChild(edit);
  }

  if (!isOwner && user) {
    const report = document.createElement('button');
    report.type = 'button';
    report.className = 'account-standartButton';
    report.textContent = 'Пожаловаться';
    report.addEventListener('click', async () => {
      const result = await EventCenter.report(eventId);
      showNotification(result.message, result.success ? 'success' : 'error');
      if (result.success) await refreshCurrentPage();
    });
    actions.appendChild(report);
  }

  if (actions.childNodes.length > 0) card.appendChild(actions);
  container.appendChild(card);
}

/* ------------------------------------------------------------------------------------------
 * Страница «Уведомления»: все события и уведомления по дням
 * ---------------------------------------------------------------------------------------- */

async function renderNotificationsPage(container) {
  await EventCenter.ensureLoaded();
  const list = EventCenter.visibleForMe();
  EventRoles.ensure();

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'info-container';
    empty.innerHTML = '<p><b>Пока ничего нет</b></p><p style="font-size: 14px;">Здесь появятся события и уведомления от старосты, профорга, культорга и администраторов.</p>';
    container.appendChild(empty);
    return;
  }

  // ✓ Группировка по дням: сверху свежие, ниже — более старые
  const days = new Map();
  list.forEach((item) => {
    const key = formatDayKey(item.kind === 'event' ? item.startTime : item.timestamp);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(item);
  });

  const orderedKeys = Array.from(days.keys()).sort((a, b) => (a < b ? 1 : -1));
  orderedKeys.forEach((key) => {
    const group = document.createElement('div');
    group.className = 'notifications-day';
    const heading = document.createElement('p');
    heading.className = 'notifications-day-title';
    const sample = days.get(key)[0];
    heading.textContent = formatDayTitle(sample.kind === 'event' ? sample.startTime : sample.timestamp);
    group.appendChild(heading);

    days.get(key)
      .sort((a, b) => {
        const aTime = a.kind === 'event' ? Number(a.startTime) : Number(a.timestamp);
        const bTime = b.kind === 'event' ? Number(b.startTime) : Number(b.timestamp);
        return bTime - aTime;
      })
      .forEach((item) => {
        const isEvent = item.kind === 'event';
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'notification-row ' + (isEvent ? 'notification-row--event' : 'notification-row--notice');
        const time = isEvent ? `${formatClock(item.startTime)}–${formatClock(item.endTime)}` : '';
        row.innerHTML = `
          <span class="notification-row-head">
            <span class="notification-row-role">${escapeHtmlText(EventCenter.authorLine(item))}</span>
            ${time ? `<span class="notification-row-time">${escapeHtmlText(time)}</span>` : ''}
          </span>
          <span class="notification-row-title">${escapeHtmlText(item.title || (isEvent ? 'Событие' : 'Уведомление'))}</span>
          ${isEvent && item.place ? `<span class="notification-row-place">${escapeHtmlText(item.place)}</span>` : ''}`;
        row.addEventListener('click', () => EventCenter.open(item.eventId));
        group.appendChild(row);
      });
    container.appendChild(group);
  });
}

/* ------------------------------------------------------------------------------------------
 * Баннер уведомлений при входе
 * ---------------------------------------------------------------------------------------- */

const NoticeBanner = {
  queue: [],
  showing: false,
  host: null,
  started: false,

  readIds() {
    const saved = readJsonStorage(READ_NOTICES_KEY, []);
    return Array.isArray(saved) ? saved : [];
  },

  markRead(id) {
    const ids = this.readIds();
    if (!ids.includes(id)) ids.push(id);
    writeJsonStorage(READ_NOTICES_KEY, ids.slice(-300));
  },

  // ✓ Показываем только уведомления (не события) — один раз за запуск приложения.
  //   Флаг живёт в памяти: при каждом открытии страницы непрочитанные показываются заново.
  async startOnce() {
    if (this.started === true) return;
    this.started = true;
    await EventCenter.ensureLoaded();
    const read = this.readIds();
    this.queue = EventCenter.visibleForMe()
      .filter((item) => item.kind === 'notice' && !read.includes(item.eventId))
      .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
    if (this.queue.length === 0) return;
    this.showNext();
  },

  showNext() {
    const item = this.queue.shift();
    if (!item) { this.showing = false; return; }
    this.showing = true;
    if (!this.host) {
      this.host = document.createElement('div');
      this.host.className = 'notice-banner-host';
      document.body.appendChild(this.host);
    }
    const banner = document.createElement('div');
    banner.className = 'notice-banner';
    banner.innerHTML = `
      <div class="notice-banner-head">
        <span class="notice-banner-role">${escapeHtmlText(EventCenter.authorLine(item))}</span>
        <span class="notice-banner-date">${escapeHtmlText(formatDayTitle(item.timestamp))}</span>
      </div>
      <p class="notice-banner-title">${escapeHtmlText(item.title || 'Уведомление')}</p>
      <p class="notice-banner-text">${escapeHtmlText(item.description || '')}</p>`;

    // ✓ Автор уведомления открывается по нажатию — предосмотр его аккаунта
    const authorLink = document.createElement('button');
    authorLink.type = 'button';
    authorLink.className = 'notice-banner-author';
    authorLink.textContent = item.ownerName ? `Открыть профиль: ${item.ownerName}` : 'Открыть профиль автора';
    authorLink.addEventListener('click', () => {
      this.dismiss(banner);
      if (typeof navigateTo === 'function') navigateTo('userprofile', { userId: String(item.ownerUid), userName: item.ownerName || '' });
    });
    banner.appendChild(authorLink);

    const buttons = document.createElement('div');
    buttons.className = 'notice-banner-buttons';

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.className = 'account-standartButton';
    openButton.textContent = 'Подробнее';
    openButton.addEventListener('click', () => {
      this.markRead(item.eventId);
      this.dismiss(banner);
      EventCenter.open(item.eventId);
    });

    const okButton = document.createElement('button');
    okButton.type = 'button';
    okButton.className = 'account-standartButton notice-banner-ok';
    okButton.textContent = 'Прочитано';
    okButton.addEventListener('click', () => {
      this.markRead(item.eventId);
      this.dismiss(banner);
    });

    buttons.appendChild(openButton);
    buttons.appendChild(okButton);
    banner.appendChild(buttons);
    this.host.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('notice-banner--visible'));
  },

  dismiss(banner) {
    banner.classList.remove('notice-banner--visible');
    setTimeout(() => {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
      // ✓ Следующее уведомление появляется только после закрытия предыдущего
      this.showNext();
    }, 320);
  },
};

window.NoticeBanner = NoticeBanner;

/* ------------------------------------------------------------------------------------------
 * Кнопка «Создать событие» на странице расписания
 * ---------------------------------------------------------------------------------------- */

function mountScheduleCreateButton() {
  const existing = document.getElementById('schedule-create-event');
  if (existing) existing.remove();
  EventRoles.ensure().then((roles) => {
    if (!roles.canPublish()) return;
    // ✓ Кнопка нужна только на самой странице расписания, поверх — нет
    if (navOpened !== 'nav-shedule') return;
    if (containerUpward && containerUpward.classList.contains('visible')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'schedule-create-event';
    button.className = 'schedule-create-button';
    // ✓ Только плюс: надпись на кнопке не появляется никогда
    button.innerHTML = '<span class="schedule-create-button-plus" aria-hidden="true">+</span>';
    button.title = 'Создать событие или уведомление';
    button.setAttribute('aria-label', 'Создать событие или уведомление');
    button.addEventListener('click', () => {
      if (typeof navigateTo === 'function') navigateTo('eventcreate', {}).catch(() => {});
    });
    document.body.appendChild(button);
  });
}

function unmountScheduleCreateButton() {
  const button = document.getElementById('schedule-create-event');
  if (button) button.remove();
}

// ✓ Единая точка: показать кнопку на расписании и убрать её на перекрывающих окнах.
//   Вызывается после возврата с подстраниц, закрытия окон и смены страницы.
function syncScheduleCreateButton() {
  const subpageOpened = Boolean(containerUpward && containerUpward.classList.contains('visible'));
  if (navOpened === 'nav-shedule' && !subpageOpened) mountScheduleCreateButton();
  else unmountScheduleCreateButton();
}

/* ------------------------------------------------------------------------------------------
 * Обновление страницы и окна пары сразу после публикации
 * ---------------------------------------------------------------------------------------- */

async function refreshAfterPublish(lessonEvent, returnSource) {
  // ✓ Публикация только что изменила материалы: сбрасываем сохранённые ответы кэша,
  //   чтобы страница материалов и информация о лекции показали новый пост сразу.
  try {
    const cache = window.contentCache;
    if (cache) {
      const group = (typeof CurrentGroup !== 'undefined' && CurrentGroup) ? CurrentGroup : '';
      if (lessonEvent && typeof ScheduleRenderer.extractElementData === 'function') {
        const summary = String(lessonEvent.summary || '').trim();
        if (summary) {
          if (group && typeof cache.invalidate === 'function') await cache.invalidate('texts', 'group', group);
          if (group && typeof cache.invalidate === 'function') await cache.invalidate('images', 'group', group);
        }
      } else if (typeof cache.invalidateCollection === 'function') {
        await cache.invalidateCollection('texts');
        await cache.invalidateCollection('images');
      }
    }
  } catch (error) {
    if (DEBUG_MODE) console.warn('Не удалось сбросить кэш материалов:', error && error.message);
  }
  try {
    const pageContent = await generatePageContent(navOpened || 'nav-shedule');
    containerMain.innerHTML = '';
    containerMain.appendChild(pageContent);
  } catch (error) {
    console.warn('Не удалось обновить страницу после публикации:', error && error.message);
  }
  const target = (appState.page && appState.page !== 'home' && appState.page !== 'addmatr')
    ? appState.page
    : 'lesson';
  const targetData = target === 'lesson'
    ? { event: lessonEvent, source: returnSource || 'materials' }
    : appState.data;
  try {
    await generateSubpage(target, { data: targetData, soft: false });
    appState.page = target;
    appState.data = targetData;
    history.replaceState({ page: target, ...targetData, previous: { page: 'home' } }, '', `#${target}`);
  } catch (error) {
    console.warn('Не удалось обновить окно после публикации:', error && error.message);
  }
}

const auth = new AuthProcessor();
auth.init(); // Когда приложение загружается, первым делом запускаем авторизацию

/* Удаление аккаунта

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

*/