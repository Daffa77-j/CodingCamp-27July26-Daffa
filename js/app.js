/* ============================================================
   app.js — Personal Dashboard
   ============================================================ */

// ============================================================
// SECTION 1: CLOCK & GREETING
// ============================================================

const timeEl     = document.getElementById('current-time');
const dateEl     = document.getElementById('current-date');
const greetingEl = document.getElementById('greeting');

/**
 * Returns a greeting string based on the current hour.
 * @param {number} hour - 0–23
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good Morning!';
  if (hour >= 12 && hour < 17) return 'Good Afternoon!';
  if (hour >= 17 && hour < 21) return 'Good Evening!';
  return 'Good Night!';
}

/** Formats a Date object into a readable string. */
function formatDate(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

/** Pads a number to 2 digits. */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Updates clock, date, and greeting every second. */
function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  timeEl.textContent     = `${pad(h)}:${pad(m)}:${pad(s)}`;
  dateEl.textContent     = formatDate(now);
  greetingEl.textContent = getGreeting(h);
}

updateClock();
setInterval(updateClock, 1000);


// ============================================================
// SECTION 2: FOCUS TIMER
// ============================================================

const TIMER_DURATION = 25 * 60; // 25 minutes in seconds

const timerDisplayEl = document.getElementById('timer-display');
const timerLabelEl   = document.getElementById('timer-label');
const btnStart       = document.getElementById('btn-start');
const btnStop        = document.getElementById('btn-stop');
const btnReset       = document.getElementById('btn-reset');

let timerInterval  = null;
let timeRemaining  = TIMER_DURATION;
let timerRunning   = false;

/** Renders the current timeRemaining onto the display. */
function renderTimer() {
  const mins = Math.floor(timeRemaining / 60);
  const secs = timeRemaining % 60;
  timerDisplayEl.textContent = `${pad(mins)}:${pad(secs)}`;
}

/** Tick — called every second when timer is running. */
function timerTick() {
  if (timeRemaining <= 0) {
    clearInterval(timerInterval);
    timerInterval  = null;
    timerRunning   = false;
    timerDisplayEl.classList.remove('running');
    timerDisplayEl.classList.add('finished');
    timerLabelEl.textContent = '✓ Session complete! Take a break.';
    btnStart.disabled = true;
    return;
  }
  timeRemaining--;
  renderTimer();
}

/** Starts the countdown. */
function startTimer() {
  if (timerRunning || timeRemaining <= 0) return;
  timerRunning = true;
  timerDisplayEl.classList.add('running');
  timerDisplayEl.classList.remove('finished');
  timerLabelEl.textContent = 'Stay focused…';
  timerInterval = setInterval(timerTick, 1000);
}

/** Pauses the countdown. */
function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval  = null;
  timerRunning   = false;
  timerDisplayEl.classList.remove('running');
  timerLabelEl.textContent = 'Paused. Press Start to continue.';
}

/** Resets the countdown to 25:00. */
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval  = null;
  timerRunning   = false;
  timeRemaining  = TIMER_DURATION;
  timerDisplayEl.classList.remove('running', 'finished');
  timerLabelEl.textContent = 'Ready to focus?';
  btnStart.disabled = false;
  renderTimer();
}

btnStart.addEventListener('click', startTimer);
btnStop.addEventListener('click',  stopTimer);
btnReset.addEventListener('click', resetTimer);

renderTimer();


// ============================================================
// SECTION 3: TO-DO LIST
// ============================================================

const TODO_KEY    = 'dashboard_todos';
const todoInput   = document.getElementById('todo-input');
const btnAddTodo  = document.getElementById('btn-add-todo');
const todoListEl  = document.getElementById('todo-list');
const todoEmptyEl = document.getElementById('todo-empty');

// Edit modal elements
const modalOverlay  = document.getElementById('modal-overlay');
const modalInput    = document.getElementById('modal-input');
const btnModalSave  = document.getElementById('btn-modal-save');
const btnModalCancel= document.getElementById('btn-modal-cancel');

let todos         = [];       // Array of { id, text, done }
let editingTodoId = null;     // ID of the task currently being edited

/** Loads tasks from LocalStorage. */
function loadTodos() {
  try {
    const stored = localStorage.getItem(TODO_KEY);
    todos = stored ? JSON.parse(stored) : [];
  } catch {
    todos = [];
  }
}

/** Saves tasks to LocalStorage. */
function saveTodos() {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

/** Generates a simple unique ID. */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Adds a new task. */
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.push({ id: generateId(), text: trimmed, done: false });
  saveTodos();
  renderTodos();
}

/** Toggles the done state of a task. */
function toggleTodo(id) {
  const task = todos.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTodos();
  renderTodos();
}

/** Deletes a task by ID. */
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

