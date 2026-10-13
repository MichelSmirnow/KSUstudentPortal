/* ============================================================================================
 * scripts/admin.js — управление приложением
 *
 * Здесь собрано всё, что относится к ролям, модерации и администрированию:
 *   1) GovernanceStore — набор методов для window.database (роли, блокировки, модерация,
 *      жалобы, удаление публикаций);
 *   2) UserBadges     — значки рядом с именем автора (админ / староста / преподаватель / тег);
 *   3) PostMenu       — меню из трёх точек у публикации (жалоба, поделиться, скопировать,
 *      редактировать, удалить);
 *   4) AdminPanel     — страница «Панель администратора» (пользователи + модерация).
 *
 * Коллекции Firestore:
 *   texts, images   — публикации; поля moderation ('pending'|'approved'), moderatedBy,
 *                     moderatedAt, reportCount, reportedBy;
 *   reports         — жалобы пользователей; id документа: <postId>__<uid>, повторно пожаловаться нельзя;
 *   userdata/{uid}  — роли и ограничения: role ('starosta'|'teacher'), customTag, blocked,
 *                     blockedReason, blockedBy, blockedAt;
 *   accounts, admindata — как и раньше.
 * ========================================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ Константы */

  const REPORT_LIMIT = 7;                    // сколько жалоб удаляет публикацию
  const MODERATION_PENDING = 'pending';      // «не проверено»
  const MODERATION_APPROVED = 'approved';    // «проверено»
  const ROLE_STAROSTA = 'starosta';
  const ROLE_TEACHER = 'teacher';
  const ROLE_LABELS = { [ROLE_STAROSTA]: 'Староста', [ROLE_TEACHER]: 'Преподаватель' };
  const ADMIN_BADGE_TEXT = 'Админ';
  const MODERATION_TAB_REFRESH = 30000;      // автообновление очереди модерации, мс

  /* ------------------------------------------------------------------ Мелкие утилиты */

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function notify(message, type) {
    if (typeof global.showNotification === 'function') global.showNotification(message, type || 'info');
    else console.log(message);
  }

  function currentUser() {
    return global.auth && typeof global.auth.getCurrentUser === 'function' ? global.auth.getCurrentUser() : null;
  }

  function currentUid() {
    const user = currentUser();
    return user && user.uid ? String(user.uid) : '';
  }

  function formatDate(value) {
    if (global.HomeworkRenderer && HomeworkRenderer.formatDate) return HomeworkRenderer.formatDate(value);
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  }

  function formatTime(value) {
    if (global.HomeworkRenderer && HomeworkRenderer.formatTime) return HomeworkRenderer.formatTime(value);
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatDateTime(value) {
    if (global.HomeworkRenderer && HomeworkRenderer.formatDateTime) return HomeworkRenderer.formatDateTime(value);
    const date = Number(value) ? new Date(Number(value) < 100_000_000_000 ? Number(value) * 1000 : Number(value)) : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${formatTime(date)}, ${formatDate(date)}`;
  }

  function shuffle(list) {
    const array = Array.isArray(list) ? list : [];
    for (let index = array.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      const temporary = array[index];
      array[index] = array[random];
      array[random] = temporary;
    }
    return array;
  }

  function plural(number, one, few, many) {
    const value = Math.abs(Number(number) || 0) % 100;
    const last = value % 10;
    if (value > 10 && value < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  }

  function snapshotToArray(snapshot) {
    const list = [];
    if (!snapshot) return list;
    // Firestore: QuerySnapshot.forEach(doc => …), данные — doc.data(), id — doc.id
    snapshot.forEach((doc) => {
      const data = typeof doc.data === 'function' ? doc.data() : doc;
      list.push({ id: doc.id, ...(data || {}) });
    });
    if (list.length === 0 && Array.isArray(snapshot.docs)) {
      snapshot.docs.forEach((doc) => {
        const data = typeof doc.data === 'function' ? doc.data() : doc;
        list.push({ id: doc.id, ...(data || {}) });
      });
    }
    return list;
  }

  /* =========================== 1. Методы базы данных =========================== */

  function installGovernanceExtensions() {
    const database = global.database;
    if (!database || !database.constructor || !database.constructor.prototype) return;
    const prototype = database.constructor.prototype;

    /* ------------------------- Профили пользователей (userdata) ------------------------- */

    prototype.getUserdata = async function getUserdata(userId) {
      try {
        const doc = await this.db.collection('userdata').doc(String(userId)).get();
        const data = typeof doc.data === 'function' ? doc.data() : null;
        return { success: true, profile: data || null };
      } catch (error) {
        return { success: false, profile: null, message: `Не удалось получить данные пользователя: ${error && error.message ? error.message : error}` };
      }
    };

    prototype.getAllUserdata = async function getAllUserdata() {
      try {
        const snapshot = await this.db.collection('userdata').get();
        return { success: true, profiles: snapshotToArray(snapshot) };
      } catch (error) {
        return { success: false, profiles: [], message: `Не удалось получить список ролей: ${error && error.message ? error.message : error}` };
      }
    };

    prototype.updateUserdata = async function updateUserdata(userId, changes) {
      try {
        const user = this.auth.getCurrentUser();
        if (!user) return { success: false, message: 'Пользователь не авторизован' };
        const payload = { ...(changes || {}), userId: String(userId), updatedAt: Date.now(), updatedBy: user.uid };
        await this.db.collection('userdata').doc(String(userId)).set(payload, { merge: true });
        if (global.UserBadges) global.UserBadges.invalidate();
        return { success: true, profile: payload, message: 'Данные пользователя обновлены' };
      } catch (error) {
        return { success: false, message: `Не удалось обновить данные пользователя: ${error && error.message ? error.message : error}` };
      }
    };

    prototype.setUserRole = async function setUserRole(userId, role) {
      const value = role === ROLE_STAROSTA || role === ROLE_TEACHER ? role : '';
      return this.updateUserdata(userId, { role: value });
    };

    prototype.setUserTag = async function setUserTag(userId, tag) {
      const value = String(tag || '').trim().slice(0, 24);
      return this.updateUserdata(userId, { customTag: value });
    };

    prototype.setUserBlocked = async function setUserBlocked(userId, blocked, reason) {
      const admin = currentUser();
      return this.updateUserdata(userId, {
        blocked: Boolean(blocked),
        blockedReason: blocked ? String(reason || '').trim().slice(0, 200) : '',
        blockedBy: blocked ? (admin ? admin.uid : '') : '',
        blockedAt: blocked ? Date.now() : null,
      });
    };

    /* ------------------------------ Пользователи и посты ------------------------------ */

    prototype.getAllAccounts = async function getAllAccounts() {
      try {
        const snapshot = await this.db.collection('accounts').get();
        return { success: true, accounts: snapshotToArray(snapshot) };
      } catch (error) {
        return { success: false, accounts: [], message: `Не удалось получить список аккаунтов: ${error && error.message ? error.message : error}` };
      }
    };

    prototype.getPostsByUser = async function getPostsByUser(userId) {
      try {
        const [textSnapshot, imageSnapshot] = await Promise.all([
          this.db.collection('texts').where('userId', '==', userId).get(),
          this.db.collection('images').where('userId', '==', userId).get(),
        ]);
        return { success: true, texts: snapshotToArray(textSnapshot), images: snapshotToArray(imageSnapshot) };
      } catch (error) {
        return { success: false, texts: [], images: [], message: `Не удалось получить публикации пользователя: ${error && error.message ? error.message : error}` };
      }
    };

    /* --------------------------------- Модерация --------------------------------- */

    prototype.getPendingPosts = async function getPendingPosts() {
      try {
        const [textSnapshot, imageSnapshot] = await Promise.all([
          this.db.collection('texts').where('moderation', '==', MODERATION_PENDING).get(),
          this.db.collection('images').where('moderation', '==', MODERATION_PENDING).get(),
        ]);
        return { success: true, texts: snapshotToArray(textSnapshot), images: snapshotToArray(imageSnapshot) };
      } catch (error) {
        return { success: false, texts: [], images: [], message: `Не удалось получить очередь модерации: ${error && error.message ? error.message : error}` };
      }
    };

    /**
     * Модерация публикации. Решение принимается в транзакции: если другой администратор
     * успел раньше, документы уже не «pending» и мы возвращаем alreadyModerated —
     * контент остаётся таким, каким его оставил первый администратор.
     */
    prototype.moderatePost = async function moderatePost(post, decision) {
      const approve = decision === 'approve' || decision === 'approved';
      try {
        const user = this.auth.getCurrentUser();
        if (!user) return { success: false, message: 'Пользователь не авторизован' };

        const textRefs = (post && Array.isArray(post.textIds) ? post.textIds : []).filter(Boolean)
          .map((id) => this.db.collection('texts').doc(String(id)));
        const imageRefs = (post && Array.isArray(post.imageIds) ? post.imageIds : []).filter(Boolean)
          .map((id) => this.db.collection('images').doc(String(id)));
        const refs = [...textRefs, ...imageRefs];
        if (refs.length === 0) return { success: false, message: 'Нечего модерировать' };

        const db = this.db;
        let alreadyModerated = false;
        let moderatedCount = 0;

        const applyInTransaction = async () => {
          await db.runTransaction(async (transaction) => {
            const entries = [];
            for (const ref of refs) {
              const snapshot = await transaction.get(ref);
              const exists = snapshot && (typeof snapshot.exists === 'boolean' ? snapshot.exists : true);
              if (!exists) continue;
              const data = typeof snapshot.data === 'function' ? snapshot.data() : snapshot;
              entries.push({ ref, data: data || {} });
            }
            const pending = entries.filter((entry) => entry.data.moderation === MODERATION_PENDING);
            if (entries.length === 0 || pending.length === 0) {
              alreadyModerated = true;
              return;
            }
            for (const entry of entries) {
              if (approve) {
                transaction.update(entry.ref, {
                  moderation: MODERATION_APPROVED,
                  moderatedBy: user.uid,
                  moderatedAt: Date.now(),
                });
              } else {
                transaction.delete(entry.ref);
              }
              moderatedCount += 1;
            }
          });
        };

        if (typeof db.runTransaction === 'function') {
          await applyInTransaction();
        } else {
          // Запасной путь для сред без транзакций: проверяем и пишем по очереди.
          const entries = [];
          for (const ref of refs) {
            const snapshot = await ref.get();
            const exists = snapshot && (typeof snapshot.exists === 'boolean' ? snapshot.exists : true);
            if (!exists) continue;
            const data = typeof snapshot.data === 'function' ? snapshot.data() : snapshot;
            entries.push({ ref, data: data || {} });
          }
          const pending = entries.filter((entry) => entry.data.moderation === MODERATION_PENDING);
          if (entries.length === 0 || pending.length === 0) alreadyModerated = true;
          else {
            for (const entry of entries) {
              if (approve) await entry.ref.update({ moderation: MODERATION_APPROVED, moderatedBy: user.uid, moderatedAt: Date.now() });
              else await entry.ref.delete();
              moderatedCount += 1;
            }
          }
        }

        if (alreadyModerated) {
          return { success: false, alreadyModerated: true, message: 'Контент уже был отмодерирован' };
        }
        return {
          success: true,
          moderated: moderatedCount,
          message: approve ? 'Публикация принята' : 'Публикация отклонена и удалена',
        };
      } catch (error) {
        return { success: false, message: `Ошибка модерации: ${error && error.message ? error.message : error}` };
      }
    };

    /* ---------------------------------- Жалобы ---------------------------------- */

    prototype.getReportCount = async function getReportCount(postId) {
      try {
        const snapshot = await this.db.collection('reports').where('postId', '==', String(postId)).get();
        const list = snapshotToArray(snapshot);
        return { success: true, count: list.length, reporters: list.map((item) => String(item.userId || '')) };
      } catch (error) {
        return { success: false, count: 0, reporters: [], message: `Не удалось получить жалобы: ${error && error.message ? error.message : error}` };
      }
    };

    /** Жалоба на публикацию. Одна жалоба на пользователя; 7 жалоб — публикация удаляется. */
    prototype.reportPost = async function reportPost(post, reason) {
      try {
        const user = this.auth.getCurrentUser();
        if (!user) return { success: false, message: 'Пользователь не авторизован' };

        const postKey = String((post && (post.postId || post.textIds && post.textIds[0] || post.textId)) || '');
        if (!postKey) return { success: false, message: 'Не удалось определить публикацию' };
        if (String(post.userId || '') === String(user.uid)) {
          return { success: false, message: 'На свою публикацию пожаловаться нельзя' };
        }

        const reportId = `${postKey}__${user.uid}`;
        const reportRef = this.db.collection('reports').doc(reportId);
        const existing = await reportRef.get();
        const alreadyExists = existing && (typeof existing.exists === 'boolean' ? existing.exists : Boolean(typeof existing.data === 'function' ? existing.data() : existing));
        if (alreadyExists) {
          return { success: false, alreadyReported: true, message: 'Вы уже отправляли жалобу на эту публикацию' };
        }

        await reportRef.set({
          reportId,
          postId: postKey,
          textId: post.textIds && post.textIds[0] ? post.textIds[0] : '',
          subject: String(post.subject || ''),
          subjectTimestamp: Number(post.subjectTimestamp) || 0,
          author: String(post.author || ''),
          authorId: String(post.userId || ''),
          userId: user.uid,
          userEmail: user.email || '',
          reason: String(reason || '').slice(0, 300),
          timestamp: Date.now(),
        });

        const counted = await this.getReportCount(postKey);
        const reportedBy = Array.from(new Set([
          ...(Array.isArray(post.reportedBy) ? post.reportedBy.map(String) : []),
          String(user.uid),
        ]));
        const reportCount = Math.max(Number(post.reportCount) || 0, 0) + 1;
        const finalCount = Math.max(reportCount, counted.count || 0);

        // Счётчик жалоб живёт прямо в публикации: по нему срабатывает правило удаления.
        const textRefs = (post.textIds || []).map((id) => this.db.collection('texts').doc(String(id)));
        const imageRefs = (post.imageIds || []).map((id) => this.db.collection('images').doc(String(id)));
        for (const ref of [...textRefs, ...imageRefs]) {
          try { await ref.update({ reportedBy, reportCount: finalCount }); } catch (error) { console.warn('Не удалось обновить счётчик жалоб:', error); }
        }

        let removed = false;
        if (finalCount >= REPORT_LIMIT) {
          const deletion = await this.deletePosts({ postId: postKey, textIds: post.textIds, imageIds: post.imageIds });
          removed = deletion.success === true;
        }

        return {
          success: true,
          reportCount: finalCount,
          limit: REPORT_LIMIT,
          removed,
          message: removed
            ? `Жалоба отправлена. Публикация удалена (${finalCount} из ${REPORT_LIMIT} жалоб)`
            : `Жалоба отправлена (${finalCount} из ${REPORT_LIMIT})`,
        };
      } catch (error) {
        return { success: false, message: `Не удалось отправить жалобу: ${error && error.message ? error.message : error}` };
      }
    };

    /* ------------------------------ Удаление публикаций ------------------------------ */

    /**
     * Удаление публикации: сначала по известным id документов, остальное — поиском по postId.
     * descriptor: { postId, textIds, imageIds }
     */
    prototype.deletePosts = async function deletePosts(descriptor) {
      const source = descriptor || {};
      let deleted = 0;
      const errors = [];

      const removeRef = async (ref) => {
        try { await ref.delete(); deleted += 1; } catch (error) { errors.push(error); }
      };

      const textIds = Array.isArray(source.textIds) ? source.textIds.filter(Boolean) : [];
      const imageIds = Array.isArray(source.imageIds) ? source.imageIds.filter(Boolean) : [];
      for (const id of textIds) await removeRef(this.db.collection('texts').doc(String(id)));
      for (const id of imageIds) await removeRef(this.db.collection('images').doc(String(id)));

      if (source.postId) {
        try {
          const [texts, images] = await Promise.all([
            this.db.collection('texts').where('postId', '==', String(source.postId)).get(),
            this.db.collection('images').where('postId', '==', String(source.postId)).get(),
          ]);
          for (const doc of snapshotToArray(texts)) {
            if (textIds.includes(doc.id)) continue;
            await removeRef(this.db.collection('texts').doc(String(doc.id)));
          }
          for (const doc of snapshotToArray(images)) {
            if (imageIds.includes(doc.id)) continue;
            await removeRef(this.db.collection('images').doc(String(doc.id)));
          }
        } catch (error) { errors.push(error); }
      }

      if (deleted === 0) {
        return { success: false, deleted, message: errors.length ? 'Не удалось удалить публикацию' : 'Публикация уже удалена' };
      }
      return { success: true, deleted, message: 'Публикация удалена' };
    };
  }

  installGovernanceExtensions();

  /* =========================== 2. Значки авторов =========================== */

  const badgeCache = {
    loaded: false,
    loading: null,
    byUid: new Map(),
    byEmail: new Map(),
    adminIds: new Set(),
  };

  async function loadBadgeData(force) {
    if (badgeCache.loaded && !force) return badgeCache;
    if (badgeCache.loading && !force) return badgeCache.loading;

    badgeCache.loading = (async () => {
      const adminIds = new Set();
      const byUid = new Map();
      const byEmail = new Map();

      try {
        if (global.database && typeof global.database.getAdminIds === 'function') {
          const result = await global.database.getAdminIds();
          if (result && Array.isArray(result.ids)) {
            result.ids.forEach((value) => adminIds.add(String(value)));
          }
        }
      } catch (error) { console.warn('Список администраторов недоступен:', error); }

      try {
        if (global.database && typeof global.database.getAllAccounts === 'function') {
          const result = await global.database.getAllAccounts();
          (result && Array.isArray(result.accounts) ? result.accounts : []).forEach((account) => {
            if (!account) return;
            const uid = String(account.userId || account.uid || '');
            if (uid) byUid.set(uid, { ...(byUid.get(uid) || {}), ...account });
            if (account.userEmail) byEmail.set(String(account.userEmail).toLowerCase(), byUid.get(uid) || account);
          });
        }
      } catch (error) { console.warn('Список аккаунтов недоступен:', error); }

      try {
        if (global.database && typeof global.database.getAllUserdata === 'function') {
          const result = await global.database.getAllUserdata();
          (result && Array.isArray(result.profiles) ? result.profiles : []).forEach((profile) => {
            if (!profile) return;
            const uid = String(profile.userId || profile.id || '');
            if (!uid) return;
            byUid.set(uid, { ...(byUid.get(uid) || {}), ...profile });
          });
        }
      } catch (error) { console.warn('Список ролей недоступен:', error); }

      // Почту из профилей тоже индексируем, чтобы значки находились по e-mail.
      byUid.forEach((profile) => {
        const email = String(profile.userEmail || '').toLowerCase();
        if (email) byEmail.set(email, profile);
      });

      badgeCache.adminIds = adminIds;
      badgeCache.byUid = byUid;
      badgeCache.byEmail = byEmail;
      badgeCache.loaded = true;
      badgeCache.loading = null;
      return badgeCache;
    })();

    return badgeCache.loading;
  }

  function profileFor(post, cache) {
    if (!post) return null;
    const uid = String(post.userId || post.authorId || post.uid || '');
    const email = String(post.authorEmail || '').toLowerCase();
    if (uid && cache.byUid.has(uid)) return cache.byUid.get(uid);
    if (email && cache.byEmail.has(email)) return cache.byEmail.get(email);
    return null;
  }

  function isAdminPost(post, cache) {
    if (!post) return false;
    if (post.isAdmin === true || post.authorIsAdmin === true) return true;
    const uid = String(post.userId || post.authorId || post.uid || '');
    const email = String(post.authorEmail || '').toLowerCase();
    if (uid && cache.adminIds.has(uid)) return true;
    if (email && cache.adminIds.has(email)) return true;
    return false;
  }

  /** Полный список значков для публикации: админ → преподаватель → староста → свой тег */
  function badgesFor(post, cache) {
    const badges = [];
    const profile = profileFor(post, cache);
    if (isAdminPost(post, cache)) badges.push({ kind: 'admin', text: ADMIN_BADGE_TEXT });
    if (profile && profile.role === ROLE_TEACHER) badges.push({ kind: 'teacher', text: ROLE_LABELS[ROLE_TEACHER] });
    else if (profile && profile.role === ROLE_STAROSTA) badges.push({ kind: 'starosta', text: ROLE_LABELS[ROLE_STAROSTA] });
    if (profile && profile.customTag) badges.push({ kind: 'custom', text: String(profile.customTag) });
    return badges;
  }

  function createBadge(badge) {
    const node = element('span', badge.kind === 'admin' ? 'homework-admin-badge' : `homework-role-badge homework-role-badge--${badge.kind}`, badge.text);
    node.title = badge.kind === 'custom' ? 'Особый статус от администрации' : badge.text;
    return node;
  }

  /**
   * Нужен ли ещё этот узел: во время первой отрисовки дерево может быть ещё не в документе,
   * удалённым считаем только тот узел, который уже был в документе и пропал из него.
   */
  function isAlive(node) {
    if (!node) return false;
    if (node.isConnected) { node.__wasInDocument = true; return true; }
    return node.__wasInDocument !== true;
  }

  const UserBadges = {
    REPORT_LIMIT,
    ROLE_STAROSTA,
    ROLE_TEACHER,
    ROLE_LABELS,
    load: loadBadgeData,
    invalidate() {
      badgeCache.loaded = false;
      badgeCache.loading = null;
      if (global.HomeworkRenderer && global.HomeworkRenderer._adminIdsPromise) {
        global.HomeworkRenderer._adminIdsPromise = null;
      }
    },
    getBadges(post) {
      return badgesFor(post, badgeCache.loaded ? badgeCache : { byUid: new Map(), byEmail: new Map(), adminIds: new Set() });
    },
    async renderInto(host, post) {
      if (!host) return;
      const cache = await loadBadgeData();
      if (!isAlive(host)) return;
      const badges = badgesFor(post, cache);
      clear(host);
      badges.forEach((badge) => host.appendChild(createBadge(badge)));
    },
    async isAdmin(userId) {
      const cache = await loadBadgeData();
      const user = userId || currentUid();
      if (!user) return false;
      const uid = String(user);
      const email = String((currentUser() && currentUser().email) || '').toLowerCase();
      return cache.adminIds.has(uid) || (email && cache.adminIds.has(email));
    },
    /** Заблокирован ли пользователь (запрет на публикацию) */
    async getBlockState(userId) {
      const cache = await loadBadgeData();
      const uid = String(userId || currentUid());
      const profile = cache.byUid.get(uid) || null;
      return {
        blocked: Boolean(profile && profile.blocked),
        reason: (profile && profile.blockedReason) || '',
        profile,
      };
    },
    getProfile(userId) {
      return badgeCache.byUid.get(String(userId || '')) || null;
    },
    profiles: badgeCache,
  };

  /* =========================== 3. Меню публикации =========================== */

  let openMenu = null;

  function closeMenu() {
    if (!openMenu) return;
    if (openMenu.parentNode) openMenu.parentNode.removeChild(openMenu);
    openMenu = null;
  }

  async function copyText(text) {
    const value = String(text || '');
    if (!value) return false;
    try {
      if (global.navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (error) { /* ниже запасной путь */ }
    try {
      // Работает и на http://, и при открытии файла напрямую.
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.left = '-10000px';
      area.style.top = '0';
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, value.length);
      const copied = document.execCommand('copy');
      document.body.removeChild(area);
      return Boolean(copied);
    } catch (error) {
      return false;
    }
  }

  /** Текст для «поделиться»: вид публикации, пара, текст, автор и группа */
  function buildShareText(post, context) {
    const kind = context && context.type === 'homework' ? 'Домашнее задание' : 'Материал';
    const subject = String((context && context.subject) || post.subject || 'занятие');
    const lines = [`${kind} с «${subject}»`];

    const start = context && context.start ? context.start : null;
    const end = context && context.end ? context.end : null;
    if (start) {
      const timePart = end ? `${formatTime(start)}–${formatTime(end)}` : formatTime(start);
      lines.push(`${formatDate(start)}, ${timePart}`);
    }

    const text = String(post.textContent || '').trim();
    if (text) {
      lines.push('');
      lines.push(text);
    }

    const images = Array.isArray(post.images) ? post.images.length : 0;
    if (images > 0) {
      lines.push('');
      lines.push(`Изображений: ${images}`);
    }

    lines.push('');
    const group = post.userGroup ? ` (группа ${post.userGroup})` : '';
    lines.push(`Автор: ${post.author || 'неизвестен'}${group}`);
    return lines.join('\n');
  }

  async function buildShareFiles(post) {
    const records = Array.isArray(post.images) ? post.images : [];
    const files = [];
    for (let index = 0; index < records.length; index += 1) {
      const url = String(records[index].imageUrl || records[index].url || '').trim();
      if (!url) continue;
      try {
        const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
        if (!response.ok) continue;
        const blob = await response.blob();
        const extension = (url.split('.').pop() || 'png').split('?')[0].slice(0, 5);
        const name = `image-${index + 1}.${extension || 'png'}`;
        try {
          files.push(new File([blob], name, { type: blob.type || 'image/png' }));
        } catch (_) {
          blob.name = name;
          files.push(blob);
        }
      } catch (error) {
        console.warn('Не удалось подготовить изображение для отправки:', error);
      }
    }
    return files;
  }

  async function sharePost(post, context) {
    const text = buildShareText(post, context);
    const title = `${context && context.type === 'homework' ? 'Домашнее задание' : 'Материал'} с «${(context && context.subject) || post.subject || ''}»`;
    let files = [];
    try { files = await buildShareFiles(post); } catch (error) { files = []; }

    const shareApi = global.navigator && typeof navigator.share === 'function' ? navigator.share.bind(navigator) : null;
    if (shareApi) {
      try {
        const payload = { title, text };
        if (files.length > 0) {
          const canShareFiles = typeof navigator.canShare !== 'function' || navigator.canShare({ files });
          if (canShareFiles) payload.files = files;
          else {
            payload.text = `${text}\n\n${(post.images || []).map((image) => image.imageUrl).filter(Boolean).join('\n')}`;
          }
        }
        await shareApi(payload);
        return { success: true, shared: true };
      } catch (error) {
        if (error && error.name === 'AbortError') return { success: false, canceled: true };
        console.warn('Системное «поделиться» не сработало, копирую текст:', error);
      }
    }

    const copied = await copyText(text);
    if (copied) notify('Текст публикации скопирован — вставьте его в нужный чат', 'success');
    else notify('Не удалось поделиться публикацией на этом устройстве', 'error');
    return { success: copied, copied };
  }

  async function reportPost(post, context) {
    if (!global.database || typeof global.database.reportPost !== 'function') {
      notify('Отправка жалоб недоступна', 'error');
      return { success: false };
    }
    const current = Number(post.reportCount) || 0;
    if (String(post.userId || '') === currentUid()) {
      notify(`Жалобы на публикацию: ${current} из ${REPORT_LIMIT}. На свои публикации жаловаться нельзя`, 'info');
      return { success: false };
    }
    // Случайное нажатие не должно отправлять жалобу — спрашиваем подтверждение
    const confirmed = typeof global.confirm === 'function'
      ? global.confirm(`Отправить жалобу на публикацию? Сейчас жалоб: ${current} из ${REPORT_LIMIT}.`)
      : true;
    if (!confirmed) return { success: false, canceled: true };
    const descriptor = {
      postId: post.postId,
      textIds: post.textIds,
      imageIds: post.imageIds,
      userId: post.userId,
      author: post.author,
      subject: post.subject,
      subjectTimestamp: post.subjectTimestamp,
      reportedBy: post.reportedBy,
      reportCount: post.reportCount,
    };
    const result = await global.database.reportPost(descriptor, 'Жалоба из приложения');
    if (result && result.success) {
      post.reportCount = result.reportCount;
      notify(result.message, result.removed ? 'error' : 'success');
      if (result.removed && typeof global.refreshCurrentPage === 'function') global.refreshCurrentPage();
    } else {
      notify((result && result.message) || 'Не удалось отправить жалобу', result && result.alreadyReported ? 'info' : 'error');
    }
    return result;
  }

  async function deletePost(post, context) {
    if (!global.database || typeof global.database.deletePosts !== 'function') {
      notify('Удаление публикаций недоступно', 'error');
      return { success: false };
    }
    const confirmed = typeof global.confirm === 'function'
      ? global.confirm('Удалить публикацию? Действие необратимо.')
      : true;
    if (!confirmed) return { success: false, canceled: true };

    const result = await global.database.deletePosts({ postId: post.postId, textIds: post.textIds, imageIds: post.imageIds });
    if (result && result.success) {
      notify('Публикация удалена', 'success');
      if (typeof global.refreshCurrentPage === 'function') global.refreshCurrentPage();
    } else {
      notify((result && result.message) || 'Не удалось удалить публикацию', 'error');
    }
    return result;
  }

  function openPostEditor(post, context) {
    const navigate = global.navigateTo || (typeof navigateTo === 'function' ? navigateTo : null);
    if (typeof navigate !== 'function') {
      notify('Редактирование недоступно', 'error');
      return;
    }
    const event = context && context.event ? context.event : null;
    Promise.resolve(navigate('addmatr', {
      event,
      fixedType: post.textType || (context && context.type) || 'material',
      source: (context && context.source) || 'materials',
      edit: {
        postId: post.postId,
        textIds: post.textIds,
        imageIds: post.imageIds,
        textContent: post.textContent,
        images: (post.images || []).map((image) => image.imageUrl || image.url).filter(Boolean),
        textType: post.textType || (context && context.type) || 'material',
      },
    })).catch((error) => console.warn('Не удалось открыть редактирование:', error));
  }

  const PostMenu = {
    REPORT_LIMIT,
    copyText,
    buildShareText,
    sharePost,
    reportPost,
    deletePost,
    openPostEditor,
    close: closeMenu,

    /**
     * Кнопка с тремя точками. context: { event, type, subject, start, end, source }
     */
    buildButton(post, context) {
      const button = element('button', 'homework-post-menu-button', '⋯');
      button.type = 'button';
      button.title = 'Действия с публикацией';
      button.setAttribute('aria-label', 'Действия с публикацией');
      button.addEventListener('click', async (clickEvent) => {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        try { await loadBadgeData(); } catch (_) { /* меню откроется и без ролей */ }
        this.open(button, post, context || {});
      });
      return button;
    },

    open(anchor, post, context) {
      closeMenu();
      const menu = element('div', 'homework-post-menu');
      menu.setAttribute('role', 'menu');

      const isOwn = String(post.userId || '') === currentUid();
      const adminIds = badgeCache.adminIds;
      const iAmAdmin = adminIds.has(currentUid());

      const addItem = (label, handler, options = {}) => {
        const item = element('button', 'homework-post-menu-item', label);
        item.type = 'button';
        if (options.modifier) item.classList.add(`homework-post-menu-item--${options.modifier}`);
        if (options.disabled) {
          item.disabled = true;
          item.classList.add('homework-post-menu-item--disabled');
        }
        if (typeof handler === 'function') {
          item.addEventListener('click', async (clickEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
            closeMenu();
            await handler();
          });
        }
        menu.appendChild(item);
        return item;
      };

      const reports = Number(post.reportCount) || 0;

      if (isOwn) {
        addItem('Редактировать', () => openPostEditor(post, context));
        addItem('Скопировать текст', async () => {
          const copied = await copyText(post.textContent || '');
          notify(copied ? 'Текст скопирован' : 'Не удалось скопировать текст', copied ? 'success' : 'error');
        });
        addItem('Поделиться', () => sharePost(post, context));
        addItem('Удалить публикацию', () => deletePost(post, context), { modifier: 'danger' });
        addItem(`Жалобы: ${reports} из ${REPORT_LIMIT}`, null, { disabled: true });
      } else {
        addItem('Скопировать текст', async () => {
          const copied = await copyText(post.textContent || '');
          notify(copied ? 'Текст скопирован' : 'Не удалось скопировать текст', copied ? 'success' : 'error');
        });
        addItem('Поделиться', () => sharePost(post, context));
        addItem(`Пожаловаться (${reports} из ${REPORT_LIMIT})`, () => reportPost(post, context), { modifier: 'danger' });
        if (iAmAdmin) addItem('Удалить публикацию', () => deletePost(post, context), { modifier: 'danger' });
      }

      document.body.appendChild(menu);
      openMenu = menu;

      const rect = anchor.getBoundingClientRect();
      const width = menu.offsetWidth || 220;
      const height = menu.offsetHeight || 180;
      let left = rect.right - width;
      if (left < 8) left = 8;
      if (left + width > global.innerWidth - 8) left = Math.max(8, global.innerWidth - width - 8);
      let top = rect.bottom + 6;
      if (top + height > global.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
      menu.style.left = `${Math.round(left)}px`;
      menu.style.top = `${Math.round(top)}px`;

      const onDocumentClick = (event) => {
        if (menu.contains(event.target)) return;
        closeMenu();
        document.removeEventListener('click', onDocumentClick, true);
        global.removeEventListener('resize', closeMenu);
        global.removeEventListener('scroll', closeMenu, true);
      };
      setTimeout(() => {
        document.addEventListener('click', onDocumentClick, true);
        global.addEventListener('resize', closeMenu);
        global.addEventListener('scroll', closeMenu, true);
      }, 0);

      return menu;
    },
  };

  /* =========================== 4. Панель администратора =========================== */

  const AdminPanel = {
    refreshInterval: MODERATION_TAB_REFRESH,

    async render() {
      const root = element('div', 'admin-panel');
      root.id = 'admin-panel';

      const header = element('div', 'admin-panel-header');
      header.appendChild(element('h2', null, 'Панель администратора'));
      header.appendChild(element('p', 'admin-panel-subtitle', 'Пользователи, роли и модерация публикаций'));
      root.appendChild(header);

      const cache = await loadBadgeData(true);
      const uid = currentUid();
      const user = currentUser();
      const isAdmin = Boolean(
        (uid && cache.adminIds.has(uid)) ||
        (user && user.email && cache.adminIds.has(String(user.email).toLowerCase()))
      );
      if (!isAdmin) {
        const denied = element('div', 'admin-panel-denied');
        denied.appendChild(element('p', null, 'Панель доступна только администраторам приложения.'));
        root.appendChild(denied);
        return root;
      }

      const tabs = element('div', 'admin-panel-tabs');
      const content = element('div', 'admin-panel-content');
      const buttons = {};
      const selectTab = async (name) => {
        Object.entries(buttons).forEach(([key, button]) => button.classList.toggle('selected', key === name));
        clear(content);
        if (name === 'moderation') await this.renderModerationTab(content);
        else await this.renderUsersTab(content);
      };
      [['users', 'Пользователи'], ['moderation', 'Модерация']].forEach(([name, label]) => {
        const button = element('button', 'radio-button admin-panel-tab', label);
        button.type = 'button';
        button.addEventListener('click', () => selectTab(name));
        buttons[name] = button;
        tabs.appendChild(button);
      });
      root.appendChild(tabs);
      root.appendChild(content);
      await selectTab('users');
      return root;
    },

    /* ------------------------------- Вкладка «Пользователи» ------------------------------- */

    async renderUsersTab(container) {
      const cache = await loadBadgeData(true);
      const loading = element('p', 'admin-panel-loading', 'Загружаю пользователей…');
      container.appendChild(loading);

      const accountsResult = global.database && typeof global.database.getAllAccounts === 'function'
        ? await global.database.getAllAccounts()
        : { accounts: [] };
      const accounts = Array.isArray(accountsResult.accounts) ? accountsResult.accounts : [];
      clear(container);

      const users = new Map();
      const addUser = (source) => {
        if (!source) return;
        const uid = String(source.userId || source.uid || source.id || '');
        if (!uid) return;
        users.set(uid, { ...(users.get(uid) || {}), ...source, uid });
      };
      accounts.forEach(addUser);
      cache.byUid.forEach((profile, uid) => addUser({ uid, ...profile }));
      cache.adminIds.forEach((value) => {
        if (value && String(value).length > 20) addUser({ uid: String(value) });
      });

      if (users.size === 0) {
        container.appendChild(element('p', 'admin-panel-empty', 'Пользователи пока не найдены.'));
        return;
      }

      const search = element('input', 'admin-panel-search');
      search.type = 'search';
      search.placeholder = 'Поиск по имени, почте или группе';
      container.appendChild(search);

      const summary = element('p', 'admin-panel-summary');
      container.appendChild(summary);

      const list = element('div', 'admin-user-list');
      container.appendChild(list);

      const rows = [];

      Array.from(users.values())
        .sort((a, b) => String(a.userName || a.userEmail || a.uid).localeCompare(String(b.userName || b.userEmail || b.uid), 'ru'))
        .forEach((user) => {
          const row = this.createUserRow(user, cache);
          rows.push({ user, row });
          list.appendChild(row);
        });

      summary.textContent = `Всего пользователей: ${rows.length}`;

      search.addEventListener('input', () => {
        const query = search.value.trim().toLowerCase();
        let visible = 0;
        rows.forEach(({ user, row }) => {
          const haystack = [user.userName, user.userEmail, user.userGroup, user.customTag, user.uid]
            .filter(Boolean).join(' ').toLowerCase();
          const matches = !query || haystack.includes(query);
          row.hidden = !matches;
          if (matches) visible += 1;
        });
        summary.textContent = `Показано: ${visible} из ${rows.length}`;
      });
    },

    createUserRow(user, cache) {
      const row = element('article', 'admin-user');
      row.dataset.uid = user.uid;

      const uid = String(user.uid);
      const isAdmin = cache.adminIds.has(uid) || (user.userEmail && cache.adminIds.has(String(user.userEmail).toLowerCase()));
      const role = user.role === ROLE_STAROSTA || user.role === ROLE_TEACHER ? user.role : '';
      if (user.blocked) row.classList.add('admin-user--blocked');

      const head = element('div', 'admin-user-head');
      const nameBox = element('div', 'admin-user-name-box');
      const name = element('p', 'admin-user-name', user.userName || user.userEmail || `ID ${uid.slice(0, 8)}`);
      nameBox.appendChild(name);
      const meta = element('p', 'admin-user-meta', [
        user.userEmail || 'почта не указана',
        user.userGroup ? `группа ${user.userGroup}` : 'группа не выбрана',
        user.userSubgroup ? `${user.userSubgroup}-я подгруппа` : null,
        user.userLanguage || null,
      ].filter(Boolean).join(' · '));
      nameBox.appendChild(meta);

      const badges = element('span', 'admin-user-badges');
      if (isAdmin) badges.appendChild(createBadge({ kind: 'admin', text: ADMIN_BADGE_TEXT }));
      if (role) badges.appendChild(createBadge({ kind: role, text: ROLE_LABELS[role] }));
      if (user.customTag) badges.appendChild(createBadge({ kind: 'custom', text: user.customTag }));
      if (user.blocked) badges.appendChild(element('span', 'homework-role-badge homework-role-badge--blocked', 'Заблокирован'));
      head.appendChild(nameBox);
      head.appendChild(badges);
      row.appendChild(head);

      const controls = element('div', 'admin-user-controls');

      /* Роль */
      const roleLabel = element('label', 'admin-user-field');
      roleLabel.appendChild(element('span', null, 'Статус'));
      const roleSelect = element('select', 'admin-user-select');
      [['', 'Без статуса'], [ROLE_STAROSTA, ROLE_LABELS[ROLE_STAROSTA]], [ROLE_TEACHER, ROLE_LABELS[ROLE_TEACHER]]]
        .forEach(([value, label]) => {
          const option = element('option', null, label);
          option.value = value;
          roleSelect.appendChild(option);
        });
      roleSelect.value = role;
      roleSelect.addEventListener('change', async () => {
        roleSelect.disabled = true;
        const result = await global.database.setUserRole(uid, roleSelect.value);
        roleSelect.disabled = false;
        notify((result && result.message) || 'Статус обновлён', result && result.success ? 'success' : 'error');
        if (typeof global.refreshCurrentPage === 'function') global.refreshCurrentPage();
      });
      roleLabel.appendChild(roleSelect);
      controls.appendChild(roleLabel);

      /* Свой тег */
      const tagLabel = element('label', 'admin-user-field');
      tagLabel.appendChild(element('span', null, 'Свой тег'));
      const tagInput = element('input', 'admin-user-input');
      tagInput.type = 'text';
      tagInput.maxLength = 24;
      tagInput.placeholder = 'например: куратор';
      tagInput.value = user.customTag || '';
      const tagButton = element('button', 'admin-user-button', 'Сохранить');
      tagButton.type = 'button';
      tagButton.addEventListener('click', async () => {
        tagButton.disabled = true;
        const result = await global.database.setUserTag(uid, tagInput.value);
        tagButton.disabled = false;
        notify((result && result.message) || 'Тег сохранён', result && result.success ? 'success' : 'error');
        if (typeof global.refreshCurrentPage === 'function') global.refreshCurrentPage();
      });
      tagLabel.appendChild(tagInput);
      tagLabel.appendChild(tagButton);
      controls.appendChild(tagLabel);

      /* Блокировка */
      const blockBox = element('div', 'admin-user-block');
      const blockButton = element('button', `admin-user-button ${user.blocked ? 'admin-user-button--success' : 'admin-user-button--danger'}`, user.blocked ? 'Разблокировать' : 'Заблокировать');
      blockButton.type = 'button';
      const reasonBox = element('div', 'admin-user-block-reason');
      const reasonInput = element('input', 'admin-user-input');
      reasonInput.type = 'text';
      reasonInput.placeholder = 'Причина блокировки';
      const reasonApply = element('button', 'admin-user-button admin-user-button--danger', 'Подтвердить');
      reasonApply.type = 'button';
      const reasonCancel = element('button', 'admin-user-button', 'Отмена');
      reasonCancel.type = 'button';
      reasonBox.appendChild(reasonInput);
      reasonBox.appendChild(reasonApply);
      reasonBox.appendChild(reasonCancel);
      reasonBox.hidden = true;

      const applyBlock = async (blocked, reason) => {
        blockButton.disabled = true;
        const result = await global.database.setUserBlocked(uid, blocked, reason);
        blockButton.disabled = false;
        notify((result && result.message) || 'Готово', result && result.success ? 'success' : 'error');
        if (typeof global.refreshCurrentPage === 'function') global.refreshCurrentPage();
      };

      blockButton.addEventListener('click', async () => {
        if (user.blocked) { await applyBlock(false, ''); return; }
        reasonBox.hidden = false;
        reasonInput.focus();
      });
      reasonCancel.addEventListener('click', () => { reasonBox.hidden = true; });
      reasonApply.addEventListener('click', async () => {
        reasonBox.hidden = true;
        await applyBlock(true, reasonInput.value);
      });

      blockBox.appendChild(blockButton);
      blockBox.appendChild(reasonBox);
      controls.appendChild(blockBox);

      /* Публикации пользователя */
      const postsButton = element('button', 'admin-user-button', 'Публикации');
      postsButton.type = 'button';
      const postsBox = element('div', 'admin-user-posts');
      postsBox.hidden = true;
      postsButton.addEventListener('click', async () => {
        if (!postsBox.hidden) { postsBox.hidden = true; postsButton.textContent = 'Публикации'; return; }
        postsBox.hidden = false;
        postsButton.textContent = 'Скрыть публикации';
        clear(postsBox);
        postsBox.appendChild(element('p', 'admin-panel-loading', 'Загружаю публикации…'));
        const result = await global.database.getPostsByUser(uid);
        clear(postsBox);
        const posts = AdminPanel.groupPosts({ texts: result.texts || [], images: result.images || [] });
        if (posts.length === 0) {
          postsBox.appendChild(element('p', 'admin-panel-empty', 'У пользователя нет публикаций.'));
          return;
        }
        posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        posts.forEach((post) => postsBox.appendChild(AdminPanel.createCompactPostCard(post, {
          onDelete: () => {
            const node = postsBox.querySelector(`[data-post="${post.postId}"]`);
            if (node && node.parentNode) node.parentNode.removeChild(node);
          },
        })));
      });
      controls.appendChild(postsButton);

      row.appendChild(controls);
      row.appendChild(postsBox);
      return row;
    },

    /* -------------------------------- Вкладка «Модерация» -------------------------------- */

    async renderModerationTab(container) {
      const list = element('div', 'admin-moderation-list');
      const toolbar = element('div', 'admin-moderation-toolbar');
      const status = element('p', 'admin-panel-summary');
      const refreshButton = element('button', 'admin-user-button', 'Обновить список');
      refreshButton.type = 'button';
      const order = [];
      let timer = null;

      toolbar.appendChild(status);
      toolbar.appendChild(refreshButton);
      container.appendChild(toolbar);
      container.appendChild(list);

      const loadQueue = async (options = {}) => {
        const result = global.database && typeof global.database.getPendingPosts === 'function'
          ? await global.database.getPendingPosts()
          : { texts: [], images: [] };
        let posts = AdminPanel.groupPosts({ texts: result.texts || [], images: result.images || [] });
        if (options.shuffle) shuffle(posts);

        // Порядок фиксируется: уже показанные публикации не перемешиваются, новые — в конце.
        const rank = new Map(order.map((id, index) => [id, index]));
        posts.sort((a, b) => {
          const aRank = rank.has(a.postId) ? rank.get(a.postId) : Number.MAX_SAFE_INTEGER;
          const bRank = rank.has(b.postId) ? rank.get(b.postId) : Number.MAX_SAFE_INTEGER;
          if (aRank !== bRank) return aRank - bRank;
          return (a.timestamp || 0) - (b.timestamp || 0);
        });
        order.length = 0;
        posts.forEach((post) => order.push(post.postId));
        return posts;
      };

      const draw = async (options = {}) => {
        const posts = await loadQueue(options);
        clear(list);
        if (posts.length === 0) {
          list.appendChild(element('p', 'admin-panel-empty', 'Неотмодерированных публикаций нет.'));
        } else {
          posts.forEach((post) => list.appendChild(this.createModerationCard(post, {
            onDone: async (alreadyModerated) => {
              await draw({ shuffle: false });
              if (alreadyModerated) {
                const note = element('p', 'admin-moderation-note', 'Контент уже был отмодерирован');
                list.insertBefore(note, list.firstChild);
                setTimeout(() => { if (note.parentNode) note.parentNode.removeChild(note); }, 4000);
              }
            },
          })));
        }
        status.textContent = posts.length === 0
          ? 'Очередь пуста'
          : `${posts.length} ${plural(posts.length, 'публикация', 'публикации', 'публикаций')} ждут проверки`;
        return posts.length;
      };

      refreshButton.addEventListener('click', () => draw({ shuffle: false }));

      const initial = await draw({ shuffle: true });
      if (initial > 0) {
        timer = setInterval(() => {
          if (!isAlive(container)) { clearInterval(timer); return; }
          draw({ shuffle: false });
        }, Number(this.refreshInterval) || MODERATION_TAB_REFRESH);
      }
      return container;
    },

    createModerationCard(post, handlers = {}) {
      const card = element('article', 'admin-moderation-card');
      card.dataset.post = post.postId;

      const head = element('div', 'admin-moderation-head');
      const titleBox = element('div', 'admin-moderation-title-box');
      titleBox.appendChild(element('p', 'admin-moderation-title', post.subject || 'Занятие без названия'));
      const when = post.subjectTimestamp ? new Date(Number(post.subjectTimestamp) * 1000) : (post.timestamp ? new Date(Number(post.timestamp)) : null);
      const metaParts = [
        post.textType === 'homework' ? 'Домашнее задание' : 'Материал',
        when && !Number.isNaN(when.getTime()) ? `${formatDate(when)}, ${formatTime(when)}` : null,
        post.author ? `автор: ${post.author}` : null,
        post.userGroup ? `группа ${post.userGroup}` : null,
      ].filter(Boolean);
      titleBox.appendChild(element('p', 'admin-moderation-meta', metaParts.join(' · ')));
      head.appendChild(titleBox);

      const badges = element('span', 'admin-moderation-badges');
      badges.appendChild(element('span', 'homework-moderation-badge', 'Не проверено'));
      if (Number(post.reportCount) > 0) {
        badges.appendChild(element('span', 'homework-role-badge homework-role-badge--blocked', `Жалоб: ${post.reportCount} из ${REPORT_LIMIT}`));
      }
      head.appendChild(badges);
      card.appendChild(head);

      const body = element('div', 'admin-moderation-body');
      if (post.textContent) body.appendChild(element('p', 'admin-moderation-text', post.textContent));
      if (post.images.length > 0) {
        const grid = element('div', 'homework-image-grid');
        post.images.forEach((image) => {
          const url = image.imageUrl || image.url;
          if (!url) return;
          const img = element('img', 'homework-post-image');
          img.src = url;
          img.alt = 'Изображение публикации';
          img.loading = 'lazy';
          img.addEventListener('click', () => {
            if (global.imageViewer) global.imageViewer.open(url);
          });
          grid.appendChild(img);
        });
        body.appendChild(grid);
      }
      card.appendChild(body);

      const actions = element('div', 'admin-moderation-actions');
      const rejectButton = element('button', 'admin-moderation-button admin-moderation-button--reject', 'Отклонить');
      rejectButton.type = 'button';
      const approveButton = element('button', 'admin-moderation-button admin-moderation-button--approve', 'Принять');
      approveButton.type = 'button';
      const note = element('p', 'admin-moderation-note');
      note.hidden = true;

      const runDecision = async (decision) => {
        rejectButton.disabled = true;
        approveButton.disabled = true;
        note.hidden = true;
        const result = await global.database.moderatePost(post, decision);
        if (result && result.success) {
          notify(result.message, 'success');
          if (typeof handlers.onDone === 'function') await handlers.onDone(false);
          return;
        }
        rejectButton.disabled = false;
        approveButton.disabled = false;
        const text = (result && result.message) || 'Не удалось выполнить модерацию';
        note.textContent = text;
        note.hidden = false;
        notify(text, result && result.alreadyModerated ? 'info' : 'error');
        if (result && result.alreadyModerated && typeof handlers.onDone === 'function') {
          setTimeout(() => { handlers.onDone(true); }, 600);
        }
      };

      rejectButton.addEventListener('click', () => runDecision('reject'));
      approveButton.addEventListener('click', () => runDecision('approve'));

      actions.appendChild(rejectButton);
      actions.appendChild(note);
      actions.appendChild(approveButton);
      card.appendChild(actions);
      return card;
    },

    /* ---------------------------------- Общие части ---------------------------------- */

    /** Собирает публикации из документов texts и images, группируя их по postId */
    groupPosts(source) {
      const texts = Array.isArray(source && source.texts) ? source.texts : [];
      const images = Array.isArray(source && source.images) ? source.images : [];
      const posts = new Map();

      const ensure = (key, record) => {
        if (!posts.has(key)) {
          posts.set(key, {
            postId: key,
            textIds: [],
            imageIds: [],
            textContent: '',
            textType: 'material',
            author: '',
            userId: '',
            userGroup: '',
            userSubgroup: null,
            subject: '',
            subjectTimestamp: 0,
            moderation: MODERATION_APPROVED,
            reportCount: 0,
            reportedBy: [],
            images: [],
            timestamp: 0,
          });
        }
        const post = posts.get(key);
        if (record) {
          post.author = record.author || post.author;
          post.userId = record.userId || post.userId;
          post.userGroup = record.userGroup || post.userGroup;
          post.userSubgroup = record.userSubgroup || post.userSubgroup;
          post.subject = record.subject || post.subject;
          post.subjectTimestamp = Number(record.subjectTimestamp) || post.subjectTimestamp;
          post.timestamp = Number(record.timestamp) || post.timestamp;
          post.reportCount = Math.max(post.reportCount, Number(record.reportCount) || 0);
          if (Array.isArray(record.reportedBy)) post.reportedBy = record.reportedBy;
        }
        return post;
      };

      texts.forEach((text, index) => {
        const key = String(text.postId || text.textId || `text-${index}`);
        const post = ensure(key, text);
        if (text.id) post.textIds.push(String(text.id));
        post.textContent = String(text.textContent || '');
        post.textType = text.textType === 'homework' ? 'homework' : 'material';
        if (text.moderation === MODERATION_PENDING) post.moderation = MODERATION_PENDING;
      });

      images.forEach((image, index) => {
        const key = String(image.postId || image.textId || `image-${index}`);
        const post = ensure(key, image);
        if (image.id) post.imageIds.push(String(image.id));
        post.images.push(image);
        if (image.moderation === MODERATION_PENDING) post.moderation = MODERATION_PENDING;
      });

      return Array.from(posts.values());
    },

    createCompactPostCard(post, handlers = {}) {
      const card = element('div', 'admin-post-card');
      card.dataset.post = post.postId;
      const meta = [
        post.textType === 'homework' ? 'ДЗ' : 'Материал',
        post.subject || null,
        post.timestamp ? formatDateTime(post.timestamp) : null,
        post.moderation === MODERATION_PENDING ? 'не проверено' : 'проверено',
        Number(post.reportCount) > 0 ? `жалоб: ${post.reportCount}` : null,
      ].filter(Boolean);
      card.appendChild(element('p', 'admin-post-card-meta', meta.join(' · ')));
      if (post.textContent) card.appendChild(element('p', 'admin-post-card-text', post.textContent));
      if (post.images.length > 0) {
        const grid = element('div', 'homework-image-grid');
        post.images.forEach((image) => {
          const url = image.imageUrl || image.url;
          if (!url) return;
          const img = element('img', 'homework-post-image');
          img.src = url;
          img.alt = 'Изображение публикации';
          img.loading = 'lazy';
          img.addEventListener('click', () => {
            if (global.imageViewer) global.imageViewer.open(url);
          });
          grid.appendChild(img);
        });
        if (grid.firstChild) card.appendChild(grid);
      }
      const actions = element('div', 'admin-post-card-actions');
      const removeButton = element('button', 'admin-user-button admin-user-button--danger', 'Удалить');
      removeButton.type = 'button';
      removeButton.addEventListener('click', async () => {
        removeButton.disabled = true;
        const result = await global.database.deletePosts({ postId: post.postId, textIds: post.textIds, imageIds: post.imageIds });
        removeButton.disabled = false;
        notify((result && result.message) || 'Готово', result && result.success ? 'success' : 'error');
        if (result && result.success) {
          if (typeof handlers.onDelete === 'function') handlers.onDelete();
          if (typeof global.refreshCurrentPage === 'function') global.refreshCurrentPage();
        }
      });
      actions.appendChild(removeButton);
      card.appendChild(actions);
      return card;
    },
  };

  /* =========================== Экспорт =========================== */

  global.UserBadges = UserBadges;
  global.PostMenu = PostMenu;
  global.AdminPanel = AdminPanel;
  global.GovernanceStore = {
    REPORT_LIMIT,
    MODERATION_PENDING,
    MODERATION_APPROVED,
    ROLE_STAROSTA,
    ROLE_TEACHER,
  };
})(window);
