// static/js/auth.js
let currentUser = null;

window.loginUser = async () => {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) {
        app.showNotification('Заполните email и пароль', 'warning');
        return;
    }
    try {
        const result = await api.login(email, password);
        if (result.success) {
            currentUser = result;
            localStorage.setItem('authToken', result.token);
            document.getElementById('userName').textContent = result.name;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('userProfile').style.display = 'block';
            app.showNotification('Вход успешен!', 'success');
        } else {
            app.showNotification(result.error || 'Ошибка входа', 'error');
        }
    } catch (error) {
        app.showNotification('Ошибка подключения к серверу', 'error');
    }
};

window.registerUser = async () => {
    const name = document.getElementById('regName')?.value.trim();
    const surname = document.getElementById('regSurname')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const gender = document.getElementById('regGender')?.value;

    if (!name || !surname || !email || !password) {
        app.showNotification('Заполните все обязательные поля', 'warning');
        return;
    }

    try {
        const result = await api.register({ name, surname, email, password, gender });
        if (result.success) {
            currentUser = result;
            localStorage.setItem('authToken', `token_${result.id}`);
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('userProfile').style.display = 'block';
            document.getElementById('userName').textContent = name;
            app.showNotification('Регистрация успешна! Ваши данные сохранены в базе.', 'success');
        } else {
            app.showNotification(result.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        app.showNotification('Ошибка подключения к серверу', 'error');
    }
};

window.logout = () => {
    localStorage.removeItem('authToken');
    currentUser = null;
    document.getElementById('userProfile').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    app.showNotification('Вы вышли из аккаунта', 'info');
};