
chrome.runtime.onInstalled.addListener(() => {
  console.log('Text Processor Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LOG_TEXT') {
    console.log('Received text from popup:', request.text);
    sendResponse({ status: 'Text logged successfully' });
  }
});

