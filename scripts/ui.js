/* Пользовательские данные (данные группы), основной информационный контент приложения */
const groupData = {
  shedule: [],
}


/* ====================================== Расписание ====================================== */

// ✓ Парсер ICS календаря с сайта ЕЙОС КГУ
class ICSParser {
  constructor() { groupData.shedule = []; }
  
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
    groupData.shedule = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent = null;
    lines.forEach(line => {
      line = line.trim();
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        groupData.shedule.push(this.normalizeEvent(currentEvent));
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        this.parseProperty(currentEvent, line);
      }
    });
    return groupData.shedule;
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
    groupData.shedule = events;
  } catch (error) {
    console.error('Error loading schedule:', error);
  }
}

// ✓ Отрисовка расписания 
class ScheduleRenderer {
  constructor(type) {
    this.type = type;
    this.generated = '';
  }
  
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

  // ✓ Рендер элемента недельного расписания
  createEventElement(event) {
    // ✓ Получаем основную информацию по занятию
    const startTime = this.formatTime(event.startTime);
    const endTime = event.endTime ? this.formatTime(event.endTime) : '';
    const room = event.location;
    const teacher = this.extractTeacher(event.description);
    
    // ✓ Получаем дополнительную информацию по занятию
    const typeMatch = event.summary.match(/\(([^)]+)\)/);
    const type = typeMatch ? String(typeMatch[1]).substring(0,7) : '';
    
    // ✓ Получаем название и цвет предмета
    const colors = {
      'лаб':'rgba(252,184,38,1)',
      'лек':'rgba(37, 204, 37, 1)',
      'пр.':'rgba(190, 38, 190, 1)',
    }
    const nameMatch = {
      'лаб':'Семинар',
      'лек':'Лекция',
      'пр.':'Лаба',
    }
    const subjectMatch = event.summary.slice(0, 3);
    const subjectMatchColor = colors[subjectMatch];
    const subject = event.summary.slice(4).trim(); 
    
