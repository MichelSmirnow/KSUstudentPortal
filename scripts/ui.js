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

// Парсер ICS календаря с сайта ЕЙОС КГУ
class ICSParser {
  constructor() {
    this.events = [];
  }
  
  async fetch(url) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/calendar'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const text = await response.text();
      return this.parse(text);
      
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
  
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
  
  parseProperty(event, line) {
    const colonIndex = line.indexOf(':');
    let key = line.substring(0, colonIndex).split(';')[0];
    let value = line.substring(colonIndex + 1);
    
    event[key] = value;
  }
  
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
  
  parseDateTime(dateString) {
    if (!dateString) return null;
    
    const date = dateString.replace(/[TZ]/g, '');
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    const hour = date.substring(8, 10) || '00';
    const minute = date.substring(10, 12) || '00';
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  }
  
  decode(text) {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }
}

// Класс для отрисовки расписания
class ScheduleRenderer {
  constructor(containerId) {
    this.container = document.querySelector(containerId);
    this.events = [];
  }
  
  setEvents(events) {
    this.events = events;
  }
  
  // Группирует события по датам
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
    
    // Сортируем по датам
    return Object.keys(grouped)
      .sort()
      .reduce((acc, key) => {
        acc[key] = grouped[key].sort((a, b) => 
          a.startTime - b.startTime
        );
        return acc;
      }, {});
  }
  
  // Получает день недели
  getDayName(date) {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    return days[date.getDay()];
  }
  
  // Форматирует дату для группировки (YYYY-MM-DD)
  formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Форматирует дату для отображения
  formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
  
  // Форматирует время
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Получает цвет для дня недели
  getDayColor(date) {
    const dayOfWeek = date.getDay();
    const colors = {
      1: '#4a5f8f', // Понедельник - синий
      2: '#e8a63d', // Вторник - оранжевый
      3: '#2ea84f', // Среда - зелёный
      4: '#a93f55', // Четверг - фиолетовый
      5: '#d67c3b', // Пятница - коричневый
      6: '#8a5a3a', // Суббота - коричневатый
      0: '#2ea84f'  // Воскресенье - зелёный
    };
    return colors[dayOfWeek] || '#4a5f8f';
  }
  
  // Извлекает аудиторию из описания
  extractRoom(description) {
    const match = description.match(/Аудитория[:\s]+([^\n]+)/i);
    return match ? match[1].trim() : '';
  }
  
  // Извлекает преподавателя из описания
  extractTeacher(description) {
    const match = description.match(/([А-Яа-яЁё\s\.]+)/);
    return match ? match[0].trim() : '';
  }
  
  render() {
    if (!this.container) {
      console.error('Container not found');
      return;
    }
    
    this.container.innerHTML = '';
    const grouped = this.groupByDate(this.events);
    
    Object.entries(grouped).forEach(([dateKey, dayEvents]) => {
      const dayDate = new Date(dateKey + 'T00:00:00');
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
    });
  }
  
  // Создаёт элемент события
  createEventElement(event, dayColor) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event';
    
    const startTime = this.formatTime(event.startTime);
    const endTime = event.endTime ? this.formatTime(event.endTime) : '';
    const room = this.extractRoom(event.description);
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
          ${teacher ? `<div class="event-detail"><strong>👤</strong> ${teacher}</div>` : ''}
          ${room ? `<div class="event-detail"><strong>📍</strong> ${room}</div>` : ''}
        </div>
      </div>
      
      <button class="event-details-btn" title="Подробнее">...</button>
    `;
    
    return eventDiv;
  }
}

// CSS стили
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .schedule-day {
      margin-bottom: 30px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .day-header {
      padding: 15px 20px;
      color: white;
      font-weight: 600;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .day-name {
      font-weight: 700;
    }
    
    .day-date {
      font-size: 14px;
      opacity: 0.95;
    }
    
    .day-events {
      padding: 0;
    }
    
    .event {
      display: flex;
      align-items: flex-start;
      padding: 15px 20px;
      border-bottom: 1px solid #e0e0e0;
      transition: background-color 0.2s;
    }
    
    .event:hover {
      background-color: #f9f9f9;
    }
    
    .event:last-child {
      border-bottom: none;
    }
    
    .event-time-block {
      min-width: 70px;
      margin-right: 20px;
      padding-left: 10px;
    }
    
    .event-time {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .start-time {
      font-weight: 700;
      font-size: 18px;
      color: #333;
    }
    
    .end-time {
      font-size: 12px;
      color: #999;
    }
    
    .event-content {
      flex: 1;
      min-width: 0;
    }
    
    .event-header {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .event-subject {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      word-break: break-word;
    }
    
    .event-type {
      background-color: #e8e8e8;
      color: #666;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    
    .event-details {
      font-size: 13px;
      color: #666;
    }
    
    .event-detail {
      margin-bottom: 4px;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .event-details-btn {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 20px;
      padding: 0 10px;
      margin-left: auto;
      transition: color 0.2s;
    }
    
    .event-details-btn:hover {
      color: #333;
    }
  `;
  document.head.appendChild(style);
}

// Инициализация
async function initSchedule() {
  injectStyles();
  
  const parser = new ICSParser();
  const renderer = new ScheduleRenderer('#container');
  
  try {
    const events = await parser.fetch('https://eios.kosgos.ru/api/Rasp?idGroup=8953&iCal=true');
    renderer.setEvents(events);
    renderer.render();
    
    console.log('Schedule loaded:', events);
  } catch (error) {
    console.error('Error loading schedule:', error);
    document.querySelector('#container').innerHTML = `
      <div style="padding: 20px; color: red; text-align: center;">
        Ошибка при загрузке расписания: ${error.message}
      </div>
    `;
  }
}

// Запуск
initSchedule();
