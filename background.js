

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'process_elements') {
        const { elements, target_word, min_word_count } = request;

        const backendUrl = 'http://localhost:5000/process_elements';

        fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                elements: elements,
                target_word: target_word,
                min_word_count: min_word_count
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            chrome.tabs.sendMessage(sender.tab.id, { type: 'highlight_ids', ids: data.ids });
            console.log('Sent matching IDs to content script:', data.ids);
        })
        .catch(error => {
            console.error('Error processing elements:', error);
            chrome.tabs.sendMessage(sender.tab.id, { type: 'error', message: error.message });
        });
    }
});

