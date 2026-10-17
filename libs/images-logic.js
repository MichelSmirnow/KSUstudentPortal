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
        const response = await fetch(url, { method: 'GET', mode: 'cors', cache: 'force-cache' });
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

      // Зона загрузки: выбор файлов, перетаскивание и вставка из буфера обмена
      this.dropzone = document.createElement('div');
      this.dropzone.classList.add('postimages-dropzone');
      this.dropzone.tabIndex = 0;
      this.dropzone.innerHTML = `
        <span class="postimages-dropzone-icon">🖼️</span>
        <span class="postimages-dropzone-text"><b>Выберите изображения</b>, перетащите их сюда или вставьте из буфера (Ctrl+V)</span>
        <span class="postimages-dropzone-hint">JPG, PNG, GIF, WEBP · до 10 МБ · не более ${this.maxImages} изображений</span>`;

      const pickButton = document.createElement('button');
      pickButton.type = 'button';
      pickButton.classList.add('postimages-upload-button');
      pickButton.textContent = 'Выбрать файлы';
      pickButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.fileInput.click();
      });
      this.dropzone.appendChild(pickButton);

      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/*';
      this.fileInput.multiple = true;
      this.fileInput.classList.add('postimages-file-input');
      this.fileInput.addEventListener('change', () => {
        this.addFiles(this.fileInput.files);
        this.fileInput.value = '';
      });

      this.dropzone.addEventListener('click', () => this.fileInput.click());
      this.dropzone.addEventListener('dragenter', (event) => { event.preventDefault(); this.dropzone.classList.add('postimages-dropzone--over'); });
      this.dropzone.addEventListener('dragover', (event) => { event.preventDefault(); this.dropzone.classList.add('postimages-dropzone--over'); });
      this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('postimages-dropzone--over'));
      this.dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        this.dropzone.classList.remove('postimages-dropzone--over');
        const files = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : null;
        if (files && files.length) this.addFiles(files);
      });

      // Запасной вариант: добавить изображение по прямой ссылке
      const manual = document.createElement('details');
      manual.classList.add('postimages-manual');
      const manualSummary = document.createElement('summary');
      manualSummary.textContent = 'Добавить изображение по прямой ссылке';
      const manualRow = document.createElement('div');
      manualRow.classList.add('postimages-manual-row');
      const manualInput = document.createElement('input');
      manualInput.type = 'url';
      manualInput.classList.add('postimages-manual-input');
      manualInput.placeholder = 'https://i.postimg.cc/xxxxxx/image.png';
      const manualButton = document.createElement('button');
      manualButton.type = 'button';
      manualButton.classList.add('postimages-manual-button');
      manualButton.textContent = 'Добавить';
      manualButton.addEventListener('click', () => {
        const url = manualInput.value.trim();
        if (!url) return;
        if (!/^https?:\/\//i.test(url)) { showMessage('Ссылка должна начинаться с http:// или https://', 'error'); return; }
        if (this.items.length >= this.maxImages) { showMessage(`Можно прикрепить не более ${this.maxImages} изображений`, 'info'); return; }
        this.items.push({
          id: `manual_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
          file: null, name: url.split('/').pop() || 'изображение', size: 0,
          previewUrl: url, remoteUrl: url, status: 'done', error: '',
        });
        manualInput.value = '';
        this._renderItems();
        this._emitChange();
      });
      manualRow.appendChild(manualInput);
      manualRow.appendChild(manualButton);
      manual.appendChild(manualSummary);
      manual.appendChild(manualRow);

      this.statusLine = document.createElement('p');
      this.statusLine.classList.add('postimages-status');
      this.statusLine.hidden = true;

      this.previewContainer = document.createElement('div');
      this.previewContainer.classList.add('postimages-preview-list');

      this.controls.appendChild(head);
      this.controls.appendChild(this.dropzone);
      this.controls.appendChild(this.fileInput);
      this.controls.appendChild(manual);
      this.controls.appendChild(this.previewContainer);
      this.controls.appendChild(this.statusLine);
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
        response = await fetch(`${PostimagesUploader.HOST}/json`, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
          },
          body: form,
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
        const response = await fetch(`${PostimagesUploader.HOST}/mod?${params.toString()}`, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
          },
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

    _renderItems() {
      if (!this.previewContainer) return;
      while (this.previewContainer.firstChild) this.previewContainer.removeChild(this.previewContainer.firstChild);

      const uploaded = this.items.filter((item) => item.status === 'done' && item.remoteUrl).length;
      const busy = this.items.some((item) => item.status === 'uploading' || item.status === 'pending');
      this.counter.textContent = `${uploaded}/${this.maxImages}`;
      this.dropzone.classList.toggle('postimages-dropzone--busy', busy);
      this.dropzone.classList.toggle('postimages-dropzone--full', this.items.length >= this.maxImages);

      const statusLabels = {
        pending: 'В очереди…',
        uploading: 'Загрузка…',
        done: 'Готово',
        error: 'Ошибка',
      };

      for (const item of this.items) {
        const card = document.createElement('div');
        card.classList.add('postimages-preview-item', `postimages-preview-item--${item.status}`);

        const image = document.createElement('img');
        image.alt = `Изображение ${item.name || ''}`.trim();
        image.src = item.remoteUrl || item.previewUrl || '';
        image.loading = 'lazy';
        image.addEventListener('click', () => {
          const url = item.remoteUrl || item.previewUrl;
          if (url && global.imageViewer) global.imageViewer.open(url);
        });
        card.appendChild(image);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('postimages-remove-button');
        removeButton.textContent = '×';
        removeButton.title = 'Удалить изображение';
        removeButton.setAttribute('aria-label', 'Удалить изображение из публикации');
        removeButton.addEventListener('click', () => this._removeItem(item));
        card.appendChild(removeButton);

        const caption = document.createElement('span');
        caption.classList.add('postimages-item-name');
        const sizeText = item.size ? ` · ${PostimagesUploader.formatSize(item.size)}` : '';
        caption.textContent = `${item.name || 'изображение'}${sizeText}`;
        caption.title = caption.textContent;
        card.appendChild(caption);

        const status = document.createElement('span');
        status.classList.add('postimages-item-status');
        status.textContent = statusLabels[item.status] || '';
        card.appendChild(status);

        if (item.status === 'error') {
          const retry = document.createElement('button');
          retry.type = 'button';
          retry.classList.add('postimages-retry-button');
          retry.textContent = 'Повторить';
          retry.addEventListener('click', () => {
            item.status = 'pending';
            item.error = '';
            this._renderItems();
            this._enqueueUploads();
          });
          card.appendChild(retry);
          if (item.error) {
            const errorText = document.createElement('span');
            errorText.classList.add('postimages-item-error');
            errorText.textContent = item.error;
            card.appendChild(errorText);
          }
        }

        this.previewContainer.appendChild(card);
      }

      this._updateStatusLine();
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
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
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
      event.preventDefault();
      if (this.dropzone) this.dropzone.classList.add('postimages-dropzone--over');
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
          name: url.split('/').pop() || 'изображение',
          size: 0,
          previewUrl: url,
          remoteUrl: url,
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

  class ImageViewer {
    constructor(contentCache) {
      this.cache = contentCache;
      this.overlay = null;
      this.image = null;
      this.imageStage = null;
      this.url = '';
      this.scale = 1;
      this.rotation = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.pointers = new Map();
      this.dragOrigin = null;
      this.pinchOrigin = null;
      this._keyHandler = (event) => {
        if (!this.overlay || !this.overlay.classList.contains('image-viewer--open')) return;
        if (event.key === 'Escape') this.close();
        if (event.key === '+' || event.key === '=') this.zoom(0.2);
        if (event.key === '-') this.zoom(-0.2);
        if (event.key.toLowerCase() === 'r') this.rotate(90);
      };
      global.addEventListener('keydown', this._keyHandler);
    }

    _build() {
      if (this.overlay) return;

      this.overlay = document.createElement('div');
      this.overlay.classList.add('image-viewer');
      this.overlay.setAttribute('role', 'dialog');
      this.overlay.setAttribute('aria-modal', 'true');
      this.overlay.setAttribute('aria-label', 'Просмотр изображения');

      const toolbar = document.createElement('div');
      toolbar.classList.add('image-viewer-toolbar');
      const makeButton = (label, title, callback) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('image-viewer-button');
        button.textContent = label;
        button.title = title;
        button.setAttribute('aria-label', title);
        button.addEventListener('click', callback);
        toolbar.appendChild(button);
        return button;
      };

      makeButton('−', 'Уменьшить', () => this.zoom(-0.2));
      makeButton('+', 'Увеличить', () => this.zoom(0.2));
      makeButton('↶', 'Повернуть влево', () => this.rotate(-90));
      makeButton('↷', 'Повернуть вправо', () => this.rotate(90));
      makeButton('↓', 'Скачать изображение', () => this.download());
      makeButton('×', 'Закрыть просмотр', () => this.close());

      this.imageStage = document.createElement('div');
      this.imageStage.classList.add('image-viewer-stage');
      this.image = document.createElement('img');
      this.image.classList.add('image-viewer-image');
      this.image.alt = 'Просматриваемое изображение';
      this.image.draggable = false;
      this.imageStage.appendChild(this.image);

      this.imageStage.addEventListener('click', (event) => {
        if (event.target === this.imageStage) this.close();
      });
      this.overlay.addEventListener('click', (event) => {
        if (event.target === this.overlay) this.close();
      });
      this.imageStage.addEventListener('wheel', (event) => {
        event.preventDefault();
        this.zoom(event.deltaY < 0 ? 0.12 : -0.12);
      }, { passive: false });
      this.imageStage.addEventListener('pointerdown', (event) => this._pointerDown(event));
      this.imageStage.addEventListener('pointermove', (event) => this._pointerMove(event));
      this.imageStage.addEventListener('pointerup', (event) => this._pointerUp(event));
      this.imageStage.addEventListener('pointercancel', (event) => this._pointerUp(event));

      this.overlay.appendChild(toolbar);
      this.overlay.appendChild(this.imageStage);
      document.body.appendChild(this.overlay);
    }

    async open(url) {
      if (!url) return;
      this._build();
      this.url = url;
      this.scale = 1;
      this.rotation = 0;
      this.offsetX = 0;
      this.offsetY = 0;
      this.pointers.clear();
      this._applyTransform();
      this.overlay.classList.add('image-viewer--open');
      this.image.src = this.cache ? await this.cache.getDisplayUrl(url) : url;
      if (this.cache) this.cache.cacheImage(url);
    }

    close() {
      if (this.overlay) this.overlay.classList.remove('image-viewer--open');
      this.pointers.clear();
    }

    zoom(delta) {
      this.scale = Math.min(5, Math.max(0.25, this.scale + delta));
      this._applyTransform();
    }

    rotate(delta) {
      this.rotation = (this.rotation + delta) % 360;
      this._applyTransform();
    }

    _applyTransform() {
      if (!this.image) return;
      this.image.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale}) rotate(${this.rotation}deg)`;
    }

    _pointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      this.imageStage.setPointerCapture(event.pointerId);
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (this.pointers.size === 1) {
        this.dragOrigin = {
          x: event.clientX,
          y: event.clientY,
          offsetX: this.offsetX,
          offsetY: this.offsetY,
        };
      } else if (this.pointers.size === 2) {
        const [a, b] = Array.from(this.pointers.values());
        this.pinchOrigin = {
          distance: Math.hypot(a.x - b.x, a.y - b.y),
          scale: this.scale,
        };
      }
    }

    _pointerMove(event) {
      if (!this.pointers.has(event.pointerId)) return;
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (this.pointers.size >= 2 && this.pinchOrigin) {
        const [a, b] = Array.from(this.pointers.values());
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        this.scale = Math.min(5, Math.max(0.25, this.pinchOrigin.scale * distance / Math.max(1, this.pinchOrigin.distance)));
        this._applyTransform();
      } else if (this.pointers.size === 1 && this.dragOrigin && this.scale > 1) {
        this.offsetX = this.dragOrigin.offsetX + event.clientX - this.dragOrigin.x;
        this.offsetY = this.dragOrigin.offsetY + event.clientY - this.dragOrigin.y;
        this._applyTransform();
      }
    }

    _pointerUp(event) {
      this.pointers.delete(event.pointerId);
      this.dragOrigin = null;
      this.pinchOrigin = null;
      if (this.pointers.size === 1) {
        const [point] = Array.from(this.pointers.values());
        this.dragOrigin = { x: point.x, y: point.y, offsetX: this.offsetX, offsetY: this.offsetY };
      }
    }

    async download() {
      if (!this.url) return;
      let blob = this.cache ? await this.cache.getImageBlob(this.url) : null;

      if (!blob) {
        try {
          const response = await fetch(this.url, { mode: 'cors' });
          if (response.ok && response.type !== 'opaque') blob = await response.blob();
        } catch (_) {
          // Попробуем обычную загрузку по ссылке ниже.
        }
      }

      const fileName = this._fileName(this.url);
      if (blob && typeof global.showSaveFilePicker === 'function') {
        try {
          const handle = await global.showSaveFilePicker({ suggestedName: fileName });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') return;
        }
      }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = blob ? URL.createObjectURL(blob) : this.url;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (blob && link.href.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(link.href), 30_000);
    }

    _fileName(url) {
      try {
        const pathname = new URL(url).pathname;
        const name = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || 'image');
        return /\.[a-z0-9]{2,5}$/i.test(name) ? name : `${name}.jpg`;
      } catch (_) {
        return 'image.jpg';
      }
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

  global.OfflineContentCache = OfflineContentCache;
  global.PostimagesUploader = PostimagesUploader;
  global.ImageViewer = ImageViewer;
  global.contentCache = contentCache;
  global.imageViewer = imageViewer;
  global.openImageViewer = (url) => imageViewer.open(url);
  global.extractPostimagesUrls = extractImageUrls;
  global.teacherNameKey = teacherNameKey;
  global.isPostForTeacher = isPostForTeacher;

  registerImageServiceWorker();
})(window);