    // ✓ Генерируем HTML
    return `<div class="event">
      <div class="event-time-block" style="border-left: 5px solid ${subjectMatchColor}">
        <div class="event-time">
          <span class="start-time">${startTime}</span>
          <span class="end-time">${endTime}</span>
        </div>
        <span style="color: #555; margin-top: 5px; font-size: 13px; ">${nameMatch[subjectMatch]}</span>
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

  // ✓ Вернуть элемент расписания по дате (добавить пустой день если расписания нету!)
  renderByDate(date) {
    const dateKey = this.formatDateKey(date);
    const dayEvents = groupData.shedule
      .filter(event => event.startTime && this.formatDateKey(event.startTime) === dateKey)
      .sort((a, b) => a.startTime - b.startTime);

    // ✓ Получаем данные заголовка дня
    const dayDate = new Date(dateKey + 'T00:00:00');
    const dayName = this.getDayName(dayDate);
    const formattedDate = this.formatDate(dayDate);
    const dayColor = this.getDayColor(dayDate);

    // ✓ Генерируем список занятий
    let events = '';
    dayEvents.forEach((event, index) => {
      events += this.createEventElement(event);
    });
    
    // ✓ Возвращаем список занятий на текущий день
    return `
    <div class="schedule-day">
      <div class="day-header" style="background-color: ${dayColor};">
        <span class="day-name">${dayName}</span>
        <span class="day-date">${formattedDate}</span>
      </div>
      <div class="day-events">${events}</div>
    </div>
    `;
  }
  
  // ✓ Проверяем, закончились ли сегодня пары
  isClassesEndedToday() {
    const today = this.formatDateKey(new Date());
    const now = new Date();
    const todayEvents = groupData.shedule.filter(event => 
      event.startTime && this.formatDateKey(event.startTime) === today
    );
    if (todayEvents.length === 0) return true;
    const lastEvent = todayEvents.reduce((latest, event) => 
      event.endTime > latest.endTime ? event : latest
    );
    return now > lastEvent.endTime;
  }

  // ✓ Возвращает дату следующих занятий после сегодняшнего дня
  getNextClassesDate() {
    const today = this.formatDateKey(new Date());
    
    // Берём все уникальные даты из событий
    const allDates = [...new Set(
      groupData.shedule
        .filter(event => event.startTime)
        .map(event => this.formatDateKey(event.startTime))
    )].sort();
    
    // Ищем первую дату, которая больше сегодняшней
    const nextDate = allDates.find(date => date > today);
    
    return nextDate ? new Date(nextDate + 'T00:00:00') : null;
  }


  // Текущая пара (Нужно полностью переделать дизайн)
  // Фантомный квадрат Худякова
  // Может быть проблема с подгруппами - это надо будет решить потом
  // Сделать динамическое обновление оставшегося времени (в данный момент глючит и не обновляется)
  getCurrentAndNextClassElement() {
    const colors = {
      'лаб': 'rgba(252, 184, 38, 1)',
      'лек': 'rgba(37, 204, 37, 1)',
      'пр.': 'rgba(190, 38, 190, 1)',
      'next': 'rgba(74, 144, 226, 1)'
    };

    const nameMatch = {
      'лаб': 'Семинар',
      'лек': 'Лекция',
      'пр.': 'Лаба'
    };

    const now = new Date();
    const wrapper = document.createElement('div');
    wrapper.className = 'classes-wrapper';

    // Ищем текущее событие
    const currentEvent = groupData.shedule.find(event =>
      event.startTime && event.endTime &&
      now >= event.startTime && now <= event.endTime
    );

    // Если есть текущее событие, добавляем его
    if (currentEvent) {
      wrapper.appendChild(this.createCurrentClassElement(currentEvent, colors, nameMatch));
    }

    // Функция для проверки, что две даты в один день
    const isSameDay = (date1, date2) => {
      return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    };

    // Ищем следующее событие в тот же день
    let nextEvent = null;

    if (currentEvent) {
      // Если есть текущее событие, ищем следующее после него в тот же день
      nextEvent = groupData.shedule.find(event =>
        event.startTime && event.endTime &&
        event.startTime > currentEvent.endTime &&
        isSameDay(event.startTime, now)
      );
    } else {
      // Если нет текущего события, ищем первое событие в будущем в тот же день
      nextEvent = groupData.shedule.find(event =>
        event.startTime && event.endTime &&
        event.startTime > now &&
        isSameDay(event.startTime, now)
      );
    }

    // Определяем, показываем ли мы следующее событие
    if (nextEvent) {
      const timeUntilNext = nextEvent.startTime - now;
      const hoursUntilNext = timeUntilNext / (1000 * 60 * 60);

      // Если до следующей пары меньше 3 часов, показываем её
      if (hoursUntilNext <= 3) {
        wrapper.appendChild(this.createNextClassElement(nextEvent, colors, nameMatch, timeUntilNext));
      } else {
        // Если более 3 часов до следующей пары, показываем блок "Нет пар"
        const noClassesBlock = document.createElement('div');
        noClassesBlock.className = 'no-classes-block';
        noClassesBlock.textContent = '⏱️ В ближайшее время нет пар';
        wrapper.appendChild(noClassesBlock);
      }
    } else {
      // Если нет следующих событий в этот день, показываем блок "Нет пар"
      if (!currentEvent) {
        const noClassesBlock = document.createElement('div');
        noClassesBlock.className = 'no-classes-block';
        noClassesBlock.textContent = '⏱️ В ближайшее время нет пар';
        wrapper.appendChild(noClassesBlock);
      }
    }

    return wrapper;
  }

  createCurrentClassElement(event, colors, nameMatch) {
    const container = document.createElement('div');
    container.className = 'current-class';

    // Определяем тип пары
    const typeMatch = event.summary.match(/^(лаб|лек|пр\.)/);
    const classType = typeMatch ? typeMatch[1] : 'next';
    const classColor = colors[classType];

    container.style.setProperty('--class-color', classColor);

    // Извлекаем данные
    const subject = event.summary.slice(4).trim();
    const displayType = nameMatch[classType] || classType;

    const startTime = this.formatTime(event.startTime);
    const endTime = this.formatTime(event.endTime);

    const room = event.location;
    const teacher = this.extractTeacher(event.description);

    // Вычисляем прогресс
    const now = new Date();
    const totalDuration = event.endTime - event.startTime;
    const elapsed = now - event.startTime;
    const remaining = event.endTime - now;

    const progressPercent = (elapsed / totalDuration) * 100;
    const remainingMinutes = Math.ceil(remaining / (1000 * 60));

    // HTML структура
    container.innerHTML = `
      <div class="class-subject">
        <div class="class-type-label">📚 ${displayType}</div>
        <p><b>${subject}</b></p>
      </div>

