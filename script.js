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

const addLessonBtn = document.querySelector('.add-lesson-btn');
const addHomeworkBtn = document.querySelector('.add-homework-btn');
const lessonInput = document.querySelector('.add-lesson-container .name');
const chooseLesson = document.querySelector('.choose-lesson');
const homeworkInput = document.querySelector('.add-homework-container .name');
const dynamicListDiv = document.getElementById('dynamic-list');
const staticScheduleList = document.getElementById('static-schedule-list');
const toggleSwitch = document.querySelector('#myToggle');
const dayButtons = document.querySelectorAll('.day-btn');

function loadDataForDay(day) {
    lessons = getCookie('lessons_' + day) || [];
    homework = getCookie('homework_' + day) || [];
}

function initDay() {
    loadDataForDay(currentDay);
    updateLessonSelect();
    display();
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

function setupInputPlaceholder(inputElement, placeholderText) {
    inputElement.addEventListener('focus', () => {
        if (inputElement.value === placeholderText) {
            inputElement.value = '';
        }
    });
    inputElement.addEventListener('blur', () => {
        if (inputElement.value.trim() === '') {
            inputElement.value = placeholderText;
        }
    });
}

setupInputPlaceholder(lessonInput, 'Додати урок');
setupInputPlaceholder(homeworkInput, 'Додати домашку');

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

if (addLessonBtn) {
    addLessonBtn.addEventListener('click', () => {
        const lessonName = lessonInput.value.trim();
        if (lessonName && lessonName !== 'Додати урок') {
            lessons.push(lessonName);
            setCookie('lessons_' + currentDay, lessons, 365);
            
            updateLessonSelect();
            lessonInput.value = 'Додати урок';
            display();
        }
    });
}

if (addHomeworkBtn) {
    addHomeworkBtn.addEventListener('click', () => {
        const selectedLesson = chooseLesson.value;
        const homeworkText = homeworkInput.value.trim();
        
        if (selectedLesson !== 'example' && homeworkText && homeworkText !== 'Додати домашку') {
            homework.push({ lesson: selectedLesson, task: homeworkText });
            setCookie('homework_' + currentDay, homework, 365);
            homeworkInput.value = 'Додати домашку';
            display();
        }
    });
}

function loadTaskState(day, taskId) {
    const state = JSON.parse(localStorage.getItem('schedule_' + day) || '{}');
    return state[taskId] === true;
}

function saveTaskState(day, taskId, isChecked) {
    const state = JSON.parse(localStorage.getItem('schedule_' + day) || '{}');
    state[taskId] = isChecked;
    localStorage.setItem('schedule_' + day, JSON.stringify(state));
}

function display() {
    dynamicListDiv.innerHTML = ''; 
    
    if (lessons.length > 0) {
        const lessonsTitle = document.createElement('h4');
        lessonsTitle.textContent = 'Уроки:';
        dynamicListDiv.appendChild(lessonsTitle);
        
        lessons.forEach((lesson, index) => {
            const p = document.createElement('p');
            p.textContent = `${index + 1}. ${lesson}`;
            p.addEventListener('click', () => {
                const lessonName = lessons[index];
                homework = homework.filter(h => h.lesson !== lessonName);
                setCookie('homework_' + currentDay, homework, 365);
                
                lessons.splice(index, 1);
                setCookie('lessons_' + currentDay, lessons, 365);
                updateLessonSelect();
                display();
            });
            dynamicListDiv.appendChild(p);
        });
    }
    
    if (homework.length > 0) {
        const hwTitle = document.createElement('h4');
        hwTitle.textContent = 'Домашка:';
        hwTitle.style.marginTop = '15px';
        dynamicListDiv.appendChild(hwTitle);

        const lessonTaskCounters = {};
        
        homework.forEach((hw, index) => {
            const lessonIndex = lessons.indexOf(hw.lesson);
            
            if (lessonIndex !== -1) {
                const isCompleted = loadTaskState(currentDay, `task-${lessonIndex + 1}`);
                if (isCompleted) return;
            }

            if (!lessonTaskCounters[hw.lesson]) {
                lessonTaskCounters[hw.lesson] = 0;
            }
            lessonTaskCounters[hw.lesson]++;
            
            const lessonNumber = lessonIndex + 1;
            const taskCounter = lessonTaskCounters[hw.lesson];
            const displayIndex = `${lessonNumber}.${taskCounter}`;

            const p = document.createElement('p');
            p.textContent = `${displayIndex} (${hw.lesson}): ${hw.task}`;
            p.addEventListener('click', () => {
                homework.splice(index, 1);
                setCookie('homework_' + currentDay, homework, 365);
                display();
            });
            dynamicListDiv.appendChild(p);
        });
    }
}

const numTasks = 8;
const tasks = [];
for (let i = 1; i <= numTasks; i++) {
    tasks.push({ id: `task-${i}`, name: `Урок ${i} - Домашнє завдання` });
}

function renderSchedule() {
    staticScheduleList.innerHTML = '';
    
    tasks.forEach(task => {
        const isChecked = loadTaskState(currentDay, task.id);
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('task-item');
        if (isChecked) {
            itemDiv.classList.add('completed');
        }

        itemDiv.innerHTML = `
            <span class="task-name">${task.name}</span>
            <div class="checkbox-wrapper">
                <input type="checkbox" id="${task.id}" class="task-checkbox" ${isChecked ? 'checked' : ''}>
                <label for="${task.id}" class="star-label">★</label>
            </div>
        `;
        staticScheduleList.appendChild(itemDiv);
    });

    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = e.target.id;
            const isChecked = e.target.checked;
            saveTaskState(currentDay, taskId, isChecked);
            
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                if (isChecked) {
                    taskItem.classList.add('completed');
                } else {
                    taskItem.classList.remove('completed');
                }
            }
            display();
        });
    });
}

initDay();

function closeModal() {
let modal = document.getElementById('contactModal');
let overlay = document.getElementById('modalOverlay'); 
    
if (modal) {
    modal.style.display = 'none';
}
if (overlay) {
    overlay.style.display = 'none';
}
window.location.href = 'index.html';
}