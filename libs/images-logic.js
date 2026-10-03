// === /libs/postimages/PostImages.js ===

class PostImages {
  constructor(options = {}) {
    this.host = options.host || 'postimages.org';
    this.maxFileSize = options.maxFileSize || 10; // МБ
    this.uploadForm = null;
    this.fileInput = null;
    this.resolveUpload = null;
    this.rejectUpload = null;
  }

  // ✓ Инициализация
  async init() {
    console.log('🔧 PostImages инициализирован');
    this._createUploadForm();
    return true;
  }

  // ✓ Создание скрытой формы для загрузки
  _createUploadForm() {
    if (this.uploadForm) return;

    this.uploadForm = document.createElement('form');
    this.uploadForm.style.display = 'none';
    this.uploadForm.enctype = 'multipart/form-data';
    this.uploadForm.method = 'POST';

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.name = 'upload[]';

    this.uploadForm.appendChild(this.fileInput);
    document.body.appendChild(this.uploadForm);

    this.fileInput.addEventListener('change', (e) => {
      this._handleFileSelect(e);
    });
  }

  // ✓ Открыть диалог выбора файла
  async openUploadWindow() {
    console.log('📂 Открываем диалог выбора файла...');

    return new Promise((resolve, reject) => {
      this.resolveUpload = resolve;
      this.rejectUpload = reject;

      const timeout = setTimeout(() => {
        reject(new Error('Пользователь отменил выбор файла'));
      }, 30 * 60 * 1000);

      this._uploadTimeout = timeout;
      this.fileInput.click();
    });
  }

  // ✓ Обработка выбранного файла
  async _handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
      if (this.rejectUpload) {
        this.rejectUpload(new Error('Файл не выбран'));
      }
      return;
    }

    // Валидация размера
    if (file.size > this.maxFileSize * 1024 * 1024) {
      if (this.rejectUpload) {
        this.rejectUpload(new Error(`Файл слишком большой (макс ${this.maxFileSize} МБ)`));
      }
      return;
    }

    // Валидация типа
    if (!file.type.startsWith('image/')) {
      if (this.rejectUpload) {
        this.rejectUpload(new Error('Это не изображение'));
      }
      return;
    }

    try {
      console.log('⏳ Загружаем файл:', file.name);
      const imageUrl = await this._uploadFile(file);
      
      clearTimeout(this._uploadTimeout);
      console.log('✓ Файл загружен:', imageUrl);

      if (this.resolveUpload) {
        this.resolveUpload({
          success: true,
          imageUrl: imageUrl,
          fileName: file.name,
          fileSize: file.size
        });
      }
    } catch (error) {
      clearTimeout(this._uploadTimeout);
      console.error('❌ Ошибка загрузки:', error);

      if (this.rejectUpload) {
        this.rejectUpload(error);
      }
    }
  }

  // ✓ Загрузить файл на postimages.org (исправленный API)
  async _uploadFile(file) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      
      // ✓ КРИТИЧНО: правильный порядок и названия параметров
      formData.append('upload[]', file);
      formData.append('numfiles', '1');
      formData.append('gallery', '');
      formData.append('optsize', '0');
      formData.append('expire', '0');
      formData.append('format', 'json'); // Запрашиваем JSON ответ

      const xhr = new XMLHttpRequest();

      // Отслеживание прогресса
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          console.log(`📊 Прогресс: ${percentComplete.toFixed(2)}%`);
        }
      });

      // Успешная загрузка
      xhr.addEventListener('load', () => {
        console.log(`📡 Статус ответа: ${xhr.status}`);
        console.log(`📦 Тело ответа:`, xhr.responseText);

        if (xhr.status === 200) {
          try {
            let response;
            
            // Пытаемся распарсить как JSON
            try {
              response = JSON.parse(xhr.responseText);
            } catch {
              // Если JSON не сработал, пытаемся извлечь URL из HTML
              const urlMatch = xhr.responseText.match(/https?:\/\/[^\s"<>]+\.(jpg|jpeg|png|gif|webp)/gi);
              if (urlMatch && urlMatch.length > 0) {
                resolve(urlMatch[0]);
                return;
              }
              throw new Error('Неверный формат ответа');
            }

            console.log('✓ Распарсен ответ:', response);

            // Извлекаем URL из разных возможных форматов ответа
            let imageUrl = null;

            if (response.url) {
              imageUrl = response.url;
            } else if (response.image) {
              imageUrl = response.image;
            } else if (response.images && response.images.length > 0) {
              imageUrl = response.images[0];
            } else if (response.status === 'ok' && response.image) {
              imageUrl = response.image;
            }

            if (imageUrl) {
              // Убеждаемся, что это полный URL
              if (!imageUrl.startsWith('http')) {
                imageUrl = 'https://' + imageUrl;
              }
              resolve(imageUrl);
            } else {
              console.error('Структура ответа:', response);
              reject(new Error('URL изображения не найден в ответе сервера'));
            }
          } catch (error) {
            reject(new Error('Ошибка парсинга ответа: ' + error.message));
          }
        } else {
          reject(new Error(`Ошибка сервера: ${xhr.status}`));
        }
      });

      // Ошибка сети
      xhr.addEventListener('error', () => {
        reject(new Error('Ошибка сетевого соединения'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Загрузка отменена'));
      });

      // ✓ ВАЖНО: правильный endpoint
      // Используем старый API, совместимый с JSON ответами
      xhr.open('POST', 'https://postimages.org/api/1/upload');
      
      // НЕ устанавливаем Content-Type, браузер сам установит правильный multipart/form-data
      xhr.send(formData);
    });
  }
}

/*

// ✓ Создаем глобальные экземпляры классов для доступа из ui.js
window.postimages = new PostImages();

*/