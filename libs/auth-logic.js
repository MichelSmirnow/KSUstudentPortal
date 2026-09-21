// libs/auth-logic.js

/**
 * Класс Authentication для управления пользователями Firebase
 * Поддерживает: регистрацию, вход, выход, удаление аккаунта,
 * восстановление пароля, подтверждение почты
 */
class Authentication {
    constructor() {
        const firebaseConfig = {
            apiKey: "AIzaSyDK4QZ3i1O4gvC_xDFbXJbsf1-D20yr2UI",
            authDomain: "ksustudent-2026.firebaseapp.com",
            databaseURL: "https://ksustudent-2026-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "ksustudent-2026",
            storageBucket: "ksustudent-2026.firebasestorage.app",
            messagingSenderId: "857442293549",
            appId: "1:857442293549:web:c6d573f769ae5fd01925a4",
            measurementId: "G-6TESFY3B7M"
        };

        firebase.initializeApp(firebaseConfig);
        this.auth = firebase.auth();
        this.currentUser = null;

        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            console.log("Auth state changed:", user ? user.email : "No user");
        });
    }

    /**
     * Регистрация нового пользователя
     * @param {string} email - Электронная почта
     * @param {string} password - Пароль
     * @param {string} username - Имя пользователя (логин)
     * @returns {Promise<Object>} Объект пользователя
     */
    async register(email, password, username) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                email,
                password
            );
            const user = userCredential.user;

            await user.updateProfile({ displayName: username });

            this.currentUser = user;
            console.log("✅ Регистрация успешна:", user.email);
            return {
                success: true,
                user: user,
                message: "Регистрация завершена успешно"
            };
        } catch (error) {
            console.error("❌ Ошибка регистрации:", error.code, error.message);
            return {
                success: false,
                error: error.code,
                message: this._getErrorMessage(error.code)
            };
        }
    }

    /**
     * Вход пользователя по почте и паролю
     * @param {string} email - Электронная почта
     * @param {string} password - Пароль
     * @returns {Promise<Object>} Объект пользователя
     */
    async login(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(
                email,
                password
            );
            const user = userCredential.user;

            this.currentUser = user;
            console.log("✅ Вход успешен:", user.email);
            return {
                success: true,
                user: user,
                message: "Вход выполнен успешно"
            };
        } catch (error) {
            console.error("❌ Ошибка входа:", error.code, error.message);
            return {
                success: false,
                error: error.code,
                message: this._getErrorMessage(error.code)
            };
        }
    }

    /**
     * Выход пользователя из аккаунта
     * @returns {Promise<Object>} Результат операции
     */
    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            console.log("✅ Выход выполнен");
            return {
                success: true,
                message: "Вы вышли из аккаунта"
            };
        } catch (error) {
            console.error("❌ Ошибка выхода:", error.message);
            return {
                success: false,
                error: error.code,
                message: "Ошибка при выходе из аккаунта"
            };
        }
    }

    /**
     * Удаление аккаунта (требует переввода пароля для подтверждения)
     * @param {string} password - Пароль пользователя для подтверждения
     * @returns {Promise<Object>} Результат операции
     */
    async deleteAccount(password) {
        try {
            const user = this.auth.currentUser;

            if (!user) {
                return {
                    success: false,
                    message: "Пользователь не авторизован"
                };
            }

            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                password
            );

            await user.reauthenticateWithCredential(credential);
            await user.delete();

            this.currentUser = null;
            console.log("✅ Аккаунт удален");
            return {
                success: true,
                message: "Аккаунт успешно удален"
            };
        } catch (error) {
            console.error("❌ Ошибка удаления аккаунта:", error.code, error.message);
            return {
                success: false,
                error: error.code,
                message: this._getErrorMessage(error.code)
            };
        }
    }

    /**
     * Отправить письмо для подтверждения почты
     * @returns {Promise<Object>} Результат операции
     */
    async sendEmailVerification() {
        try {
            const user = this.auth.currentUser;

            if (!user) {
                return {
                    success: false,
                    message: "Пользователь не авторизован"
                };
            }

            if (user.emailVerified) {
                return {
                    success: true,
                    message: "Почта уже подтверждена"
                };
            }

            await user.sendEmailVerification();
            console.log("✅ Письмо для подтверждения отправлено");
            return {
                success: true,
                message: "Письмо для подтверждения отправлено на " + user.email
            };
        } catch (error) {
            console.error("❌ Ошибка отправки письма:", error.message);
            return {
                success: false,
                error: error.code,
                message: "Ошибка при отправке письма для подтверждения"
            };
        }
    }

    /**
     * Проверить, подтверждена ли почта
     * @returns {boolean} true, если почта подтверждена
     */
    isEmailVerified() {
        return this.currentUser && this.currentUser.emailVerified;
    }

    /**
     * Отправить письмо для восстановления пароля
     * @param {string} email - Электронная почта
     * @returns {Promise<Object>} Результат операции
     */
    async sendPasswordResetEmail(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            console.log("✅ Письмо для восстановления пароля отправлено");
            return {
                success: true,
                message: "Письмо для восстановления пароля отправлено на " + email
            };
        } catch (error) {
            console.error("❌ Ошибка отправки письма:", error.code, error.message);
            return {
                success: false,
                error: error.code,
                message: this._getErrorMessage(error.code)
            };
        }
    }

    /**
     * Получить текущего авторизованного пользователя
     * @returns {Object|null} Объект пользователя или null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Проверить, авторизован ли пользователь
     * @returns {boolean} true, если авторизован
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Преобразовать коды ошибок Firebase в читаемые сообщения
     * @private
     */
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

// Создаем глобальный экземпляр класса для доступа из ui.js
window.auth = new Authentication();