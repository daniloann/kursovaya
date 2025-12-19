console.log('Tree.js загружен!');

let familyTree = null; // корень дерева

let nextId = 1;
const generateId = () => nextId++;

window.addSelf = async function() {
    const name = document.getElementById('selfName')?.value.trim();
    const surname = document.getElementById('selfSurname')?.value.trim();
    const gender = document.getElementById('selfGender')?.value;
    const birth = document.getElementById('selfBirth')?.value;
    const city = document.getElementById('selfCity')?.value.trim(); // Получаем город

    if (!name || !surname || !gender) {
        alert('❌ Заполните имя, фамилию и пол!');
        return;
    }

    // Блокируем кнопку
    const btn = document.querySelector('button[onclick="addSelf()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ Сохранение...';
    btn.disabled = true;

    try {
        const personData = {
            name: name,
            surname: surname,
            gender: parseInt(gender),
            yearOfBirth: birth ? parseInt(birth) : null,
            isAlive: 1,
            city: city || ''
        };

        const response = await fetch(`${window.location.origin}/person/save/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(personData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            familyTree = {
                id: generateId(),
                name: name,
                surname: surname,
                gender: parseInt(gender),
                yearOfBirth: birth ? parseInt(birth) : null,
                city: city,
                role: 'self',
                relatives: []
            };

            const cityInfo = city ? `\nГород: ${city}` : '';
            alert(`✅ Успех!${cityInfo}\n\n${surname} ${name}\nID: ${result.personId}`);

            document.getElementById('selfName').value = '';
            document.getElementById('selfSurname').value = '';
            document.getElementById('selfBirth').value = '';
            document.getElementById('selfCity').value = '';

            renderTreeControls();
            app.showNotification('Вы добавлены как основной человек', 'success');

        } else {
            alert(`❌ Ошибка: ${result.error}`);
        }

    } catch (error) {
        alert(`❌ Ошибка соединения:\n${error.message}`);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

window.addRelativeForm = function() {
    if (!familyTree) {
        alert('❌ Сначала добавьте себя!');
        return;
    }

    const container = document.getElementById('relativesFormsContainer');

    const formHtml = `
        <div class="glass-card" style="margin-top: 1rem;">
            <div class="section-header">
                <h3><i class="fas fa-user-plus"></i> Добавить родственника</h3>
                <button type="button" onclick="removeRelativeForm()"
                    style="background: none; border: none; color: var(--text-secondary); font-size: 1.2rem;">❌</button>
            </div>

            <div class="modern-form-grid">
                <input type="text" id="relName" placeholder="Имя">
                <input type="text" id="relSurname" placeholder="Фамилия">
                <select id="relGender">
                    <option value="1">Мужской</option>
                    <option value="0">Женский</option>
                </select>
                <input type="number" id="relBirth" placeholder="Год рождения">

                <!-- ДОБАВЬТЕ ЭТО ПОЛЕ -->
                <input type="text" id="relCity" placeholder="Город (например: Москва)">

                <select id="relType">
                    <option value="father">Отец</option>
                    <option value="mother">Мать</option>
                    <option value="son">Сын</option>
                    <option value="daughter">Дочь</option>
                    <option value="husband">Муж</option>
                    <option value="wife">Жена</option>
                </select>

                <button type="button" class="btn-primary" onclick="addRelative()">
                    <i class="fas fa-plus"></i> Добавить
                </button>
            </div>
        </div>
    `;

    container.innerHTML = formHtml;
};

// ========== ФУНКЦИЯ ДОБАВЛЕНИЯ РОДСТВЕННИКА ==========
window.addRelative = function() {
    if (!familyTree) {
        alert('❌ Сначала добавьте себя');
        return;
    }

    // Получаем данные
    const name = document.getElementById('relName')?.value.trim();
    const surname = document.getElementById('relSurname')?.value.trim();
    const gender = document.getElementById('relGender')?.value;
    const birth = document.getElementById('relBirth')?.value;
    const relationType = document.getElementById('relType')?.value;
    const city = document.getElementById('relCity')?.value.trim(); // Город

    // Проверка
    if (!name || !surname || !gender || !relationType) {
        alert('Заполните все поля');
        return;
    }

    // Создаем родственника
    const newPerson = {
        id: generateId(),
        name,
        surname,
        gender: parseInt(gender),
        yearOfBirth: birth ? parseInt(birth) : null,
        city: city, // Сохраняем город
        role: relationType,
        relatives: []
    };

    // Добавляем в дерево
    familyTree.relatives.push(newPerson);

    // Сообщение
    const relationText = {
        'father': 'отец', 'mother': 'мать',
        'son': 'сын', 'daughter': 'дочь',
        'husband': 'муж', 'wife': 'жена'
    }[relationType];

    const cityInfo = city ? `\nГород: ${city}` : '';
    alert(`✅ Добавлен ${relationText}: ${surname} ${name}${cityInfo}`);

    // Очищаем форму
    document.getElementById('relName').value = '';
    document.getElementById('relSurname').value = '';
    document.getElementById('relBirth').value = '';
    document.getElementById('relCity').value = '';

    // Показываем успех
    const container = document.getElementById('relativesFormsContainer');
    if (container) {
        container.innerHTML = `
            <div class="glass-card" style="margin-top: 1rem; background: rgba(16, 185, 129, 0.1);">
                <h4 style="color: #10b981;">✅ Родственник добавлен!</h4>
                <p>${surname} ${name} - ${relationText}${city ? `<br><small>Город: ${city}</small>` : ''}</p>
                <button class="btn-secondary" onclick="addRelativeForm()">
                    <i class="fas fa-plus"></i> Добавить еще
                </button>
            </div>
        `;
    }
};

// ========== ФУНКЦИЯ УДАЛЕНИЯ ФОРМЫ ==========
window.removeRelativeForm = () => {
    console.log('🔔 Удаляем форму...');
    const container = document.getElementById('relativesFormsContainer');
    if (container) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-secondary); padding: 1rem;">
                Нажмите "Добавить родственника" чтобы открыть форму
            </p>
        `;
    }
};

// Найти человека по ID в дереве
function findPerson(node, id) {
    if (node.id === id) return node;
    for (let rel of node.relatives) {
        const found = findPerson(rel, id);
        if (found) return found;
    }
    return null;
}

// Собрать всех людей для выпадающего списка
function collectAllPeople(node, list = []) {
    list.push(node);
    for (let rel of node.relatives) {
        collectAllPeople(rel, list);
    }
    return list;
}

// Отрендерить форму ввода и кнопки
function renderTreeControls() {
    const container = document.getElementById('relativesFormsContainer');
    container.innerHTML = `
        <div class="glass-card" style="margin-top: 1rem; background: rgba(79, 70, 229, 0.1);">
            <div style="text-align: center;">
                <div style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Вы добавлены в дерево!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    Теперь вы можете добавить родственников или построить дерево
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-primary" onclick="buildTree()">
                        <i class="fas fa-tree"></i> Построить дерево
                    </button>
                    <button class="btn-secondary" onclick="addRelativeForm()">
                        <i class="fas fa-user-plus"></i> Добавить родственника
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Построить визуальное дерево
window.buildTree = () => {
    const container = document.getElementById('treeContainer');
    container.innerHTML = '';

    if (!familyTree) {
        container.innerHTML = '<div class="empty-state">Сначала добавьте себя</div>';
        return;
    }

    const html = renderNode(familyTree, true);
    container.innerHTML = `<div class="family-tree">${html}</div>`;
    app.showNotification('Дерево построено!', 'success');
};

// Рекурсивная отрисовка узла
function renderNode(node, isRoot = false) {
    const fullName = `${node.name} ${node.surname}`;
    const icon = node.gender === 1 ? '👨' : '👩';
    const roleLabel = node.role === 'self' ? 'Вы' :
                      node.role === 'father' ? 'Отец' :
                      node.role === 'mother' ? 'Мать' :
                      node.role === 'son' ? 'Сын' :
                      node.role === 'daughter' ? 'Дочь' :
                      node.role === 'husband' ? 'Муж' : 'Жена';

    // Добавляем город в отображение
    const cityInfo = node.city ? `<p><i class="fas fa-city"></i> ${node.city}</p>` : '';

    let html = `
        <div class="tree-node ${isRoot ? 'node-main' : (node.gender === 1 ? 'node-male' : 'node-female')}">
            <div class="node-icon">${icon}</div>
            <div class="node-content">
                <h4>${fullName}</h4>
                <p>${node.yearOfBirth || 'Год рождения неизвестен'}</p>
                ${cityInfo}
                <small>${roleLabel}</small>
            </div>
        </div>
    `;

    // Рекурсивно рендерим родственников
    if (node.relatives.length > 0) {
        html += '<div class="tree-generation children-generation" style="justify-content: center; gap: 1.5rem;">';
        node.relatives.forEach(child => {
            html += renderNode(child, false);
        });
        html += '</div>';
    }

    return html;
}
