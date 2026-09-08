// Функции генерации страницы
/* const container = document.getElementByID('container'); // Родительский контейнер генерации
class generate {
    // ✓ Удаляем все дочерние элементы родительского контейнера
    static _deletePreviousPage() {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    // Главная новостная страница
    static main() {
        this._deletePreviousPage();
        const page = document.createElement('div');

    }

    // Страница авторизации в приложении
    static register() {

    }
} */






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

// Отрисовка расписания
class ScheduleRenderer {
  constructor(containerId) {
    this.container = document.querySelector(containerId);
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
  
  // Рендер дней в расписании
  render() {

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

    if (!this.container) {
      console.error('Container not found');
      return;
    }
    
    this.container.innerHTML = '';
    const grouped = this.groupByDate(this.events);
    
    Object.entries(grouped).forEach(([dateKey, dayEvents]) => {
      const dayDate = new Date(dateKey + 'T00:00:00');
      if (isSameWeek(dayDate)) {
        const dayName = this.getDayName(dayDate);
        const formattedDate = this.formatDate(dayDate);
        const dayColor = this.getDayColor(dayDate);
        
        // Контейнер дня
        const daySection = document.createElement('div');
        daySection.className = 'schedule-day';
        
        // Заголовок дня
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.style.backgroundColor = dayColor;
        dayHeader.innerHTML = `
          <span class="day-name">${dayName}</span>
          <span class="day-date">${formattedDate}</span>
        `;
        daySection.appendChild(dayHeader);
        
        // Контейнер событий для этого дня
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';
        
        dayEvents.forEach((event, index) => {
          const eventElement = this.createEventElement(event, dayColor);
          eventsContainer.appendChild(eventElement);
        });
        
        daySection.appendChild(eventsContainer);
        this.container.appendChild(daySection);
      }
    });
  }
  
  // Создаёт элемент события
  createEventElement(event, dayColor) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event';
    
    const startTime = this.formatTime(event.startTime);
    const endTime = event.endTime ? this.formatTime(event.endTime) : '';
    const room = event.location;
    const teacher = this.extractTeacher(event.description);
    
    // Получаем тип предмета (лек, пр, лаб и т.д.)
    const typeMatch = event.summary.match(/\(([^)]+)\)/);
    const type = typeMatch ? typeMatch[1] : '';
    
    // Получаем название предмета
    const subjectMatch = event.summary.match(/(?:лек|пр|лаб)\.\s+(.+?)(?:\(|$)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : event.summary;
    
    eventDiv.innerHTML = `
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
    `;
    
    return eventDiv;
  }
}




// Изменение режима просмотра расписания
function switchSchedule(type) {
  const dayButton = document.getElementById('shedule-day');
  const weekButton = document.getElementById('shedule-week');
  if (type === 'day') {
    weekButton.classList.remove('selected');
    dayButton.classList.add('selected');
  } else if (type === 'week') {
    dayButton.classList.remove('selected');
    weekButton.classList.add('selected');
  }
}

// Инициализация
async function initSchedule() {
  const parser = new ICSParser();
  const renderer = new ScheduleRenderer('#shedule-container');
  
  try {
    const events = await parser.fetch('https://eios.kosgos.ru/api/Rasp?idGroup=8953&iCal=true');
    renderer.setEvents(events);
    renderer.render();
    
    console.log('Schedule loaded:', events);
  } catch (error) {
    console.error('Error loading schedule:', error);
    document.querySelector('#shedule-container').innerHTML = `
      <div style="padding: 20px; text-align: center;">
        Ошибка при загрузке расписания: ${error.message}. Попробуйте отключить VPN (если включен) и перезагрузить приложение
      </div>
    `;
  }
}

// Запуск
switchSchedule('day');
initSchedule();
