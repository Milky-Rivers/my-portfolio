// 任务清单：状态 -> 渲染，所有写操作都先改状态再重绘
const STORAGE_KEY = "portfolio.tasks.v1";

const form = document.querySelector("#taskForm");
const input = document.querySelector("#taskInput");
const list = document.querySelector("#taskList");
const empty = document.querySelector("#taskEmpty");
const count = document.querySelector("#taskCount");
const summary = document.querySelector("#taskSummary");
const clearBtn = document.querySelector("#clearDone");
const filterBtns = [...document.querySelectorAll(".seg button")];
const yearEl = document.querySelector("#year");

if (yearEl) yearEl.textContent = String(new Date().getFullYear());

let tasks = loadTasks();
let filter = "all";

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // 隐私模式或存储被禁用时，页面仍然可用，只是刷新后不保留
  }
}

function makeId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function visibleTasks() {
  if (filter === "active") return tasks.filter((t) => !t.done);
  if (filter === "done") return tasks.filter((t) => t.done);
  return tasks;
}

function render() {
  const items = visibleTasks();
  list.replaceChildren();

  for (const task of items) {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.id = `check-${task.id}`;
    checkbox.setAttribute("aria-label", task.done ? `标记为未完成：${task.text}` : `标记为完成：${task.text}`);

    const label = document.createElement("label");
    label.className = "task-text";
    label.htmlFor = checkbox.id;
    label.textContent = task.text; // 用 textContent，用户输入不会被当成 HTML

    const del = document.createElement("button");
    del.type = "button";
    del.className = "task-del";
    del.dataset.action = "delete";
    del.setAttribute("aria-label", `删除任务：${task.text}`);
    del.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

    li.append(checkbox, label, del);
    list.append(li);
  }

  const remaining = tasks.filter((t) => !t.done).length;
  const done = tasks.length - remaining;
  count.textContent = filter === "all" ? `剩余 ${remaining} 项` : `${items.length} 项`;
  summary.textContent = `共 ${tasks.length} 项 · 已完成 ${done} 项`;
  clearBtn.disabled = done === 0;

  empty.hidden = items.length > 0;
  if (items.length === 0) {
    empty.textContent =
      filter === "active" ? "没有进行中的任务。" :
      filter === "done" ? "还没有完成的任务。" :
      "还没有任务，添加第一条吧。";
  }
}

function addTask(text) {
  tasks.unshift({ id: makeId(), text, done: false, createdAt: Date.now() });
  saveTasks();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addTask(text);
  input.value = "";
  input.focus();
});

// 事件委托：列表是动态渲染的，把监听挂在父级更稳
list.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".task-check");
  if (!checkbox) return;
  const id = checkbox.closest(".task-item").dataset.id;
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = checkbox.checked;
  saveTasks();
  render();
});

list.addEventListener("click", (event) => {
  const btn = event.target.closest('[data-action="delete"]');
  if (!btn) return;
  const id = btn.closest(".task-item").dataset.id;
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
});

for (const btn of filterBtns) {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    for (const b of filterBtns) b.setAttribute("aria-pressed", String(b === btn));
    render();
  });
}

clearBtn.addEventListener("click", () => {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
});

render();
