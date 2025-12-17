// static/js/simpleSearch.js
document.getElementById('simpleSearchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fio = document.getElementById('searchFio').value.trim();
    const gender = document.getElementById('searchGender').value;
    const year = parseInt(document.getElementById('searchYear').value) || null;
    const range = parseInt(document.getElementById('searchRange').value) || 5;

    if (!fio && !gender && !year) {
        app.showNotification('Укажите хотя бы одно условие', 'warning');
        return;
    }

    const criteria = {};
    if (fio) criteria.surname = fio.split(' ')[0] || fio;
    if (gender !== '') criteria.gender = parseInt(gender);
    if (year) {
        criteria.yearOfBirth = year;
        criteria.ageTolerance = range;
    }

    try {
        const results = await api.post('/country/simple_search', criteria);
        const box = document.getElementById('searchResultBox');
        if (!results || results.length === 0) {
            box.innerHTML = '<p class="empty-state">Человек не найден</p>';
        } else {
            const p = results[0];
            box.innerHTML = `
                <div class="person-card">
                    <h4>${p.fio || `${p.surname} ${p.name}`}</h4>
                    <p>Пол: ${p.gender === 1 ? 'Мужской' : 'Женский'}</p>
                    <p>Год рождения: ${p.yearOfBirth || 'неизвестен'}</p>
                    <p>ID: ${p.id}</p>
                </div>
            `;
        }
    } catch (err) {
        document.getElementById('searchResultBox').innerHTML = '<p class="empty-state">Ошибка поиска</p>';
    }
});