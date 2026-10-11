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
  let postimagesLoadPromise = null;

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
        'userGroup', 'userSubgroup', 'targetSubgroup', 'postId',
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
        'userGroup', 'targetSubgroup', 'postId', 'textId',
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
        const textType = input.textType === 'homework' ? 'homework' : 'material';
        const targetSubgroup = input.targetSubgroup === 1 || input.targetSubgroup === 2
          ? input.targetSubgroup
          : null;
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
          subjectTimestamp: Number(input.subjectTimestamp),
          textContent: String(input.textContent || '').trim(),
          textType,
          imageCount: imageUrls.length,
          timestamp,
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
            subjectTimestamp: Number(input.subjectTimestamp),
            imageUrl,
            imageType: textType,
            timestamp,
            order: index,
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

  class PostimagesUploader {
    constructor(container, options = {}) {
      this.container = container;
      this.maxImages = Math.min(MAX_POST_IMAGES, Math.max(1, Number(options.maxImages) || MAX_POST_IMAGES));
      this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
      this.urls = Array.isArray(options.initialImages) ? options.initialImages.slice(0, this.maxImages) : [];
      this.areaId = `postimg_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
      this._postimagesLoading = !isPostimagesReady();
      this._handleOutput = this._handleOutput.bind(this);

      this.hiddenArea = document.createElement('textarea');
      this.hiddenArea.dataset.postimg = this.areaId;
      this.hiddenArea.setAttribute('aria-hidden', 'true');
      this.hiddenArea.tabIndex = -1;
      this.hiddenArea.classList.add('postimages-result-area');

      this.controls = document.createElement('div');
      this.controls.classList.add('postimages-uploader');
      this.uploadButton = document.createElement('button');
      this.uploadButton.type = 'button';
      this.uploadButton.classList.add('postimages-upload-button');
      this.uploadButton.textContent = 'Подключение Postimages…';
      this.uploadButton.disabled = true;
      this.uploadButton.addEventListener('click', () => this.openUploader());
      this.controls.appendChild(this.uploadButton);

      const readyPromise = global.postimagesReady || ensurePostimagesLoaded();
      Promise.resolve(readyPromise).then((ready) => {
        this._postimagesLoading = false;
        if (ready === false || !isPostimagesReady()) {
          throw new Error('window.postimage.upload не найден');
        }
        if (!this.uploadButton) return;
        this.uploadButton.textContent = 'Добавить изображение';
        this.uploadButton.title = 'Открыть загрузчик Postimages';
        this._renderPreviews();
      }).catch((error) => {
        this._postimagesLoading = false;
        if (!this.uploadButton) return;
        this.uploadButton.textContent = 'Повторить подключение';
        this.uploadButton.title = 'Не удалось подключить Postimages. Нажмите, чтобы повторить.';
        this._renderPreviews();
        console.error('Postimages пока не подключён:', error);
      });

      this.counter = document.createElement('span');
      this.counter.classList.add('postimages-counter');
      this.controls.appendChild(this.counter);

      this.previewContainer = document.createElement('div');
      this.previewContainer.classList.add('postimages-preview-list');
      this.container.appendChild(this.controls);
      this.container.appendChild(this.previewContainer);
      this.container.appendChild(this.hiddenArea);

      global.addEventListener('postimages:output', this._handleOutput);
      this._renderPreviews();
    }

    openUploader() {
      if (this.urls.length >= this.maxImages) {
        showMessage(`Можно прикрепить не более ${this.maxImages} изображений`, 'info');
        return;
      }

      // Открытие popup должно произойти непосредственно внутри пользовательского
      // click-события, иначе браузер может заблокировать окно загрузчика.
      if (isPostimagesReady()) {
        wrapPostimagesOutput();
        try {
          if (global.postimage.opt) global.postimage.opt.code = 'hotlink';
          global.postimage.upload(this.areaId);
          const popup = global.postimage.windows && global.postimage.windows[this.areaId]
            ? global.postimage.windows[this.areaId].window
            : null;
          if (!popup) showMessage('Браузер заблокировал окно Postimages. Разрешите всплывающие окна для приложения и нажмите ещё раз.', 'error');
        } catch (error) {
          console.error('Ошибка запуска Postimages:', error);
          showMessage(`Не удалось открыть загрузчик Postimages: ${error.message || error}`, 'error');
        }
        return;
      }

      // Если основной script-тег не сработал, пробуем подгрузить файл ещё раз.
      // После завершения попросим нажать кнопку повторно, чтобы popup открылся
      // уже прямо из обработчика click и не был заблокирован браузером.
      this._postimagesLoading = true;
      this.uploadButton.textContent = 'Подключение…';
      this._renderPreviews();
      ensurePostimagesLoaded().then(() => {
        this._postimagesLoading = false;
        this.uploadButton.textContent = 'Добавить изображение';
        this._renderPreviews();
        showMessage('Загрузчик подключён. Нажмите «Добавить изображение» ещё раз.', 'success');
      }).catch((error) => {
        this._postimagesLoading = false;
        this.uploadButton.textContent = 'Повторить подключение';
        this._renderPreviews();
        console.error('Postimages script не загружен:', error);
        showMessage(`Postimages не подключился. Проверьте путь к скрипту libs/postimages/phpbb3-de-hotlink.js и ответ сервера в Network. ${error.message || ''}`, 'error');
      });
    }

    _handleOutput(event) {
      const detail = event && event.detail;
      if (!detail || String(detail.areaId) !== this.areaId) return;

      const newUrls = extractImageUrls(detail.content);
      if (newUrls.length === 0) {
        showMessage('Не удалось извлечь прямую ссылку на изображение из ответа Postimages. Проверьте формат ответа.', 'error');
        return;
      }

      let added = 0;
      for (const url of newUrls) {
        if (this.urls.includes(url)) continue;
        if (this.urls.length >= this.maxImages) break;
        this.urls.push(url);
        added += 1;
      }

      if (added === 0 && this.urls.length >= this.maxImages) {
        showMessage(`Достигнут лимит: ${this.maxImages} изображений`, 'info');
      } else if (added > 0) {
        this._renderPreviews();
        this.onChange(this.urls.slice());
      }
    }

    _renderPreviews() {
      while (this.previewContainer.firstChild) this.previewContainer.removeChild(this.previewContainer.firstChild);
      this.counter.textContent = `${this.urls.length}/${this.maxImages}`;
      this.uploadButton.disabled = this.urls.length >= this.maxImages || this._postimagesLoading;

      this.urls.forEach((url, index) => {
        const item = document.createElement('div');
        item.classList.add('postimages-preview-item');
        const image = document.createElement('img');
        image.alt = `Прикреплённое изображение ${index + 1}`;
        image.src = url;
        image.addEventListener('click', () => global.imageViewer.open(url));

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.classList.add('postimages-remove-button');
        removeButton.textContent = '×';
        removeButton.setAttribute('aria-label', 'Удалить изображение из публикации');
        removeButton.addEventListener('click', () => {
          this.urls.splice(index, 1);
          this._renderPreviews();
          this.onChange(this.urls.slice());
        });

        item.appendChild(image);
        item.appendChild(removeButton);
        this.previewContainer.appendChild(item);
        if (global.contentCache) global.contentCache.cacheImage(url);
      });
    }

    getImages() {
      return this.urls.slice();
    }

    destroy() {
      global.removeEventListener('postimages:output', this._handleOutput);
    }
  }

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

  function isPostimagesReady() {
    const postimage = global.postimage;
    return Boolean(
      postimage &&
      typeof postimage.upload === 'function' &&
      typeof postimage.output === 'function' &&
      postimage.opt &&
      postimage.windows
    );
  }

  function wrapPostimagesOutput() {
    const postimage = global.postimage;
    if (!postimage || typeof postimage.output !== 'function' || postimage.__appOutputWrapped) return;

    const originalOutput = postimage.output;
    postimage.output = function wrappedOutput(areaId, result, closeWindow) {
      const output = originalOutput.apply(this, arguments);
      try {
        global.dispatchEvent(new CustomEvent('postimages:output', {
          detail: { areaId: String(areaId), content: String(result || ''), closeWindow: Boolean(closeWindow) },
        }));
      } catch (_) {
        // CustomEvent недоступен в очень старых WebView.
      }
      return output;
    };
    postimage.__appOutputWrapped = true;
  }

  function findPostimagesScriptUrl() {
    const scriptTags = Array.from(document.scripts || []);
    const postimagesTag = scriptTags.find((script) => /phpbb3-de-hotlink(?:\.min)?\.js(?:\?|$)/i.test(script.src || ''));
    if (postimagesTag) return postimagesTag.src;

    const logicTag = scriptTags.find((script) => /(?:^|\/)images-logic\.js(?:\?|$)/i.test(script.src || ''));
    if (logicTag && logicTag.src) {
      return new URL('./postimages/phpbb3-de-hotlink.js', logicTag.src).href;
    }

    return new URL('libs/postimages/phpbb3-de-hotlink.js', document.baseURI || global.location.href).href;
  }

  function ensurePostimagesLoaded() {
    if (isPostimagesReady()) {
      wrapPostimagesOutput();
      return Promise.resolve(global.postimage);
    }
    if (postimagesLoadPromise) return postimagesLoadPromise;

    const source = findPostimagesScriptUrl();
    postimagesLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.dataset.imagesLogicPostimagesRetry = 'true';
      script.onload = () => {
        if (!isPostimagesReady()) {
          reject(new Error(`Скрипт загрузился, но window.postimage.upload не найден: ${source}`));
          return;
        }
        wrapPostimagesOutput();
        resolve(global.postimage);
      };
      script.onerror = () => reject(new Error(`Не удалось загрузить Postimages-скрипт: ${source}`));
      (document.head || document.body || document.documentElement).appendChild(script);
    }).catch((error) => {
      postimagesLoadPromise = null; // разрешаем повторить загрузку после исправления пути/сети
      throw error;
    });

    return postimagesLoadPromise;
  }

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

  const postimagesReady = ensurePostimagesLoaded()
    .then(() => {
      wrapPostimagesOutput();
      return true;
    })
    .catch((error) => {
      console.error('Postimages script не инициализирован:', error);
      return false;
    });
  global.postimagesReady = postimagesReady;
  global.imagesLogicStatus = () => ({
    postimagesLoaded: isPostimagesReady(),
    postimagesScript: findPostimagesScriptUrl(),
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

  registerImageServiceWorker();
})(window);