      <div class="class-time-grid">
        <div class="class-time-item">
          <div class="class-time-label">Начало</div>
          <div class="class-time-value">${startTime}</div>
        </div>
        <div class="class-time-item">
          <div class="class-time-label">Окончание</div>
          <div class="class-time-value">${endTime}</div>
        </div>
      </div>

      ${room || teacher ? `
        <div class="class-info">
          ${teacher ? `<div class="class-info-item">👤 ${teacher}</div>` : ''}
          ${room ? `<div class="class-info-item">📍 ${room}</div>` : ''}
        </div>
      ` : ''}

      <div class="class-progress">
        <div class="class-progress-header">
          <span class="class-progress-label">Прогресс</span>
          <span class="class-remaining-time">${remainingMinutes} мин осталось</span>
        </div>
        <div class="class-progress-bar-container">
          <div class="class-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
      </div>
    `;

    // Функция для обновления прогресса
    const updateProgress = () => {
      const nowUpdate = new Date();

      // Проверяем, не закончилась ли пара
      if (nowUpdate > event.endTime) {
        container.remove();
        return;
      }

      const elapsedUpdate = nowUpdate - event.startTime;
      const remainingUpdate = event.endTime - nowUpdate;
      const progressPercentUpdate = (elapsedUpdate / totalDuration) * 100;
      const remainingMinutesUpdate = Math.ceil(remainingUpdate / (1000 * 60));

      const progressBar = container.querySelector('.class-progress-bar');
      const remainingTimeSpan = container.querySelector('.class-remaining-time');

      if (progressBar) {
        progressBar.style.width = progressPercentUpdate + '%';
      }
      if (remainingTimeSpan) {
        remainingTimeSpan.textContent = remainingMinutesUpdate + ' мин осталось';
      }
    };

    // Обновляем каждую секунду
    const intervalId = setInterval(updateProgress, 1000);
    container.dataset.intervalId = intervalId;

    // Останавливаем обновление при удалении элемента
    const observer = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(intervalId);
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });

    return container;
  }

  createNextClassElement(event, colors, nameMatch, timeUntilNext) {
    const container = document.createElement('div');
    container.className = 'next-class';

    // Определяем тип пары
    const typeMatch = event.summary.match(/^(лаб|лек|пр\.)/);
    const classType = typeMatch ? typeMatch[1] : 'next';
    const displayType = nameMatch[classType] || classType;

    // Извлекаем данные
    const subject = event.summary.slice(4).trim();
    const startTime = this.formatTime(event.startTime);
    const room = event.location;
    const teacher = this.extractTeacher(event.description);

    // Вычисляем время до пары
    const updateCountdown = () => {
      const nowUpdate = new Date();
      // const nowUpdate = new Date();
      const timeRemaining = event.startTime - nowUpdate;

      if (timeRemaining <= 0) {
        container.remove();
        return;
      }

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      const countdownSpan = container.querySelector('.class-countdown-value');
      if (countdownSpan) {
        countdownSpan.textContent = `${hours}ч ${minutes}м ${seconds}с`;
      }
    };

    // HTML структура
    container.innerHTML = `
      <div class="class-subject">
        <div class="class-type-label">⏳ Следующая пара</div>
        <p><b>${subject}</b></p>
        <div class="class-subject-type">${displayType}</div>
      </div>