/** Opens the edit modal for a given task ID. */
function openEditModal(id) {
  const task = todos.find(t => t.id === id);
  if (!task) return;
  editingTodoId = id;
  modalInput.value = task.text;
  modalOverlay.classList.add('active');
  modalOverlay.setAttribute('aria-hidden', 'false');
  modalInput.focus();
}

/** Closes the edit modal. */
function closeEditModal() {
  editingTodoId = null;
  modalOverlay.classList.remove('active');
  modalOverlay.setAttribute('aria-hidden', 'true');
  modalInput.value = '';
}

/** Saves the edit from the modal. */
function saveEdit() {
  const trimmed = modalInput.value.trim();
  if (!trimmed || !editingTodoId) return;
  const task = todos.find(t => t.id === editingTodoId);
  if (task) {
    task.text = trimmed;
    saveTodos();
    renderTodos();
  }
  closeEditModal();
}

/**
 * Builds and renders the task list into the DOM.
 * Completed tasks are moved to the bottom.
 */
function renderTodos() {
  todoListEl.innerHTML = '';

  // Sort: incomplete first, done last
  const sorted = [
    ...todos.filter(t => !t.done),
    ...todos.filter(t =>  t.done),
  ];

  todoEmptyEl.style.display = sorted.length === 0 ? 'block' : 'none';

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleTodo(task.id));

    // Text
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = task.text;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon btn-edit';
    editBtn.innerHTML = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon btn-delete';
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => deleteTodo(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    todoListEl.appendChild(li);
  });
}

// Event listeners — add task
btnAddTodo.addEventListener('click', () => {
  addTodo(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTodo(todoInput.value);
    todoInput.value = '';
  }
});

// Event listeners — modal
btnModalSave.addEventListener('click', saveEdit);
btnModalCancel.addEventListener('click', closeEditModal);

modalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveEdit();
  if (e.key === 'Escape') closeEditModal();
});

// Close modal when clicking backdrop
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeEditModal();
});

// Init
loadTodos();
renderTodos();


// ============================================================
// SECTION 4: QUICK LINKS
// ============================================================

const LINKS_KEY      = 'dashboard_links';
const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const btnAddLink     = document.getElementById('btn-add-link');
const linksGridEl    = document.getElementById('links-grid');
const linksEmptyEl   = document.getElementById('links-empty');

let links = []; // Array of { id, name, url }

/** Loads links from LocalStorage. */
function loadLinks() {
  try {
    const stored = localStorage.getItem(LINKS_KEY);
    links = stored ? JSON.parse(stored) : [];
  } catch {
    links = [];
  }
}

/** Saves links to LocalStorage. */
function saveLinks() {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

/**
 * Validates and normalises a URL string.
 * Prepends https:// if no protocol is present.
 * @param {string} raw
 * @returns {string|null} normalised URL or null if invalid
 */
function normaliseUrl(raw) {
  let url = raw.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/** Adds a new quick link. */
function addLink(name, url) {
  const trimmedName = name.trim();
  const normalisedUrl = normaliseUrl(url);

  if (!trimmedName) {
    linkNameInput.focus();
    linkNameInput.style.borderColor = 'var(--danger)';
    setTimeout(() => { linkNameInput.style.borderColor = ''; }, 1500);
    return;
  }

  if (!normalisedUrl) {
    linkUrlInput.focus();
    linkUrlInput.style.borderColor = 'var(--danger)';
    setTimeout(() => { linkUrlInput.style.borderColor = ''; }, 1500);
    return;
  }

  links.push({ id: generateId(), name: trimmedName, url: normalisedUrl });
  saveLinks();
  renderLinks();
}

/** Deletes a quick link by ID. */
function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

/** Builds and renders the links grid. */
function renderLinks() {
  linksGridEl.innerHTML = '';
  linksEmptyEl.style.display = links.length === 0 ? 'block' : 'none';

  links.forEach(link => {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-item';

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.className = 'link-btn';
    anchor.textContent = link.name;
    anchor.title = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'link-remove';
    removeBtn.innerHTML = '✕';
    removeBtn.setAttribute('aria-label', `Remove link: ${link.name}`);
    removeBtn.addEventListener('click', () => deleteLink(link.id));

    wrapper.appendChild(anchor);
    wrapper.appendChild(removeBtn);
    linksGridEl.appendChild(wrapper);
  });
}

// Event listeners — add link
btnAddLink.addEventListener('click', () => {
  addLink(linkNameInput.value, linkUrlInput.value);
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
});

linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addLink(linkNameInput.value, linkUrlInput.value);
    linkNameInput.value = '';
    linkUrlInput.value  = '';
    linkNameInput.focus();
  }
});

// Init
loadLinks();
renderLinks();
