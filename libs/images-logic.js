/*
 * Offline content cache, Postimages bridge and image viewer.
 * Loaded after auth-logic.js so it can extend the existing Firestore Database.
 */
(function installImagesLogic(global) {
  'use strict';

  const DB_NAME = 'student-kgu-offline-content-v1';
  const DB_VERSION = 1;
  const QUERY_STORE = 'queries';
  const IMAGE_STORE = 'image-blobs';
  const MAX_POST_IMAGES = 10;

  class OfflineContentCache {
    constructor() {
      this._dbPromise = null;
      this._objectUrls = new Map();
      this._memoryQueries = new Map();
      this._memoryImages = new Map();
    }

    async _openDB() {
      if (typeof indexedDB === 'undefined') return null;
      if (this._dbPromise) return this._dbPromise;

      this._dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(QUERY_STORE)) {
            db.createObjectStore(QUERY_STORE, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(IMAGE_STORE)) {
            db.createObjectStore(IMAGE_STORE, { keyPath: 'url' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Не удалось открыть локальный кэш'));
        request.onblocked = () => reject(new Error('Локальный кэш заблокирован другой вкладкой'));
      }).catch((error) => {
        this._dbPromise = null;
        console.warn('IndexedDB-кэш недоступен:', error);
        return null;
      });

      return this._dbPromise;
    }

    _queryKey(collection, parameter, value) {
      let serializedValue;
      try {
        serializedValue = JSON.stringify(value);
      } catch (_) {
        serializedValue = String(value);
      }
      return `${collection}:${parameter}:${serializedValue}`;
    }

    async _readStore(storeName, key) {
      const db = await this._openDB();
      if (!db) return null;

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(storeName, 'readonly');
          const request = transaction.objectStore(storeName).get(key);
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
    }

    async _writeStore(storeName, value) {
      const db = await this._openDB();
      if (!db) return false;

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(storeName, 'readwrite');
          transaction.objectStore(storeName).put(value);
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => resolve(false);
          transaction.onabort = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    // ✓ Сбросить сохранённый результат одного запроса: после публикации показываем свежие данные
    async invalidate(collection, parameter, value) {
      const key = this._queryKey(collection, parameter, value);
      this._memoryQueries.delete(key);
      const db = await this._openDB();
      if (!db) return true;
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(QUERY_STORE, 'readwrite');
          transaction.objectStore(QUERY_STORE).delete(key);
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => resolve(false);
          transaction.onabort = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    // ✓ Сбросить все сохранённые тексты и изображения запрошенного вида (например, все запросы по группе)
    async invalidateCollection(collection) {
      const prefix = `${collection}:`;
      Array.from(this._memoryQueries.keys()).forEach((key) => {
        if (key.indexOf(prefix) === 0) this._memoryQueries.delete(key);
      });
      const db = await this._openDB();
      if (!db) return true;
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(QUERY_STORE, 'readwrite');
          const store = transaction.objectStore(QUERY_STORE);
          const request = store.openCursor();
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) return;
            const key = String((cursor.value && cursor.value.key) || '');
            if (key.indexOf(prefix) === 0) store.delete(key);
            cursor.continue();
          };
          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => resolve(false);
          transaction.onabort = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    }

    /* -------------------------------------------------------------------------------------
     * Управление локальным кэшем (раздел «Данные приложения» в настройках)
     * ----------------------------------------------------------------------------------- */

    // ✓ Объём кэша в байтах (запросы + изображения)
    async size() {
      const db = await this._openDB();
      if (!db) return 0;
      const storeSize = (storeName) => new Promise((resolve) => {
        try {
          const transaction = db.transaction(storeName, 'readonly');
          const request = transaction.objectStore(storeName).openCursor();
          let total = 0;
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) { resolve(total); return; }
            const value = cursor.value;
            try {
              if (value && value.blob && typeof value.blob.size === 'number') total += value.blob.size;
              else total += JSON.stringify(value === undefined ? '' : value).length;
            } catch (_) { /* пропускаем несериализуемое значение */ }
            cursor.continue();
          };
          request.onerror = () => resolve(total);
        } catch (_) { resolve(0); }
      });
      const [queries, images] = await Promise.all([storeSize(QUERY_STORE), storeSize(IMAGE_STORE)]);
      return (queries || 0) + (images || 0);
    }

    // ✓ Очистить оперативную память кэша (данные на диске остаются)
    clearMemory() {
      this._memoryQueries.clear();
      this._memoryImages.clear();
      return true;
    }

    // ✓ Очистить кэш полностью: и оперативную память, и локальную базу
    async clearAll() {
      this.clearMemory();
      if (this._dbPromise) {
        try { const db = await this._dbPromise; if (db) db.close(); } catch (_) { /* уже закрыта */ }
        this._dbPromise = null;
      }
      if (typeof indexedDB === 'undefined' || typeof indexedDB.deleteDatabase !== 'function') return false;
      return new Promise((resolve) => {
        try {
          const request = indexedDB.deleteDatabase(DB_NAME);
          request.onsuccess = () => resolve(true);
          request.onerror = () => resolve(false);
          request.onblocked = () => resolve(false);
        } catch (_) { resolve(false); }
      });
    }

    async _readThrough(collection, parameter, value, resultProperty, fetcher) {
      const key = this._queryKey(collection, parameter, value);
      const memoryValue = this._memoryQueries.get(key);
      const stored = await this._readStore(QUERY_STORE, key);
      const cached = stored ? stored.result : memoryValue;

      if (global.navigator && global.navigator.onLine === false) {
        return cached
          ? { ...cached, offline: true, stale: true }
          : { success: false, [resultProperty]: [], offline: true, message: 'Нет сохранённых данных для офлайн-режима' };
      }

      try {
        if (!global.database || typeof fetcher !== 'function') {
          throw new Error('База данных недоступна');
        }
        const result = await fetcher();
        if (result && result.success === true && Array.isArray(result[resultProperty])) {
          this._memoryQueries.set(key, result);
          await this._writeStore(QUERY_STORE, {
            key,
            result,
            savedAt: Date.now(),
          });
          return result;
        }
        if (cached) return { ...cached, offline: true, stale: true };
        return result || { success: false, [resultProperty]: [], message: 'Сервер не вернул данные' };
      } catch (error) {
        if (cached) return { ...cached, offline: true, stale: true, cacheError: String(error) };
        return {
          success: false,
          [resultProperty]: [],
          offline: true,
          message: error && error.message ? error.message : 'Не удалось загрузить данные',
        };
      }
    }

    async getTexts(parameter, value) {
      return this._readThrough(
        'texts', parameter, value, 'texts',
        () => global.database.getTexts(parameter, value)
      );
    }

    async getImages(parameter, value) {
      return this._readThrough(
        'images', parameter, value, 'images',
        () => global.database.getImages(parameter, value)
      );
    }

    async getImageBlob(url) {
      if (!url) return null;
      const memoryBlob = this._memoryImages.get(url);
      if (memoryBlob) return memoryBlob;
      const stored = await this._readStore(IMAGE_STORE, url);
      if (stored && stored.blob instanceof Blob) {
        this._memoryImages.set(url, stored.blob);
        return stored.blob;
      }
      return null;
    }

    async cacheImage(url) {
      if (!url || typeof url !== 'string') return false;

      // Caching an image through an <img> request also lets service-worker Cache API
      // store cross-origin Postimages responses that do not expose CORS headers.
      this._warmImageRequest(url);

      if (global.navigator && global.navigator.onLine === false) return false;
      try {
        const response = await (global.fetchWithTimeout || global.fetch.bind(global))(url, { method: 'GET', mode: 'cors', cache: 'force-cache', timeout: 12000 });
        if (!response.ok || response.type === 'opaque') return false;
        const blob = await response.blob();
        if (!blob || blob.size === 0) return false;
        this._memoryImages.set(url, blob);
        await this._writeStore(IMAGE_STORE, { url, blob, savedAt: Date.now() });
        return true;
      } catch (_) {
        // У Postimages может быть запрещён CORS. Отображение и офлайн-кэш в таком
        // случае обеспечивает service worker; blob-копия просто не создаётся.
        return false;
      }
    }

    _warmImageRequest(url) {
      try {
        const image = new Image();
        image.decoding = 'async';
        image.src = url;
      } catch (_) {
        // Нет Image API, например в тестовом окружении.
      }
    }

    async getDisplayUrl(url) {
      const blob = await this.getImageBlob(url);
      if (blob) {
        if (!this._objectUrls.has(url)) {
          this._objectUrls.set(url, URL.createObjectURL(blob));
        }
        return this._objectUrls.get(url);
      }
      this.cacheImage(url);
      return url;
    }

    async getTextsForEvent(event) {
      const timestamp = OfflineContentCache.getEventTimestamp(event);
      if (!timestamp) return { success: false, texts: [] };
      return this.getTexts('subjectTimestamp', timestamp);
    }

    async getImagesForEvent(event) {
      const timestamp = OfflineContentCache.getEventTimestamp(event);
      if (!timestamp) return { success: false, images: [] };
      return this.getImages('subjectTimestamp', timestamp);
    }

    static getEventTimestamp(event) {
      if (!event || !event.startTime) return null;
      const value = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      if (Number.isNaN(value.getTime())) return null;
      return Math.floor(value.getTime() / 1000);
    }
  }

  function normalizeQueryParameter(parameter) {
    const aliases = {
      textID: 'textId',
      userID: 'userId',
      imageID: 'imageId',
      imageURL: 'imageUrl',
    };
    return aliases[parameter] || parameter;
  }

  function installDatabaseExtensions() {
    const database = global.database;
    if (!database || !database.constructor || !database.constructor.prototype) return;

    const prototype = database.constructor.prototype;

    // Выравниваем имена Firestore-полей с теми, которые реально записываются
    // в документах (textId/userId, а не textID/userID), и добавляем новые поля.
    prototype.getTexts = async function getTexts(parameter, value) {
      const field = normalizeQueryParameter(parameter);
      const allowed = [
        'textId', 'userId', 'author', 'authorEmail', 'subject',
        'subjectTimestamp', 'textContent', 'textType', 'timestamp',
        'userGroup', 'userSubgroup', 'targetSubgroup', 'postId', 'teacher',
        'feedbackOwner', 'feedbackQuestion', 'moderation',
      ];
      if (!allowed.includes(field)) {
        return { success: false, texts: [], message: 'Неверный параметр запроса текстов' };
      }
      try {
        const snapshot = await this.db.collection('texts').where(field, '==', value).get();
        const texts = [];
        snapshot.forEach((doc) => texts.push(doc.data()));
        return { success: true, texts };
      } catch (error) {
        return {
          success: false,
          texts: [],
          error: error && error.code,
          message: `Ошибка получения текстов: ${error && error.message ? error.message : error}`,
        };
      }
    };

    // Исправляет несовпадение imageID/imageURL с фактическими imageId/imageUrl
    // и добавляет поля для группировки новых постов и подгрупп.
    prototype.getImages = async function getImages(parameter, value) {
      const field = normalizeQueryParameter(parameter);
      const allowed = [
        'imageId', 'userId', 'author', 'authorEmail', 'subject',
        'subjectTimestamp', 'imageUrl', 'imageType', 'timestamp',
        'userGroup', 'targetSubgroup', 'postId', 'textId', 'teacher',
        'feedbackOwner', 'moderation',
      ];
      if (!allowed.includes(field)) {
        return { success: false, images: [], message: 'Неверный параметр запроса изображений' };
      }
      try {
        const snapshot = await this.db.collection('images').where(field, '==', value).get();
        const images = [];
        snapshot.forEach((doc) => images.push(doc.data()));
        return { success: true, images };
      } catch (error) {
        return {
          success: false,
          images: [],
          error: error && error.code,
          message: `Ошибка получения изображений: ${error && error.message ? error.message : error}`,
        };
      }
    };

    prototype.saveMaterialPost = async function saveMaterialPost(post) {
      try {
        const user = this.auth && this.auth.getCurrentUser ? this.auth.getCurrentUser() : null;
        if (!user) return { success: false, message: 'Пользователь не авторизован' };

        const input = post || {};
        const imageUrls = Array.isArray(input.images)
          ? Array.from(new Set(input.images.map((image) => typeof image === 'string' ? image : image && image.url).filter(Boolean)))
          : [];
        if (imageUrls.length > MAX_POST_IMAGES) {
          return { success: false, message: `Можно прикрепить не более ${MAX_POST_IMAGES} изображений` };
        }
        if (!String(input.textContent || '').trim() && imageUrls.length === 0) {
          return { success: false, message: 'Добавьте текст или хотя бы одно изображение' };
        }

        const postId = `post_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const textId = `text_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const timestamp = Date.now();
        const textType = input.textType === 'homework'
          ? 'homework'
          : (input.textType === 'feedback' ? 'feedback' : 'material');
        const targetSubgroup = input.targetSubgroup === 1 || input.targetSubgroup === 2
          ? input.targetSubgroup
          : null;
        // ✓ Обращения в поддержку не проходят модерацию: их видят только администраторы,
        // и попадают они сразу во вкладку «Фидбек», а не в очередь проверки контента.
        const moderationState = textType === 'feedback' ? 'approved' : 'pending';
        // ✓ Преподаватель пары: две разные группы могут слушать один предмет
        // в одно и то же время у разных преподавателей — по этому полю ДЗ и материалы
        // показываются только той группе, к которой относятся.
        const teacher = String(input.teacher || '').trim();
        const batch = this.db.batch();
        const textRef = this.db.collection('texts').doc(textId);

        batch.set(textRef, {
          textId,
          postId,
          userId: user.uid,
          author: user.displayName || 'Анонимный пользователь',
          authorEmail: user.email || '',
          userGroup: input.userGroup || 'Группа не выбрана',
          userSubgroup: input.userSubgroup || null,
          targetSubgroup,
          subject: String(input.subject || ''),
          teacher,
          subjectTimestamp: Number(input.subjectTimestamp),
          textContent: String(input.textContent || '').trim(),
          textType,
          imageCount: imageUrls.length,
          timestamp,
          // Обычная публикация появляется в приложении только после проверки администратором,
          // обращение в поддержку — сразу (модерация ему не нужна)
          moderation: moderationState,
          reportCount: 0,
          reportedBy: [],
        });

        const imageIds = [];
        imageUrls.forEach((imageUrl, index) => {
          const imageId = `img_${Date.now()}_${index}_${Math.floor(Math.random() * 10000)}`;
          imageIds.push(imageId);
          const imageRef = this.db.collection('images').doc(imageId);
          batch.set(imageRef, {
            imageId,
            postId,
            textId,
            userId: user.uid,
            author: user.displayName || 'Анонимный пользователь',
            authorEmail: user.email || '',
            userGroup: input.userGroup || 'Группа не выбрана',
            userSubgroup: input.userSubgroup || null,
            targetSubgroup,
            subject: String(input.subject || ''),
            teacher,
            subjectTimestamp: Number(input.subjectTimestamp),
            imageUrl,
            imageType: textType,
            timestamp,
            order: index,
            moderation: moderationState,
            reportCount: 0,
            reportedBy: [],
          });
        });

        await batch.commit();
        return { success: true, postId, textId, imageIds, message: 'Публикация успешно сохранена' };
      } catch (error) {
        return {
          success: false,
          error: error && error.code,
          message: `Ошибка сохранения публикации: ${error && error.message ? error.message : error}`,
        };
      }
    };
  }

  /* ---------------------------------------------------------------------------------------
   * Сверка публикации с преподавателем пары.
   * Публикации, созданные до появления поля teacher, отсекать нельзя — для них
   * (как и раньше) сверяются только предмет и подгруппа.
   * ------------------------------------------------------------------------------------- */
  function teacherNameKey(value) {
    const parts = String(value || '')
      .replace(/[.]+/g, ' ')
      .replace(/[ёЁ]/g, (letter) => (letter === 'ё' ? 'е' : 'Е'))
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .split(' ');
    if (!parts[0]) return '';
    const surname = parts[0];
    const initials = parts.slice(1).filter(Boolean).map((part) => part[0]).join('');
    return initials ? `${surname} ${initials}` : surname;
  }

  function isPostForTeacher(record, teacherQuery) {
    if (!record) return false;
    const recordKey = teacherNameKey(record.teacher);
    if (!recordKey) return true;            // старые публикации без поля teacher
    const queryKey = teacherNameKey(teacherQuery);
    if (!queryKey) return true;             // преподавателя пары не удалось определить
    return recordKey === queryKey;
  }

  function extractImageUrls(content) {
    const source = String(content || '').replace(/&amp;/gi, '&');
    const results = [];
    const add = (candidate) => {
      if (!candidate) return;
      let value = String(candidate).trim().replace(/^['"]|['"]$/g, '');
      value = value.replace(/&amp;/gi, '&');
      try {
        const parsed = new URL(value, global.location && global.location.href);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
          results.push(parsed.href);
        }
      } catch (_) {
        // Не URL.
      }
    };

    // Стандартная разметка Postimages: [img]https://...[/img].
    for (const match of source.matchAll(/\[img(?:=[^\]]+)?\]\s*([^\[]+?)\s*\[\/img\]/gi)) add(match[1]);
    // На случай HTML-ответа.
    for (const match of source.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["']/gi)) add(match[1]);
    // Прямые ссылки на файлы изображений, если выбран hotlink-формат.
    for (const match of source.matchAll(/https?:\/\/[^\s\]<>"']+\.(?:png|jpe?g|gif|webp|bmp|avif)(?:\?[^\s\]<>"']*)?/gi)) add(match[0]);

    return Array.from(new Set(results));
  }

  function showMessage(message, type = 'info') {
    if (typeof global.showNotification === 'function') global.showNotification(message, type);
    else console[type === 'error' ? 'error' : 'log'](message);
  }

  /* ---------------------------------------------------------------------------------------
   * Загрузка изображений на Postimages напрямую со страницы приложения (только fetch).
   * Никаких всплывающих окон, переходов на другие страницы, локальных серверов и сборок.
   *
   * Схема ровно такая же, как у самого Postimages, только запросы уходят из нашего кода:
   *   1) POST https://postimages.org/json  (multipart/form-data)
   *      поля: file, numfiles, upload_session, pm=1, gallery, optsize=0, expire=0,
   *            mode=phpbb3, lang, forumurl
   *      ответ: { "url": "https://postimg.cc/XXXX/YYYY", "image": "..." }
   *   2) GET https://postimages.org/mod?dz=1&to=<url>&mode=phpbb3&hash=1&lang=english
   *            &code=hotlink&forumurl=<...>&areaid=<...>&errors=0
   *      ответ: BBCode вида [url=...][img]https://i.postimg.cc/....png[/img][/url],
   *      из которого мы берём прямую ссылку на изображение.
   * ------------------------------------------------------------------------------------- */
  class PostimagesUploader {
    constructor(container, options = {}) {
      this.container = container;
      this.maxImages = Math.min(MAX_POST_IMAGES, Math.max(1, Number(options.maxImages) || MAX_POST_IMAGES));
      this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
      this.items = []; // { id, file, name, size, previewUrl, remoteUrl, status, error }
      this._uploading = false;
      this._queue = [];
      this._areaId = `postimg_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;

      this._onPaste = this._onPaste.bind(this);
      this._onWindowDragOver = this._onWindowDragOver.bind(this);

      this._buildUI();
      document.addEventListener('paste', this._onPaste);
      global.addEventListener('dragover', this._onWindowDragOver);
    }

    /* ---------------------------- Разметка интерфейса ---------------------------- */

    _buildUI() {
      this.controls = document.createElement('div');
      this.controls.classList.add('postimages-uploader');

      const head = document.createElement('div');
      head.classList.add('postimages-head');
      const headTitle = document.createElement('p');
      headTitle.classList.add('postimages-head-title');
      headTitle.textContent = 'Изображения к публикации';
      this.counter = document.createElement('span');
      this.counter.classList.add('postimages-counter');
      head.appendChild(headTitle);
      head.appendChild(this.counter);
      this.controls.appendChild(head);

      // ✓ Предосмотр: ровные квадраты, тап открывает редактор (без открытия галереи)
      this.previewContainer = document.createElement('div');
      this.previewContainer.classList.add('postimages-preview-list');
      this.controls.appendChild(this.previewContainer);

      // ✓ Кнопка под изображениями: открывает галерею устройства
      this.pickButton = document.createElement('button');
      this.pickButton.type = 'button';
      this.pickButton.classList.add('postimages-pick-button');
      this.pickButton.addEventListener('click', () => this.openPicker());
      this.controls.appendChild(this.pickButton);

      this.statusLine = document.createElement('p');
      this.statusLine.classList.add('postimages-status');
      this.statusLine.hidden = true;
      this.controls.appendChild(this.statusLine);

      // Скрытый ввод нужен для вставки из буфера и как резервный путь выбора
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/*';
      this.fileInput.multiple = true;
      this.fileInput.classList.add('postimages-file-input');
      this.fileInput.addEventListener('change', () => {
        this.addFiles(this.fileInput.files);
        this.fileInput.value = '';
      });
      this.controls.appendChild(this.fileInput);

      // ✓ Файлы можно бросить прямо на блок с изображениями
      this.controls.addEventListener('dragover', (event) => {
        event.preventDefault();
        this.controls.classList.add('postimages-uploader--drag');
      });
      this.controls.addEventListener('dragleave', (event) => {
        if (event.target === this.controls) this.controls.classList.remove('postimages-uploader--drag');
      });
      this.controls.addEventListener('drop', (event) => {
        event.preventDefault();
        this.controls.classList.remove('postimages-uploader--drag');
        const files = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : null;
        if (files && files.length) this.addFiles(files);
      });

      this.container.appendChild(this.controls);
      this._renderItems();
    }

    /* ---------------------------- Добавление и загрузка файлов ---------------------------- */

    addFiles(fileList) {
      const incoming = Array.from(fileList || []);
      if (incoming.length === 0) return;

      let added = 0;
      for (const file of incoming) {
        if (this.items.length >= this.maxImages) break;
        if (!file) continue;
        if (!PostimagesUploader.ALLOWED_TYPES.test(file.type || '')) {
          showMessage(`«${file.name}» не является изображением`, 'error');
          continue;
        }
        if (file.size > PostimagesUploader.MAX_FILESIZE) {
          showMessage(`«${file.name}» больше 10 МБ`, 'error');
          continue;
        }
        if (this.items.some((item) => item.file && item.file.name === file.name && item.file.size === file.size)) {
          continue; // такой файл уже добавлен
        }
        this.items.push({
          id: `file_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
          file,
          originalFile: file,
          transform: PostimagesUploader.emptyTransform(),
          name: file.name,
          size: file.size,
          previewUrl: this._localPreview(file),
          remoteUrl: '',
          status: 'pending',
          error: '',
        });
        added += 1;
      }

      if (this.items.length >= this.maxImages && incoming.length + this.items.length > this.maxImages) {
        showMessage(`Достигнут лимит: ${this.maxImages} изображений`, 'info');
      }
      if (added > 0) {
        this._renderItems();
        this._enqueueUploads();
      }
    }

    _localPreview(file) {
      try { return URL.createObjectURL(file); } catch (_) { return ''; }
    }

    /** Ставим в очередь и загружаем по одному файлу (как parallelUploads: 1 у Postimages) */
    _enqueueUploads() {
      for (const item of this.items) {
        if (item.status === 'pending' && !this._queue.includes(item)) this._queue.push(item);
      }
      if (!this._uploading) this._processQueue();
    }

    async _processQueue() {
      if (this._uploading) return;
      this._uploading = true;
      while (this._queue.length > 0) {
        const item = this._queue.shift();
        if (!item || item.status !== 'pending') continue;
        await this._uploadItem(item);
      }
      this._uploading = false;
      this._updateStatusLine();
    }

    async _uploadItem(item) {
      item.status = 'uploading';
      item.error = '';
      this._renderItems();

      try {
        const pageUrl = await this._sendFile(item.file);
        item.remoteUrl = await this._resolveDirectLink(pageUrl) || pageUrl;
        item.status = 'done';
        if (item.remoteUrl && global.contentCache) global.contentCache.cacheImage(item.remoteUrl);
      } catch (error) {
        item.status = 'error';
        item.error = error && error.message ? error.message : 'Не удалось загрузить изображение';
        console.warn('Ошибка загрузки изображения:', error);
      }

      this._renderItems();
      this._emitChange();
    }

    /** Шаг 1: отправляем файл на /json и получаем ссылку на страницу изображения */
    async _sendFile(file) {
      const form = new FormData();
      form.append('file', file, file.name || 'image');
      form.append('numfiles', '1');
      form.append('upload_session', PostimagesUploader.newSession());
      form.append('pm', '1');
      form.append('gallery', '');
      form.append('optsize', '0');
      form.append('expire', '0');
      form.append('mode', 'phpbb3');
      form.append('lang', PostimagesUploader.LANG);
      form.append('forumurl', encodeURIComponent(global.location.href));

      let response;
      try {
        response = await (global.fetchWithTimeout || global.fetch.bind(global))(`${PostimagesUploader.HOST}/json`, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
          },
          body: form,
          timeout: 45000,
        });
      } catch (networkError) {
        throw new Error('Нет связи с Postimages. Проверьте интернет-соединение и попробуйте снова.');
      }

      if (!response.ok) {
        let details = '';
        try {
          const data = await response.json();
          if (data && data.error && data.error.message) details = `: ${data.error.message}`;
        } catch (_) { /* ответ не в формате JSON */ }
        if (response.status === 403 || /automated uploads/i.test(details)) {
          throw new Error(`Postimages отклонил автоматическую загрузку. Нажмите «Повторить» или добавьте изображение по прямой ссылке ниже.`);
        }
        if (response.status === 413) {
          throw new Error(`Файл слишком большой для Postimages (HTTP 413).`);
        }
        if (response.status >= 500) {
          throw new Error(`Сервер Postimages временно недоступен (HTTP ${response.status}). Попробуйте позже.`);
        }
        throw new Error(`Postimages отклонил загрузку (HTTP ${response.status})${details}`);
      }

      let data = null;
      try { data = await response.json(); } catch (_) { data = null; }
      if (!data) throw new Error('Postimages вернул ответ в неизвестном формате. Попробуйте загрузить изображение ещё раз.');
      const pageUrl = String(data.url || data.image || data.page || '').trim();
      if (!/^https?:\/\//i.test(pageUrl)) throw new Error('Postimages вернул ответ без ссылки на изображение.');
      return pageUrl;
    }

    /**
     * Шаг 2: получаем прямую ссылку на изображение.
     * Сначала код hotlink (полноразмерная ссылка), затем thumb — на случай,
     * если у формата hotlink не оказалось значения.
     */
    async _resolveDirectLink(pageUrl) {
      if (!pageUrl) return '';
      for (const code of ['hotlink', 'thumb']) {
        const direct = await this._requestPostimagesCode(pageUrl, code);
        if (direct) return direct;
      }
      return '';
    }

    /** Запрос готового кода (hotlink/thumb) для уже загруженного изображения */
    async _requestPostimagesCode(pageUrl, code) {
      const params = new URLSearchParams({
        dz: '1',
        to: pageUrl,
        mode: 'phpbb3',
        hash: '1',
        lang: PostimagesUploader.LANG,
        code,
        forumurl: global.location.href,
        areaid: this._areaId,
        errors: '0',
      });

      try {
        const response = await (global.fetchWithTimeout || global.fetch.bind(global))(`${PostimagesUploader.HOST}/mod?${params.toString()}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
          },
          timeout: 15000,
        });
        if (!response.ok) return '';
        const text = await response.text();
        const urls = extractImageUrls(text);
        const direct = urls.find((url) => /i\.postimg\.cc|i\.postimages\.org/i.test(url)) || urls[0];
        return direct || '';
      } catch (_) {
        return '';
      }
    }

    /** Человекочитаемый размер файла */
    static formatSize(bytes) {
      const value = Number(bytes) || 0;
      if (value < 1024) return `${value} Б`;
      if (value < 1024 * 1024) return `${Math.round(value / 1024)} КБ`;
      return `${(value / (1024 * 1024)).toFixed(1)} МБ`;
    }

    /** Уникальный идентификатор загрузки (аналог upload_session у самого Postimages) */
    static newSession() {
      return `${Date.now()}${String(Math.random()).substring(1)}`;
    }

    /* ---------------------------- Отрисовка ---------------------------- */

    /** Пустое преобразование — исходное состояние изображения */
    static emptyTransform() {
      return { rotation: 0, flipH: false, flipV: false, crop: null };
    }

    /** Изображение меняли в редакторе? */
    _isEdited(item) {
      const transform = item && item.transform ? item.transform : null;
      if (!transform) return false;
      return Boolean(transform.rotation) || transform.flipH || transform.flipV || Boolean(transform.crop);
    }

    /* ---------------------------- Галерея и редактор ---------------------------- */

    /** Нижняя шторка с галереей устройства */
    openPicker() {
      const picker = global.imagePicker;
      if (!picker) { this.fileInput.click(); return; }
      const free = Math.max(1, this.maxImages - this.items.length);
      picker.open({
        max: free,
        onConfirm: (files) => this.addFiles(files),
        onUrls: (urls) => this.addRemoteImages(urls),
      });
    }

    /** Редактор конкретного изображения: поворот, отражение, кадрирование */
    openEditor(item) {
      if (!item) return;
      const viewer = global.imageViewer;
      if (!viewer) return;
      const source = item.originalFile || item.file || item.remoteUrl || item.previewUrl;
      viewer.open(source, {
        mode: 'edit',
        file: item.originalFile || item.file || null,
        transform: item.transform || PostimagesUploader.emptyTransform(),
        title: item.name || 'Редактирование изображения',
        onApply: (payload) => this._applyEdit(item, payload),
      });
    }

    /**
     * Применяем результат редактора: изображение перерисовывается и
     * отправляется на Postimages заново (для просмотра это не обязательно,
     * но публиковаться должна уже изменённая версия).
     */
    _applyEdit(item, payload) {
      if (!item || !payload) return;
      item.transform = Object.assign(PostimagesUploader.emptyTransform(), payload.transform || {});
      const blob = payload.blob;
      if (!blob) { this._renderItems(); return; }

      const fileName = this._editedName(item);
      let file = null;
      try {
        file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      } catch (_) {
        file = blob;
      }

      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(item.previewUrl); } catch (_) { /* уже освобождена */ }
      }

      item.file = file;
      item.size = blob.size || 0;
      item.previewUrl = URL.createObjectURL(blob);
      item.status = 'pending';
      item.error = '';
      this._renderItems();
      this._enqueueUploads();
      this._emitChange();
      showMessage('Изображение изменено и отправлено на загрузку', 'success');
    }

    /** Возвращаем изображение к исходному виду (до поворотов и обрезки) */
    resetEdit(item) {
      if (!item) return;
      const original = item.originalFile;
      item.transform = PostimagesUploader.emptyTransform();
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(item.previewUrl); } catch (_) { /* уже освобождена */ }
      }
      if (original) {
        item.file = original;
        item.size = original.size;
        item.previewUrl = this._localPreview(original);
        item.status = 'pending';
        item.error = '';
      } else {
        item.file = null;
        item.previewUrl = item.remoteUrl || item.sourceUrl || item.previewUrl;
        item.status = item.remoteUrl ? 'done' : 'error';
      }
      this._renderItems();
      if (original) this._enqueueUploads();
      this._emitChange();
    }

    _editedName(item) {
      const base = String(item.name || 'image').replace(/\.[a-z0-9]{2,5}$/i, '');
      return `${base}-edited.jpg`;
    }

    /* ---------------------------- Отрисовка ---------------------------- */

    _renderItems() {
      if (!this.previewContainer) return;
      while (this.previewContainer.firstChild) this.previewContainer.removeChild(this.previewContainer.firstChild);

      const uploaded = this.items.filter((item) => item.status === 'done' && item.remoteUrl).length;
      this.counter.textContent = `${this.items.length}/${this.maxImages}`;

      if (this.pickButton) {
        const label = this.items.length > 0 ? 'Загрузить или редактировать файлы' : 'Загрузить изображения';
        this.pickButton.innerHTML = `${ICONS.image}<span>${label}</span>`;
        this.pickButton.disabled = this.items.length >= this.maxImages;
        this.pickButton.title = this.items.length >= this.maxImages
          ? `Достигнут лимит: ${this.maxImages} изображений`
          : 'Открыть галерею устройства';
      }

      const statusLabels = {
        pending: 'В очереди…',
        uploading: 'Загрузка…',
        done: 'Готово',
        error: 'Ошибка',
      };

      for (const item of this.items) {
        const card = document.createElement('div');
        card.classList.add('postimages-preview-item', `postimages-preview-item--${item.status}`);
        if (this._isEdited(item)) card.classList.add('postimages-preview-item--edited');

        const tile = document.createElement('div');
        tile.className = 'postimages-preview-tile';

        const image = document.createElement('img');
        image.alt = `Изображение ${item.name || ''}`.trim();
        image.src = item.previewUrl || item.remoteUrl || '';
        image.loading = 'lazy';
        image.draggable = false;
        image.title = 'Открыть редактор';
        // ✓ Короткий тап по превью открывает редактор, а не галерею
        image.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.openEditor(item);
        });
        tile.appendChild(image);

        if (item.status === 'uploading' || item.status === 'pending') {
          const spinner = document.createElement('span');
          spinner.className = 'postimages-preview-spinner';
          tile.appendChild(spinner);
        }

        if (this._isEdited(item)) {
          const badge = document.createElement('span');
          badge.className = 'postimages-preview-edited';
          badge.textContent = 'изменено';
          badge.title = 'Изображение отредактировано — публикуется изменённая версия';
          tile.appendChild(badge);
        }

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('postimages-remove-button');
        removeButton.innerHTML = ICONS.close;
        removeButton.title = 'Убрать изображение';
        removeButton.setAttribute('aria-label', 'Убрать изображение из публикации');
        removeButton.addEventListener('click', (event) => {
          event.stopPropagation();
          this._removeItem(item);
        });
        tile.appendChild(removeButton);

        card.appendChild(tile);

        if (this._isEdited(item)) {
          const reset = document.createElement('button');
          reset.type = 'button';
          reset.className = 'postimages-reset-button';
          reset.innerHTML = `${ICONS.reset}<span>Вернуть как было</span>`;
          reset.addEventListener('click', () => this.resetEdit(item));
          card.appendChild(reset);
        }

        const caption = document.createElement('span');
        caption.classList.add('postimages-item-status');
        caption.textContent = statusLabels[item.status] || '';
        if (item.status === 'error' && item.error) {
          caption.textContent = 'Ошибка загрузки';
          caption.title = item.error;
        }
        card.appendChild(caption);

        if (item.status === 'error') {
          const retry = document.createElement('button');
          retry.type = 'button';
          retry.classList.add('postimages-retry-button');
          retry.textContent = 'Повторить';
          retry.addEventListener('click', (event) => {
            event.stopPropagation();
            item.status = 'pending';
            item.error = '';
            this._renderItems();
            this._enqueueUploads();
          });
          card.appendChild(retry);
        }

        this.previewContainer.appendChild(card);
      }

      this._updateStatusLine();
      if (uploaded >= 0) this._emitChange();
    }

    _updateStatusLine() {
      if (!this.statusLine) return;
      const failed = this.items.filter((item) => item.status === 'error');
      const busy = this.items.some((item) => item.status === 'uploading' || item.status === 'pending');
      if (busy) {
        this.statusLine.hidden = false;
        this.statusLine.className = 'postimages-status';
        this.statusLine.textContent = 'Загружаю изображения на Postimages…';
        return;
      }
      if (failed.length > 0) {
        this.statusLine.hidden = false;
        this.statusLine.className = 'postimages-status postimages-status--error';
        this.statusLine.textContent = `${failed.length} изображ. не загрузилось: ${failed[0].error}. Нажмите «Повторить» или добавьте ссылку вручную.`;
        return;
      }
      this.statusLine.hidden = true;
      this.statusLine.textContent = '';
    }

    _removeItem(item) {
      this._queue = this._queue.filter((queued) => queued !== item);
      const index = this.items.indexOf(item);
      if (index !== -1) this.items.splice(index, 1);
      // ✓ Удалённое изображение теряет и свои правки
      if (item.previewUrl && item.previewUrl.startsWith('blob:') && item.previewUrl !== item.remoteUrl) {
        try { URL.revokeObjectURL(item.previewUrl); } catch (_) { /* уже освобождён */ }
      }
      this._renderItems();
      this._emitChange();
    }

    /* ---------------------------- Буфер обмена и перетаскивание на страницу ---------------------------- */

    _onPaste(event) {
      if (!event || !event.clipboardData) return;
      const files = Array.from(event.clipboardData.files || []);
      if (files.length === 0) return;
      event.preventDefault();
      this.addFiles(files);
    }

    _onWindowDragOver(event) {
      if (!event || !event.dataTransfer) return;
      const types = Array.from(event.dataTransfer.types || []);
      if (!types.includes('Files')) return;
      event.preventDefault(); // ✓ иначе браузер просто откроет брошенный файл
    }

    /* ---------------------------- Публичный интерфейс ---------------------------- */

    /** Сообщить странице, что список изображений изменился */
    _emitChange() {
      try { this.onChange(this.getImages()); } catch (error) { console.warn('Ошибка обработчика изображений:', error); }
      this._updateStatusLine();
    }

    /**
     * Добавить уже загруженные изображения по ссылкам — используется при редактировании
     * публикации: показать прикреплённые картинки, чтобы их можно было снять или добавить новые.
     */
    addRemoteImages(urls) {
      const list = Array.isArray(urls) ? urls : [];
      let added = 0;
      for (const raw of list) {
        const url = String(raw || '').trim();
        if (!url || !/^https?:\/\//i.test(url)) continue;
        if (this.items.length >= this.maxImages) break;
        if (this.items.some((item) => item.remoteUrl === url)) continue;
        this.items.push({
          id: `remote_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
          file: null,
          originalFile: null,
          transform: PostimagesUploader.emptyTransform(),
          name: url.split('/').pop() || 'изображение',
          size: 0,
          previewUrl: url,
          remoteUrl: url,
          sourceUrl: url,
          status: 'done',
          error: '',
        });
        added += 1;
      }
      if (added > 0) {
        this._renderItems();
        this._emitChange();
      }
      return added;
    }

    /** Прямые ссылки на успешно загруженные изображения */
    /**
     * ✓ Одиночная загрузка без интерфейса: возвращает прямую ссылку на изображение.
     *   Та же связка Postimages, что и у публикаций (/json + запрос готовой ссылки),
     *   — используется, например, для аватара профиля.
     */
    static async uploadDirect(file) {
      if (!file) return '';
      const widget = new PostimagesUploader(document.createElement('div'), {});
      try {
        const pageUrl = await widget._sendFile(file);
        if (!pageUrl) return '';
        const direct = await widget._resolveDirectLink(pageUrl);
        return direct || pageUrl;
      } finally {
        try { widget.destroy(); } catch (_) { /* уже очищен */ }
      }
    }

    getImages() {
      return Array.from(new Set(
        this.items.filter((item) => item.status === 'done' && item.remoteUrl).map((item) => item.remoteUrl)
      ));
    }

    /** Идёт ли загрузка прямо сейчас */
    isUploading() {
      return this.items.some((item) => item.status === 'uploading' || item.status === 'pending');
    }

    destroy() {
      document.removeEventListener('paste', this._onPaste);
      global.removeEventListener('dragover', this._onWindowDragOver);
      for (const item of this.items) {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(item.previewUrl); } catch (_) { /* уже освобождён */ }
        }
      }
      this.items = [];
      this._queue = [];
      if (this.controls && this.controls.parentNode) this.controls.parentNode.removeChild(this.controls);
    }
  }

  PostimagesUploader.HOST = 'https://postimages.org';
  PostimagesUploader.LANG = 'english';
  PostimagesUploader.MAX_FILESIZE = 10 * 1024 * 1024; // 10 МБ на файл
  PostimagesUploader.ALLOWED_TYPES = /^image\//i;

  /* ==========================================================================================
   * Системная кнопка «Назад» для модальных слоёв (галерея, просмотр, редактор).
   * Модал сам кладёт запись в историю: нажатие «Назад» закрывает только модал,
   * страница публикации при этом не перерисовывается и выбранные файлы не сбрасываются.
   * ======================================================================================== */
  class ModalBackStack {
    constructor() {
      this.stack = [];
      this._seq = 0;
      this._expectPop = false;
    }

    push(handler) {
      const id = ++this._seq;
      let pushed = false;
      try {
        // ✓ Отступать назад имеет смысл только если в истории уже есть куда
        if (typeof history !== 'undefined' && history.length > 1) {
          const state = history.state ? history.state : {};
          history.pushState(Object.assign({}, state, { kgModal: id }), '');
          pushed = true;
        }
      } catch (_) { /* история недоступна — работаем без неё */ }
      this.stack.push({ id, handler, pushed });
      return id;
    }

    /** Закрытие по кнопке: убираем и обработчик, и лишнюю запись истории */
    remove(id) {
      const index = this.stack.findIndex((entry) => entry.id === id);
      if (index === -1) return;
      const entry = this.stack.splice(index, 1)[0];
      if (!entry || !entry.pushed) return;
      try {
        if (history.state && history.state.kgModal === id) {
          this._expectPop = true;
          history.back();
          // ✓ Страховка: если событие не пришло, флаг всё равно снимаем
          setTimeout(() => { this._expectPop = false; }, 1200);
        }
      } catch (_) { this._expectPop = false; }
    }

    /** true — событие обработано модалом, страницу перерисовывать не нужно */
    onPopstate() {
      if (this._expectPop) { this._expectPop = false; return true; }
      if (this.stack.length === 0) return false;
      const entry = this.stack.pop();
      try { entry.handler(); } catch (error) { console.warn('Не удалось закрыть модал:', error); }
      return true;
    }

    get size() { return this.stack.length; }
  }

  const modalBack = new ModalBackStack();

  /* ------------------------------------------------------------------------------------------
   * Иконки: встроенные SVG, чтобы интерфейс не зависел от загрузки картинок
   * ---------------------------------------------------------------------------------------- */
  const ICONS = {
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M4 13l5 5L20 6"/></svg>',
    rotateLeft: '<svg viewBox="0 0 24 24"><path d="M4 8h6"/><path d="M4 8a8 8 0 1 1-1 6"/><path d="M4 8V4"/><path d="M4 8h4"/></svg>',
    rotateRight: '<svg viewBox="0 0 24 24"><path d="M20 8h-6"/><path d="M20 8a8 8 0 1 0 1 6"/><path d="M20 8V4"/><path d="M20 8h-4"/></svg>',
    flipH: '<svg viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M9 7L4 12l5 5z"/><path d="M15 7l5 5-5 5z"/></svg>',
    flipV: '<svg viewBox="0 0 24 24"><path d="M3 12h18"/><path d="M7 9l5-5 5 5z"/><path d="M7 15l5 5 5-5z"/></svg>',
    crop: '<svg viewBox="0 0 24 24"><path d="M6 3v13a2 2 0 0 0 2 2h13"/><path d="M3 6h13a2 2 0 0 1 2 2v13"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 8-8"/><path d="M4 4v5h5"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M4 17l5-5 4 4 3-3 4 4"/></svg>',
  };

  function iconButton(iconName, title, onClick, extraClass) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kg-icon-button' + (extraClass ? ` ${extraClass}` : '');
    button.title = title;
    button.setAttribute('aria-label', title);
    button.innerHTML = `${ICONS[iconName] || ICONS.image}<span>${title}</span>`;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick(event);
    });
    return button;
  }

  /* ------------------------------------------------------------------------------------------
   * Геометрия: преобразования только кратные 90° и отражения, поэтому прямоугольник
   * переводится из координат результата в координаты исходника (и обратно) без искажений.
   * ---------------------------------------------------------------------------------------- */
  const FULL_RECT = { x: 0, y: 0, w: 1, h: 1 };

  function mapPointToResult(point, rotation, flipH, flipV) {
    let u = point.x;
    let v = point.y;
    const quarter = ((rotation % 360) + 360) % 360;
    if (quarter === 90) { const t = u; u = 1 - v; v = t; }
    else if (quarter === 180) { u = 1 - u; v = 1 - v; }
    else if (quarter === 270) { const t = u; u = v; v = 1 - t; }
    if (flipH) u = 1 - u;
    if (flipV) v = 1 - v;
    return { x: u, y: v };
  }

  function mapPointToSource(point, rotation, flipH, flipV) {
    let u = point.x;
    let v = point.y;
    if (flipH) u = 1 - u;
    if (flipV) v = 1 - v;
    const quarter = ((rotation % 360) + 360) % 360;
    if (quarter === 90) { const t = u; u = v; v = 1 - t; }
    else if (quarter === 180) { u = 1 - u; v = 1 - v; }
    else if (quarter === 270) { const t = u; u = 1 - v; v = t; }
    return { x: u, y: v };
  }

  function mapRect(rect, rotation, flipH, flipV, toResult) {
    const a = toResult
      ? mapPointToResult({ x: rect.x, y: rect.y }, rotation, flipH, flipV)
      : mapPointToSource({ x: rect.x, y: rect.y }, rotation, flipH, flipV);
    const b = toResult
      ? mapPointToResult({ x: rect.x + rect.w, y: rect.y + rect.h }, rotation, flipH, flipV)
      : mapPointToSource({ x: rect.x + rect.w, y: rect.y + rect.h }, rotation, flipH, flipV);
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y),
    };
  }

  function clampRect(rect, minSize) {
    const w = Math.min(1, Math.max(minSize, rect.w));
    const h = Math.min(1, Math.max(minSize, rect.h));
    const x = Math.min(1 - w, Math.max(0, rect.x));
    const y = Math.min(1 - h, Math.max(0, rect.y));
    return { x, y, w, h };
  }

  const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i;
  const IMAGE_MIME = /^image\//i;

  function isImageName(name) {
    return IMAGE_EXTENSIONS.test(String(name || ''));
  }

  /* ------------------------------------------------------------------------------------------
   * Память о выданных доступах к папкам устройства (File System Access API).
   * Дескрипторы хранятся в IndexedDB: повторный вход не требует нового разрешения.
   * ---------------------------------------------------------------------------------------- */
  class FilesystemStore {
    constructor() {
      this.dbName = 'kgu-filesystem-handles-v1';
      this.store = 'handles';
    }

    _open() {
      if (typeof indexedDB === 'undefined') return Promise.resolve(null);
      return new Promise((resolve) => {
        const request = indexedDB.open(this.dbName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(this.store)) db.createObjectStore(this.store);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
    }

    async _run(mode, action) {
      const db = await this._open();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(this.store, mode);
          const store = transaction.objectStore(this.store);
          const request = action(store);
          transaction.oncomplete = () => resolve(request ? request.result : true);
          transaction.onerror = () => resolve(null);
          transaction.onabort = () => resolve(null);
        } catch (_) { resolve(null); }
      });
    }

    get(key) { return this._run('readonly', (store) => store.get(key)); }
    set(key, value) { return this._run('readwrite', (store) => store.put(value, key)); }
    remove(key) { return this._run('readwrite', (store) => store.delete(key)); }
  }

  const filesystemStore = new FilesystemStore();

  /** Проверяем/запрашиваем разрешение на чтение папки, выданной ранее */
  async function ensureDirectoryPermission(handle, mode) {
    if (!handle) return 'none';
    const options = { mode: mode || 'read' };
    if (typeof handle.queryPermission !== 'function') return 'unsupported';
    let state = 'none';
    try { state = await handle.queryPermission(options); } catch (_) { state = 'none'; }
    if (state === 'granted') return state;
    if (state === 'prompt' && typeof handle.requestPermission === 'function') {
      try { state = await handle.requestPermission(options); } catch (_) { state = 'denied'; }
    }
    return state;
  }

  /* ------------------------------------------------------------------------------------------
   * Галерея устройства: список изображений и системных папок.
   * Работает через File System Access API там, где он есть; иначе — через обычный
   * выбор файлов, который на телефоне открывает системную галерею.
   * ---------------------------------------------------------------------------------------- */
  class DeviceGallery {
    constructor() {
      this.handle = null;
      this.handleName = '';
      this.entries = [];   // { id, name, file, folder, folderKey, modified, url }
      this.folders = [];   // { key, name, count, thumbUrl }
      this.refusals = Number(readLocalCounter('kgGalleryRefusals') || 0);
      this._urls = [];
    }

    get supported() {
      return typeof global.showDirectoryPicker === 'function';
    }

    get hasAccess() {
      return Boolean(this.handle) && this.entries.length > 0;
    }

    /** true — пользователю уже отказывали (или он сам закрыл системный диалог) */
    get refused() {
      return this.refusals > 0;
    }

    noteRefusal() {
      this.refusals += 1;
      try { global.localStorage.setItem('kgGalleryRefusals', String(this.refusals)); } catch (_) { /* нет доступа к хранилищу */ }
    }

    resetRefusals() {
      this.refusals = 0;
      try { global.localStorage.removeItem('kgGalleryRefusals'); } catch (_) { /* нет доступа к хранилищу */ }
    }

    /** Пытаемся восстановить доступ, выданный ранее */
    async restore() {
      if (!this.supported) return false;
      const stored = await filesystemStore.get('gallery-root');
      if (!stored) return false;
      const state = await ensureDirectoryPermission(stored, 'read');
      if (state !== 'granted') return false;
      this.handle = stored;
      this.handleName = stored.name || 'Устройство';
      await this.scan();
      return this.entries.length > 0;
    }

    /** Запрашиваем доступ к папке (вызывается только по нажатию пользователя) */
    async requestDirectory() {
      if (!this.supported) return { status: 'unsupported' };
      let handle = null;
      try {
        handle = await global.showDirectoryPicker({ id: 'kgu-gallery', mode: 'read' });
      } catch (error) {
        const name = error && error.name ? error.name : '';
        if (name === 'AbortError') { this.noteRefusal(); return { status: 'cancelled' }; }
        this.noteRefusal();
        return { status: 'denied', error };
      }
      const state = await ensureDirectoryPermission(handle, 'read');
      if (state !== 'granted') { this.noteRefusal(); return { status: 'denied' }; }
      this.handle = handle;
      this.handleName = handle.name || 'Устройство';
      this.resetRefusals();
      try { await filesystemStore.set('gallery-root', handle); } catch (_) { /* не сохранилось — не страшно */ }
      await this.scan();
      return { status: 'granted', count: this.entries.length };
    }

    forget() {
      this._revokeUrls();
      this.handle = null;
      this.handleName = '';
      this.entries = [];
      this.folders = [];
      try { filesystemStore.remove('gallery-root'); } catch (_) { /* нечего удалять */ }
    }

    _revokeUrls() {
      this._urls.forEach((url) => { try { URL.revokeObjectURL(url); } catch (_) { /* уже освобождена */ } });
      this._urls = [];
    }

    /** Обходим папку (не глубже двух уровней) и собираем изображения */
    async scan() {
      this._revokeUrls();
      this.entries = [];
      if (!this.handle || typeof this.handle.values !== 'function') return;

      const limit = 400;
      const folders = new Map();
      const collected = [];

      const readDirectory = async (directory, prefix, depth) => {
        let iterator = null;
        try {
          for await (const entry of directory.values()) {
            if (collected.length >= limit) return;
            if (entry.kind === 'directory') {
              if (depth >= 2) continue;
              await readDirectory(entry, prefix ? `${prefix}/${entry.name}` : entry.name, depth + 1);
              continue;
            }
            if (entry.kind !== 'file') continue;
            if (!isImageName(entry.name)) continue;
            let file = null;
            try { file = await entry.getFile(); } catch (_) { continue; }
            if (!file || (!IMAGE_MIME.test(file.type || '') && !isImageName(file.name))) continue;
            const folderKey = prefix || '';
            collected.push({
              id: `${folderKey}|${entry.name}|${file.size}|${file.lastModified}`,
              name: entry.name,
              file,
              folder: prefix || this.handleName || 'Устройство',
              folderKey,
              modified: Number(file.lastModified) || 0,
              url: '',
            });
          }
        } catch (_) { /* папку прочитать не удалось — пропускаем */ }
        return iterator;
      };

      await readDirectory(this.handle, '', 0);

      collected.sort((a, b) => b.modified - a.modified);
      this.entries = collected;

      for (const entry of this.entries) {
        const known = folders.get(entry.folderKey);
        if (known) { known.count += 1; continue; }
        folders.set(entry.folderKey, {
          key: entry.folderKey,
          name: entry.folder || 'Изображения',
          count: 1,
          thumbEntry: entry,
        });
      }
      this.folders = Array.from(folders.values()).sort((a, b) => b.count - a.count);
    }

    /** Ссылка для миниатюры (создаётся лениво и кешируется) */
    thumbUrl(entry) {
      if (!entry) return '';
      if (!entry.url) {
        try {
          entry.url = URL.createObjectURL(entry.file);
          this._urls.push(entry.url);
        } catch (_) { entry.url = ''; }
      }
      return entry.url;
    }
  }

  function readLocalCounter(key) {
    try { return global.localStorage.getItem(key); } catch (_) { return null; }
  }

  const deviceGallery = new DeviceGallery();

  /* ==========================================================================================
   * Просмотр и редактирование изображений.
   *  • режим «view» — обычный просмотр чужой публикации: приближение, поворот, сохранение;
   *  • режим «edit» — редактор публикации: поворот, отражение, кадрирование, сброс.
   * Кнопок «+» и «−» нет: масштаб меняется пальцами или колесом мыши.
   * ======================================================================================== */
  const VIEWER_MAX_SIDE = 1600;
  const CROP_MIN_SIZE = 0.08;

  class ImageViewer {
    constructor(cache) {
      this.cache = cache;
      this.overlay = null;
      this.session = null;
      this.mode = 'view';
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.viewRotation = 0;       // поворот только для просмотра (не сохраняется)
      this.transform = { rotation: 0, flipH: false, flipV: false, crop: null };
      this.pointers = new Map();
      this.dragOrigin = null;
      this.pinchOrigin = null;
      this.cropMode = false;
      this.cropRect = Object.assign({}, FULL_RECT);
      this._sourceCanvas = null;
      this._resultCanvas = null;
      this._resultBlob = null;
      this._previewUrl = '';
      this._backId = null;
      this._renderToken = 0;
      this._keyHandler = (event) => {
        if (!this.isOpen) return;
        if (event.key === 'Escape') { this.close(); return; }
        if (event.key === '+' || event.key === '=') this.zoomBy(0.25);
        if (event.key === '-') this.zoomBy(-0.25);
        if (event.key.toLowerCase() === 'r') this.rotate(90);
      };
      global.addEventListener('keydown', this._keyHandler);
    }

    get isOpen() {
      return Boolean(this.overlay) && this.overlay.classList.contains('viewer--open');
    }

    /* ---------------------------------- Разметка ---------------------------------- */

    _build() {
      if (this.overlay) return;

      this.overlay = document.createElement('div');
      this.overlay.className = 'viewer';
      this.overlay.setAttribute('role', 'dialog');
      this.overlay.setAttribute('aria-modal', 'true');

      this.backdrop = document.createElement('div');
      this.backdrop.className = 'viewer-backdrop';
      this.backdrop.addEventListener('click', () => {
        if (this.mode === 'view' && !this.cropMode) this.close();
      });

      this.shell = document.createElement('div');
      this.shell.className = 'viewer-shell';

      /* Верхняя панель */
      this.topBar = document.createElement('div');
      this.topBar.className = 'viewer-topbar';
      this.title = document.createElement('span');
      this.title.className = 'viewer-title';
      this.topBar.appendChild(this.title);
      this.topBar.appendChild(iconButton('close', 'Закрыть', () => this.close(), 'viewer-close'));

      /* Сцена */
      this.stage = document.createElement('div');
      this.stage.className = 'viewer-stage';
      this.imageWrap = document.createElement('div');
      this.imageWrap.className = 'viewer-image-wrap';
      this.image = document.createElement('img');
      this.image.className = 'viewer-image';
      this.image.alt = 'Изображение';
      this.image.draggable = false;
      this.imageWrap.appendChild(this.image);
      this.stage.appendChild(this.imageWrap);

      /* Рамка кадрирования */
      this.cropLayer = document.createElement('div');
      this.cropLayer.className = 'viewer-crop-layer';
      this.cropFrame = document.createElement('div');
      this.cropFrame.className = 'viewer-crop-frame';
      this.cropGrid = document.createElement('div');
      this.cropGrid.className = 'viewer-crop-grid';
      this.cropFrame.appendChild(this.cropGrid);
      ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach((handle) => {
        const dot = document.createElement('span');
        dot.className = `viewer-crop-handle viewer-crop-handle--${handle}`;
        dot.dataset.handle = handle;
        this.cropFrame.appendChild(dot);
      });
      this.cropLayer.appendChild(this.cropFrame);
      this.stage.appendChild(this.cropLayer);

      /* Нижняя панель инструментов */
      this.toolbar = document.createElement('div');
      this.toolbar.className = 'viewer-toolbar';

      this.shell.appendChild(this.topBar);
      this.shell.appendChild(this.stage);
      this.shell.appendChild(this.toolbar);
      this.overlay.appendChild(this.backdrop);
      this.overlay.appendChild(this.shell);
      document.body.appendChild(this.overlay);

      /* Масштаб и перетаскивание */
      this.stage.addEventListener('wheel', (event) => {
        if (!this.isOpen) return;
        event.preventDefault();
        this.zoomBy(event.deltaY < 0 ? 0.12 : -0.12);
      }, { passive: false });
      this.stage.addEventListener('pointerdown', (event) => this._pointerDown(event));
      this.stage.addEventListener('pointermove', (event) => this._pointerMove(event));
      this.stage.addEventListener('pointerup', (event) => this._pointerUp(event));
      this.stage.addEventListener('pointercancel', (event) => this._pointerUp(event));
      this.stage.addEventListener('dblclick', (event) => {
        event.preventDefault();
        this.toggleZoom();
      });
    }

    /* ---------------------------------- Открытие ---------------------------------- */

    /**
     * @param {string|Blob} source — ссылка или сам файл изображения
     * @param {object} options — { mode, transform, onApply, title, saveFolder, allowSave }
     */
    async open(source, options = {}) {
      if (!source) return;
      this._build();
      this._resetTransient();
      this._closing = false;

      const isBlob = typeof Blob !== 'undefined' && source instanceof Blob;
      this.session = {
        sourceUrl: isBlob ? '' : String(source),
        sourceFile: isBlob ? source : (options.file || null),
        mode: options.mode === 'edit' ? 'edit' : 'view',
        onApply: typeof options.onApply === 'function' ? options.onApply : null,
        title: String(options.title || (options.mode === 'edit' ? 'Редактирование' : 'Просмотр')),
        saveFolder: String(options.saveFolder || 'Материалы'),
        allowSave: options.allowSave !== false,
        fileName: String(options.fileName || ''),
      };
      this.mode = this.session.mode;
      this.transform = Object.assign(
        { rotation: 0, flipH: false, flipV: false, crop: null },
        options.transform || {}
      );
      if (this.transform.crop) this.transform.crop = clampRect(this.transform.crop, CROP_MIN_SIZE);
      this.title.textContent = this.session.title;
      this.overlay.classList.add('viewer--open');
      this.overlay.classList.toggle('viewer--edit', this.mode === 'edit');
      this.overlay.classList.toggle('viewer--view', this.mode !== 'edit');

      this._renderToolbar();
      this._setImage('');
      // ✓ Запись в историю — сразу: иначе быстрое закрытие оставит «Назад» без обработки
      this._backId = modalBack.push(() => this.close({ silent: true }));

      if (this.mode === 'edit') {
        await this._prepareEditing();
      } else {
        const url = this.session.sourceUrl
          ? (this.cache ? await this.cache.getDisplayUrl(this.session.sourceUrl) : this.session.sourceUrl)
          : '';
        // ✓ Если пока грузили ссылку пользователь закрыл просмотр — ничего не показываем
        if (this._closing) return;
        this._setImage(url || (this.session.sourceFile ? URL.createObjectURL(this.session.sourceFile) : ''));
        if (this.session.sourceUrl && this.cache) this.cache.cacheImage(this.session.sourceUrl);
      }
    }

    /** Показываем изображение и сбрасываем масштаб */
    _setImage(url) {
      if (this.image.src && this.image.src.startsWith('blob:')) {
        try { URL.revokeObjectURL(this.image.src); } catch (_) { /* уже освобождена */ }
      }
      this.image.src = url || '';
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.viewRotation = 0;
      this._applyTransform();
    }

    _resetTransient() {
      this.pointers.clear();
      this.dragOrigin = null;
      this.pinchOrigin = null;
      this.cropMode = false;
      this._sourceCanvas = null;
      this._resultCanvas = null;
      this._resultBlob = null;
      if (this.overlay) {
        this.overlay.classList.remove('viewer--cropping');
        this.cropLayer.classList.remove('viewer-crop-layer--active');
      }
    }

    /* ---------------------------------- Инструменты ---------------------------------- */

    _renderToolbar() {
      this.toolbar.innerHTML = '';
      const isEdit = this.mode === 'edit';

      if (this.cropMode) {
        this.toolbar.appendChild(iconButton('reset', 'Сбросить кадрирование', () => this._resetCropFrame(), 'viewer-tool--wide'));
        this.toolbar.appendChild(iconButton('close', 'Отменить', () => this._exitCrop(false)));
        this.toolbar.appendChild(iconButton('check', 'Применить', () => this._exitCrop(true), 'viewer-tool--accent'));
        return;
      }

      if (isEdit) {
        this.toolbar.appendChild(iconButton('rotateLeft', 'Повернуть влево', () => this.rotate(-90)));
        this.toolbar.appendChild(iconButton('rotateRight', 'Повернуть вправо', () => this.rotate(90)));
        this.toolbar.appendChild(iconButton('flipH', 'Отзеркалить по горизонтали', () => this.flip('h')));
        this.toolbar.appendChild(iconButton('flipV', 'Отзеркалить по вертикали', () => this.flip('v')));
        this.toolbar.appendChild(iconButton('crop', 'Кадрировать', () => this._enterCrop()));
        this.toolbar.appendChild(iconButton('reset', 'Сбросить изменения', () => this.resetTransform()));
        this.toolbar.appendChild(iconButton('check', 'Готово', () => this.close({ apply: true }), 'viewer-tool--accent'));
        return;
      }

      this.toolbar.appendChild(iconButton('rotateLeft', 'Повернуть влево', () => this.rotate(-90)));
      this.toolbar.appendChild(iconButton('rotateRight', 'Повернуть вправо', () => this.rotate(90)));
      if (this.session && this.session.allowSave) {
        this.toolbar.appendChild(iconButton('download', 'Сохранить на устройство', () => this.saveToDevice()));
      }
      this.toolbar.appendChild(iconButton('close', 'Закрыть', () => this.close()));
    }

    /* ---------------------------------- Поворот и отражение ---------------------------------- */

    rotate(delta) {
      if (this.mode === 'edit') {
        this.transform.rotation = (((this.transform.rotation + delta) % 360) + 360) % 360;
        // ✓ Поворот быстрый, но анимированный: картинка доворачивается на глазах
        this._animateTurn(delta);
        this._applyEditing();
      } else {
        this.viewRotation = (this.viewRotation + delta) % 360;
        this._applyTransform();
      }
    }

    /** Короткая доводка кадра: новое изображение уже повёрнуто, анимация — от старого угла к нулю */
    _animateTurn(delta) {
      const image = this.image;
      if (!image) return;
      try {
        image.style.transition = 'none';
        this.viewRotation = -delta;
        this._applyTransform();
        requestAnimationFrame(() => {
          if (!this.isOpen) return;
          image.style.transition = 'transform .22s cubic-bezier(.25,.8,.3,1)';
          this.viewRotation = 0;
          this._applyTransform();
          setTimeout(() => { image.style.transition = ''; }, 260);
        });
      } catch (_) { /* анимация не обязательна */ }
    }

    flip(axis) {
      if (this.mode !== 'edit') return;
      if (axis === 'h') this.transform.flipH = !this.transform.flipH;
      else this.transform.flipV = !this.transform.flipV;
      this._applyEditing();
    }

    resetTransform() {
      if (this.mode !== 'edit') {
        this.viewRotation = 0;
        this._applyTransform();
        return;
      }
      this.transform = { rotation: 0, flipH: false, flipV: false, crop: null };
      this._applyEditing();
    }

    /* ---------------------------------- Масштаб ---------------------------------- */

    zoomBy(delta) {
      this.scale = Math.min(8, Math.max(0.3, this.scale + delta));
      this._applyTransform();
    }

    toggleZoom() {
      if (this.scale > 1.05) {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
      } else {
        this.scale = 2.2;
      }
      this._applyTransform();
    }

    _applyTransform() {
      if (!this.image) return;
      const rotation = this.mode === 'edit' ? 0 : this.viewRotation;
      this.image.style.transform =
        `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale}) rotate(${rotation}deg)`;
    }

    _pointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const handle = event.target && event.target.dataset ? event.target.dataset.handle : null;
      if (handle) {
        this._startCropDrag(handle, event);
        return;
      }
      if (this.cropMode) return;
      try { this.stage.setPointerCapture(event.pointerId); } catch (_) { /* нет захвата */ }
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.pointers.size === 1) {
        this.dragOrigin = { x: event.clientX, y: event.clientY, offsetX: this.offsetX, offsetY: this.offsetY };
      } else if (this.pointers.size === 2) {
        this._startPinch();
      }
    }

    _startPinch() {
      const [a, b] = Array.from(this.pointers.values());
      this.pinchOrigin = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        scale: this.scale,
        turned: 0,
      };
    }

    _pointerMove(event) {
      if (!this.pointers.has(event.pointerId) && !this.cropDrag) return;
      if (this.cropDrag) { this._moveCropDrag(event); return; }
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (this.pointers.size >= 2 && this.pinchOrigin) {
        const [a, b] = Array.from(this.pointers.values());
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        this.scale = Math.min(8, Math.max(0.3, this.pinchOrigin.scale * distance / Math.max(1, this.pinchOrigin.distance)));

        // ✓ Поворот двумя пальцами: как только довернули на 20°, фиксируем четверть оборота
        let delta = angle - this.pinchOrigin.angle;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        if (Math.abs(delta) > 0.35) {
          this.rotate(delta > 0 ? 90 : -90);
          this.pinchOrigin.angle = angle;
        }
        this._applyTransform();
        return;
      }

      if (this.pointers.size === 1 && this.dragOrigin) {
        this.offsetX = this.dragOrigin.offsetX + event.clientX - this.dragOrigin.x;
        this.offsetY = this.dragOrigin.offsetY + event.clientY - this.dragOrigin.y;
        this._applyTransform();
      }
    }

    _pointerUp(event) {
      if (this.cropDrag) { this.cropDrag = null; return; }
      this.pointers.delete(event.pointerId);
      this.dragOrigin = null;
      if (this.pointers.size === 1) {
        const [point] = Array.from(this.pointers.values());
        this.dragOrigin = { x: point.x, y: point.y, offsetX: this.offsetX, offsetY: this.offsetY };
        this.pinchOrigin = null;
      } else if (this.pointers.size === 0) {
        this.pinchOrigin = null;
      }
    }

    /* ---------------------------------- Редактирование ---------------------------------- */

    async _prepareEditing() {
      const source = this.session.sourceFile || this.session.sourceUrl;
      if (!source) return;
      this._sourceCanvas = await this._loadCanvas(source);
      if (!this._sourceCanvas) {
        showMessage('Не удалось открыть изображение для редактирования', 'error');
        return;
      }
      await this._applyEditing();
    }

    async _loadCanvas(source) {
      let blob = null;
      if (typeof Blob !== 'undefined' && source instanceof Blob) blob = source;
      else if (source instanceof HTMLImageElement) blob = null;
      else {
        if (this.cache) {
          try { blob = await this.cache.getImageBlob(String(source)); } catch (_) { blob = null; }
        }
        if (!blob) {
          try {
            const response = await (global.fetchWithTimeout || global.fetch.bind(global))(String(source), { mode: 'cors', timeout: 15000 });
            if (response.ok) blob = await response.blob();
          } catch (_) { blob = null; }
        }
      }

      const image = await this._decode(blob, source);
      if (!image) return null;
      const width = image.naturalWidth || image.width || 0;
      const height = image.naturalHeight || image.height || 0;
      if (!width || !height) return null;
      const ratio = Math.min(1, VIEWER_MAX_SIDE / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (image.close && typeof image.close === 'function') { try { image.close(); } catch (_) { /* уже закрыт */ } }
      return canvas;
    }

    _decode(blob, source) {
      if (blob && typeof global.createImageBitmap === 'function') {
        return global.createImageBitmap(blob).catch(() => this._decodeByImage(blob, source));
      }
      return this._decodeByImage(blob, source);
    }

    _decodeByImage(blob, source) {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.crossOrigin = 'anonymous';
        image.src = blob ? URL.createObjectURL(blob) : String(source || '');
      });
    }

    /** Перерисовываем результат редактора по текущему преобразованию */
    async _applyEditing() {
      if (!this._sourceCanvas) return;
      const canvas = this._renderCanvas();
      if (!canvas) return;
      this._resultCanvas = canvas;
      const blob = await new Promise((resolve) => {
        if (typeof canvas.toBlob !== 'function') { resolve(null); return; }
        try { canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92); } catch (_) { resolve(null); }
      });
      if (!this.isOpen) return;
      this._resultBlob = blob;
      let url = '';
      if (blob) {
        try { url = URL.createObjectURL(blob); } catch (_) { url = ''; }
      }
      if (!url) {
        try { url = canvas.toDataURL('image/jpeg', 0.92); } catch (_) { url = ''; }
      }
      const token = ++this._renderToken;
      // ✓ Сначала дожидаемся загрузки нового кадра, только потом подменяем — без мигания
      await this._preload(url);
      if (!this.isOpen || token !== this._renderToken) return;
      if (this._previewUrl && this._previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(this._previewUrl); } catch (_) { /* уже освобождена */ }
      }
      this._previewUrl = url;
      this.image.src = url;
      this._applyTransform();
      if (this.cropMode) this._layoutCropFrame();
    }

    _preload(url) {
      if (!url) return Promise.resolve();
      return new Promise((resolve) => {
        const probe = new Image();
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        probe.onload = finish;
        probe.onerror = finish;
        setTimeout(finish, 900);
        probe.src = url;
      });
    }

    _renderCanvas() {
      const source = this._sourceCanvas;
      const crop = clampRect(this.transform.crop || FULL_RECT, CROP_MIN_SIZE);
      const sx = crop.x * source.width;
      const sy = crop.y * source.height;
      const sw = Math.max(1, crop.w * source.width);
      const sh = Math.max(1, crop.h * source.height);
      const quarter = ((this.transform.rotation % 360) + 360) % 360;
      const swap = quarter === 90 || quarter === 270;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(swap ? sh : sw));
      canvas.height = Math.max(1, Math.round(swap ? sw : sh));
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return null;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(quarter * Math.PI / 180);
      ctx.scale(this.transform.flipH ? -1 : 1, this.transform.flipV ? -1 : 1);
      ctx.drawImage(source, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
      return canvas;
    }

    get hasChanges() {
      const t = this.transform;
      return Boolean(t.rotation) || t.flipH || t.flipV || Boolean(t.crop);
    }

    /* ---------------------------------- Кадрирование ---------------------------------- */

    _enterCrop() {
      if (this.mode !== 'edit') return;
      this.cropMode = true;
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this._applyTransform();
      this.overlay.classList.add('viewer--cropping');
      this.cropLayer.classList.add('viewer-crop-layer--active');
      this._resetCropFrame();
      this._renderToolbar();
    }

    _resetCropFrame() {
      const current = this.transform.crop ? clampRect(this.transform.crop, CROP_MIN_SIZE) : FULL_RECT;
      this.cropRect = Object.assign({}, mapRect(current, this.transform.rotation, this.transform.flipH, this.transform.flipV, true));
      this._layoutCropFrame();
    }

    _layoutCropFrame() {
      const imageRect = this.image.getBoundingClientRect();
      const stageRect = this.stage.getBoundingClientRect();
      if (!imageRect.width || !imageRect.height) return;
      const left = imageRect.left - stageRect.left;
      const top = imageRect.top - stageRect.top;
      this.cropBase = { left, top, width: imageRect.width, height: imageRect.height };
      const rect = this.cropRect;
      this.cropFrame.style.left = `${left + rect.x * imageRect.width}px`;
      this.cropFrame.style.top = `${top + rect.y * imageRect.height}px`;
      this.cropFrame.style.width = `${rect.w * imageRect.width}px`;
      this.cropFrame.style.height = `${rect.h * imageRect.height}px`;
    }

    _startCropDrag(handle, event) {
      event.preventDefault();
      event.stopPropagation();
      this.cropDrag = {
        handle,
        startX: event.clientX,
        startY: event.clientY,
        rect: Object.assign({}, this.cropRect),
      };
      try { this.stage.setPointerCapture(event.pointerId); } catch (_) { /* нет захвата */ }
    }

    _moveCropDrag(event) {
      const drag = this.cropDrag;
      if (!drag || !this.cropBase) return;
      const dx = (event.clientX - drag.startX) / this.cropBase.width;
      const dy = (event.clientY - drag.startY) / this.cropBase.height;
      let { x, y, w, h } = drag.rect;
      const right = x + w;
      const bottom = y + h;

      if (drag.handle.includes('w')) { x = Math.min(right - CROP_MIN_SIZE, x + dx); }
      if (drag.handle.includes('e')) { w = Math.max(CROP_MIN_SIZE, w + dx); }
      if (drag.handle.includes('n')) { y = Math.min(bottom - CROP_MIN_SIZE, y + dy); }
      if (drag.handle.includes('s')) { h = Math.max(CROP_MIN_SIZE, h + dy); }

      let rect = { x, y, w, h };
      // ✓ За пределы изображения выйти нельзя
      if (rect.x < 0) { rect.w += rect.x; rect.x = 0; }
      if (rect.y < 0) { rect.h += rect.y; rect.y = 0; }
      if (rect.x + rect.w > 1) rect.w = 1 - rect.x;
      if (rect.y + rect.h > 1) rect.h = 1 - rect.y;
      rect.w = Math.max(CROP_MIN_SIZE, rect.w);
      rect.h = Math.max(CROP_MIN_SIZE, rect.h);
      this.cropRect = clampRect(rect, CROP_MIN_SIZE);
      this._layoutCropFrame();
    }

    _exitCrop(apply) {
      if (apply) {
        const sourceRect = mapRect(
          this.cropRect,
          this.transform.rotation,
          this.transform.flipH,
          this.transform.flipV,
          false
        );
        const full = sourceRect.w >= 0.999 && sourceRect.h >= 0.999;
        this.transform.crop = full ? null : clampRect(sourceRect, CROP_MIN_SIZE);
      }
      this.cropMode = false;
      this.cropDrag = null;
      this.overlay.classList.remove('viewer--cropping');
      this.cropLayer.classList.remove('viewer-crop-layer--active');
      this._renderToolbar();
      if (apply) this._applyEditing();
      else this._resetCropFrame();
    }

    /* ---------------------------------- Сохранение на устройство ---------------------------------- */

    async currentBlob() {
      if (this.mode === 'edit') {
        if (this._resultBlob) return this._resultBlob;
        const canvas = this._resultCanvas || (this._sourceCanvas ? this._renderCanvas() : null);
        if (!canvas || typeof canvas.toBlob !== 'function') return null;
        return new Promise((resolve) => {
          if (typeof canvas.toBlob !== 'function') { resolve(null); return; }
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
        });
      }

      const source = this.session ? (this.session.sourceFile || this.session.sourceUrl) : '';
      if (!source) return null;
      if (typeof Blob !== 'undefined' && source instanceof Blob) return source;
      if (this.cache) {
        try {
          const cached = await this.cache.getImageBlob(String(source));
          if (cached) return cached;
        } catch (_) { /* кэш недоступен */ }
      }
      try {
        const response = await (global.fetchWithTimeout || global.fetch.bind(global))(String(source), { mode: 'cors', timeout: 15000 });
        if (response.ok) return await response.blob();
      } catch (_) { /* сеть недоступна */ }
      return null;
    }

    /** Сохраняем в «Материалы» или «Домашние задания» — как просили, а не в папку со странным именем */
    async saveToDevice() {
      const blob = await this.currentBlob();
      if (!blob) { showMessage('Не удалось подготовить изображение для сохранения', 'error'); return; }

      const folder = this.session ? this.session.saveFolder : 'Материалы';
      const fileName = this._saveFileName(folder);
      const saved = await saveBlobToDevice(blob, fileName, folder);
      if (saved) showMessage('Изображение сохранено на устройство', 'success');
      else if (saved !== null) showMessage('Сохранение отменено', 'info');
    }

    _saveFileName(folder) {
      const now = new Date();
      const pad = (value) => String(value).padStart(2, '0');
      const stamp = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const base = String(folder || 'Материалы').replace(/[\\/:*?"<>|]/g, ' ').trim();
      return `${base}_${stamp}.jpg`;
    }

    /* ---------------------------------- Закрытие ---------------------------------- */

    close(options = {}) {
      const session = this.session;
      if (!this.isOpen) return;
      this._closing = true;
      const apply = options.apply === true && this.mode === 'edit' && this.hasChanges;

      if (this._backId !== null) { modalBack.remove(this._backId); this._backId = null; }
      this.overlay.classList.remove('viewer--open');
      this.overlay.classList.remove('viewer--cropping');
      this.cropLayer.classList.remove('viewer-crop-layer--active');
      this.cropMode = false;
      this.cropDrag = null;
      this.pointers.clear();

      if (options.silent !== true && session && typeof session.onApply === 'function' && apply) {
        const payload = {
          transform: Object.assign({}, this.transform),
          blob: this._resultBlob,
        };
        Promise.resolve(session.onApply(payload)).catch((error) => {
          console.warn('Не удалось применить изменения изображения:', error);
        });
      }

      const image = this.image;
      if (image && image.src && image.src.startsWith('blob:')) {
        setTimeout(() => { try { URL.revokeObjectURL(image.src); } catch (_) { /* уже освобождена */ } }, 1000);
      }
      this.session = null;
    }
  }

  /**
   * Сохранение файла: сначала пробуем запомненную папку загрузок, затем системный
   * диалог сохранения, затем обычное скачивание по ссылке.
   * @returns {boolean|null} true — сохранено, false — не вышло, null — отменил пользователь
   */
  async function saveBlobToDevice(blob, fileName, folderName) {
    const storeKey = `downloads-${folderName}`;

    // 1) Папка, в которую сохраняли в прошлый раз (дескриптор хранится в IndexedDB)
    const stored = await filesystemStore.get(storeKey);
    if (stored && typeof stored.getFileHandle === 'function') {
      const state = await ensureDirectoryPermission(stored, 'readwrite');
      if (state === 'granted') {
        try {
          const handle = await stored.getFileHandle(fileName, { create: true });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return true;
        } catch (error) {
          if (error && error.name === 'AbortError') return null;
          // папка недоступна — пробуем другие способы ниже
        }
      }
    }

    // 2) Системный диалог сохранения: запоминаем выбранную папку
    if (typeof global.showSaveFilePicker === 'function') {
      try {
        const handle = await global.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Изображение JPEG', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        try {
          if (typeof handle.getParent === 'function') {
            const parent = await handle.getParent();
            if (parent) await filesystemStore.set(storeKey, parent);
          }
        } catch (_) { /* запомнить папку не вышло — не страшно */ }
        return true;
      } catch (error) {
        if (error && error.name === 'AbortError') return null;
      }
    }

    try {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 30000);
      return true;
    } catch (_) {
      showMessage('Не удалось сохранить изображение', 'error');
      return false;
    }
  }

  /* ==========================================================================================
   * Галерея устройства — нижняя шторка в стиле Telegram.
   *  • если доступ к файлам выдан — показываем все изображения и папки устройства;
   *  • если в доступе отказали — подсказка по центру экрана с кнопками «Назад» и «Продолжить»;
   *  • выбирать можно до 10 файлов: тап по кружку в углу или долгое нажатие,
   *    короткий тап по фотографии открывает предосмотр.
   * ======================================================================================== */
  class ImagePicker {
    constructor(cache) {
      this.cache = cache;
      this.sheet = null;
      this.options = {};
      this.selected = [];
      this.entries = [];
      this.activeFolder = '';
      this._backId = null;
      this._drag = null;
      this._observer = null;
      this._longPress = null;
    }

    get isOpen() {
      return Boolean(this.sheet) && this.sheet.classList.contains('gallery--open');
    }

    /* ---------------------------------- Разметка ---------------------------------- */

    _build() {
      if (this.sheet) return;

      this.overlay = document.createElement('div');
      this.overlay.className = 'gallery-overlay';

      this.sheet = document.createElement('div');
      this.sheet.className = 'gallery';
      this.sheet.setAttribute('role', 'dialog');
      this.sheet.setAttribute('aria-modal', 'true');
      this.sheet.setAttribute('aria-label', 'Выбор изображений');

      /* Бегунок: за него шторку тянут вниз, чтобы закрыть */
      this.handle = document.createElement('div');
      this.handle.className = 'gallery-handle';
      this.handle.innerHTML = '<span></span>';

      this.head = document.createElement('div');
      this.head.className = 'gallery-head';

      this.folderButton = document.createElement('button');
      this.folderButton.type = 'button';
      this.folderButton.className = 'gallery-folder-button';
      this.folderButton.innerHTML = `${ICONS.folder}<span class="gallery-folder-name">Все изображения</span><span class="gallery-folder-caret">▾</span>`;
      this.folderButton.addEventListener('click', () => this._toggleFolderMenu());
      this.head.appendChild(this.folderButton);

      this.counter = document.createElement('span');
      this.counter.className = 'gallery-counter';
      this.head.appendChild(this.counter);

      this.closeButton = document.createElement('button');
      this.closeButton.type = 'button';
      this.closeButton.className = 'gallery-close';
      this.closeButton.innerHTML = ICONS.close;
      this.closeButton.title = 'Закрыть';
      this.closeButton.setAttribute('aria-label', 'Закрыть галерею');
      this.closeButton.addEventListener('click', () => this.close());
      this.head.appendChild(this.closeButton);

      this.folderMenu = document.createElement('div');
      this.folderMenu.className = 'gallery-folder-menu';

      this.body = document.createElement('div');
      this.body.className = 'gallery-body';

      this.foot = document.createElement('div');
      this.foot.className = 'gallery-foot';
      this.hint = document.createElement('span');
      this.hint.className = 'gallery-hint';
      this.foot.appendChild(this.hint);
      this.confirmButton = document.createElement('button');
      this.confirmButton.type = 'button';
      this.confirmButton.className = 'gallery-confirm';
      this.confirmButton.innerHTML = ICONS.check;
      this.confirmButton.title = 'Готово';
      this.confirmButton.setAttribute('aria-label', 'Подтвердить выбор');
      this.confirmButton.addEventListener('click', () => this._confirm());
      this.foot.appendChild(this.confirmButton);

      this.sheet.appendChild(this.handle);
      this.sheet.appendChild(this.head);
      this.sheet.appendChild(this.folderMenu);
      this.sheet.appendChild(this.body);
      this.sheet.appendChild(this.foot);
      this.overlay.appendChild(this.sheet);
      document.body.appendChild(this.overlay);

      this.overlay.addEventListener('click', (event) => {
        if (event.target === this.overlay) this.close();
      });

      /* Свайп вниз за бегунок или за шапку */
      const startDrag = (event) => {
        if (this.body.scrollTop > 0 && event.target.closest && event.target.closest('.gallery-body')) return;
        this._drag = { y: event.clientY, startY: event.clientY, moved: 0, time: Date.now() };
        this.sheet.classList.add('gallery--dragging');
        try { this.sheet.setPointerCapture(event.pointerId); } catch (_) { /* нет захвата */ }
      };
      const moveDrag = (event) => {
        if (!this._drag) return;
        const delta = Math.max(0, event.clientY - this._drag.y);
        this._drag.moved = event.clientY - this._drag.startY;
        this.sheet.style.transform = `translateY(${delta}px)`;
      };
      const endDrag = () => {
        if (!this._drag) return;
        const { moved } = this._drag;
        const fast = Date.now() - this._drag.time < 260 && moved > 60;
        this._drag = null;
        this.sheet.classList.remove('gallery--dragging');
        this.sheet.style.transform = '';
        if (moved > 140 || fast) this.close();
      };
      this.handle.addEventListener('pointerdown', startDrag);
      this.head.addEventListener('pointerdown', startDrag);
      this.sheet.addEventListener('pointermove', moveDrag);
      this.sheet.addEventListener('pointerup', endDrag);
      this.sheet.addEventListener('pointercancel', endDrag);
    }

    /* ---------------------------------- Открытие ---------------------------------- */

    /**
     * @param {object} options — { max, onConfirm(files), onUrls(urls), title }
     */
    async open(options = {}) {
      this._build();
      this.options = options;
      this.selected = [];
      this.max = Math.max(1, Number(options.max) || 10);
      this.overlay.classList.add('gallery-overlay--open');
      this.sheet.classList.add('gallery--open');
      this._backId = modalBack.push(() => this.close({ silent: true }));

      // ✓ По нажатию сразу просим систему показать файлы устройства — без лишнего шага
      if (deviceGallery.hasAccess) {
        this._renderGallery();
        return;
      }

      const restored = await deviceGallery.restore();
      if (restored && deviceGallery.entries.length > 0) {
        this._renderGallery();
        return;
      }

      if (deviceGallery.supported) {
        const result = await deviceGallery.requestDirectory();
        if (result.status === 'granted') {
          this._renderGallery();
          return;
        }
        if (result.status === 'cancelled' || result.status === 'denied') {
          this._renderStart();
          this._showAccessBanner();
          return;
        }
      }

      // File System Access API недоступен (iOS, WebView старых версий):
      // просим саму систему открыть галерею телефона
      this._renderStart();
      this._pickByInput();
    }

    close(options = {}) {
      if (!this.isOpen) return;
      if (this._backId !== null) { modalBack.remove(this._backId); this._backId = null; }
      this.sheet.classList.remove('gallery--open');
      this.overlay.classList.remove('gallery-overlay--open');
      this.sheet.style.transform = '';
      if (this._observer) { try { this._observer.disconnect(); } catch (_) { /* уже отключён */ } this._observer = null; }
      if (options.silent !== true && typeof this.options.onCancel === 'function') this.options.onCancel();
    }

    /* ---------------------------------- Стартовый экран (доступа ещё нет) ---------------------------------- */

    _renderStart() {
      this.folderButton.hidden = true;
      this.body.innerHTML = '';

      const start = document.createElement('div');
      start.className = 'gallery-start';

      const title = document.createElement('p');
      title.className = 'gallery-start-title';
      title.textContent = 'Откройте изображения на устройстве';
      start.appendChild(title);

      const text = document.createElement('p');
      text.className = 'gallery-start-text';
      text.textContent = 'Разрешите доступ к файлам — тогда галерея откроется со всеми фотографиями и папками, как в Телеграме.';
      start.appendChild(text);

      if (deviceGallery.supported) {
        const folderButton = document.createElement('button');
        folderButton.type = 'button';
        folderButton.className = 'gallery-start-button gallery-start-button--primary';
        folderButton.innerHTML = `${ICONS.folder}<span>Открыть галерею устройства</span>`;
        folderButton.addEventListener('click', async () => {
          folderButton.disabled = true;
          const result = await deviceGallery.requestDirectory();
          folderButton.disabled = false;
          if (result.status === 'granted') {
            if (result.count > 0) { this._renderGallery(); return; }
            showMessage('В этой папке нет изображений — выберите другую', 'info');
            this._renderGallery();
            return;
          }
          if (result.status === 'cancelled' || result.status === 'denied') { this._showAccessBanner(); return; }
          this._renderFileFallback();
        });
        start.appendChild(folderButton);
      }

      const pickButton = document.createElement('button');
      pickButton.type = 'button';
      pickButton.className = 'gallery-start-button';
      pickButton.innerHTML = `${ICONS.image}<span>Выбрать изображения</span>`;
      pickButton.addEventListener('click', () => this._pickByInput());
      start.appendChild(pickButton);

      this.body.appendChild(start);
      this._updateFoot();
    }

    /** Резервный путь: системный диалог выбора файлов (работает везде, в том числе в iOS/Android WebView) */
    _pickByInput() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.className = 'gallery-hidden-input';
      let settled = false;
      const finish = (files) => {
        if (settled) return;
        settled = true;
        input.remove();
        if (files && files.length) {
          deviceGallery.resetRefusals();
          this.close({ silent: true });
          if (typeof this.options.onConfirm === 'function') this.options.onConfirm(Array.from(files));
          return;
        }
        deviceGallery.noteRefusal();
        this._showAccessBanner();
      };
      input.addEventListener('change', () => finish(input.files));
      input.addEventListener('cancel', () => finish(null));
      document.body.appendChild(input);
      input.click();
    }

    _renderFileFallback() {
      // File System Access API недоступен — остаёмся на системном выборе файлов
      deviceGallery.supportedValue = false;
      this._renderStart();
    }

    /* ---------------------------------- Подсказка про доступ к файлам ---------------------------------- */

    _showAccessBanner() {
      if (this.banner) return;

      const layer = document.createElement('div');
      layer.className = 'gallery-access';

      const card = document.createElement('div');
      card.className = 'gallery-access-card';

      const text = document.createElement('p');
      text.className = 'gallery-access-text';
      text.textContent = 'Без доступа к файлам галерея не откроется. Разрешите доступ в настройках приложения — так выбирать фотографии гораздо удобнее.';
      card.appendChild(text);

      const row = document.createElement('div');
      row.className = 'gallery-access-row';

      const backButton = document.createElement('button');
      backButton.type = 'button';
      backButton.className = 'gallery-access-button';
      backButton.textContent = 'Назад';
      backButton.addEventListener('click', () => this._hideAccessBanner());

      const continueButton = document.createElement('button');
      continueButton.type = 'button';
      continueButton.className = 'gallery-access-button gallery-access-button--primary';
      continueButton.textContent = 'Продолжить';
      continueButton.addEventListener('click', () => {
        this._hideAccessBanner();
        this._openClassicModal();
      });

      row.appendChild(backButton);
      row.appendChild(continueButton);
      card.appendChild(row);
      layer.appendChild(card);
      document.body.appendChild(layer);
      requestAnimationFrame(() => layer.classList.add('gallery-access--open'));

      this.banner = layer;
      this._bannerBackId = modalBack.push(() => this._hideAccessBanner());
    }

    _hideAccessBanner() {
      if (!this.banner) return;
      if (this._bannerBackId !== null) { modalBack.remove(this._bannerBackId); this._bannerBackId = null; }
      const layer = this.banner;
      this.banner = null;
      layer.classList.remove('gallery-access--open');
      setTimeout(() => layer.remove(), 220);
    }

    /* ---------------------------------- Обычный модал выбора файлов (как было) ---------------------------------- */

    _openClassicModal() {
      if (this.classic) return;
      const layer = document.createElement('div');
      layer.className = 'gallery-classic';

      const sheet = document.createElement('div');
      sheet.className = 'gallery-classic-sheet';

      const head = document.createElement('div');
      head.className = 'gallery-classic-head';
      const title = document.createElement('p');
      title.textContent = 'Выбрать изображения';
      head.appendChild(title);
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'gallery-close';
      closeButton.innerHTML = ICONS.close;
      closeButton.title = 'Закрыть';
      closeButton.addEventListener('click', () => this._closeClassicModal());
      head.appendChild(closeButton);
      sheet.appendChild(head);

      const dropzone = document.createElement('div');
      dropzone.className = 'gallery-classic-dropzone';
      dropzone.innerHTML = `
        <span class="gallery-classic-icon">🖼️</span>
        <span class="gallery-classic-text"><b>Выберите изображения</b>, перетащите их сюда или вставьте из буфера (Ctrl+V)</span>
        <span class="gallery-classic-hint">JPG, PNG, GIF, WEBP · до 10 МБ · не более ${this.max} изображений</span>`;

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.className = 'gallery-hidden-input';
      input.addEventListener('change', () => {
        const files = Array.from(input.files || []);
        input.value = '';
        if (files.length) {
          this._closeClassicModal();
          this.close({ silent: true });
          if (typeof this.options.onConfirm === 'function') this.options.onConfirm(files);
        }
      });

      const pickButton = document.createElement('button');
      pickButton.type = 'button';
      pickButton.className = 'gallery-start-button gallery-start-button--primary';
      pickButton.textContent = 'Выбрать файлы';
      pickButton.addEventListener('click', () => input.click());
      dropzone.appendChild(pickButton);
      sheet.appendChild(dropzone);
      sheet.appendChild(input);

      dropzone.addEventListener('click', () => input.click());
      dropzone.addEventListener('dragover', (event) => { event.preventDefault(); dropzone.classList.add('gallery-classic-dropzone--over'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('gallery-classic-dropzone--over'));
      dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropzone.classList.remove('gallery-classic-dropzone--over');
        const files = event.dataTransfer && event.dataTransfer.files ? Array.from(event.dataTransfer.files) : [];
        if (files.length) {
          this._closeClassicModal();
          this.close({ silent: true });
          if (typeof this.options.onConfirm === 'function') this.options.onConfirm(files);
        }
      });

      if (typeof this.options.onUrls === 'function') {
        const manual = document.createElement('div');
        manual.className = 'gallery-classic-manual';
        const manualInput = document.createElement('input');
        manualInput.type = 'url';
        manualInput.placeholder = 'https://i.postimg.cc/xxxxxx/image.png';
        const manualButton = document.createElement('button');
        manualButton.type = 'button';
        manualButton.textContent = 'Добавить ссылку';
        manualButton.addEventListener('click', () => {
          const url = manualInput.value.trim();
          if (!url) return;
          if (!/^https?:\/\//i.test(url)) { showMessage('Ссылка должна начинаться с http:// или https://', 'error'); return; }
          this.options.onUrls([url]);
          manualInput.value = '';
          this._closeClassicModal();
          this.close({ silent: true });
        });
        manual.appendChild(manualInput);
        manual.appendChild(manualButton);
        sheet.appendChild(manual);
      }

      layer.appendChild(sheet);
      document.body.appendChild(layer);
      requestAnimationFrame(() => layer.classList.add('gallery-classic--open'));
      layer.addEventListener('click', (event) => { if (event.target === layer) this._closeClassicModal(); });

      this.classic = layer;
      this._classicBackId = modalBack.push(() => this._closeClassicModal());
    }

    _closeClassicModal() {
      if (!this.classic) return;
      if (this._classicBackId !== null) { modalBack.remove(this._classicBackId); this._classicBackId = null; }
      const layer = this.classic;
      this.classic = null;
      layer.classList.remove('gallery-classic--open');
      setTimeout(() => layer.remove(), 220);
    }

    /* ---------------------------------- Галерея устройства ---------------------------------- */

    _renderGallery() {
      this.folderButton.hidden = false;
      this.activeFolder = '';
      this.body.innerHTML = '';

      if (deviceGallery.entries.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'gallery-empty';
        empty.textContent = 'Изображения не найдены. Выберите другую папку или отдельные файлы.';
        this.body.appendChild(empty);
      } else {
        this.grid = document.createElement('div');
        this.grid.className = 'gallery-grid';
        this.body.appendChild(this.grid);
        this._renderGrid();
      }

      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'gallery-more';
      more.innerHTML = `${ICONS.image}<span>Выбрать отдельные файлы</span>`;
      more.addEventListener('click', () => this._pickByInput());
      this.body.appendChild(more);

      this._updateFoot();
    }

    get visibleEntries() {
      if (!this.activeFolder) return deviceGallery.entries;
      return deviceGallery.entries.filter((entry) => entry.folderKey === this.activeFolder);
    }

    _renderGrid() {
      if (!this.grid) return;
      this.grid.innerHTML = '';
      if (this._observer) { try { this._observer.disconnect(); } catch (_) { /* уже отключён */ } }
      const entries = this.visibleEntries;
      const lazy = typeof IntersectionObserver === 'function';

      this._observer = lazy ? new IntersectionObserver((records) => {
        records.forEach((record) => {
          if (!record.isIntersecting) return;
          const cell = record.target;
          const entry = cell.__entry;
          if (entry && !cell.dataset.loaded) {
            cell.dataset.loaded = '1';
            const image = cell.querySelector('img');
            if (image) image.src = deviceGallery.thumbUrl(entry);
          }
        });
      }, { root: this.body, rootMargin: '250px 0px' }) : null;

      entries.forEach((entry) => {
        const cell = document.createElement('div');
        cell.className = 'gallery-cell';
        cell.__entry = entry;

        const image = document.createElement('img');
        image.alt = entry.name;
        image.loading = 'lazy';
        image.draggable = false;
        if (!lazy) image.src = deviceGallery.thumbUrl(entry);
        cell.appendChild(image);

        const check = document.createElement('button');
        check.type = 'button';
        check.className = 'gallery-cell-check';
        check.setAttribute('aria-label', 'Выбрать изображение');
        check.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this._toggle(entry);
        });
        cell.appendChild(check);

        // ✓ Короткий тап — предосмотр, долгое нажатие — выбор
        image.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (this._longPressed) { this._longPressed = false; return; }
          this._openPreview(entry);
        });
        image.addEventListener('pointerdown', () => {
          this._longPressed = false;
          clearTimeout(this._longPress);
          this._longPress = setTimeout(() => { this._longPressed = true; this._toggle(entry); }, 480);
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => {
          image.addEventListener(type, () => clearTimeout(this._longPress));
        });

        this.grid.appendChild(cell);
        if (this._observer) this._observer.observe(cell);
        this._paintCell(cell, entry);
      });
    }

    _cellFor(entry) {
      if (!this.grid) return null;
      return Array.from(this.grid.children).find((cell) => cell.__entry === entry) || null;
    }

    _paintCell(cell, entry) {
      if (!cell) return;
      const index = this.selected.indexOf(entry);
      cell.classList.toggle('gallery-cell--selected', index !== -1);
      const check = cell.querySelector('.gallery-cell-check');
      if (check) check.textContent = index === -1 ? '' : String(index + 1);
    }

    /**
     * @param {boolean} forceDown — true, если нужно запустить касание (используется в предпросмотре)
     */
    _toggle(entry) {
      const index = this.selected.indexOf(entry);
      if (index !== -1) {
        this.selected.splice(index, 1);
      } else {
        if (this.selected.length >= this.max) {
          showMessage(`Можно выбрать не более ${this.max} изображений`, 'info');
          return;
        }
        this.selected.push(entry);
      }
      this.selected.forEach((item) => this._paintCell(this._cellFor(item), item));
      if (index !== -1) this._paintCell(this._cellFor(entry), entry);
      this._updateFoot();
    }

    _openPreview(entry) {
      const viewer = global.imageViewer;
      if (!viewer) return;
      const url = deviceGallery.thumbUrl(entry);
      viewer.open(url, {
        mode: 'view',
        file: entry.file,
        title: entry.name,
        allowSave: false,
      });
    }

    /* ---------------------------------- Меню папок ---------------------------------- */

    _toggleFolderMenu() {
      if (this.folderMenu.classList.contains('gallery-folder-menu--open')) {
        this.folderMenu.classList.remove('gallery-folder-menu--open');
        return;
      }
      this.folderMenu.innerHTML = '';

      const makeRow = (label, count, thumbUrl, onClick, active) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'gallery-folder-row' + (active ? ' gallery-folder-row--active' : '');
        const thumb = document.createElement('span');
        thumb.className = 'gallery-folder-thumb';
        if (thumbUrl) thumb.style.backgroundImage = `url("${thumbUrl}")`;
        else thumb.innerHTML = ICONS.folder;
        const text = document.createElement('span');
        text.className = 'gallery-folder-label';
        text.textContent = label;
        const badge = document.createElement('span');
        badge.className = 'gallery-folder-count';
        badge.textContent = String(count);
        row.appendChild(thumb);
        row.appendChild(text);
        row.appendChild(badge);
        row.addEventListener('click', () => {
          this.folderMenu.classList.remove('gallery-folder-menu--open');
          onClick();
        });
        return row;
      };

      // ✓ Общий список: миниатюра — самое свежее изображение устройства
      const newest = deviceGallery.entries[0];
      this.folderMenu.appendChild(makeRow(
        'Все изображения',
        deviceGallery.entries.length,
        newest ? deviceGallery.thumbUrl(newest) : '',
        () => this._selectFolder(''),
        this.activeFolder === ''
      ));

      deviceGallery.folders.forEach((folder) => {
        this.folderMenu.appendChild(makeRow(
          folder.name,
          folder.count,
          deviceGallery.thumbUrl(folder.thumbEntry),
          () => this._selectFolder(folder.key),
          this.activeFolder === folder.key
        ));
      });

      const other = document.createElement('button');
      other.type = 'button';
      other.className = 'gallery-folder-row gallery-folder-row--action';
      other.textContent = 'Выбрать другую папку…';
      other.addEventListener('click', async () => {
        this.folderMenu.classList.remove('gallery-folder-menu--open');
        const result = await deviceGallery.requestDirectory();
        if (result.status === 'granted') this._renderGallery();
        else if (result.status === 'cancelled' || result.status === 'denied') this._showAccessBanner();
      });
      this.folderMenu.appendChild(other);

      this.folderMenu.classList.add('gallery-folder-menu--open');
    }

    _selectFolder(key) {
      this.activeFolder = key;
      const label = key === ''
        ? 'Все изображения'
        : (deviceGallery.folders.find((folder) => folder.key === key) || {}).name || 'Папка';
      const nameNode = this.folderButton.querySelector('.gallery-folder-name');
      if (nameNode) nameNode.textContent = label;
      this._renderGrid();
      this.body.scrollTop = 0;
    }

    /* ---------------------------------- Подвал и подтверждение ---------------------------------- */

    _updateFoot() {
      const count = this.selected.length;
      this.counter.textContent = `${count}/${this.max}`;
      this.confirmButton.classList.toggle('gallery-confirm--active', count > 0);
      this.hint.textContent = count > 0
        ? `Выбрано изображений: ${count}`
        : 'Тап по кружку — выбрать, тап по фото — посмотреть';
    }

    _confirm() {
      if (this.selected.length === 0) {
        showMessage('Выберите хотя бы одно изображение', 'info');
        return;
      }
      const files = this.selected.map((entry) => entry.file);
      this.close({ silent: true });
      if (typeof this.options.onConfirm === 'function') this.options.onConfirm(files);
    }
  }

  // Всплывающее окно Postimages больше не используется: весь интерфейс загрузки
  // встроен прямо в страницу публикации, а запросы уходят через fetch.

  function findImagesLogicScriptUrl() {
    if (document.currentScript && document.currentScript.src) return document.currentScript.src;
    const scriptTag = Array.from(document.scripts || []).find((script) => /(?:^|\/)images-logic\.js(?:\?|$)/i.test(script.src || ''));
    return scriptTag && scriptTag.src ? scriptTag.src : null;
  }

  function registerImageServiceWorker() {
    if (!global.navigator || !global.navigator.serviceWorker || !global.isSecureContext) {
      global.imageServiceWorkerReady = Promise.resolve(null);
      return;
    }
    // ✓ Service worker работает только на http/https. При открытии файла напрямую
    //   (file://) браузер отказывается регистрировать его — раньше это сыпало ошибкой
    //   в консоль при каждом запуске. Молча пропускаем.
    const pageProtocol = global.location && global.location.protocol ? global.location.protocol : '';
    if (pageProtocol && !/^https?:$/.test(pageProtocol)) {
      global.imageServiceWorkerReady = Promise.resolve(null);
      return;
    }
    try {
      const scriptUrl = findImagesLogicScriptUrl();
      const workerUrl = scriptUrl
        ? new URL('../service-worker.js', scriptUrl).href
        : new URL('./service-worker.js', global.location.href).href;
      global.imageServiceWorkerUrl = workerUrl;
      global.imageServiceWorkerReady = global.navigator.serviceWorker.register(workerUrl)
        .then((registration) => {
          console.info('Офлайн-кэш изображений активирован:', workerUrl);
          return registration;
        })
        .catch((error) => {
          console.warn(`Не удалось зарегистрировать service worker по адресу ${workerUrl}:`, error);
          return null;
        });
    } catch (error) {
      global.imageServiceWorkerReady = Promise.resolve(null);
      console.warn('Не удалось определить путь к service worker:', error);
    }
  }

  installDatabaseExtensions();

  // Загрузка изображений идёт напрямую через fetch к Postimages, поэтому всплывающий
  // загрузчик (libs/postimages/phpbb3-de-hotlink.js) больше не используется.
  global.postimagesReady = Promise.resolve(false);
  global.imagesLogicStatus = () => ({
    uploader: 'fetch (Postimages JSON API)',
    uploadHost: PostimagesUploader.HOST,
    serviceWorkerSupported: Boolean(global.navigator && global.navigator.serviceWorker),
    secureContext: Boolean(global.isSecureContext),
    serviceWorkerUrl: global.imageServiceWorkerUrl || null,
  });

  const contentCache = new OfflineContentCache();
  const imageViewer = new ImageViewer(contentCache);

  const imagePicker = new ImagePicker(contentCache);

  global.OfflineContentCache = OfflineContentCache;
  global.PostimagesUploader = PostimagesUploader;
  global.ImageViewer = ImageViewer;
  global.ImagePicker = ImagePicker;
  global.ModalBack = modalBack;
  global.deviceGallery = deviceGallery;
  global.contentCache = contentCache;
  global.imageViewer = imageViewer;
  global.imagePicker = imagePicker;
  global.openImageViewer = (url, options) => imageViewer.open(url, options);
  global.openImagePicker = (options) => imagePicker.open(options);
  global.extractPostimagesUrls = extractImageUrls;
  global.teacherNameKey = teacherNameKey;
  global.isPostForTeacher = isPostForTeacher;

  registerImageServiceWorker();
})(window);