      <div class="class-time-grid">
        <div class="class-time-item">
          <div class="class-time-label">Начало</div>
          <div class="class-time-value">${startTime}</div>
        </div>
      </div>

      ${room || teacher ? `
        <div class="class-info">
          ${teacher ? `<div class="class-info-item">👤 ${teacher}</div>` : ''}
          ${room ? `<div class="class-info-item">📍 ${room}</div>` : ''}
        </div>
      ` : ''}

      <div class="class-countdown">
        <span>Осталось:</span>
        <span class="class-countdown-value">...</span>
      </div>
    `;

    // Обновляем каждую секунду
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    container.dataset.intervalId = intervalId;

    // Останавливаем обновление при удалении элемента
    const observer = new MutationObserver(() => {
      if (!document.contains(container)) {
        clearInterval(intervalId);
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });

    return container;
  }


  // ✓ Рендер расписания
  render(type) {
    this.generated = '';
    if (type === 'day') { // ✓ Сгенерировать внутридневное расписание
      // ✓ Если сейчас идет пара или до пары 3 часа, то генерируем блок с этой парой
      const currentClassElement = this.getCurrentAndNextClassElement();
      this.generated += currentClassElement.outerHTML;

      // ✓ Проверяем, закончились ли на сегодня пары
      if (this.isClassesEndedToday()) {
        this.generated += `<p style="text-align: center; ">Расписание на следующий учебный день</p>`;
        this.generated += this.renderByDate(this.getNextClassesDate());
      } else {
        this.generated += `<p style="text-align: center;">Расписание на сегодня</p>`;
        this.generated += this.renderByDate(new Date());
      }
      this.generated += `<div style="height: 100px; width: 100%;"></div>`
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
      const grouped = this.groupByDate(groupData.shedule);
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
            events +=  this.createEventElement(event);
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

    } else { // ✓ Если страница не найдена (Ошибка 404)
      return `<p>Как ты умудрился(-ась) это сделать? Не лезь в консоль :_</p>`
    }
  }
}

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
    sheduleHTML = renderer.render('day');
    changeContent(sheduleHTML);

  // ✓ Если выбрано недельное расписание
  } else if (type === 'week' && !weekButton.classList.contains('selected')) {
    dayButton.classList.remove('selected');
    weekButton.classList.add('selected');
    const renderer = new ScheduleRenderer();
    sheduleHTML = renderer.render('week');
    changeContent(sheduleHTML);
  }
}

/* ================================= Интерфейс и страницы ================================= */

// Генерация контента на страницах приложения
let sheduleHTML;
async function generatePageContent(id, data) {
  if (id === 'nav-kafeder') { // Окно кафедры
    
    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half" style="z-index: 9999 !important;">
          <h3>Кафедра</h3>
          <p>Списки дисциплин и информация про преподавателей</p>
          <p style="font-size: 12px; color: #777;">Вся информация взята из открытых источников</p>
          <div class="flex-container radio-container" style="justify-content: start !important; z-index: 9999 !important;">
            <button id="kafeder-teachers" class="radio-button selected" onclick="">Преподаватели</button>
            <button id="kafeder-lessons" class="radio-button" onclick="">Дисциплины</button>
          </div>
        </div>
        <img class="banner-half" style="z-index: 1 !important;" src="images/supbanners/kafeder.png"/>
      </div>
      <div id="shedule-container"></div>
    </div>`;
  } else if (id === 'nav-homework') { // Окно домашних заданий, работы и материалов

    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Материалы</h3>
          <p></p>
        </div>
        <img class="banner-half" src="images/supbanners/note.png"/>
      </div>
      <div id="shedule-container"></div>
    </div>
    `;
  } else if (id === 'nav-shedule') { // ✓ Окно расписания
    const renderer = new ScheduleRenderer();
    sheduleHTML = renderer.render('day'); // Временно для удобства

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

    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Расписание</h3>
          <p>${getRandomDescription()}</p>
          <div class="flex-container radio-container" style="justify-content: start !important;">
            <button id="shedule-day" class="radio-button selected" onclick="switchSchedule('day')">День</button>
            <button id="shedule-week" class="radio-button" onclick="switchSchedule('week')">Неделя</button>
          </div>
        </div>
        <img class="banner-half" src="images/supbanners/note.png"/>
      </div>
      <div id="shedule-container">${sheduleHTML}</div>
    </div>`;
  
  } else if (id === 'nav-messager') { // Окно чатов
  
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
  } else if (id === 'nav-services') { // Окно сервисов
  
    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Сервисы</h3>
          <p></p>
        </div>
        <img class="banner-half" src="images/supbanners/note.png"/>
      </div>
      <div id="shedule-container"></div>
    </div>
    `;
  } else if (id === 'lesson') { // Окно информации о занятии

    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Расписание</h3>
          <p></p>
        </div>
        <img class="banner-half" src="images/supbanners/note.png"/>
      </div>
      <div id="shedule-container"></div>
    </div>
    `;
  } else if (id === 'notifications') { // Окно информации о занятии

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
  } else if (id === 'web') { // Официальные сайты КГУ

    return `
    <div class="relative-container" id="subcontainer">
      <div class="flex-container info-container">
        <div class="banner-half">
          <h3>Университет</h3>
          <p>Полезные ссылки на официальные сервисы ИВИТШ КГУ</p>
        </div>
        <img class="banner-half" src="images/supbanners/kgu.png"/>
      </div>
      <div id="shedule-container"></div>
    </div>
    `;
  } else { // Страница не найдена, ошибка 404
    return `
    <img src="images/supbanners/404.jpg" class="banner-half" style="width: 100% !important;"/>
    <h1>Пустая страница</h1>
    <p>Тут пока ничего нету прикинь</p>
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

// ✓ Объявление кнопок закрепленного интерфейса
let navOpened = 'nav-shedule'; // Текущая открытая страница навигационного меню
const navPosition = {          // Расположение кнопок слева направо
  'web':          0,
  'nav-kafeder':  1,
  'nav-homework': 2,
  'nav-shedule':  3,
  'nav-messager': 4,
  'nav-services': 5,
  'lesson':       6,
  'notifications':7,
}

// ✓ Добавление слушателей нажатия на все кнопки интерфейса
const navButtons = document.querySelectorAll('.nav-element');
const buttonNotifications = document.getElementById('header-notifications');
const buttonWeb = document.getElementById('header-web');
navButtons.forEach(button => {
  button.addEventListener('click', async() => {
    try { 
      if (animationInProgress !== true) { await generatePage(button.id); }
    } catch { animationInProgress = false; }
  });
});
buttonNotifications.addEventListener('click', async() => {
  try { 
    if (animationInProgress !== true) { await generatePage('notifications'); }
  } catch { animationInProgress = false; }
});
buttonWeb.addEventListener('click', async() => {
  try { 
    if (animationInProgress !== true) { await generatePage('web'); }
  } catch { animationInProgress = false; }
});

// ✓ Обработка нажатий на кнопку стороннего перехода
function openLink(link) {
  if (link.startsWith('tg://') || link.startsWith('mailto:') || link.startsWith('tel:') || link.startsWith('viber://') || link.startsWith('whatsapp://')) {
    window.location.href = link;
  } else {
    window.open(link, '_blank');
  }
}

/* ===================================== Инициализация ==================================== */

// Запуск
async function init() {
  await loadSchedule();
  await generatePage('nav-shedule', true);
}
init();

