function setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(JSON.stringify(value)) + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            try {
                return JSON.parse(decodeURIComponent(cookie.substring(nameEQ.length)));
            } catch(e) {
                return null;
            }
        }
    }
    return null;
}

let currentDay = 'Понеділок'; 
let lessons = [];
let homework = [];
let pendingAction = null;

const addLessonBtn = document.querySelector('.add-lesson-btn');
const addHomeworkBtn = document.querySelector('.add-homework-btn');
const lessonInput = document.querySelector('.add-lesson-container .name');
const chooseLesson = document.querySelector('.choose-lesson');
const homeworkInput = document.querySelector('.add-homework-container .name');
const staticScheduleList = document.getElementById('static-schedule-list');
const toggleSwitch = document.querySelector('#myToggle');
const dayButtons = document.querySelectorAll('.day-btn');
const clearDayBtn = document.getElementById('clearDayBtn');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

function loadDataForDay(day) {
    lessons = getCookie('lessons_' + day) || [];
    homework = getCookie('homework_' + day) || [];
}

function initDay() {
    loadDataForDay(currentDay);
    updateLessonSelect();
    renderSchedule();
}

const savedTheme = getCookie('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (toggleSwitch) toggleSwitch.checked = true;
}

if (toggleSwitch) {
    toggleSwitch.addEventListener('change', function() {
        document.body.classList.toggle('dark-mode');
        setCookie('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light', 365);
    });
}

dayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        dayButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDay = btn.getAttribute('data-day');
        initDay();
    });
});

if (addLessonBtn) {
    addLessonBtn.addEventListener('click', () => {
        const lessonName = lessonInput.value.trim();
        if (lessonName) {
            lessons.push(lessonName);
            setCookie('lessons_' + currentDay, lessons, 365);
            updateLessonSelect();
            lessonInput.value = '';
            renderSchedule();
        }
    });
}

if (addHomeworkBtn) {
    addHomeworkBtn.addEventListener('click', () => {
        const selectedLesson = chooseLesson.value;
        const homeworkText = homeworkInput.value.trim();
        
        if (selectedLesson !== 'example' && homeworkText) {
            homework.push({ lesson: selectedLesson, task: homeworkText });
            setCookie('homework_' + currentDay, homework, 365);
            homeworkInput.value = '';
            renderSchedule();
        }
    });
}

function updateLessonSelect() {
    while (chooseLesson.options.length > 1) {
        chooseLesson.remove(1);
    }
    lessons.forEach(lessonName => {
        const newOption = document.createElement('option');
        newOption.value = lessonName;
        newOption.textContent = lessonName;
        chooseLesson.appendChild(newOption);
    });
}

function loadTaskState(day, taskId) {
    const state = getCookie('task_state_' + day) || {};
    return state[taskId] === true;
}

function saveTaskState(day, taskId, isChecked) {
    const state = getCookie('task_state_' + day) || {};
    state[taskId] = isChecked;
    setCookie('task_state_' + day, state, 365);
}

function deleteLesson(index) {
    const lessonName = lessons[index];
    homework = homework.filter(hw => hw.lesson !== lessonName);
    lessons.splice(index, 1);
    setCookie('lessons_' + currentDay, lessons, 365);
    setCookie('homework_' + currentDay, homework, 365);
    updateLessonSelect();
    renderSchedule();
}

function deleteHomework(index) {
    homework.splice(index, 1);
    setCookie('homework_' + currentDay, homework, 365);
    renderSchedule();
}

function showConfirmModal(message, action) {
    confirmMessage.textContent = message;
    pendingAction = action;
    confirmModal.style.display = 'flex';
}

function hideConfirmModal() {
    confirmModal.style.display = 'none';
    pendingAction = null;
}

confirmYes.addEventListener('click', () => {
    if (pendingAction) {
        pendingAction();
    }
    hideConfirmModal();
});

confirmNo.addEventListener('click', hideConfirmModal);

confirmModal.addEventListener('click', function(e) {
    if (e.target === confirmModal) {
        hideConfirmModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && confirmModal.style.display === 'flex') {
        hideConfirmModal();
    }
});

