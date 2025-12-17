// static/js/tree.js

// Данные хранятся ONLY в памяти (не в localStorage!) → сбрасываются при обновлении
let familyTree = null; // корень дерева

// Генерация уникального ID (для ссылок внутри дерева)
let nextId = 1;
const generateId = () => nextId++;

// Добавить себя как корень дерева
window.addSelf = () => {
    const name = document.getElementById('selfName')?.value.trim();
    const surname = document.getElementById('selfSurname')?.value.trim();
    const gender = document.getElementById('selfGender')?.value;
    const birth = document.getElementById('selfBirth')?.value;

    if (!name || !surname || !gender) {
        app.showNotification('Заполните имя, фамилию и пол', 'warning');
        return;
    }

    familyTree = {
        id: generateId(),
        name,
        surname,
        gender: parseInt(gender),
        yearOfBirth: birth ? parseInt(birth) : null,
        role: 'self',
        relatives: [] // дети, супруги, родители — всё здесь
    };

    renderTreeControls();
    app.showNotification('Вы добавлены как основной человек', 'success');
};

// Отрендерить форму для добавления родственника к выбранному человеку
window.addRelativeForm = () => {
    if (!familyTree) {
        app.showNotification('Сначала добавьте себя', 'warning');
        return;
    }

    const container = document.getElementById('relativesFormsContainer');
    const formId = Date.now();

    // Собираем список всех людей для выбора "к кому привязать"
    const allPeople = collectAllPeople(familyTree);
    const peopleOptions = allPeople.map(p => {
        const fullName = `${p.name} ${p.surname}`;
        const role = p.role === 'self' ? ' (Вы)' :
                    p.role === 'father' ? ' (Отец)' :
                    p.role === 'mother' ? ' (Мать)' :
                    p.role === 'son' ? ' (Сын)' :
                    p.role === 'daughter' ? ' (Дочь)' :
                    p.role === 'husband' ? ' (Муж)' : ' (Жена)';
        return `<option value="${p.id}">${fullName}${role}</option>`;
    }).join('');

    const formHtml = `
        <div class="glass-card" id="relForm_${formId}" style="margin-top: 1rem;">
            <div class="section-header">
                <h3>Новый родственник</h3>
                <button type="button" class="btn-small" onclick="removeRelativeForm('${formId}')"
                    style="background: none; border: none; color: var(--text-secondary); font-size: 1.2rem;">❌</button>
            </div>
            <div class="modern-form-grid">
                <select id="relTarget_${formId}">
                    <option value="">К кому добавить?</option>
                    ${peopleOptions}
                </select>
                <input type="text" id="relName_${formId}" placeholder="Имя">
                <input type="text" id="relSurname_${formId}" placeholder="Фамилия">
                <select id="relGender_${formId}">
                    <option value="1">Мужской</option>
                    <option value="0">Женский</option>
                </select>
                <input type="number" id="relBirth_${formId}" placeholder="Год рождения">
                <select id="relType_${formId}">
                    <option value="father">Отец</option>
                    <option value="mother">Мать</option>
                    <option value="son">Сын</option>
                    <option value="daughter">Дочь</option>
                    <option value="husband">Муж</option>
                    <option value="wife">Жена</option>
                </select>
                <button type="button" class="btn-secondary" onclick="addRelative('${formId}')">Добавить</button>
            </div>
        </div>
    `;

    container.innerHTML = formHtml; // ← перезаписываем, а не добавляем (чтобы не накапливать формы)
};

// Удалить форму (визуально)
window.removeRelativeForm = (formId) => {
    const form = document.getElementById(`relForm_${formId}`);
    if (form) form.remove();
};

// Найти человека по ID в дереве (рекурсивно)
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

// Добавить родственника к выбранному человеку
window.addRelative = (formId) => {
    const targetId = document.getElementById(`relTarget_${formId}`)?.value;
    const name = document.getElementById(`relName_${formId}`)?.value.trim();
    const surname = document.getElementById(`relSurname_${formId}`)?.value.trim();
    const gender = document.getElementById(`relGender_${formId}`)?.value;
    const birth = document.getElementById(`relBirth_${formId}`)?.value;
    const type = document.getElementById(`relType_${formId}`)?.value;

    if (!targetId || !name || !surname || !gender || !type) {
        app.showNotification('Заполните все поля', 'warning');
        return;
    }

    const target = findPerson(familyTree, parseInt(targetId));
    if (!target) {
        app.showNotification('Не удалось найти целевого человека', 'error');
        return;
    }

    const newPerson = {
        id: generateId(),
        name,
        surname,
        gender: parseInt(gender),
        yearOfBirth: birth ? parseInt(birth) : null,
        role: type,
        relatives: []
    };

    target.relatives.push(newPerson);
    renderTreeControls();
    app.showNotification(`Добавлен ${type === 'father' ? 'отец' : type === 'mother' ? 'мать' : type === 'son' ? 'сын' : type === 'daughter' ? 'дочь' : type === 'husband' ? 'муж' : 'жена'} к ${target.name}`, 'success');
};

// Отрендерить форму ввода и кнопки
function renderTreeControls() {
    const container = document.getElementById('relativesFormsContainer');
    container.innerHTML = `
        <p style="text-align: center; color: var(--text-secondary);">
            Добавьте родственников к любому человеку в дереве
        </p>
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

    let html = `
        <div class="tree-node ${isRoot ? 'node-main' : (node.gender === 1 ? 'node-male' : 'node-female')}">
            <div class="node-icon">${icon}</div>
            <div class="node-content">
                <h4>${fullName}</h4>
                <p>${node.yearOfBirth || '?'}</p>
                <small>${roleLabel}</small>
            </div>
        </div>
    `;

    // Рекурсивно рендерим родственников (детей, супругов)
    if (node.relatives.length > 0) {
        html += '<div class="tree-generation children-generation" style="justify-content: center; gap: 1.5rem;">';
        node.relatives.forEach(child => {
            html += renderNode(child, false);
        });
        html += '</div>';
    }

    return html;
}