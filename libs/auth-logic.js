/**
 * ✓ Предел ожидания любого сетевого ответа.
 * Если сервер молчит (плохая связь, сайт висит) — вместо зависшего промиса возвращается
 * запасное значение, и страница сразу продолжает работу. Плюс: при отсутствии интернета
 * запрос даже не делается — соответствующие методы проверяют navigator.onLine сами.
 */
window.waitForNetwork = function waitForNetwork(promise, timeout, fallback) {
  const mark = fallback === undefined ? '__no_answer__' : fallback;
  let timer = 0;
  const safe = Promise.resolve(promise).catch(() => mark);
  return Promise.race([
    safe,
    new Promise((resolve) => { timer = setTimeout(() => { resolve(mark); }, timeout || 6000); }),
  ]).then((value) => { clearTimeout(timer); return value; });
};

// ✓ Класс для управления авторизацией в Firebase
class Authentication {
  // ✓ Нет соединения: сетевые методы сразу возвращают локальный ответ, без запросов
  static isOffline() {
    try { return typeof navigator !== 'undefined' && navigator.onLine === false; }
    catch (_) { return false; }
  }


  // ✓ Базовые настройки сервиса авторизации от Firebase
  constructor() {
    firebase.initializeApp(firebaseConfig);
    this.auth = firebase.auth(); // Firebase API
    this.currentUser = null;
    this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      console.log("Текущее значение авторизации: ", user ? user.email : "нет входа в аккаунт");
    });
  }

  // ✓ Получить объект текущего авторизованного пользователя
  getCurrentUser() { return this.currentUser; }

  // ✓ Проверка на существование авторизованного аккаунта
  isAuthenticated() { return this.currentUser !== null; }

  // ✓ Регистрация нового пользователя по почте, паролю и логину (стандартный сценарий регистрации)
  async register(email, password, username) {
    try {
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.updateProfile({ displayName: username });
      this.currentUser = user;

      // ✓ Сразу отправляем письмо для подтверждения почты: без него вход в приложение закрыт
      let verificationSent = false;
      try { await user.sendEmailVerification(); verificationSent = true; }
      catch (error) { console.warn('Не удалось отправить письмо для подтверждения:', error && error.code); }

      return {
        success: true,
        user: user,
        verificationSent,
        message: verificationSent
          ? "Регистрация завершена. Письмо для подтверждения почты отправлено"
          : "Регистрация завершена, но письмо отправить не удалось — попробуйте кнопку «Отправить письмо ещё раз»",
      };
    } catch (error) {
      return { success: false, error: error.code, message: this._getErrorMessage(error.code) };
    }
  }

  // ✓ Вход в существующий аккаунт по почте и паролю (стандартный сценарий авторизации)
  async login(email, password) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      this.currentUser = user;

      // ✓ Почта не подтверждена: письмо отправляем заново при каждом входе
      if (!user.emailVerified) {
        let verificationSent = false;
        try { await user.sendEmailVerification(); verificationSent = true; }
        catch (error) { console.warn('Не удалось повторно отправить письмо:', error && error.code); }
        return {
          success: true,
          user: user,
          needsEmailVerification: true,
          verificationSent,
          message: "Почта не подтверждена: мы отправили новое письмо со ссылкой",
        };
      }

      return { success: true, user: user, message: "Вход выполнен успешно" };
    } catch (error) {
      return { success: false, error: error.code, message: this._getErrorMessage(error.code) };
    }
  }

  // ✓ Завершение пользовательской сессии (выход из аккаунта)
  async logout() {
    try {
      await this.auth.signOut();
      this.currentUser = null;
      return { success: true, message: "Выход из аккаунта завершился успехом" };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка выхода из аккаунта: ${error}` };
    }
  }

  // ✓ Удаление аккаунта (требуется подтверждение пароля)
  async deleteAccount(password) {
    try {
      const user = this.auth.currentUser;
      const username = user.displayName;
      if (!user) { return { success: false, message: "Пользователь не авторизован" };}
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
      await user.reauthenticateWithCredential(credential);
      await user.delete();
      this.currentUser = null;
      return { success: true, message: `Аккаунт пользователя ${username} успешно удален`};
    } catch (error) {
      return { success: false, error: error.code, message: this._getErrorMessage(error.code)};
    }
  }

  // ✓ Отправить письмо на почту пользователя для ее подтверждения
  async sendEmailVerification() {
    if (Authentication.isOffline()) {
      return { success: false, offline: true, message: "Нет подключения к интернету: письмо отправить невозможно" };
    }
    try {
      const user = this.auth.currentUser;
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      if (user.emailVerified) { return { success: true, message: `Почта ${user.email} уже подтверждена` };}
      await user.sendEmailVerification();
      return { success: true, message: `"Письмо для подтверждения успешно отправлено на почту ${user.email}` };
    } catch (error) {
      return { success: false, error: error.code, message: "Ошибка при отправке письма для подтверждения" };
    }
  }

  // ✓ Проверка аккаунта на подтвержденную почту
  isEmailVerified() { return this.currentUser && this.currentUser.emailVerified; }

  // ✓ Перечитать данные пользователя с сервера (например, после перехода по ссылке из письма)
  async reloadUser() {
    try {
      const user = this.auth.currentUser;
      if (!user) { return { success: false, verified: false, message: "Пользователь не авторизован" }; }
      if (Authentication.isOffline()) { // ✓ Без интернета перечитывать нечего — берём сохранённое состояние
        return {
          success: true,
          verified: Boolean(user.emailVerified),
          message: user.emailVerified ? "Почта подтверждена" : "Нет подключения: показано сохранённое состояние почты",
        };
      }
      const reloaded = await window.waitForNetwork(user.reload(), 6000, '__no_answer__');
      if (reloaded === '__no_answer__') {
        return { success: false, verified: Boolean(user.emailVerified), message: "Сервер не отвечает: показано сохранённое состояние почты" };
      }
      this.currentUser = this.auth.currentUser || user;
      return {
        success: true,
        verified: Boolean(this.currentUser && this.currentUser.emailVerified),
        message: this.currentUser && this.currentUser.emailVerified ? "Почта подтверждена" : "Почта пока не подтверждена",
      };
    } catch (error) {
      return { success: false, verified: false, error: error.code, message: "Не удалось проверить подтверждение почты" };
    }
  }

  // ✓ Проверить подтверждение почты (перечитывает данные с сервера)
  async checkEmailVerified() {
    const result = await this.reloadUser();
    return { success: result.success, verified: Boolean(result.verified), message: result.message };
  }

  // ✓ Отменить регистрацию: удалить только что созданный аккаунт без пароля.
  //   Firebase разрешает удаление без повторного входа, если сессия свежая (аккаунт только создан).
  async cancelRegistration() {
    try {
      const user = this.auth.currentUser;
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      await user.delete();
      this.currentUser = null;
      return { success: true, message: "Регистрация отменена, аккаунт удалён" };
    } catch (error) {
      const requiresRecentLogin = error && error.code === 'auth/requires-recent-login';
      return {
        success: false,
        error: error && error.code,
        message: requiresRecentLogin
          ? 'Firebase требует свежий вход: выйдите из аккаунта и войдите снова, а затем повторите удаление'
          : this._getErrorMessage(error && error.code),
      };
    }
  }

  // ✓ Повторная аутентификация перед опасными действиями (смена пароля, удаление аккаунта)
  async reauthenticate(password) {
    try {
      const user = this.auth.currentUser;
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      if (!password) { return { success: false, message: "Введите пароль аккаунта" }; }
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
      await user.reauthenticateWithCredential(credential);
      return { success: true, message: "Пароль подтверждён" };
    } catch (error) {
      return { success: false, error: error.code, message: this._getErrorMessage(error.code) };
    }
  }

  // ✓ Сменить пароль (нужен текущий пароль для повторной аутентификации)
  async changePassword(currentPassword, newPassword) {
    try {
      const user = this.auth.currentUser;
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      if (!currentPassword) { return { success: false, message: "Введите текущий пароль" }; }
      if (!newPassword || String(newPassword).length < 6) {
        return { success: false, message: "Новый пароль слишком короткий (минимум 6 символов)" };
      }
      const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      return { success: true, message: "Пароль обновлён" };
    } catch (error) {
      return { success: false, error: error.code, message: this._getErrorMessage(error.code) };
    }
  }

  // ✓ Поддерживает ли текущая сборка Firebase смену почты с подтверждением ссылкой
  canChangeEmail() {
    const user = this.auth.currentUser;
    return Boolean(user && typeof user.verifyBeforeUpdateEmail === 'function');
  }

  // ✓ Сменить почту: новая почта подтверждается ссылкой из письма (verifyBeforeUpdateEmail)
  async requestEmailChange(newEmail, currentPassword) {
    try {
      const user = this.auth.currentUser;
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      if (typeof user.verifyBeforeUpdateEmail !== 'function') {
        return { success: false, unsupported: true, message: "Эта сборка Firebase не поддерживает смену почты из приложения" };
      }
      const email = String(newEmail || '').trim();
      if (!email) { return { success: false, message: "Введите новую почту" }; }
      if (currentPassword) {
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
      }
      await user.verifyBeforeUpdateEmail(email);
      return {
        success: true,
        message: `Ссылка для подтверждения новой почты отправлена на ${email}. Почта изменится после перехода по ссылке`,
      };
    } catch (error) {
      return { success: false, error: error.code, message: this._getErrorMessage(error.code) };
    }
  }

  // ✓ Сменить публичное имя (логин) пользователя
  async updateDisplayName(username) {
    try {
      const user = this.auth.currentUser;
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      const name = String(username || '').trim();
      if (!name) { return { success: false, message: "Логин не может быть пустым" }; }
      await user.updateProfile({ displayName: name });
      this.currentUser = this.auth.currentUser || user;
      return { success: true, name, message: "Логин обновлён" };
    } catch (error) {
      return { success: false, error: error.code, message: error && error.message ? error.message : 'Не удалось изменить логин' };
    }
  }

  // ✓ Дата регистрации аккаунта (по данным Firebase Auth)
  getRegistrationTime() {
    const user = this.auth.currentUser;
    const created = user && user.metadata && user.metadata.creationTime;
    const parsed = created ? Date.parse(created) : NaN;
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  // ✓ Отправить письмо на почту пользователя для восстановления пароля
  async sendPasswordResetEmail(email) {
    try {
      await this.auth.sendPasswordResetEmail(email);
      return { success: true, message: `Письмо для восстановления пароля успешно отправлено на почту ${email}` };
    } catch (error) {
      return { success: false, error: error.code, message: this._getErrorMessage(error.code) };
    }
  }

  // ✓ Получить персонализированное сообщение об ошибке на основе ошибки Firebase Auth
  _getErrorMessage(errorCode) {
    const errorMessages = {
      "auth/email-already-in-use": "Эта почта уже зарегистрирована",
      "auth/invalid-email": "Неверный формат почты",
      "auth/weak-password": "Пароль слишком слабый (минимум 6 символов)",
      "auth/user-not-found": "Пользователь не найден",
      "auth/wrong-password": "Неверный пароль",
      "auth/invalid-credential": "Неверные учетные данные",
      "auth/operation-not-allowed": "Операция недоступна",
      "auth/too-many-requests": "Слишком много попыток. Попробуйте позже",
      "auth/requires-recent-login": "Нужен свежий вход: выйдите из аккаунта и войдите снова",
      "auth/network-request-failed": "Нет соединения с сервером. Проверьте интернет",
      "auth/user-disabled": "Аккаунт отключён администрацией",
      "auth/missing-password": "Введите пароль",
      "auth/email-change-needs-verification": "Сначала подтвердите новую почту по ссылке из письма",
      "auth/missing-email": "Введите почту"
    };
    return errorMessages[errorCode] || "Произошла ошибка. Попробуйте позже";
  }
}

