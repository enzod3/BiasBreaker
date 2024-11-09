const HIGHLIGHT_CLASS = 'highlight-red-border';
const MODAL_ID = 'highlight-modal';

// Create and style the modal
function createModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return; // Modal already exists

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    Object.assign(modal.style, {
        position: 'absolute',
        backgroundColor: '#f9f9f9',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        display: 'none',
        zIndex: '1000',
        maxWidth: '400px',
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        transition: 'opacity 0.3s ease',
        opacity: '0',
    });

    // Optional: Add a close button inside the modal
    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    Object.assign(closeButton.style, {
        position: 'absolute',
        top: '10px',
        right: '15px',
        fontSize: '20px',
        fontWeight: 'bold',
        cursor: 'pointer',
    });
    closeButton.addEventListener('click', hideModal);
    modal.appendChild(closeButton);

    // Content area
    const content = document.createElement('div');
    content.id = `${MODAL_ID}-content`;
    modal.appendChild(content);

    document.body.appendChild(modal);
}

// Show the modal above the target element with rewritten text
function showModal(element, originalText) {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    const rewrittenText = rewriteTweet(originalText);

    const content = document.getElementById(`${MODAL_ID}-content`);
    content.innerText = rewrittenText || 'No additional information available.';

    modal.style.display = 'block';
    modal.style.opacity = '1';

    const rect = element.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();

    // Calculate position to place the modal above the element
    let top = rect.top + window.scrollY - modalRect.height - 10; // 10px above
    let left = rect.left + window.scrollX;

    // Ensure the modal doesn't go off the top of the viewport
    if (top < window.scrollY) {
        top = rect.bottom + window.scrollY + 10; // Place below if not enough space above
    }

    // Ensure the modal doesn't go off the right of the viewport
    if (left + modalRect.width > window.innerWidth) {
        left = window.innerWidth - modalRect.width - 20; // 20px margin from the edge
    }

    modal.style.top = `${top}px`;
    modal.style.left = `${left}px`;
}

// Hide the modal
function hideModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match the transition duration
    }
}

// Function to rewrite the tweet's text
function rewriteTweet(text) {
    // Placeholder for actual rewriting logic
    // For demonstration, let's reverse the text
    return text.split('').reverse().join('');
    // You can replace the above line with any text processing logic you need
}

// Assign unique IDs and set up hover listeners
function assignUniqueIds(elements) {
    elements.forEach((element) => {
        if (!element.id) {
            element.id = `custom-${element.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log(`Assigned ID: ${element.id} to tweet container:`, element);
        } else {
            console.log(`Tweet container already has ID: ${element.id}`);
        }

        element.addEventListener('mouseenter', () => {
            const tweetText = element.innerText || element.textContent || '';
            showModal(element, tweetText);
        });

    });
}

function highlightElements(ids) {
    ids.forEach(id => {
        try {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add(HIGHLIGHT_CLASS);
                console.log(`Highlighted tweet with ID: ${id}`);
            } else {
                console.warn(`Element with ID ${id} not found.`);
            }
        } catch (error) {
            console.error('Error highlighting element:', error, 'ID:', id);
        }
    });
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function sendDataToBackground(elements) {
    console.log(elements)
    const dataToSend = elements.map(el => ({
        id: el.id,
        tag: el.tagName.toLowerCase(),
        text: el.innerText || el.textContent || ""
    }));
    console.log('Sending elements to backend:', dataToSend);

    chrome.runtime.sendMessage({
        type: 'process_elements',
        elements: dataToSend,
        target_word: "Trump",
        min_word_count: 10
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'highlight_ids') {
        console.log('Received IDs to highlight:', request.ids);
        highlightElements(request.ids);
    } else if (request.type === 'error') {
        console.error('Extension Error:', request.message);
        // Optionally, display an alert or notification to the user
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function collectRelevantElements(mutationsList) {
    const newElements = [];
    const tweetSelector = "[data-testid='tweetText']";

    console.log(`collectRelevantElements: Processing ${mutationsList.length} mutations.`);

    mutationsList.forEach((mutation, index) => {
        console.log(`Processing mutation ${index + 1}:`, mutation);
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node, nodeIndex) => {
                console.log(`Processing added node ${nodeIndex + 1}:`, node);
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches && node.matches(tweetSelector)) {
                        newElements.push(node);
                        console.log('New tweet detected:', node.innerText);
                    }

                    const nestedTweets = node.querySelectorAll(tweetSelector);
                    if (nestedTweets.length > 0) {
                        nestedTweets.forEach(tweet => {
                            newElements.push(tweet);
                            console.log('Nested tweet detected:', tweet.innerText);
                        });
                    }
                }
            });
        }
    });

    console.log(`collectRelevantElements: Collected ${newElements.length} new elements.`);
    return newElements;
}

function setupTwitterMutationObserver() {
    console.log("MutationObserver: Setup started");

    const onMutation = (mutationsList) => {
        console.log("MutationObserver: Detected mutations");
        const tweetSelector = "[data-testid='tweetText']";
        const newElements = Array.from(document.querySelectorAll(tweetSelector));
        if (newElements.length > 0) {
            console.log(`MutationObserver: Found ${newElements.length} new elements to process.`);
            assignUniqueIds(newElements);
            sendDataToBackground(newElements);
        } else {
            console.log("MutationObserver: No relevant new elements found.");
        }
    };

    const observer = new MutationObserver(debounce(onMutation, 1000)); // 1-second debounce

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    console.log("MutationObserver: Setup complete");
}

async function main() {
    console.log('Page loaded. Waiting for 3 seconds before sending initial request...');

    await sleep(3000);

    console.log('3 seconds elapsed. Assigning unique IDs and sending initial request.');

    const tweetSelector = "[data-testid='tweetText']";
    const initialTweets = document.querySelectorAll(tweetSelector);
    console.log(`Found ${initialTweets.length} initial tweets.`);

    assignUniqueIds(Array.from(initialTweets));

    sendDataToBackground(Array.from(initialTweets));

    setupTwitterMutationObserver();

    createModal();
}

window.addEventListener('load', main);