clearDayBtn.addEventListener('click', () => {
    showConfirmModal('Видалити все на цей день?', () => {
        lessons = [];
        homework = [];
        setCookie('lessons_' + currentDay, [], 365);
        setCookie('homework_' + currentDay, [], 365);
        setCookie('task_state_' + currentDay, {}, 365);
        updateLessonSelect();
        renderSchedule();
    });
});

function renderSchedule() {
    staticScheduleList.innerHTML = '';
    
    if (lessons.length === 0 && homework.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Додайте уроки';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.color = '#999';
        emptyMessage.style.padding = '20px';
        staticScheduleList.appendChild(emptyMessage);
        return;
    }
    
    lessons.forEach((lesson, lessonIndex) => {
        const lessonTasks = homework.filter(hw => hw.lesson === lesson);
        
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('task-item');
        
        const taskId = `homework-${lessonIndex}`;
        const isChecked = loadTaskState(currentDay, taskId);
        
        if (isChecked) {
            itemDiv.classList.add('completed');
        }

        let taskText = `${lessonIndex + 1}. ${lesson}`;
        if (lessonTasks.length > 0) {
            taskText += ` (${lessonTasks.length})`;
        }

        const taskName = document.createElement('span');
        taskName.className = 'task-name';
        taskName.textContent = taskText;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = taskId;
        checkbox.className = 'task-checkbox';
        checkbox.checked = isChecked;

        const label = document.createElement('label');
        label.htmlFor = taskId;
        label.className = 'star-label';
        label.textContent = '★';

        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'checkbox-wrapper';
        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(label);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', () => {
            showConfirmModal('Видалити цей урок?', () => {
                deleteLesson(lessonIndex);
            });
        });

        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        taskActions.appendChild(checkboxWrapper);
        taskActions.appendChild(deleteBtn);

        itemDiv.appendChild(taskName);
        itemDiv.appendChild(taskActions);
        staticScheduleList.appendChild(itemDiv);

        checkbox.addEventListener('change', (e) => {
            saveTaskState(currentDay, taskId, e.target.checked);
            if (e.target.checked) {
                itemDiv.classList.add('completed');
            } else {
                itemDiv.classList.remove('completed');
            }
        });

        lessonTasks.forEach((hw, hwIndex) => {
            const hwItemDiv = document.createElement('div');
            hwItemDiv.classList.add('task-item', 'homework-item');

            const hwText = document.createElement('span');
            hwText.className = 'task-name';
            hwText.textContent = `└─ ${hwIndex + 1}. ${hw.task}`;

            const hwDeleteBtn = document.createElement('button');
            hwDeleteBtn.className = 'delete-btn homework-delete-btn';
            hwDeleteBtn.textContent = '✕';
            hwDeleteBtn.addEventListener('click', () => {
                showConfirmModal('Видалити це домашнє завдання?', () => {
                    deleteHomework(homework.indexOf(hw));
                });
            });

            const hwTaskActions = document.createElement('div');
            hwTaskActions.className = 'task-actions';
            hwTaskActions.appendChild(hwDeleteBtn);

            hwItemDiv.appendChild(hwText);
            hwItemDiv.appendChild(hwTaskActions);
            staticScheduleList.appendChild(hwItemDiv);
        });
    });
}

initDay();

const contactsLink = document.getElementById('contacts-link');
const contactsModal = document.getElementById('contacts-modal');
const closeContactsBtn = document.getElementById('close-contacts');

if (contactsLink && contactsModal) {
    contactsLink.addEventListener('click', function(e) {
        e.preventDefault();
        contactsModal.style.display = 'flex';
    });
}

if (closeContactsBtn && contactsModal) {
    closeContactsBtn.addEventListener('click', function() {
        contactsModal.style.display = 'none';
    });
}

if (contactsModal) {
    contactsModal.addEventListener('click', function(e) {
        if (e.target === contactsModal) {
            contactsModal.style.display = 'none';
        }
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && contactsModal && contactsModal.style.display === 'flex') {
        contactsModal.style.display = 'none';
    }
});