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
    let homeworkContainer;
    if (window.auth.isAuthenticated()) {
      homeworkContainer = document.createElement('div');
      homeworkContainer.innerHTML = `
      <b></b>
      <p></p>
      `;
    } else { homeworkContainer = generateNoAuthContainer(); }
    generatePageContentContainer.innerHTML = `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Материалы</h3>
          <p>Загружайте, делитесь и просматривайте конспекты, записи лекций и домашние задания</p>
        </div>
        <img class="banner-half" src="images/supbanners/homework.png"/>
      </div>
      <div id="homework-container">${homeworkContainer.outerHTML}</div>
    </div>`;
    return generatePageContentContainer;

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

    generatePageContentContainer.innerHTML = `
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
    return generatePageContentContainer;
  } else if (id === 'nav-account') {   // Окно аккаунта (ВСЕ ВНУТРЕННЕЕ СОДЕРЖИМОе В САБПЕЙДЖ!)
    const authed = window.auth.isAuthenticated();
    if (authed) { // Добавляем красивое отображение профиля аккаунта
      const currentUserAccount = window.auth.getCurrentUser();
      generatePageContentContainer.innerHTML = `
      <div class="info-container">
        <div>
          <p><b>${currentUserAccount.displayName}</b></p>
          <p>${currentUserAccount.email}</p>
        </div>
      </div>`;
    } else {
      generatePageContentContainer.innerHTML = `
      <div class="info-container">
        <div>
          <p><b>Анонимный гость</b></p>
          <p>Почта не указана</p>
        </div>
      </div>`;
    }
    generatePageContentContainer.innerHTML += `
      <hr />
      <h3>Основные опции</h3>
      <p>Функции управления и редактирование параметров аккаунта</p>
      ${authed ? `<div class="account-button-container">
        <button class="account-standartButton" onclick="">Подтвердить почту</button>
        <p style="color: #333; font-size: 14px">После нажатия, на вашу почту будет отправлено письмо с инструкциями для подтверждения. Это нужно для активации возможности восстановления пароля</p>
      </div>` : ``}
      <div class="account-button-container">
        <button class="account-standartButton" onclick="(async () => { await window.auth.logout(); auth.endSession(); })();">${authed ? `Выйти из аккаунта` : `Регистрация`}</button>
        <p style="color: #333; font-size: 14px">${authed ? `* Вы сможете заного войти в аккаунт в любое время.` : `Вернуться в главное меню и зарегистрировать аккаунт / войти в существующий`}</p>
      </div>
      <hr />
      <h3>Опасная зона</h3>
      <p>Нажимайте на кнопки данной категории только в том случае, если ознакомились с предупреждениями справа от кнопок!</p>
      <div class="account-button-container">  
        <button class="account-awairButton" onclick="clearAllIndexedDB();">Удалить расписание</button>
        <p style="color: #333; font-size: 14px">ВНИМАНИЕ! Эта кнопка полностью стирает всё расписание на устройстве, поэтому лучше ее не нажимать, если поблизости нет надежного источника интернет-соединения.</p>
      </div>
      ${authed ? `<div class="account-button-container">
        <button class="account-awairButton" onclick="">Удалить аккаунт</button>
        <p style="color: #333; font-size: 14px">ВНИМАНИЕ! Это действие безвозвратное. Удаление аккаунта повлечет утрату полученных достижений и удаление ВСЕХ опубликованным вами материалов!</p>
      </div>` : ``}
      `;
    return generatePageContentContainer;

  } else if (id === 'notifications') { // Окно уведомлений администрации

    generatePageContentContainer.innerHTML = `
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