chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.sync.get(alarm.name, (result) => {
    chrome.notifications.create('', {
      title: 'Task Reminder',
      message: `Time for: ${result[alarm.name]}`,
      iconUrl: 'icons/icon48.png',
      type: 'basic'
    });
  });
});
