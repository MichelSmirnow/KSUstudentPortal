// ✓ Класс для управления авторизацией в Firebase
class Authentication {

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
      return { success: true, user: user, message: "Регистрация завершена успешно" };
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
      "auth/too-many-requests": "Слишком много попыток. Попробуйте позже"
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

  // ✓ Сохранить ссылку и метаданные изображения
  async saveImage(imageUrl, teacher, subject, imageType) {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) { return { success: false, message: "Пользователь не авторизован" }; }

      // ✓ Стандартизация информации об изображении
      const imageId = `img_${Date.now()}_${Math.floor(Math.random()*10000)}`;
      const imageData = {
        imageId, // Уникальный идентификатор изображения
        userId: user.uid, // Необходим для соответствия вашим правилам Firestore
        author: user.displayName || "Анонимный пользователь", // Публичное имя автора
        teacher: teacher || 'Преподаватель С.', // Имя учителя (в сокращенном виде)
        subject, // Уникальный код дисциплины
        imageUrl, // Ссылка на изображение на хостинге postimages
        imageType: imageType || 'material', // 'material' или 'homework'
        timestamp: Date.now(), // Дата публикации
      };

      // ✓ Запись документа в базу данных (коллекцию) "images" под уникальным ID
      await this.db.collection("images").doc(imageId).set(imageData);
      return { success: true, imageId, message: "Изображение успешно добавлено" };
    } catch (error) { return { success: false, error: error.code, message: `Ошибка отправки сообщения на сервер: ${error.message}` }; }
  }

  // ✓ Получить ссылки и метаданные изображений по параметру
  async getImagesBySubject(parameter, value) {
    const availableParameters = ['imageID', 'userID', 'author', 'teacher', 'subject', 'imageURL', 'imageType', 'timestamp'];
    if (!availableParameters.includes(parameter)) return { success: false, message: `Неверный тип данных для сортировки серверных изображений` }
    try {
      const snapshot = await this.db.collection("images").where(parameter, "==", value).get();
      const images = [];
      snapshot.forEach(doc => { images.push(doc.data()); });
      return { success: true, images };
    } catch (error) {
      return { success: false, error: error.code, message: `Ошибка получения изображения с сервера: ${error.message}` };
    }
  }
}

// ✓ Создаем глобальные экземпляры классов для доступа из ui.js
window.auth = new Authentication();
window.database = new Database(window.auth);