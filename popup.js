document.getElementById('add-task').addEventListener('click', addTask);
const taskList = document.getElementById('task-list');
const emptyMessage = document.getElementById('empty-message');

// Request notification permission on load
window.addEventListener('DOMContentLoaded', () => {
  requestNotificationPermission();
  loadTasks();
});

// Request notification permission from the user
function requestNotificationPermission() {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        alert("Notifications are disabled. Enable them for task reminders.");
      }
    });
  }
}

// Add task to list and set alarm
function addTask() {
  const taskName = document.getElementById('task-name').value;
  const taskTime = document.getElementById('task-time').value;
  const taskPeriod = document.getElementById('task-period').value;

  if (taskName && taskTime) {
    const [hour, minute] = taskTime.split(':');
    const task = {
      name: taskName,
      time: `${formatTo12Hour(hour)}:${minute} ${taskPeriod}`,
      completed: false,
      alarmTime: formatTo24Hour(hour, minute, taskPeriod)
    };

    saveTask(task);
    addTaskToUI(task);

    // Schedule the notification alarm
    const alarmTime = new Date();
    alarmTime.setHours(...task.alarmTime.split(':'));
    chrome.alarms.create(task.name, { when: alarmTime.getTime() });

    // Clear input fields
    document.getElementById('task-name').value = '';
    document.getElementById('task-time').value = '';
    document.getElementById('task-period').value = 'AM';
  } else {
    alert('Please enter both a task and a time!');
  }
}

// Convert hour and period to 12-hour format for display
function formatTo12Hour(hour) {
  const hourInt = parseInt(hour);
  if (hourInt === 0) return '12';
  if (hourInt > 12) return (hourInt - 12).toString().padStart(2, '0');
  return hour.padStart(2, '0');
}

// Convert hour and period to 24-hour format for alarms
function formatTo24Hour(hour, minute, period) {
  let hourInt = parseInt(hour);
  if (period === 'PM' && hourInt < 12) hourInt += 12;
  if (period === 'AM' && hourInt === 12) hourInt = 0;
  return `${hourInt.toString().padStart(2, '0')}:${minute}`;
}

// Save the task to local storage
function saveTask(task) {
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.push(task);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from local storage on startup
function loadTasks() {
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.forEach(addTaskToUI);
}

// Add task element to the UI with checkbox
function addTaskToUI(task) {
  const taskItem = document.createElement('div');
  taskItem.className = 'task-item';

  const taskCheckbox = document.createElement('input');
  taskCheckbox.type = 'checkbox';
  taskCheckbox.className = 'task-checkbox';
  taskCheckbox.checked = task.completed;
  taskCheckbox.addEventListener('change', () => completeTask(task, taskItem));

  const taskText = document.createElement('span');
  taskText.textContent = `${task.name} - ${task.time}`;

  taskItem.appendChild(taskCheckbox);
  taskItem.appendChild(taskText);
  taskList.appendChild(taskItem);

  emptyMessage.style.display = 'none';
}

// Mark task as complete and notify user
function completeTask(task, taskItem) {
  taskItem.classList.add('completed');

  setTimeout(() => {
    taskItem.remove();
    removeTaskFromStorage(task);
    checkEmptyList();

    // Notify user of task completion
    chrome.notifications.create('', {
      title: 'Task Completed!',
      message: `Great job on completing "${task.name}"!`,
      type: 'basic',
      iconUrl: 'icons/icon48.png'
    });
  }, 500);
}

// Remove the completed task from local storage
function removeTaskFromStorage(task) {
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks = tasks.filter((t) => t.name !== task.name || t.time !== task.time);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Check if task list is empty and show message
function checkEmptyList() {
  if (taskList.children.length === 0) {
    emptyMessage.style.display = 'block';
  }
}

// Notify user when the task time arrives
chrome.alarms.onAlarm.addListener((alarm) => {
  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const task = tasks.find(t => t.name === alarm.name);
  if (task) {
    chrome.notifications.create('', {
      title: 'Your Task Left',
      message: `${task.name} is due now!`,
      type: 'basic',
      iconUrl: 'icons/icon48.png'
    });
  }
});
