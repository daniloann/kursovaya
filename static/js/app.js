// static/js/app.js
class App {
    constructor() {
        this.currentSection = 'searchSection';
        this.init();
    }

    init() {
        this.bindEvents();
        this.showSection('searchSection');
        this.initAdvancedSearch();
    }

    bindEvents() {
        // Навигация по вкладкам
        document.querySelector('.nav-links').addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-btn');
            if (btn) {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const section = btn.dataset.section;
                this.showSection(section);
            }
        });

        // Поиск по Enter
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchPerson();
                }
            });
        }
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        this.currentSection = sectionId;
    }

    // Расширенный поиск (остаётся без изменений)
    async handleAdvancedSearch() {
        const form = document.getElementById('advancedSearchForm');
        const formData = new FormData(form);
        const criteria = {};
        for (let [key, value] of formData.entries()) {
            if (value) {
                if (['ageStart', 'ageEnd', 'yearOfBirth'].includes(key)) {
                    criteria[key] = parseInt(value);
                } else {
                    criteria[key] = value;
                }
            }
        }
        if (Object.keys(criteria).length === 0) {
            this.showNotification('Введите хотя бы одно поле для поиска', 'warning');
            return;
        }
        try {
            this.showLoading(form, true);
            const results = await api.searchAdvanced(criteria);
            this.displaySearchResults(results);
        } catch (error) {
            this.showNotification(`Ошибка поиска: ${error.message}`, 'error');
        } finally {
            this.showLoading(form, false);
        }
    }

    displaySearchResults(results) {
        const container = document.getElementById('searchResults');
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
            const fio = person.fio || `${person.surname || ''} ${person.name || ''}`.trim();
            return `
                <div class="person-card" data-person-id="${person.id}">
                    <div class="person-header">
                        <h4>${fio}</h4>
                        <span class="person-gender ${person.gender === 1 ? 'male' : 'female'}">
                            ${person.gender === 1 ? '♂' : '♀'}
                        </span>
                    </div>
                    <div class="person-details">
                        <span class="detail-item">
                            <i class="fas fa-calendar"></i>
                            ${person.yearOfBirth || 'неизвестно'}
                        </span>
                        <span class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            ${person.idCity || 'неизвестно'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    showNotification(message, type = 'info') {
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
            ${message}
        `;
        document.body.appendChild(notification);
        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    showLoading(element, show = true) {
        if (show) {
            element.classList.add('loading');
            const btn = element.querySelector('button[type="submit"]');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Поиск...';
                btn.disabled = true;
            }
        } else {
            element.classList.remove('loading');
            const btn = element.querySelector('button[type="submit"]');
            if (btn) {
                btn.innerHTML = 'Искать';
                btn.disabled = false;
            }
        }
    }
}

const app = new App();

// Инициализация расширенного поиска
function initAdvancedSearch() {
    const form = document.getElementById('advancedSearchForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            app.handleAdvancedSearch();
        });
    }
}
window.initAdvancedSearch = initAdvancedSearch;