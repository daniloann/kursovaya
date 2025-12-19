
class App {
    constructor() {
        this.currentSection = 'searchSection';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showSection('searchSection');
        this.setupSearchHandlers();
    }

    bindEvents() {
        // Навигация по вкладкам (только поиск и дерево)
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            navLinks.addEventListener('click', (e) => {
                const btn = e.target.closest('.nav-btn');
                if (btn) {
                    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const section = btn.dataset.section;
                    this.showSection(section);
                }
            });
        }

        // Поиск по Enter
        const searchInput = document.getElementById('searchFio');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSimpleSearch();
                }
            });
        }
    }

    setupSearchHandlers() {
        const simpleSearchForm = document.getElementById('simpleSearchForm');
        if (simpleSearchForm) {
            simpleSearchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSimpleSearch();
            });
        }
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }
    }

    // Простой поиск
    async handleSimpleSearch() {
        const fio = document.getElementById('searchFio')?.value.trim();
        const gender = document.getElementById('searchGender')?.value;
        const year = document.getElementById('searchYear')?.value;
        const range = document.getElementById('searchRange')?.value || 5;

        if (!fio && !gender && !year) {
            this.showNotification('Укажите хотя бы одно условие для поиска', 'warning');
            return;
        }

        const criteria = {};
        if (fio) criteria.surname = fio.split(' ')[0] || fio;
        if (gender !== '') criteria.gender = parseInt(gender);
        if (year) {
            criteria.yearOfBirth = parseInt(year);
            criteria.ageTolerance = parseInt(range);
        }

        try {
            this.showLoading(document.getElementById('simpleSearchForm'), true);

            const response = await fetch(`http://localhost:8000/country/simple_search/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(criteria)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const results = await response.json();
            this.displaySimpleSearchResults(results);

        } catch (error) {
            this.showNotification(`Ошибка поиска: ${error.message}`, 'error');
        } finally {
            this.showLoading(document.getElementById('simpleSearchForm'), false);
        }
    }

    displaySimpleSearchResults(results) {
        const container = document.getElementById('searchResultBox');
        if (!container) return;

        if (!results || results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h4>Ничего не найдено</h4>
                    <p>Попробуйте изменить параметры поиска</p>
                </div>
            `;
            return;
        }

        container.innerHTML = results.map(person => {
            const fio = `${person.surname || ''} ${person.name || ''}`.trim() || 'Без имени';
            const genderText = person.gender === 1 ? 'Мужской' : 'Женский';
            const genderClass = person.gender === 1 ? 'male' : 'female';
            const genderIcon = person.gender === 1 ? '♂' : '♀';

            return `
                <div class="person-card" data-person-id="${person.id}">
                    <div class="person-header">
                        <h4>${fio}</h4>
                        <span class="person-gender ${genderClass}">
                            ${genderIcon}
                        </span>
                    </div>
                    <div class="person-details">
                        <span class="detail-item">
                            <i class="fas fa-venus-mars"></i>
                            ${genderText}
                        </span>
                        <span class="detail-item">
                            <i class="fas fa-calendar"></i>
                            ${person.yearOfBirth || 'неизвестно'}
                        </span>
                        <span class="detail-item">
                            <i class="fas fa-id-card"></i>
                            ID: ${person.id}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    showNotification(message, type = 'info') {
        // Удаляем существующие уведомления
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const iconMap = {
            error: 'exclamation-triangle',
            success: 'check-circle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };

        notification.innerHTML = `
            <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 10);

        // Автоматическое скрытие
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showLoading(element, show = true) {
        if (!element) return;

        if (show) {
            element.classList.add('loading');
            const btn = element.querySelector('button[type="submit"]');
            if (btn) {
                const originalText = btn.textContent;
                btn.dataset.originalText = originalText;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Поиск...';
                btn.disabled = true;
            }
        } else {
            element.classList.remove('loading');
            const btn = element.querySelector('button[type="submit"]');
            if (btn && btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
                btn.disabled = false;
                delete btn.dataset.originalText;
            }
        }
    }
}

// Глобальные вспомогательные функции
window.showLogin = () => {
    console.log('Вкладка профиля удалена из проекта');
};

window.showRegister = () => {
    console.log('Вкладка профиля удалена из проекта');
};

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
