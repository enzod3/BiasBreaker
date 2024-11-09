
document.getElementById('saveBtn').addEventListener('click', () => {
  const enableFeature = document.getElementById('enableFeature').checked;
  chrome.storage.sync.set({ enableFeature }, () => {
    alert('Settings saved');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['enableFeature'], (result) => {
    document.getElementById('enableFeature').checked = result.enableFeature || false;
  });
});

