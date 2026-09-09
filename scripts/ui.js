/* ====================================== Расписание ====================================== */

// ✓ Парсер ICS календаря с сайта ЕЙОС КГУ
class ICSParser {
  constructor() { this.events = []; }
  
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
      console.error('Fetch error:', error);
      throw error;
    }
  }
  
  // ✓ Парсирование полученного календаря до объекта и запись в массив
  parse(icsContent) {
    this.events = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent = null;
    lines.forEach(line => {
      line = line.trim();
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        this.events.push(this.normalizeEvent(currentEvent));
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        this.parseProperty(currentEvent, line);
      }
    });
    return this.events;
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

// Загрузить расписание (требуется офлайн сохранение)
async function loadSchedule() {
  const parser = new ICSParser();
  try {
    const events = await parser.fetch('https://eios.kosgos.ru/api/Rasp?idGroup=8953&iCal=true');
    return events;
  } catch (error) {
    console.error('Error loading schedule:', error);
  }
}

// ✓ Отрисовка расписания
// 1) Добавить определение лаб/практики/лекции по цвету и спец выделением
// 2) 
class ScheduleRenderer {
  constructor(type) {
    this.type = type;
    this.generated = '';
    this.events = [];
  }
  setEvents(events) { this.events = events; }
  
  // ✓ Отсортировать и сгруппировать даты
  groupByDate(events) {
    const grouped = {};
    events.forEach(event => {
      if (!event.startTime) return;
      const dateKey = this.formatDateKey(event.startTime);
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
  
  // ✓ Определить день недели по дате
  getDayName(date) {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    return days[date.getDay() - 1];
  }
  
  // ✓ Отформатировать дату для группировки занятий по дням (YYYY-MM-DD)
  formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // ✓ Отформатировать дату для стандартного отображения
  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
  
  // ✓ Отформатировать время для стандартного отображения
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // ✓ Определить цвет дня недели
  getDayColor(date) {
    const today = new Date();
    const dayOfWeek = date.getDay();
    const colors = {
      1: '#4a6e8fff', // Понедельник
      2: '#4a5f8fff', // Вторник
      3: '#3a538fff', // Среда
      4: '#4a548fff', // Четверг
      5: '#574a8fff', // Пятница
      6: '#64147cff', // Суббота
      0: '#660f0fff'  // Воскресенье
    };
    if (date.toDateString() === today.toDateString()) {
      return '#a01212ff'; // return '#12a01eff';
    } else {
      return colors[dayOfWeek] || '#4a6e8fff';
    }
  }
  
  // ✓ Определить преподавателя занятия
  extractTeacher(description) {
    const match = description.match(/([А-Яа-яЁё\s\.]+)/);
    return match ? match[0].trim() : '';
  }
  
  // Рендер дней в расписании (добавить два типа расписания - ежедневное и недельное)
  render(type) {
    this.generated = '';
    if (type === 'day') { // Сгенерировать внутридневное расписание
      this.generated += `<p>Пока не работает, попробуй переключить на неделю</p>`;
      return this.generated;

    } else if (type === 'week') { // ✓ Сгенерировать недельное расписание
      // ✓ Получить текущую неделю
      function getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      }

      // ✓ Проверка на то, что сегодняшняя дата находится на той же неделе что и дата расписания
      function isSameWeek(date) {
        const today = new Date(); 
        return date.getFullYear() === today.getFullYear() && getWeekNumber(date) === getWeekNumber(today);
      }
      
      // ✓ Генерируем недельное расписание
      this.generated = '';
      const grouped = this.groupByDate(this.events);
      Object.entries(grouped).forEach(([dateKey, dayEvents]) => {
        const dayDate = new Date(dateKey + 'T00:00:00');
        if (isSameWeek(dayDate)) {

          // ✓ Получаем данные заголовка дня
          const dayName = this.getDayName(dayDate);
          const formattedDate = this.formatDate(dayDate);
          const dayColor = this.getDayColor(dayDate);
      
          // ✓ Генерируем список занятий
          let events = '';
          dayEvents.forEach((event, index) => {
            events +=  this.createEventElement(event, dayColor);
          });
          
          // ✓ Добавляем новый день к общему списку дней
          this.generated += `
          <div class="schedule-day">
            <div class="day-header" style="background-color: ${dayColor};">
              <span class="day-name">${dayName}</span>
              <span class="day-date">${formattedDate}</span>
            </div>
            <div class="day-events">${events}</div>
          </div>
          `;
        }
      });
      this.generated += `<div style="height: 100px; width: 100%; "></div>`
      return this.generated;

    } else {
      return `<p>Как ты умудрился это сделать? Не лезь в консоль :_</p>`
    }
  }
  
  // ✓ Рендер элемента расписания (рендер занятия)
  createEventElement(event, dayColor) {
    // ✓ Получаем основную информацию по занятию
    const startTime = this.formatTime(event.startTime);
    const endTime = event.endTime ? this.formatTime(event.endTime) : '';
    const room = event.location;
    const teacher = this.extractTeacher(event.description);
    
    // ✓ Получаем дополнительную информацию по занятию
    const typeMatch = event.summary.match(/\(([^)]+)\)/);
    const type = typeMatch ? typeMatch[1] : '';
    
    // ✓ Получаем название предмета
    const subjectMatch = event.summary.match(/(?:лек|пр|лаб)\.\s+(.+?)(?:\(|$)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : event.summary;
    
    // Генерируем HTML (добавить лаб/пр/лек)
    return `<div class="event">
      <div class="event-time-block" style="border-left: 4px solid ${dayColor}">
        <div class="event-time">
          <span class="start-time">${startTime}</span>
          <span class="end-time">${endTime}</span>
        </div>
      </div>
      
      <div class="event-content">
        <div class="event-header">
          <p class="event-subject"><b>${subject}</b></p>
          ${type ? `<span class="event-type">${type}</span>` : ''}
        </div>
        <div class="event-details">
          ${teacher ? `<div class="event-detail">${teacher}</div>` : ''}
          ${room ? `<div class="event-detail"><i>Аудитория</i> <b>${room}</b></div>` : ''}
        </div>
      </div>
    </div>`;
  }
}




// IndexedDB manager
class ScheduleStorage {
  constructor(dbName = 'db', storeName = 'schedule') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  // ✓ Аппаратная инициализация базы данных
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  // ✓ Аппаратное сохранение в базу данных
  async save(events) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(events, 'events');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // ✓ Аппаратная загрузка из базы данных
  async load() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('events');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}





const scheduleStorage = new ScheduleStorage('isbo4', 'schedule');


/*
// Check internet connection
function isOnline() {
  return navigator.onLine;
}

// Fetch schedule from server
async function fetchScheduleFromServer(parser) {
  try {
    const events = await parser.fetch('https://eios.kosgos.ru/api/Rasp?idGroup=8953&iCal=true');
    await scheduleStorage.save(events);
    return events;
  } catch (error) {
    console.error('Error fetching schedule from server:', error);
    throw error;
  }
}

// Load schedule (from server or cache)
async function loadSchedule(parser) {
  try {
    if (isOnline()) {
      console.log('Online - fetching from server');
      return await fetchScheduleFromServer(parser);
    } else {
      console.log('Offline - loading from cache');
      const cachedEvents = await scheduleStorage.load();
      if (!cachedEvents) {
        throw new Error('No cached schedule available');
      }
      return cachedEvents;
    }
  } catch (error) {
    console.error('Error loading schedule:', error);
    // Try to load from cache as fallback
    try {
      const cachedEvents = await scheduleStorage.load();
      if (cachedEvents) {
        console.log('Loaded from cache as fallback');
        return cachedEvents;
      }
    } catch (cacheError) {
      console.error('Error loading from cache:', cacheError);
    }
    throw error;
  }
}

// Update schedule with server check
async function updateSchedule() {
  const parser = new ICSParser();
  try {
    const events = await loadSchedule(parser);
    await generateSchedule(events);
  } catch (error) {
    console.error('Error updating schedule:', error);
    document.querySelector('#shedule-container').innerHTML = `
      <div style="padding: 20px; text-align: center;">
        Ошибка при загрузке расписания: ${error.message}. Попробуйте отключить VPN (если включен) и перезагрузить приложение
      </div>
    `;
  }
}

// Initialize schedule on app load
async function initSchedule() {
  // Initialize storage
  try {
    await scheduleStorage.init();
  } catch (error) {
    console.error('Error initializing storage:', error);
  }

  // Load and display schedule
  await updateSchedule();

  // Set up auto-update every 10 minutes (600000 ms)
  setInterval(updateSchedule, 600000);

  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('Connection restored - updating schedule');
    updateSchedule();
  });

  window.addEventListener('offline', () => {
    console.log('Connection lost - will use cached schedule');
  });
}

// Call this to manually update schedule at any time
async function manualUpdateSchedule() {
  console.log('Manual schedule update');
  await updateSchedule();
}
*/

// ✓ Изменение режима просмотра расписания
let animationInProgress = false;
async function switchSchedule(type) {
  if (animationInProgress === true) return;
  const dayButton = document.getElementById('shedule-day');
  const weekButton = document.getElementById('shedule-week');
  const sheduleContainer = document.getElementById('shedule-container');

  // ✓ Скрываем контейнер расписания, меняем контент и снова делаем видимым
  function changeContent(content) {
    sheduleContainer.classList.add('hidden');
    sheduleContainer.classList.remove('visible');
    setTimeout(() => {
      if (!content) content = `<h1>Ошибка 404</h1>`;
      sheduleContainer.innerHTML = content;
    }, 500);
    setTimeout(() => {
      sheduleContainer.classList.add('visible');
      sheduleContainer.classList.remove('hidden');
      animationInProgress = false;
    }, 500);
  }

  animationInProgress = true;
  // ✓ Если выбрано внутридневное расписание
  if (type === 'day' && !dayButton.classList.contains('selected')) {
    weekButton.classList.remove('selected');
    dayButton.classList.add('selected');

    const renderer = new ScheduleRenderer();
    const events = await loadSchedule();
    renderer.setEvents(events);
    sheduleHTML = renderer.render('day');
    changeContent(sheduleHTML);

  // ✓ Если выбрано недельное расписание
  } else if (type === 'week' && !weekButton.classList.contains('selected')) {
    dayButton.classList.remove('selected');
    weekButton.classList.add('selected');

    const renderer = new ScheduleRenderer();
    const events = await loadSchedule();
    renderer.setEvents(events);
    sheduleHTML = renderer.render('week');
    changeContent(sheduleHTML);
  }
}

/* ================================= Интерфейс и страницы ================================= */

// Генерация контента на страницах приложения
let sheduleHTML;
async function generatePageContent(id) {
  if (id === 'nav-shedule') { // ✓ Окно расписания
    const renderer = new ScheduleRenderer();
    const events = await loadSchedule();
    renderer.setEvents(events);
    sheduleHTML = renderer.render('day');
    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Расписание</h3>
          <p>Разраб выкатил обнову кнопок, радуйтесь простые смертные!!!</p>
          <div class="flex-container radio-container" style="justify-content: start !important;">
            <button id="shedule-day" class="radio-button selected" onclick="switchSchedule('day')">День</button>
            <button id="shedule-week" class="radio-button" onclick="switchSchedule('week')">Неделя</button>
          </div>
        </div>
        <img class="banner-half" src="images/supbanners/note.png"/>
      </div>
      <div id="shedule-container">${sheduleHTML}</div>
    </div>`;
  } else {
    return `
    <!-- <img src="images/supbanners/404.jpg" class="banner-half" style="width: 100% !important;"/> -->
    <h1>Пустая страница</h1>
    <p>Тут пока ничего нету прикинь</p>
    <p>Разраб трудолюбивая задница и не вайбкодит весь дизайн за раз :(</p>
    <p>Чтобы ты не расстраивался, вот тебе жмыхнутая девчонка</p>
    <img src="images/supbanners/girl.jpg" class="banner-half" style="width: 100% !important; height: 200px !important;"/>
    `;
  }
}

// ✓ Функция генерации страницы 
const containerMain = document.getElementById('container'); // Родительский контейнер генерации
const containerTranslate = document.getElementById('container-translate');
async function generatePage(id, skip) {
  if (!id) throw new Error('Страницы не существует');
  animationInProgress = true;
  containerMain.classList.add('animated');         // Для плавного перемещения
  containerTranslate.classList.remove('animated'); // Для мгновенного перемещения

  // ✓ Мгновенное перемещение второстепенного окна вбок и плавное перемещение текущего окна
  if (navPosition[id] > navPosition[navOpened]) { // Если открыта правая страница
    containerTranslate.innerHTML = await generatePageContent(id);
    containerTranslate.classList.add('right');
    containerMain.classList.add('left');
  } else if (navPosition[id] < navPosition[navOpened]) { // Если открыта левая страница
    containerTranslate.innerHTML = await generatePageContent(id);
    containerTranslate.classList.add('left');
    containerMain.classList.add('right');
  } else if (skip === true) { // Если нужно первично инициализировать
    containerMain.innerHTML = await generatePageContent(id);
    animationInProgress = false; return;
  } else { // Эта страница уже открыта
    animationInProgress = false; return; 
  }
  navOpened = id;
  
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
    containerMain.innerHTML = containerTranslate.innerHTML;
    containerMain.classList.remove('left');
    containerMain.classList.remove('right');
    containerTranslate.innerHTML = '';
    animationInProgress = false;
  }, 1000);
}

// ✓ Объявление кнопок нижнего закрепленного интерфейса
let navOpened = 'nav-shedule'; // Текущая открытая страница навигационного меню
const navPosition = { // Расположение кнопок слева направо
  'nav-kafeder': 1,
  'nav-homework':2,
  'nav-shedule': 3,
  'nav-messager':4,
  'nav-services':5,
}

// ✓ Добавление слушателей нажатия на все кнопки нижнего интерфейса
const navButtons = document.querySelectorAll('.nav-element');
navButtons.forEach(button => {
  button.addEventListener('click', async() => {
    try { 
      if (animationInProgress !== true) { await generatePage(button.id); }
    } catch { animationInProgress = false; }
  });
});


/* ===================================== Инициализация ==================================== */

// Запуск
// switchSchedule('day');
// initSchedule();
generatePage('nav-shedule', true);
