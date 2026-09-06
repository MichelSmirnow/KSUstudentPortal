// Функции генерации страницы
const container = document.getElementByID('container'); // Родительский контейнер генерации
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
}