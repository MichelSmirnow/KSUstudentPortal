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
 *                     moderatedAt, reportCount, reportedBy. Обращения в поддержку хранятся
 *                     в тех же коллекциях: textType 'feedback' (вопрос) и 'feedbackAnswer' (ответ),
 *                     поле feedbackOwner — владелец обращения, feedbackQuestion — id вопроса;
 *   reports         — жалобы пользователей; id документа: <postId>__<uid>, повторно пожаловаться нельзя;
 *   userdata/{uid}  — роли и ограничения: role ('starosta'|'teacher'|'proforg'|'kultorg'), customTag,
 *                     blocked, blockedReason, blockedBy, blockedAt, emailVerifiedByAdmin;
 *   accounts/{uid}  — профиль: группа, язык, registeredAt, achievements (массив ключей латиницей),
 *                     achievementsMeta (когда получено), favoriteGroups, hiddenFeedback;
 *   admindata/{uid} — админы (назначает владелец) + счётчики: moderationsCount, feedbackAnsweredCount;
 * ========================================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ Константы */

  const REPORT_LIMIT = 7;                    // сколько жалоб удаляет публикацию
  const MODERATION_PENDING = 'pending';      // «не проверено»
  const MODERATION_APPROVED = 'approved';    // «проверено»
  const ROLE_STAROSTA = 'starosta';
  const ROLE_TEACHER = 'teacher';
  const ROLE_PROFORG = 'proforg';
  const ROLE_KULTORG = 'kultorg';
  // Порядок важен: он же порядок пунктов в списке статусов
  const ROLE_LABELS = {
    [ROLE_STAROSTA]: 'Староста',
    [ROLE_PROFORG]: 'Профорг',
    [ROLE_KULTORG]: 'Культорг',
    [ROLE_TEACHER]: 'Преподаватель',
  };
  const ROLES = [ROLE_STAROSTA, ROLE_PROFORG, ROLE_KULTORG, ROLE_TEACHER];

  // Обращения в службу поддержки («Обратная связь»)
  const FEEDBACK_SUBJECT = 'Обратная связь';
  const FEEDBACK_QUESTION = 'feedback';
  const FEEDBACK_ANSWER = 'feedbackAnswer';
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

  function networkOffline() {
    try { return typeof navigator !== 'undefined' && navigator.onLine === false; }
    catch (_) { return false; }
  }

  function installGovernanceExtensions() {
    const database = global.database;
    if (!database || !database.constructor || !database.constructor.prototype) return;
    const prototype = database.constructor.prototype;

    /* ------------------------- Профили пользователей (userdata) ------------------------- */

    prototype.getUserdata = async function getUserdata(userId) {
      if (networkOffline()) return { success: false, profile: null, offline: true, message: 'Нет подключения к интернету' };
      try {
        const doc = await global.waitForNetwork(this.db.collection('userdata').doc(String(userId)).get(), 6000, null);
        if (!doc) return { success: false, profile: null, message: 'Сервер не отвечает' };
        const data = typeof doc.data === 'function' ? doc.data() : null;
        return { success: true, profile: data || null };
      } catch (error) {
        return { success: false, profile: null, message: `Не удалось получить данные пользователя: ${error && error.message ? error.message : error}` };
      }
    };

    prototype.getAllUserdata = async function getAllUserdata() {
      if (networkOffline()) return { success: false, profiles: [], offline: true, message: 'Нет подключения к интернету' };
      try {
        const snapshot = await global.waitForNetwork(this.db.collection('userdata').get(), 6000, null);
        if (!snapshot) return { success: false, profiles: [], message: 'Сервер не отвечает' };
        return { success: true, profiles: snapshotToArray(snapshot) };
      } catch (error) {
        return { success: false, profiles: [], message: `Не удалось получить список ролей: ${error && error.message ? error.message : error}` };
      }
    };

    prototype.updateUserdata = async function updateUserdata(userId, changes) {
      if (networkOffline()) return { success: false, offline: true, message: 'Нет подключения к интернету: изменения не сохранены' };
      try {
        const user = this.auth.getCurrentUser();
        if (!user) return { success: false, message: 'Пользователь не авторизован' };
        const payload = { ...(changes || {}), userId: String(userId), updatedAt: Date.now(), updatedBy: user.uid };
        const saved = await global.waitForNetwork(this.db.collection('userdata').doc(String(userId)).set(payload, { merge: true }), 8000, '__no_answer__');
        if (saved === '__no_answer__') return { success: false, message: 'Сервер не отвечает: изменения не сохранены' };
        if (global.UserBadges) global.UserBadges.invalidate();
        return { success: true, profile: payload, message: 'Данные пользователя обновлены' };
      } catch (error) {
        return { success: false, message: `Не удалось обновить данные пользователя: ${error && error.message ? error.message : error}` };
      }
    };

    prototype.setUserRole = async function setUserRole(userId, role) {
      const value = ROLES.includes(role) ? role : '';
      return this.updateUserdata(userId, { role: value });
    };

    prototype.setUserTag = async function setUserTag(userId, tag) {
      const value = String(tag || '').trim().slice(0, 24);
      return this.updateUserdata(userId, { customTag: value });
    };

    prototype.setUserBlocked = async function setUserBlocked(userId, blocked, reason, until) {
      const admin = currentUser();
      const now = Date.now();
      // ✓ Блокировка может быть временной: until — мс до конца срока (0 = навсегда)
      const untilMs = blocked ? (Number(until) > 0 ? Number(until) : 0) : 0;
      // ✓ История блокировок: копится в userdata и показывается в карточке профиля
      let log = [];
      try {
        const stored = await this.getUserdata(userId);
        const current = stored && stored.profile ? stored.profile : null;
        log = current && Array.isArray(current.blockLog) ? current.blockLog.slice(0, 39) : [];
      } catch (_) { /* без истории — начнём новую */ }
      log.unshift({
        at: now,
        action: blocked ? 'block' : 'unblock',
        until: untilMs,
        reason: blocked ? String(reason || '').trim().slice(0, 200) : '',
        by: admin ? String(admin.displayName || admin.email || admin.uid || '') : '',
      });
      return this.updateUserdata(userId, {
        blocked: Boolean(blocked),
        blockedReason: blocked ? String(reason || '').trim().slice(0, 200) : '',
        blockedBy: blocked ? (admin ? admin.uid : '') : '',
        blockedAt: blocked ? now : null,
        blockedUntil: untilMs,
        blockLog: log.slice(0, 40),
      });
    };

    /** ✓ Модерация описания и аватара: админ пишет в аккаунт пользователя (только поля профиля) */
    prototype.adminUpdateAccount = async function adminUpdateAccount(userId, fields) {
      if (networkOffline()) return { success: false, offline: true, message: 'Нет подключения к интернету' };
      const payload = { ...(fields || {}) };
      delete payload.userId;
      delete payload.uid;
      if (Object.keys(payload).length === 0) return { success: false, message: 'Нет данных для обновления' };
      try {
        const saved = await global.waitForNetwork(
          this.db.collection('accounts').doc(String(userId)).set(payload, { merge: true }),
          8000, '__no_answer__'
        );
        if (saved === '__no_answer__') return { success: false, message: 'Сервер не отвечает' };
        return { success: true, message: 'Профиль обновлён' };
      } catch (error) {
        return { success: false, message: `Ошибка обновления профиля: ${error && error.message ? error.message : error}` };
      }
    };

    /* ------------------------------ Счётчики администратора ------------------------------ */

    /**
     * Счётчики админа живут в его собственной записи admindata: модерации и ответы
     * в службе поддержки. Правила Firestore проверяют, что счётчик не уменьшается,
     * поэтому накрутить его «в минус» и обнулить свои достижения нельзя.
     */
    prototype.incrementAdminCounter = async function incrementAdminCounter(fieldName) {
      const field = fieldName === 'feedbackAnsweredCount' ? 'feedbackAnsweredCount' : 'moderationsCount';
      try {
        const user = this.auth.getCurrentUser();
        if (!user) return { success: false, message: 'Пользователь не авторизован' };
        if (!global.firebase || !global.firebase.firestore || !global.firebase.firestore.FieldValue) {
          return { success: false, message: 'Firebase недоступен' };
        }
        await this.db.collection('admindata').doc(String(user.uid)).set({
          [field]: global.firebase.firestore.FieldValue.increment(1),
          countersUpdatedAt: Date.now(),
        }, { merge: true });
        if (badgeCache.admins instanceof Map) {
          const current = badgeCache.admins.get(String(user.uid)) || {};
          badgeCache.admins.set(String(user.uid), { ...current, [field]: (Number(current[field]) || 0) + 1 });
        }
        return { success: true };
      } catch (error) {
        // Счётчик — вспомогательная величина: публикацию или ответ из-за него не отменяем
        console.warn('Счётчик администратора не обновлён:', error && error.message ? error.message : error);
        return { success: false, message: 'Не удалось обновить счётчик администратора' };
      }
    };

    prototype.getAllAdmindata = async function getAllAdmindata() {
      try {
        const snapshot = await this.db.collection('admindata').get();
        return { success: true, admins: snapshotToArray(snapshot) };
      } catch (error) {
        return { success: false, admins: [], message: `Не удалось получить данные администраторов: ${error && error.message ? error.message : error}` };
      }
    };

    /* ---------------------- Подтверждение почты администратором ---------------------- */

    /**
     * Подтвердить почту пользователя «вручную» из панели администратора.
     * Клиентский Firebase не умеет менять флаг emailVerified другого аккаунта
     * (для этого нужен Admin SDK на сервере), поэтому подтверждение хранится
     * в userdata/{uid}.emailVerifiedByAdmin и учитывается приложением наравне
     * с настоящим подтверждением. Писать в userdata может только администратор —
     * это проверяет Firestore, а не клиент.
     */
    prototype.confirmUserEmail = async function confirmUserEmail(userId, confirmed) {
      const value = confirmed !== false;
      const user = this.auth.getCurrentUser();
      return this.updateUserdata(String(userId), {
        emailVerifiedByAdmin: value,
        emailVerifiedBy: value && user ? user.uid : '',
        emailVerifiedAt: value ? Date.now() : null,
      });
    };

    /* ------------------------------ Обращения в поддержку ------------------------------ */

    prototype.getFeedbackThreads = async function getFeedbackThreads() {
      try {
        const [questionsSnapshot, imagesSnapshot, answersSnapshot] = await Promise.all([
          this.db.collection('texts').where('textType', '==', FEEDBACK_QUESTION).get(),
          this.db.collection('images').where('imageType', '==', FEEDBACK_QUESTION).get(),
          this.db.collection('texts').where('textType', '==', FEEDBACK_ANSWER).get(),
        ]);
        const questions = snapshotToArray(questionsSnapshot);
        const images = snapshotToArray(imagesSnapshot);
        const answers = snapshotToArray(answersSnapshot);

        const threads = questions.map((question) => {
          const postId = String(question.postId || question.textId || '');
          const threadAnswers = answers
            .filter((answer) => String(answer.feedbackQuestion || '') === postId)
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          return {
            postId,
            question,
            images: images.filter((image) => String(image.postId || '') === postId),
            answers: threadAnswers,
            answered: threadAnswers.length > 0,
            answeredBy: threadAnswers.length > 0 ? String(threadAnswers[threadAnswers.length - 1].userId || '') : '',
            answeredByName: threadAnswers.length > 0 ? String(threadAnswers[threadAnswers.length - 1].author || '') : '',
            answeredAt: threadAnswers.length > 0 ? (threadAnswers[threadAnswers.length - 1].timestamp || 0) : 0,
          };
        });

        threads.sort((a, b) => (b.question.timestamp || 0) - (a.question.timestamp || 0));
        return { success: true, threads };
      } catch (error) {
        return {
          success: false,
          threads: [],
          error: error && error.code,
          message: `Не удалось загрузить обращения: ${error && error.message ? error.message : error}`,
        };
      }
    };

    // ✓ Ответ администратора на обращение. Ответ — такая же публикация (texts/images),
    //   поэтому он попадает в общие правила безопасности: создавать ответы может
    //   только администратор (проверяется в firestore.rules).
    prototype.saveFeedbackAnswer = async function saveFeedbackAnswer(input) {
      try {
        const user = this.auth.getCurrentUser();
        if (!user) return { success: false, message: 'Пользователь не авторизован' };
        const data = input || {};
        const answerText = String(data.answerText || '').trim();
        if (!answerText) return { success: false, message: 'Введите текст ответа' };

        const questionPostId = String(data.questionPostId || '');
        const ownerUid = String(data.ownerUid || '');
        if (!questionPostId || !ownerUid) return { success: false, message: 'Обращение не найдено' };

        const timestamp = Date.now();
        const postId = `answer_${timestamp}_${Math.floor(Math.random() * 10000)}`;
        const textId = `text_${timestamp}_${Math.floor(Math.random() * 10000)}`;
        await this.db.collection('texts').doc(textId).set({
          textId,
          postId,
          userId: user.uid,
          author: user.displayName || 'Администратор',
          authorEmail: user.email || '',
          userGroup: '',
          subject: FEEDBACK_SUBJECT,
          teacher: '',
          subjectTimestamp: 0,
          textContent: answerText,
          textType: FEEDBACK_ANSWER,
          feedbackOwner: ownerUid,
          feedbackQuestion: questionPostId,
          imageCount: 0,
          timestamp,
          moderation: 'approved',
          reportCount: 0,
          reportedBy: [],
        }, { merge: true });

        await this.incrementAdminCounter('feedbackAnsweredCount');
        return { success: true, postId, textId, message: 'Ответ отправлен пользователю' };
      } catch (error) {
        return {
          success: false,
          error: error && error.code,
          message: `Не удалось сохранить ответ: ${error && error.message ? error.message : error}`,
        };
      }
    };

    // ✓ Скрыть обращение у пользователя (троеточие → «Удалить запрос»).
    //   У администраторов обращение остаётся навсегда: удаляем только у себя.
    prototype.hideFeedbackThread = async function hideFeedbackThread(postId) {
      try {
        const user = this.auth.getCurrentUser();
        if (!user) return { success: false, message: 'Пользователь не авторизован' };
        if (!global.firebase || !global.firebase.firestore || !global.firebase.firestore.FieldValue) {
          return { success: false, message: 'Firebase недоступен' };
        }
        await this.db.collection('accounts').doc(String(user.uid)).set({
          hiddenFeedback: global.firebase.firestore.FieldValue.arrayUnion(String(postId)),
          timestamp: Date.now(),
        }, { merge: true });
        return { success: true, message: 'Обращение удалено у вас (у администрации оно сохраняется)' };
      } catch (error) {
        return {
          success: false,
          error: error && error.code,
          message: `Не удалось удалить обращение: ${error && error.message ? error.message : error}`,
        };
      }
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

        // ✓ Счётчик модераций конкретного администратора — основа достижения
        //   «Квалифицированный админ». Хранится в его записи admindata.
        await this.incrementAdminCounter('moderationsCount');
        if (global.Achievements && typeof global.Achievements.evaluate === 'function') {
          global.Achievements.evaluate().catch(() => { /* достижения не критичны для модерации */ });
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
    admins: new Map(), // uid → запись admindata (счётчики модераций и ответов)
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

      const admins = new Map();
      try {
        if (global.database && typeof global.database.getAllAdmindata === 'function') {
          const result = await global.database.getAllAdmindata();
          (result && Array.isArray(result.admins) ? result.admins : []).forEach((record) => {
            if (!record) return;
            const uid = String(record.userId || record.id || '');
            if (uid) admins.set(uid, { ...(admins.get(uid) || {}), ...record });
          });
        }
      } catch (error) { console.warn('Счётчики администраторов недоступны:', error); }

      badgeCache.adminIds = adminIds;
      badgeCache.byUid = byUid;
      badgeCache.byEmail = byEmail;
      badgeCache.admins = admins;
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

  /** Текст тега достижения по ключу (или '') */
  function achievementTagText(key) {
    const value = String(key || '');
    if (!value) return '';
    const found = ACHIEVEMENTS.find((item) => item.key === value);
    return found && found.tag ? String(found.tag) : '';
  }

  /** Полный список значков: админ → преподаватель → староста → тег (достижение ИЛИ свой) → админский тег */
  function badgesFor(post, cache) {
    const badges = [];
    const profile = profileFor(post, cache);
    if (isAdminPost(post, cache)) badges.push({ kind: 'admin', text: ADMIN_BADGE_TEXT });
    if (profile && profile.role === ROLE_TEACHER) badges.push({ kind: 'teacher', text: ROLE_LABELS[ROLE_TEACHER] });
    else if (profile && profile.role === ROLE_STAROSTA) badges.push({ kind: 'starosta', text: ROLE_LABELS[ROLE_STAROSTA] });
    // ✓ Текстовый тег пользователя и тег достижения взаимоисключающи (XOR);
    //   тег администратора (customTag) и статусы работают параллельно с ними.
    const achievementText = achievementTagText(profile && profile.achievementTagKey);
    if (achievementText) badges.push({ kind: 'achievement', text: achievementText });
    else if (profile && profile.selfTag) badges.push({ kind: 'selftag', text: String(profile.selfTag) });
    if (profile && profile.customTag) badges.push({ kind: 'custom', text: String(profile.customTag) });
    return badges;
  }

  function createBadge(badge) {
    const node = element('span', badge.kind === 'admin' ? 'homework-admin-badge' : `homework-role-badge homework-role-badge--${badge.kind}`, badge.text);
    if (badge.kind === 'achievement') node.title = 'Тег за достижение';
    else if (badge.kind === 'selftag') node.title = 'Особый тег пользователя';
    else node.title = badge.kind === 'custom' ? 'Особый статус от администрации' : badge.text;
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
      const until = Number(profile && profile.blockedUntil) || 0;
      return {
        blocked: Boolean(profile && profile.blocked) && (until === 0 || until > Date.now()),
        blockedUntil: until,
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
        const response = await (global.fetchWithTimeout || global.fetch.bind(global))(url, { mode: 'cors', credentials: 'omit', timeout: 15000 });
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

  /* =========================== 4. Достижения =========================== */

  // Даты регистрации для «тестерских» достижений (по местному времени устройства)
  const TESTER_DEADLINES = {
    premium: new Date(2026, 9, 1).getTime(),   // до 01.10.2026
    alpha: new Date(2026, 9, 30).getTime(),    // до 30.10.2026
    beta: new Date(2027, 0, 1).getTime(),      // до 01.01.2027
  };

  /**
   * Список достижений. Ключи — строго латиницей: они хранятся массивом в
   * accounts/{uid}.achievements, дата получения — в accounts/{uid}.achievementsMeta.
   * Тот же список продублирован в firestore.rules: записать ключ, которого там нет,
   * или снять уже полученное достижение невозможно (проверяется сервером).
   * Картинки: images/achievements/<ключ>.png
   */
  const ACHIEVEMENTS = [
    { key: 'first_post', tag: 'Дебют', title: 'Первый пост', condition: '1 публикация', hint: 'Опубликуйте первый материал или домашнее задание', check: (stats) => stats.posts >= 1 },
    { key: 'posts_10', tag: 'Регуляр', title: 'Начинающий', condition: '10 публикаций', hint: 'Опубликуйте 10 записей', check: (stats) => stats.posts >= 10 },
    { key: 'posts_25', tag: 'Блогер', title: 'Продвинутый', condition: '25 публикаций', hint: 'Опубликуйте 25 записей', check: (stats) => stats.posts >= 25 },
    { key: 'posts_100', tag: 'Герой пера', title: 'Профи', condition: '100 публикаций', hint: 'Опубликуйте 100 записей', check: (stats) => stats.posts >= 100 },
    { key: 'posts_1000', tag: 'Марафон', title: 'Без личной жизни', condition: '1000 публикаций', hint: 'Опубликуйте 1000 записей', check: (stats) => stats.posts >= 1000 },
    { key: 'first_photo', tag: 'Щёлк!', title: 'Первый снимок', condition: '1 изображение', hint: 'Прикрепите изображение к публикации', check: (stats) => stats.photos >= 1 },
    { key: 'photos_25', tag: 'Кадровик', title: 'Любитель картинок', condition: '25 изображений', hint: 'Прикрепите 25 изображений', check: (stats) => stats.photos >= 25 },
    { key: 'photos_100', tag: 'Светопись', title: 'Фотограф', condition: '100 изображений', hint: 'Прикрепите 100 изображений', check: (stats) => stats.photos >= 100 },
    { key: 'photos_250', tag: 'Объектив', title: 'Мастер', condition: '250 изображений', hint: 'Прикрепите 250 изображений', check: (stats) => stats.photos >= 250 },
    { key: 'moderator_100', tag: 'Блюститель', title: 'Квалифицированный админ', condition: '100 модераций', hint: 'Проверьте 100 публикаций в панели администратора', check: (stats) => stats.moderations >= 100 },
    { key: 'callcenter_10', tag: 'На линии', title: 'Сотрудник call-центра', condition: '10 ответов', hint: 'Ответьте на 10 обращений в разделе «Фидбек»', check: (stats) => stats.answers >= 10 },
    { key: 'sirok', tag: 'Глазурь', title: 'Сырок', condition: '1 000 000 сырков', hint: 'Заготовка будущего достижения: механика сырков ещё не добавлена', check: () => false },
    { key: 'premium_tester', tag: 'Премиум', title: 'Премиальный тестировщик', condition: 'регистрация до 01.10.2026', hint: 'Зарегистрируйтесь до 1 октября 2026 года', check: (stats) => stats.registeredAt > 0 && stats.registeredAt < TESTER_DEADLINES.premium },
    { key: 'alpha_tester', tag: 'Альфа', title: 'Альфа-тестировщик', condition: 'регистрация до 30.10.2026', hint: 'Зарегистрируйтесь до 30 октября 2026 года', check: (stats) => stats.registeredAt > 0 && stats.registeredAt < TESTER_DEADLINES.alpha },
    { key: 'beta_tester', tag: 'Бета', title: 'Бета-тестировщик', condition: 'регистрация до 01.01.2027', hint: 'Зарегистрируйтесь до 1 января 2027 года', check: (stats) => stats.registeredAt > 0 && stats.registeredAt < TESTER_DEADLINES.beta },
  ];

  const ACHIEVEMENT_KEYS = ACHIEVEMENTS.map((item) => item.key);

  /** Собрать статистику пользователя для проверки условий достижений */
  async function collectAchievementStats(uid, account) {
    const stats = { posts: 0, photos: 0, moderations: 0, answers: 0, registeredAt: 0 };

    try {
      if (global.database && typeof global.database.getPostsByUser === 'function') {
        const result = await global.database.getPostsByUser(String(uid));
        const texts = Array.isArray(result && result.texts) ? result.texts : [];
        const images = Array.isArray(result && result.images) ? result.images : [];
        // Обращения в поддержку и ответы на них — не «посты» пользователя
        stats.posts = texts.filter((text) => text && text.textType !== FEEDBACK_QUESTION && text.textType !== FEEDBACK_ANSWER).length;
        stats.photos = images.length;
      }
    } catch (error) { console.warn('Не удалось посчитать публикации для достижений:', error); }

    try {
      const doc = await global.database.db.collection('admindata').doc(String(uid)).get();
      const data = typeof doc.data === 'function' ? doc.data() : null;
      if (data) {
        stats.moderations = Number(data.moderationsCount) || 0;
        stats.answers = Number(data.feedbackAnsweredCount) || 0;
      }
    } catch (error) { /* не администратор — счётчиков нет */ }

    // Если счётчик ответов ещё не заведён, считаем ответы по самим публикациям
    if (!stats.answers) {
      try {
        const result = await global.database.getTexts('userId', String(uid));
        const texts = Array.isArray(result && result.texts) ? result.texts : [];
        stats.answers = texts.filter((text) => text && text.textType === FEEDBACK_ANSWER).length;
      } catch (error) { /* не критично */ }
    }

    stats.registeredAt = Number(account && account.registeredAt) || 0;
    if (!stats.registeredAt && global.auth && typeof global.auth.getRegistrationTime === 'function') {
      const current = global.auth.getCurrentUser();
      if (current && String(current.uid) === String(uid)) stats.registeredAt = global.auth.getRegistrationTime();
    }
    return stats;
  }

  const Achievements = {
    LIST: ACHIEVEMENTS,
    KEYS: ACHIEVEMENT_KEYS,
    DEADLINES: TESTER_DEADLINES,

    find(key) {
      return ACHIEVEMENTS.find((item) => item.key === key) || null;
    },

    /** Только полученные достижения в порядке списка (у каждого — дата получения) */
    unpack(achievements, meta) {
      const keys = Array.isArray(achievements) ? achievements.map(String) : [];
      const dates = (meta && typeof meta === 'object') ? meta : {};
      return ACHIEVEMENTS
        .filter((item) => keys.includes(item.key))
        .map((item) => ({
          ...item,
          unlockedAt: Number(dates[item.key]) || 0,
          icon: `images/achievements/${item.key}.png`,
        }));
    },

    /**
     * Проверить условия достижений текущего пользователя и дописать новые в его аккаунт.
     * Firestore принимает только расширение списка и только известные ключи — откатить
     * достижения назад нельзя.
     */
    async evaluate() {
      try {
        if (networkOffline()) return { success: false, offline: true, added: [], achievements: [] };
        const user = global.auth && typeof global.auth.getCurrentUser === 'function' ? global.auth.getCurrentUser() : null;
        if (!user) return { success: false, added: [], achievements: [] };

        const accountResult = await global.database.getAccount(user.uid);
        const account = (accountResult && accountResult.account) ? accountResult.account : {};
        const stats = await collectAchievementStats(user.uid, account);

        const unlocked = ACHIEVEMENTS
          .filter((item) => {
            try { return item.check(stats) === true; } catch (_) { return false; }
          })
          .map((item) => item.key);

        const current = (Array.isArray(account.achievements) ? account.achievements : [])
          .map(String)
          .filter((key) => ACHIEVEMENT_KEYS.includes(key));
        const dates = (account.achievementsMeta && typeof account.achievementsMeta === 'object')
          ? { ...account.achievementsMeta }
          : {};

        const added = unlocked.filter((key) => !current.includes(key));
        if (added.length === 0) {
          return { success: true, added: [], achievements: current, meta: dates, stats };
        }

        const now = Date.now();
        added.forEach((key) => { dates[key] = now; });
        const next = current.concat(added);
        const saved = await global.database.updateAccount({ achievements: next, achievementsMeta: dates });

        if (saved && saved.success === true && typeof global.showNotification === 'function') {
          const titles = added.map((key) => {
            const item = Achievements.find(key);
            return item ? item.title : key;
          }).join(', ');
          global.showNotification(`Новое достижение: ${titles}`, 'success');
        }

        return { success: Boolean(saved && saved.success), added, achievements: next, meta: dates, stats };
      } catch (error) {
        console.warn('Достижения не обновлены:', error && error.message ? error.message : error);
        return { success: false, added: [], achievements: [] };
      }
    },

    /** Доска достижений: иконка, название, дата получения, подсказка и (во вкладке) тег */
    render(container, options) {
      if (!container) return container;
      const data = options || {};
      const unlocked = Achievements.unpack(data.achievements, data.meta);
      const unlockedByKey = new Map(unlocked.map((item) => [String(item.key), item]));
      // ✓ showAll — показать и заработанные, и заблокированные (вкладка «Достижения»)
      const items = data.showAll
        ? Achievements.LIST.map((item) => unlockedByKey.get(String(item.key))
          || { ...item, unlockedAt: 0, icon: `images/achievements/${item.key}.png` })
        : unlocked;
      const board = element('div', 'achievements-board');
      if (data.hideTitle !== true) board.appendChild(element('p', 'achievements-title', 'Достижения'));

      if (items.length === 0) {
        board.appendChild(element('p', 'achievements-empty', 'Пока нет ни одного достижения. Публикуйте материалы, изображения и отвечайте на обращения — они появятся здесь.'));
        container.appendChild(board);
        return container;
      }

      const equippedKey = String(data.equippedKey || '');
      const list = element('ul', 'achievements-list');
      items.forEach((achievement) => {
        const earned = unlockedByKey.has(String(achievement.key));
        const item = element('li', 'achievement' + (earned ? '' : ' achievement--locked'));
        const icon = element('img', 'achievement-icon');
        icon.src = achievement.icon;
        icon.alt = achievement.title;
        icon.loading = 'lazy';
        // Запасной вариант, если картинки нет: цветной кружок с первой буквой
        icon.addEventListener('error', () => {
          const fallback = element('span', 'achievement-icon achievement-icon--fallback', achievement.title.slice(0, 1));
          if (icon.parentNode) icon.parentNode.replaceChild(fallback, icon);
        });
        item.appendChild(icon);

        const body = element('div', 'achievement-body');
        body.appendChild(element('p', 'achievement-title', achievement.title));
        const dateText = achievement.unlockedAt ? formatDate(achievement.unlockedAt) : '';
        if (earned) {
          body.appendChild(element('p', 'achievement-date', dateText ? `Получено ${dateText}` : 'Получено'));
        } else {
          body.appendChild(element('p', 'achievement-date achievement-date--locked', 'Ещё не получено'));
        }
        body.appendChild(element('p', 'achievement-hint', `Как получить: ${achievement.hint} (${achievement.condition})`));

        // ✓ Тег достижения: короткая подпись, которую можно поставить вместо своего текстового тега
        if (data.showTags && achievement.tag) {
          const tagRow = element('div', 'achievement-tag-row');
          const chip = element('span', 'achievement-tag-chip' + (earned ? '' : ' achievement-tag-chip--locked'),
            String(achievement.tag));
          const equipped = equippedKey === String(achievement.key);
          if (!earned) {
            chip.title = 'Тег откроется вместе с достижением';
            tagRow.appendChild(chip);
          } else if (equipped) {
            chip.classList.add('achievement-tag-chip--active');
            tagRow.appendChild(chip);
            const off = element('button', 'account-standartButton achievement-tag-button achievement-tag-button--off', 'Убрать тег');
            off.type = 'button';
            off.addEventListener('click', () => { if (typeof data.onUnequip === 'function') data.onUnequip(); });
            tagRow.appendChild(off);
          } else {
            tagRow.appendChild(chip);
            const on = element('button', 'account-standartButton achievement-tag-button', 'Поставить тег');
            on.type = 'button';
            on.addEventListener('click', () => { if (typeof data.onEquip === 'function') data.onEquip(String(achievement.key)); });
            tagRow.appendChild(on);
          }
          body.appendChild(tagRow);
        }

        item.appendChild(body);
        list.appendChild(item);
      });
      board.appendChild(list);
      container.appendChild(board);
      return container;
    },
  };

  /* ===================== 5. Обращения в поддержку (вид для пользователя и админа) ===================== */

  const FeedbackView = {
    /**
     * Карточка обращения: вопрос (с изображениями) и ответы администрации.
     * handlers.canReply     — показать поле ответа (панель администратора)
     * handlers.canDelete    — показать троеточие «Удалить запрос» (личный кабинет пользователя)
     * handlers.showOwner    — показать автора вопроса и ссылку на его аккаунт
     */
    buildThread(thread, handlers) {
      const options = handlers || {};
      const card = element('article', 'feedback-card');
      card.dataset.postId = thread.postId;
      if (thread.answered) card.classList.add('feedback-card--answered');

      const question = thread.question || {};
      const head = element('div', 'feedback-card-head');
      const titleBox = element('div', 'feedback-card-title-box');

      const author = element('p', 'feedback-card-title', options.showOwner
        ? (question.author || 'Пользователь')
        : 'Ваш вопрос');
      if (options.showOwner && question.userId && typeof global.navigateTo === 'function') {
        // Переход в предосмотр аккаунта автора вопроса (без почты)
        author.classList.add('feedback-author-link');
        author.addEventListener('click', () => global.navigateTo('userprofile', {
          userId: String(question.userId),
          userName: question.author || '',
        }));
      }
      titleBox.appendChild(author);

      const meta = [
        question.userGroup ? `группа ${question.userGroup}` : '',
        formatDateTime(question.timestamp),
      ].filter(Boolean).join(' · ');
      titleBox.appendChild(element('p', 'feedback-card-meta', meta));
      head.appendChild(titleBox);

      const badge = element('span', `feedback-status ${thread.answered ? 'feedback-status--answered' : 'feedback-status--pending'}`,
        thread.answered ? 'Отвечено' : 'В обработке');
      head.appendChild(badge);

      if (options.canDelete) {
        const menu = element('button', 'feedback-menu-button', '⋮');
        menu.type = 'button';
        menu.title = 'Удалить запрос';
        menu.addEventListener('click', () => {
          if (typeof options.onDelete === 'function') options.onDelete(thread);
        });
        head.appendChild(menu);
      }
      card.appendChild(head);

      const questionBox = element('div', 'feedback-message feedback-message--question');
      questionBox.appendChild(element('p', 'feedback-message-text', question.textContent || ''));
      card.appendChild(questionBox);

      if (Array.isArray(thread.images) && thread.images.length > 0) {
        const grid = element('div', 'feedback-image-grid');
        thread.images.forEach((image) => {
          const url = String(image.imageUrl || '').trim();
          if (!url) return;
          const node = element('img', 'feedback-image');
          node.src = url;
          node.alt = 'Изображение к обращению';
          node.loading = 'lazy';
          node.addEventListener('click', () => {
            if (global.imageViewer) global.imageViewer.open(url, { mode: 'view' });
            else if (typeof global.openImageViewer === 'function') global.openImageViewer(url, { mode: 'view' });
          });
          grid.appendChild(node);
        });
        card.appendChild(grid);
      }

      (Array.isArray(thread.answers) ? thread.answers : []).forEach((answer) => {
        const answerBox = element('div', 'feedback-message feedback-message--answer');
        const answerAuthor = element('p', 'feedback-message-author', answer.author || 'Администрация');
        if (options.showOwner && answer.userId && typeof global.navigateTo === 'function') {
          answerAuthor.classList.add('feedback-author-link');
          answerAuthor.addEventListener('click', () => global.navigateTo('userprofile', {
            userId: String(answer.userId),
            userName: answer.author || '',
          }));
        }
        answerBox.appendChild(answerAuthor);
        answerBox.appendChild(element('p', 'feedback-message-text', answer.textContent || ''));
        answerBox.appendChild(element('p', 'feedback-message-date', formatDateTime(answer.timestamp)));
        card.appendChild(answerBox);
      });

      if (options.canReply && !thread.answered) {
        const form = element('div', 'feedback-reply');
        const textarea = element('textarea', 'feedback-reply-input');
        textarea.placeholder = 'Ответ пользователю: что сделано или что нужно уточнить';
        const submit = element('button', 'admin-user-button admin-user-button--success', 'Ответить');
        submit.type = 'button';
        submit.addEventListener('click', async () => {
          const text = textarea.value.trim();
          if (!text) { notify('Введите текст ответа', 'error'); return; }
          submit.disabled = true;
          const result = typeof options.onReply === 'function' ? await options.onReply(thread, text) : null;
          submit.disabled = false;
          if (result && result.success) {
            textarea.value = '';
            notify(result.message || 'Ответ отправлен', 'success');
          } else {
            notify((result && result.message) || 'Не удалось отправить ответ', 'error');
          }
        });
        form.appendChild(textarea);
        form.appendChild(submit);
        card.appendChild(form);
      }

      if (options.canReply && thread.answered) {
        const note = element('p', 'feedback-card-note', [
          'Обращение закрыто',
          thread.answeredByName ? `ответил(а) ${thread.answeredByName}` : '',
          thread.answeredAt ? formatDateTime(thread.answeredAt) : '',
        ].filter(Boolean).join(' · '));
        card.appendChild(note);
      }

      return card;
    },
  };

  const AdminPanel = {
    refreshInterval: MODERATION_TAB_REFRESH,

    async render(options) {
      const settings = (options && typeof options === 'object') ? options : {};
      const root = element('div', 'admin-panel');
      root.id = 'admin-panel';

      const header = element('div', 'admin-panel-header');
      header.appendChild(element('h2', null, 'Панель администратора'));
      header.appendChild(element('p', 'admin-panel-subtitle', 'Модерация, пользователи, ответы и фидбек'));
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

      // Статичное меню действий: оно остаётся на месте при переключении разделов
      const tabs = element('div', 'admin-panel-tabs');
      const content = element('div', 'admin-panel-content');
      const buttons = {};
      const selectTab = async (name) => {
        Object.entries(buttons).forEach(([key, button]) => button.classList.toggle('selected', key === name));
        clear(content);
        if (name === 'moderation') await this.renderModerationTab(content);
        else if (name === 'feedback') await this.renderFeedbackTab(content);
        else await this.renderUsersTab(content);
      };
      // ✓ Обращения пользователей — одна вкладка «Фидбек»: в ней и ответы на новые вопросы,
      // и история уже отвеченных. Отдельной вкладки «Ответы» больше нет.
      [['moderation', 'Модерация'], ['users', 'Список пользователей'], ['feedback', 'Фидбек']]
        .forEach(([name, label]) => {
          const button = element('button', 'radio-button admin-panel-tab', label);
          button.type = 'button';
          button.addEventListener('click', () => selectTab(name));
          buttons[name] = button;
          tabs.appendChild(button);
        });
      root.appendChild(tabs);
      root.appendChild(content);

      // Панель можно открыть сразу на нужном разделе (например, кнопкой «Фидбек»)
      const requested = String(settings.tab || '');
      await selectTab(buttons[requested] ? requested : 'moderation');
      return root;
    },

    /* --------------------------- Раздел «Фидбек» и «Ответы» --------------------------- */

    /**
     * Вкладка «Фидбек»: обращения пользователей и ответы на них в одном месте.
     * Сверху — вопросы в обработке (на них можно ответить), ниже — история отвеченных.
     */
    async renderFeedbackTab(container) {
      const shell = element('div', 'admin-feedback-tab');
      const status = element('p', 'admin-panel-summary', 'Загружаю обращения…');
      const toolbar = element('div', 'admin-users-toolbar');
      const refreshButton = element('button', 'admin-user-button', 'Обновить список');
      refreshButton.type = 'button';
      toolbar.appendChild(refreshButton);
      shell.appendChild(status);
      shell.appendChild(toolbar);

      const pendingTitle = element('p', 'admin-feedback-section-title', 'Обращения в обработке');
      const pendingList = element('div', 'admin-feedback-list');
      const answeredTitle = element('p', 'admin-feedback-section-title', 'Отвеченные обращения');
      const answeredList = element('div', 'admin-feedback-list');
      shell.appendChild(pendingTitle);
      shell.appendChild(pendingList);
      shell.appendChild(answeredTitle);
      shell.appendChild(answeredList);
      container.appendChild(shell);

      const makeCard = (thread, canReply) => FeedbackView.buildThread(thread, {
        showOwner: true,
        canReply,
        onReply: async (target, text) => {
          const saved = await global.database.saveFeedbackAnswer({
            questionPostId: target.postId,
            ownerUid: String(target.question.userId || ''),
            answerText: text,
          });
          if (saved && saved.success === true) {
            if (global.Achievements && typeof global.Achievements.evaluate === 'function') {
              global.Achievements.evaluate().catch(() => {});
            }
            await draw();
          }
          return saved;
        },
      });

      const draw = async () => {
        status.textContent = 'Загружаю обращения…';
        clear(pendingList);
        clear(answeredList);
        const result = await global.database.getFeedbackThreads();
        if (!result || result.success !== true) {
          status.textContent = (result && result.message) || 'Не удалось загрузить обращения';
          return;
        }
        const threads = result.threads || [];
        const pending = threads.filter((thread) => !thread.answered);
        const answered = threads.filter((thread) => thread.answered);
        status.textContent = `Обращений в обработке: ${pending.length} · отвечено: ${answered.length}`;

        if (pending.length === 0) {
          pendingList.appendChild(element('p', 'admin-panel-empty', 'Новых обращений нет — все вопросы обработаны.'));
        } else {
          pending.forEach((thread) => pendingList.appendChild(makeCard(thread, true)));
        }

        if (answered.length === 0) {
          answeredList.appendChild(element('p', 'admin-panel-empty', 'Пока нет ни одного отвеченного обращения.'));
        } else {
          answered.forEach((thread) => answeredList.appendChild(makeCard(thread, false)));
        }
      };

      refreshButton.addEventListener('click', async () => {
        refreshButton.disabled = true;
        await draw();
        refreshButton.disabled = false;
      });
      await draw();
    },

    /* ------------------------------- Вкладка «Пользователи» ------------------------------- */

    /* ------------------------------- Вкладка «Пользователи» ------------------------------- */

    // Состояние вкладки живёт между обновлениями: поиск, раскрытые карточки и позиция скролла
    usersTabState: { query: '', expanded: new Set() },

    async renderUsersTab(container) {
      const state = this.usersTabState;
      const currentUser = (global.auth && typeof global.auth.getCurrentUser === 'function')
        ? global.auth.getCurrentUser()
        : null;
      const myUid = String((currentUser && currentUser.uid) || '');

      const shell = element('div', 'admin-users-tab');
      container.appendChild(shell);

      const search = element('input', 'admin-panel-search');
      search.type = 'search';
      search.placeholder = 'Поиск по имени, почте, группе, тегу, роли или ID';
      search.value = state.query || '';

      const toolbar = element('div', 'admin-users-toolbar');
      const expandAllButton = element('button', 'admin-user-button', 'Развернуть все');
      const collapseAllButton = element('button', 'admin-user-button', 'Свернуть все');
      const refreshButton = element('button', 'admin-user-button', 'Обновить список');
      [expandAllButton, collapseAllButton, refreshButton].forEach((button) => {
        button.type = 'button';
        toolbar.appendChild(button);
      });

      const summary = element('p', 'admin-panel-summary', 'Загружаю пользователей…');
      const list = element('div', 'admin-user-list');

      shell.appendChild(search);
      shell.appendChild(toolbar);
      shell.appendChild(summary);
      shell.appendChild(list);

      // Позиция скролла: запоминаем её у окна и у всех прокручиваемых предков панели,
      // чтобы мягкое обновление не выбрасывало администратора в начало страницы.
      const scrollHosts = (() => {
        const hosts = [document.scrollingElement || document.documentElement];
        let node = container.parentElement;
        while (node && node !== document.body) {
          if (node.scrollHeight > node.clientHeight) hosts.push(node);
          node = node.parentElement;
        }
        return hosts;
      })();
      const captureScroll = () => ({
        window: global.scrollY || 0,
        hosts: scrollHosts.map((node) => node.scrollTop),
      });
      const restoreScroll = (saved) => {
        if (!saved) return;
        global.scrollTo(0, saved.window || 0);
        scrollHosts.forEach((node, index) => {
          if (saved.hosts[index] !== undefined) node.scrollTop = saved.hosts[index];
        });
      };

      const rows = [];

      const applyFilter = () => {
        const query = search.value.trim().toLowerCase();
        state.query = search.value;
        let visible = 0;
        rows.forEach(({ user, row }) => {
          const haystack = [
            user.userName, user.userEmail, user.userGroup, user.customTag, user.uid,
            user.userLanguage, user.role, ROLE_LABELS[user.role],
            user.blocked ? 'заблокирован мут' : '',
          ].filter(Boolean).join(' ').toLowerCase();
          // .admin-user — flex-контейнер, атрибут hidden его не скрывает,
          // поэтому карточка прячется классом (см. admin.css)
          const matches = !query || haystack.includes(query);
          row.classList.toggle('admin-user--hidden', !matches);
          if (matches) visible += 1;
        });
        summary.textContent = query
          ? `Найдено: ${visible} из ${rows.length}`
          : `Всего пользователей: ${rows.length}`;
      };

      const context = {
        myUid,
        isExpanded: (uid) => state.expanded.has(uid),
        setExpanded: (uid, expanded) => {
          if (expanded) state.expanded.add(uid);
          else state.expanded.delete(uid);
        },
        // Мягкое обновление: перечитываем данные и список, но не всю страницу,
        // поэтому вкладка, поиск, раскрытые карточки и скролл сохраняются.
        refresh: async () => { await draw(); },
      };

      const draw = async () => {
        const savedScroll = captureScroll();
        const cache = await loadBadgeData(true);

        const accountsResult = global.database && typeof global.database.getAllAccounts === 'function'
          ? await global.database.getAllAccounts()
          : { accounts: [] };
        const accounts = Array.isArray(accountsResult.accounts) ? accountsResult.accounts : [];

        const users = new Map();
        const addUser = (source) => {
          if (!source) return;
          const uid = String(source.userId || source.uid || source.id || '');
          if (!uid) return;
          users.set(uid, { ...(users.get(uid) || {}), ...source, uid });
        };
        accounts.forEach(addUser);
        if (cache.byUid && typeof cache.byUid.forEach === 'function') {
          cache.byUid.forEach((profile, uid) => addUser({ uid, ...profile }));
        }
        cache.adminIds.forEach((value) => {
          if (value && String(value).length > 20) addUser({ uid: String(value) });
        });

        rows.length = 0;
        clear(list);

        if (users.size === 0) {
          summary.textContent = 'Пользователи пока не найдены.';
          return;
        }

        Array.from(users.values())
          .sort((a, b) => String(a.userName || a.userEmail || a.uid).localeCompare(String(b.userName || b.userEmail || b.uid), 'ru'))
          .forEach((user) => {
            const row = this.createUserRow(user, cache, context);
            rows.push({ user, row });
            list.appendChild(row);
          });

        applyFilter();
        restoreScroll(savedScroll);
      };

      search.addEventListener('input', applyFilter);
      expandAllButton.addEventListener('click', () => {
        rows.forEach(({ row }) => { if (typeof row.adminSetExpanded === 'function') row.adminSetExpanded(true); });
      });
      collapseAllButton.addEventListener('click', () => {
        rows.forEach(({ row }) => { if (typeof row.adminSetExpanded === 'function') row.adminSetExpanded(false); });
      });
      refreshButton.addEventListener('click', async () => {
        refreshButton.disabled = true;
        await draw();
        refreshButton.disabled = false;
      });

      await draw();
    },

    createUserRow(user, cache, context = {}) {
      const row = element('article', 'admin-user');
      row.dataset.uid = user.uid;

      const uid = String(user.uid);
      // ✓ Блокировка со сроком: после blockedUntil пользователь снова обычный
      const userBlockedUntil = Number(user.blockedUntil) || 0;
      if (user.blocked && userBlockedUntil > 0 && userBlockedUntil <= Date.now()) {
        user = { ...user, blocked: false, blockedUntil: 0 };
      }
      const myUid = String(context.myUid || '');
      const isSelf = uid === myUid;
      const isAdmin = cache.adminIds.has(uid) || (user.userEmail && cache.adminIds.has(String(user.userEmail).toLowerCase()));
      // Другой администратор защищён: его нельзя заблокировать, а тег он меняет сам.
      const isAnotherAdmin = isAdmin && !isSelf;
      const role = ROLES.includes(user.role) ? user.role : '';
      const adminRecord = (cache.admins && typeof cache.admins.get === 'function') ? (cache.admins.get(uid) || null) : null;
      const moderationsCount = Number(adminRecord && adminRecord.moderationsCount) || 0;
      const answeredCount = Number(adminRecord && adminRecord.feedbackAnsweredCount) || 0;
      if (user.blocked) row.classList.add('admin-user--blocked');

      const expanded = typeof context.isExpanded === 'function' ? context.isExpanded(uid) : false;
      row.classList.toggle('admin-user--expanded', expanded);

      const head = element('div', 'admin-user-head');
      const nameBox = element('div', 'admin-user-name-box');
      const name = element('p', 'admin-user-name', user.userName || user.userEmail || `ID ${uid.slice(0, 8)}`);
      nameBox.appendChild(name);
      const meta = element('p', 'admin-user-meta', [
        user.userEmail || 'почта не указана',
        user.userGroup ? `группа ${user.userGroup}` : 'группа не выбрана',
        user.userSubgroup ? `${user.userSubgroup}-я подгруппа` : null,
        user.userLanguage || null,
        user.emailVerifiedByAdmin === true ? 'почта подтверждена администратором' : null,
      ].filter(Boolean).join(' · '));
      nameBox.appendChild(meta);

      // Счётчики админа: модерации и ответы в службе поддержки
      if (isAdmin) {
        nameBox.appendChild(element('p', 'admin-user-counters', `Модераций: ${moderationsCount} · Ответов: ${answeredCount}`));
      }

      const headRight = element('div', 'admin-user-head-right');
      const badges = element('span', 'admin-user-badges');
      if (isAdmin) badges.appendChild(createBadge({ kind: 'admin', text: ADMIN_BADGE_TEXT }));
      if (role) badges.appendChild(createBadge({ kind: role, text: ROLE_LABELS[role] }));
      if (user.customTag) badges.appendChild(createBadge({ kind: 'custom', text: user.customTag }));
      if (user.blocked) badges.appendChild(element('span', 'homework-role-badge homework-role-badge--blocked', 'Заблокирован'));

      const previewButton = element('button', 'admin-user-button', 'Предосмотр');
      previewButton.type = 'button';
      previewButton.title = 'Открыть аккаунт так, как его видят другие пользователи (без почты)';
      previewButton.addEventListener('click', () => {
        if (typeof global.navigateTo === 'function') {
          global.navigateTo('userprofile', { userId: uid, userName: user.userName || '' });
        }
      });

      const toggleButton = element('button', 'admin-user-button admin-user-toggle', expanded ? 'Свернуть' : 'Подробнее');
      toggleButton.type = 'button';
      toggleButton.setAttribute('aria-expanded', String(expanded));
      headRight.appendChild(badges);
      headRight.appendChild(previewButton);
      headRight.appendChild(toggleButton);

      head.appendChild(nameBox);
      head.appendChild(headRight);
      row.appendChild(head);

      const body = element('div', 'admin-user-body');
      body.hidden = !expanded;

      // Карточка запоминает своё состояние — при обновлении списка оно не теряется
      row.adminSetExpanded = (next) => {
        body.hidden = !next;
        row.classList.toggle('admin-user--expanded', next);
        toggleButton.textContent = next ? 'Свернуть' : 'Подробнее';
        toggleButton.setAttribute('aria-expanded', String(next));
        if (typeof context.setExpanded === 'function') context.setExpanded(uid, next);
      };
      toggleButton.addEventListener('click', () => row.adminSetExpanded(body.hidden));

      const controls = element('div', 'admin-user-controls');

      // Мягкое обновление вместо перерисовки всей страницы
      const softRefresh = async () => {
        if (typeof context.refresh === 'function') await context.refresh();
      };

      /* Роль */
      const roleLabel = element('label', 'admin-user-field');
      roleLabel.appendChild(element('span', null, 'Статус'));
      const roleSelect = element('select', 'admin-user-select');
      [['', 'Без статуса']].concat(ROLES.map((value) => [value, ROLE_LABELS[value]]))
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
        await softRefresh();
      });
      roleLabel.appendChild(roleSelect);
      controls.appendChild(roleLabel);

      /* Свой тег: себе — можно, другому администратору — нет */
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
        await softRefresh();
      });
      tagLabel.appendChild(tagInput);
      tagLabel.appendChild(tagButton);
      if (isAnotherAdmin) {
        tagInput.disabled = true;
        tagButton.disabled = true;
        tagInput.title = 'Тег администратора меняет только он сам';
        tagLabel.appendChild(element('span', 'admin-user-hint', 'Тег администратора меняет только он сам со своего аккаунта'));
      }
      controls.appendChild(tagLabel);

      /* Блокировка */
      const blockBox = element('div', 'admin-user-block');
      const blockButton = element('button', `admin-user-button ${user.blocked ? 'admin-user-button--success' : 'admin-user-button--danger'}`, user.blocked ? 'Разблокировать' : 'Заблокировать');
      blockButton.type = 'button';
      const reasonBox = element('div', 'admin-user-block-reason');
      const reasonInput = element('input', 'admin-user-input');
      reasonInput.type = 'text';
      reasonInput.placeholder = 'Причина блокировки';
      const durationSelect = element('select', 'admin-user-select admin-user-block-term');
      [['0', 'Навсегда'], ['86400000', 'На 1 день'], ['604800000', 'На 7 дней'], ['2592000000', 'На 30 дней']]
        .forEach(([value, label]) => {
          const option = element('option', null, label);
          option.value = value;
          durationSelect.appendChild(option);
        });
      const reasonApply = element('button', 'admin-user-button admin-user-button--danger', 'Подтвердить');
      reasonApply.type = 'button';
      const reasonCancel = element('button', 'admin-user-button', 'Отмена');
      reasonCancel.type = 'button';
      reasonBox.appendChild(reasonInput);
      reasonBox.appendChild(durationSelect);
      reasonBox.appendChild(reasonApply);
      reasonBox.appendChild(reasonCancel);
      reasonBox.hidden = true;

      const applyBlock = async (blocked, reason, until) => {
        if (isAnotherAdmin) {
          notify('Другого администратора заблокировать нельзя', 'error');
          return;
        }
        blockButton.disabled = true;
        const result = await global.database.setUserBlocked(uid, blocked, reason, until);
        blockButton.disabled = false;
        notify((result && result.message) || 'Готово', result && result.success ? 'success' : 'error');
        await softRefresh();
      };

      blockButton.addEventListener('click', async () => {
        if (isAnotherAdmin) { notify('Другого администратора заблокировать нельзя', 'error'); return; }
        if (user.blocked) { await applyBlock(false, ''); return; }
        reasonBox.hidden = false;
        reasonInput.focus();
      });
      reasonCancel.addEventListener('click', () => { reasonBox.hidden = true; });
      reasonApply.addEventListener('click', async () => {
        reasonBox.hidden = true;
        await applyBlock(true, reasonInput.value, Number(durationSelect.value) || 0);
      });

      blockBox.appendChild(blockButton);
      blockBox.appendChild(reasonBox);
      if (isAnotherAdmin) {
        blockButton.disabled = true;
        blockButton.title = 'Другого администратора заблокировать нельзя';
        blockBox.appendChild(element('span', 'admin-user-hint', 'Администратор защищён от блокировки'));
      }
      controls.appendChild(blockBox);

      /* История блокировок — видна только администрации (панель администратора) */
      const blockLogEntries = Array.isArray(user.blockLog) ? user.blockLog.slice(0, 20) : [];
      if (blockLogEntries.length > 0) {
        const logBox = element('div', 'admin-user-block-log');
        logBox.appendChild(element('p', 'admin-user-block-log-title', 'История блокировок'));
        blockLogEntries.forEach((entry) => {
          const line = element('p', 'admin-user-block-log-line');
          const at = entry && Number(entry.at) ? new Date(Number(entry.at)) : null;
          const untilMs = entry && Number(entry.until) ? Number(entry.until) : 0;
          const isUnblock = entry && entry.action === 'unblock';
          const action = isUnblock ? 'Разблокировка' : 'Блокировка';
          let term = '';
          if (!isUnblock) term = untilMs > 0 ? ` до ${formatDate(new Date(untilMs))}` : ' (навсегда)';
          const parts = [at ? formatDate(at) : '—', `${action}${term}`];
          if (entry && entry.reason) parts.push(String(entry.reason));
          if (entry && entry.by) parts.push(String(entry.by));
          line.textContent = parts.join(' · ');
          logBox.appendChild(line);
        });
        controls.appendChild(logBox);
      }

      /* Подтверждение почты вручную (флаг Firebase Email не меняется — см. пояснение на кнопке) */
      const verifyBox = element('div', 'admin-user-verify');
      const verifiedByAdmin = user.emailVerifiedByAdmin === true;
      const verifyButton = element('button', `admin-user-button ${verifiedByAdmin ? '' : 'admin-user-button--success'}`,
        verifiedByAdmin ? 'Снять подтверждение почты' : 'Подтвердить почту');
      verifyButton.type = 'button';
      verifyButton.title = 'Firebase не позволяет менять подтверждение чужой почты из приложения, поэтому отметка хранится в базе и учитывается входом в приложение';
      verifyButton.addEventListener('click', async () => {
        verifyButton.disabled = true;
        const result = await global.database.confirmUserEmail(uid, !verifiedByAdmin);
        verifyButton.disabled = false;
        notify((result && result.message) || 'Готово', result && result.success ? 'success' : 'error');
        await softRefresh();
      });
      verifyBox.appendChild(verifyButton);
      verifyBox.appendChild(element('span', 'admin-user-hint', verifiedByAdmin
        ? 'Почта отмечена подтверждённой администратором'
        : 'Отметка позволит пользователю войти, если письмо не приходит'));
      controls.appendChild(verifyBox);

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

      body.appendChild(controls);
      body.appendChild(postsBox);
      row.appendChild(body);
      return row;
    },

    /* -------------------------------- Вкладка «Модерация» -------------------------------- */

    async renderModerationTab(container) {
      const list = element('div', 'admin-moderation-list');
      const profileList = element('div', 'admin-moderation-list admin-profile-queue');
      profileList.hidden = true;
      const toolbar = element('div', 'admin-moderation-toolbar');
      const status = element('p', 'admin-panel-summary');
      const refreshButton = element('button', 'admin-user-button', 'Обновить список');
      refreshButton.type = 'button';
      const order = [];
      let mode = 'posts';
      let timer = null;

      toolbar.appendChild(status);
      toolbar.appendChild(refreshButton);
      container.appendChild(toolbar);

      // ✓ Внутри модерации — две подочереди: публикации и описание/аватар профилей
      const subTabs = element('div', 'admin-moderation-subtabs');
      const postsTab = element('button', 'admin-moderation-subtab selected', 'Публикации');
      postsTab.type = 'button';
      const profileTab = element('button', 'admin-moderation-subtab', 'Описание и аватар');
      profileTab.type = 'button';
      subTabs.appendChild(postsTab);
      subTabs.appendChild(profileTab);
      container.appendChild(subTabs);

      container.appendChild(list);
      container.appendChild(profileList);

      /* ------------------------- Подочередь: публикации ------------------------- */
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
        if (mode !== 'posts') return 0;
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

      /* --------------------- Подочередь: описание и аватар --------------------- */
      const loadProfileQueue = async () => {
        const result = global.database && typeof global.database.getAllAccounts === 'function'
          ? await global.database.getAllAccounts()
          : { accounts: [] };
        const accounts = Array.isArray(result.accounts) ? result.accounts : [];
        return accounts.filter((account) => {
          if (!account) return false;
          const bio = String(account.bioPending || '').trim();
          const avatar = String(account.avatarPending || '').trim();
          return Boolean(bio || avatar);
        });
      };

      const drawProfileQueue = async () => {
        if (mode !== 'profiles') return;
        clear(profileList);
        const profiles = await loadProfileQueue();
        if (profiles.length === 0) {
          profileList.appendChild(element('p', 'admin-panel-empty', 'Новых описаний или аватаров на проверку нет.'));
        } else {
          profiles.forEach((account) => {
            profileList.appendChild(this.createProfileModerationCard(account, {
              onDone: () => drawProfileQueue(),
            }));
          });
        }
        status.textContent = profiles.length === 0
          ? 'Очередь профилей пуста'
          : `${profiles.length} ${plural(profiles.length, 'профиль', 'профиля', 'профилей')} ждут проверки`;
      };

      const setMode = async (next) => {
        if (mode === next) return;
        mode = next;
        postsTab.classList.toggle('selected', mode === 'posts');
        profileTab.classList.toggle('selected', mode === 'profiles');
        list.hidden = mode !== 'posts';
        profileList.hidden = mode !== 'profiles';
        if (mode === 'posts') await draw({ shuffle: false });
        else await drawProfileQueue();
      };
      postsTab.addEventListener('click', () => setMode('posts'));
      profileTab.addEventListener('click', () => setMode('profiles'));

      refreshButton.addEventListener('click', () => {
        if (mode === 'posts') return draw({ shuffle: false });
        return drawProfileQueue();
      });

      const initial = await draw({ shuffle: true });
      timer = setInterval(() => {
        if (!isAlive(container)) { clearInterval(timer); return; }
        if (mode === 'posts') draw({ shuffle: false });
        else drawProfileQueue();
      }, Number(this.refreshInterval) || MODERATION_TAB_REFRESH);
      return container;
    },

    /**
     * ✓ Карточка модерации профиля: описание «О себе» и аватар, отправленные пользователем.
     *   Одобрение переносит pending-поля в видимые, отклонение — просто снимает их.
     */
    createProfileModerationCard(account, handlers = {}) {
      const options = handlers || {};
      const card = element('article', 'admin-moderation-card admin-profile-card');
      const uid = String(account.userId || account.uid || '');
      const bioPending = String(account.bioPending || '').trim();
      const avatarPending = String(account.avatarPending || '').trim();

      const head = element('div', 'admin-moderation-head');
      const titleBox = element('div', 'admin-moderation-title-box');
      titleBox.appendChild(element('p', 'admin-moderation-title', account.userName || account.userEmail || `ID ${uid.slice(0, 8)}`));
      const meta = [
        account.userGroup ? `группа ${account.userGroup}` : null,
        (Number(account.bioPendingAt) || Number(account.avatarPendingAt))
          ? `подано ${formatDateTime(Number(account.bioPendingAt) || Number(account.avatarPendingAt))}`
          : null,
      ].filter(Boolean).join(' · ');
      if (meta) titleBox.appendChild(element('p', 'admin-moderation-meta', meta));
      head.appendChild(titleBox);
      card.appendChild(head);

      const act = async (fields, label) => {
        const result = await global.database.adminUpdateAccount(uid, fields);
        if (typeof global.showNotification === 'function') {
          global.showNotification((result && result.message) || label, result && result.success ? 'success' : 'error');
        }
        if (result && result.success && typeof options.onDone === 'function') await options.onDone();
      };

      if (avatarPending) {
        const box = element('div', 'admin-profile-mod-row');
        const img = element('img', 'admin-profile-mod-avatar');
        img.src = avatarPending;
        img.alt = 'Новый аватар';
        img.addEventListener('click', () => {
          if (global.imageViewer && typeof global.imageViewer.open === 'function') {
            global.imageViewer.open(avatarPending, { title: 'Новый аватар' });
          }
        });
        box.appendChild(img);
        const info = element('div', 'admin-profile-mod-info');
        info.appendChild(element('p', 'admin-profile-mod-label', 'Аватар профиля'));
        const actions = element('div', 'admin-profile-mod-actions');
        const ok = element('button', 'admin-user-button admin-user-button--success', 'Одобрить аватар');
        ok.type = 'button';
        ok.addEventListener('click', () => act({
          avatarUrl: avatarPending, avatarPending: '', avatarPendingAt: 0,
        }, 'Аватар одобрен'));
        const no = element('button', 'admin-user-button admin-user-button--danger', 'Отклонить');
        no.type = 'button';
        no.addEventListener('click', () => act({
          avatarPending: '', avatarPendingAt: 0,
        }, 'Аватар отклонён'));
        actions.appendChild(ok);
        actions.appendChild(no);
        info.appendChild(actions);
        box.appendChild(info);
        card.appendChild(box);
      }

      if (bioPending) {
        const box = element('div', 'admin-profile-mod-row admin-profile-mod-row--bio');
        const info = element('div', 'admin-profile-mod-info');
        info.appendChild(element('p', 'admin-profile-mod-label', 'Описание «О себе»'));
        info.appendChild(element('p', 'admin-profile-mod-text', bioPending));
        const actions = element('div', 'admin-profile-mod-actions');
        const ok = element('button', 'admin-user-button admin-user-button--success', 'Одобрить описание');
        ok.type = 'button';
        ok.addEventListener('click', () => act({
          bio: bioPending, bioPending: '', bioPendingAt: 0,
        }, 'Описание одобрено'));
        const no = element('button', 'admin-user-button admin-user-button--danger', 'Отклонить');
        no.type = 'button';
        no.addEventListener('click', () => act({
          bioPending: '', bioPendingAt: 0,
        }, 'Описание отклонено'));
        actions.appendChild(ok);
        actions.appendChild(no);
        info.appendChild(actions);
        box.appendChild(info);
        card.appendChild(box);
      }

      return card;
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
            if (global.imageViewer) global.imageViewer.open(url, { mode: 'view' });
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
            if (global.imageViewer) global.imageViewer.open(url, { mode: 'view' });
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
  global.Achievements = Achievements;
  global.FeedbackView = FeedbackView;
  global.GovernanceStore = {
    REPORT_LIMIT,
    MODERATION_PENDING,
    MODERATION_APPROVED,
    ROLE_STAROSTA,
    ROLE_TEACHER,
    ROLE_PROFORG,
    ROLE_KULTORG,
    ROLES,
    ROLE_LABELS,
    FEEDBACK_SUBJECT,
    FEEDBACK_QUESTION,
    FEEDBACK_ANSWER,
  };
})(window);