// ✓ Класс для управления базой данных в Firestore
class Database {

  // ✓ Базовые настройки сервиса базы данных от Firebase
  constructor(authInstance) {
    this.db = firebase.firestore();
    this.auth = authInstance;
  }

  // ✓ Сохранить текст
  async saveText(textContent, subject, subjectTimestamp, textType, userGroup) {
    if (Authentication.isOffline()) return { success: false, offline: true, message: "Нет подключения к интернету: публикация не отправлена" };
    try {
      const user = this.auth.getCurrentUser();
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }

      // ✓ Стандартизация информации о тексте
      const textId = `text_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      const textData = {
        textId, // Уникальный идентификатор текста
        userId: user.uid, // Необходим для соответствия вашим правилам Firestore
        author: user.displayName || "Анонимный пользователь", // Публичное имя автора
        authorEmail: user.email,
        userGroup: userGroup || "Группа не выбрана",
        subject, // Уникальный код дисциплины
        subjectTimestamp, // Время занятия (для конкретизации)
        textContent, // Содержимое текста
        textType: textType || 'material', // 'material' или 'homework'
        timestamp: Date.now(), // Дата публикации
        // ✓ Поля ниже обязательны для правил Firestore: без moderation: 'pending'
        // запись отклоняется («Missing or insufficient permissions»), а без
        // reportCount/reportedBy не работает жалоба на публикацию.
        moderation: 'pending',
        reportCount: 0,
        reportedBy: [],
      };

      // ✓ Запись документа в базу данных (коллекцию) "texts" под уникальным ID
      const saved = await window.waitForNetwork(this.db.collection("texts").doc(textId).set(textData, { merge: true }), 8000, '__no_answer__');
      if (saved === '__no_answer__') return { success: false, message: "Сервер не отвечает: текст не отправлен" };
      return { success: true, textId, message: "Текст успешно добавлен на сервер" };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка отправки текста на сервер: ${error.message}` } 
    }
  }

  // Удалить текст
  async deleteText() {

  }

  // ✓ Получить тексты по параметру
  async getTexts(parameter, value) {
    const availableParameters = ['textID', 'userID', 'author', 'authorEmail', 'subject', 'subjectTimestamp', 'textContent', 'textType', 'timestamp', "userGroup"];
    if (!availableParameters.includes(parameter)) return { success: false, message: `Неверный тип данных для сортировки серверных текстов` }
    if (Authentication.isOffline()) return { success: false, offline: true, texts: [], message: "Нет подключения к интернету" };
    try {
      const snapshot = await window.waitForNetwork(this.db.collection("texts").where(parameter, "==", value).get(), 8000, null);
      if (!snapshot) return { success: false, texts: [], message: "Сервер не отвечает: работаем с сохранёнными материалами" };
      const texts = [];
      snapshot.forEach(doc => { texts.push(doc.data()); });
      return { success: true, texts };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка получения текста с сервера: ${error.message}` };
    }
  }

  // ✓ Сохранить ссылку и метаданные изображения
  async saveImage(imageUrl, subject, subjectTimestamp, imageType) {
    if (Authentication.isOffline()) return { success: false, offline: true, message: "Нет подключения к интернету: публикация не отправлена" };
    try {
      const user = this.auth.getCurrentUser();
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }

      // ✓ Стандартизация информации об изображении
      const imageId = `img_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      const imageData = {
        imageId, // Уникальный идентификатор изображения
        userId: user.uid, // Необходим для соответствия вашим правилам Firestore
        author: user.displayName || "Анонимный пользователь", // Публичное имя автора
        authorEmail: user.email,
        subject, // Уникальный код дисциплины
        subjectTimestamp, // Время занятия (для конкретизации)
        imageUrl, // Ссылка на изображение на хостинге postimages
        imageType: imageType || 'material', // 'material' или 'homework'
        timestamp: Date.now(), // Дата публикации
        // ✓ То же, что и для текста: публикация уходит на проверку администрации.
        moderation: 'pending',
        reportCount: 0,
        reportedBy: [],
      };

      // ✓ Запись документа в базу данных (коллекцию) "texts" под уникальным ID
      const saved = await window.waitForNetwork(this.db.collection("images").doc(imageId).set(imageData, { merge: true }), 8000, '__no_answer__');
      if (saved === '__no_answer__') return { success: false, message: "Сервер не отвечает: изображение не отправлено" };
      return { success: true, imageId, message: "Изображение успешно добавлено на сервер" };
    } catch (error) { return { success: false, error: error.code, message: `Ошибка отправки изображения на сервер: ${error.message}` }; }
  }

  // Удалить изображение
  async deleteImage() {

  }

  // ✓ Получить ссылки и метаданные изображений по параметру
  async getImages(parameter, value) {
    const availableParameters = ['imageID', 'userID', 'author', 'authorEmail', 'subject', 'subjectTimestamp', 'imageURL', 'imageType', 'timestamp'];
    if (!availableParameters.includes(parameter)) return { success: false, message: `Неверный тип данных для сортировки серверных изображений` }
    if (Authentication.isOffline()) return { success: false, offline: true, images: [], message: "Нет подключения к интернету" };
    try {
      const snapshot = await window.waitForNetwork(this.db.collection("images").where(parameter, "==", value).get(), 8000, null);
      if (!snapshot) return { success: false, images: [], message: "Сервер не отвечает: работаем с сохранёнными материалами" };
      const images = [];
      snapshot.forEach(doc => { images.push(doc.data()); });
      return { success: true, images };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка получения изображения с сервера: ${error.message}` };
    }
  }

  // ✓ Сохранить дополнительные данные аккаунта (группа, подгруппа, изучаемый язык)
  // Поддерживаются оба варианта вызова: saveAccount(group, subgroup, language)
  // и saveAccount({ userGroup, userSubgroup, userLanguage })
  async saveAccount(userGroup, userSubgroup, userLanguage) {
    if (Authentication.isOffline()) return { success: false, offline: true, message: "Нет подключения к интернету: данные сохранены на устройстве" };
    try {
      const user = this.auth.getCurrentUser();
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }

      // ✓ Приводим аргументы к одному виду
      const payload = (userGroup && typeof userGroup === 'object')
        ? userGroup
        : { userGroup, userSubgroup, userLanguage };

      const subgroup = Number(payload.userSubgroup);
      const registeredAt = this.auth && typeof this.auth.getRegistrationTime === 'function'
        ? this.auth.getRegistrationTime()
        : Date.now();
      const accountData = {
        userId: user.uid, // Уникальный идентификатор пользователя
        userName: user.displayName || "Анонимный пользователь", // Публичное имя пользователя
        userEmail: user.email,
        registeredAt, // Дата регистрации: нужна для достижений и «стажа» в профиле
        timestamp: Date.now(), // Время последнего обновления данных
      };

      // ✓ Записываем только заполненные поля, чтобы не затирать уже сохранённые значения
      if (payload.userGroup) { accountData.userGroup = payload.userGroup; }
      if (subgroup === 1 || subgroup === 2) { accountData.userSubgroup = subgroup; }
      if (payload.userLanguage) { accountData.userLanguage = payload.userLanguage; }

      // ✓ Запись документа в базу данных (коллекцию) "accounts" под уникальным ID
      const saved = await window.waitForNetwork(this.db.collection("accounts").doc(user.uid).set(accountData, { merge: true }), 8000, '__no_answer__');
      if (saved === '__no_answer__') return { success: false, message: "Сервер не отвечает: данные сохранены на устройстве" };
      return { success: true, accountId: user.uid, account: accountData, message: "Данные аккаунта успешно добавлены на сервер" };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка отправки данных аккаунта на сервер: ${error.message}` }
    }
  }

  // ✓ Получить дополнительные данные аккаунта
  async getAccount(userUID) {
    if (Authentication.isOffline()) return { success: false, offline: true, message: "Нет подключения к интернету" };
    try { // ✓ Получаем основные данные аккаунта
      const snapshot = await window.waitForNetwork(this.db.collection("accounts").where("userId", "==", userUID).get(), 8000, null);
      if (!snapshot) return { success: false, message: "Сервер не отвечает: работаем с сохранёнными данными аккаунта" };
      const accounts = [];
      snapshot.forEach(doc => { accounts.push(doc.data()); });
      const account = accounts[0];
      if (!account) { return { success: false, message: "Данные аккаунта не найдены" }; }
      return {
        success: true,
        account: {
          ...account,
          userSubgroup: Number(account.userSubgroup) === 2 ? 2 : (Number(account.userSubgroup) === 1 ? 1 : null),
          userLanguage: account.userLanguage || null,
        },
      };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка получения данных аккаунта с сервера: ${error.message}` };
    }
  }

  // ✓ Обновить отдельные поля аккаунта (группа, язык, достижения, избранные группы и т.п.)
  async updateAccount(fields) {
    if (Authentication.isOffline()) return { success: false, offline: true, message: "Нет подключения к интернету: сохранено на устройстве" };
    try {
      const user = this.auth.getCurrentUser();
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      const payload = (fields && typeof fields === 'object') ? { ...fields } : {};
      if (Object.keys(payload).length === 0) {
        return { success: false, message: "Нет данных для обновления" };
      }
      payload.userId = user.uid;
      payload.userName = user.displayName || "Анонимный пользователь";
      payload.userEmail = user.email;
      payload.timestamp = Date.now();
      const saved = await window.waitForNetwork(this.db.collection("accounts").doc(user.uid).set(payload, { merge: true }), 8000, '__no_answer__');
      if (saved === '__no_answer__') return { success: false, message: "Сервер не отвечает: данные обновлены на устройстве" };
      return { success: true, account: payload, message: "Данные аккаунта обновлены" };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка обновления данных аккаунта: ${error.message}` };
    }
  }

  // ✓ Получить статус администратора пользователя
  async getAdmin(userUID) {
    // ✓ Без сети или с молчащим сервером: админ-статус определяется, когда есть ответ
    if (Authentication.isOffline()) return { success: true, isAdmin: false, offline: true };
    try {
      const adminDoc = await window.waitForNetwork(this.db.collection("admindata").doc(userUID).get(), 6000, null);
      if (!adminDoc) return { success: true, isAdmin: false, offline: true };
      const isAdmin = adminDoc.exists; 
      return { success: true, isAdmin };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка получения данных аккаунта с сервера: ${error.message}` };
    }
  }

  /**
   * Удалить все публикации пользователя (тексты и изображения).
   * Вызывается перед удалением аккаунта, пока сессия ещё жива: иначе материалы
   * останутся в базе и будут видны другим пользователям.
   */
  async deleteUserContent() {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) { return { success: false, deleted: 0, message: "Пользователь не авторизован" }; }
      const uid = String(user.uid);
      let deleted = 0;
      for (const collectionName of ['texts', 'images']) {
        const snapshot = await this.db.collection(collectionName).where('userId', '==', uid).get();
        const docs = [];
        snapshot.forEach((doc) => docs.push(doc.ref));
        for (let index = 0; index < docs.length; index += 400) {
          const batch = this.db.batch();
          docs.slice(index, index + 400).forEach((ref) => batch.delete(ref));
          await batch.commit();
          deleted += Math.min(400, docs.length - index);
        }
      }
      return { success: true, deleted, message: `Удалено публикаций: ${deleted}` };
    } catch (error) {
      return { success: false, deleted: 0, error: error.code, message: `Не удалось удалить публикации: ${error.message}` };
    }
  }

  // ✓ Удалить дополнительные данные аккаунта (вызывается сразу после удаления аккаунта в Firebase Auth)
  async deleteAccountData() {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }
      await this.db.collection("accounts").doc(user.uid).delete();
      return { success: true, message: "Данные аккаунта удалены" };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка удаления данных аккаунта: ${error.message}` };
    }
  }
}

// ✓ Создаем глобальные экземпляры классов для доступа из ui.js
window.auth = new Authentication();
window.database = new Database(window.auth);