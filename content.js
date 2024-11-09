const HIGHLIGHT_CLASS_GREEN = 'highlight-green-border';
const HIGHLIGHT_CLASS_YELLOW = 'highlight-yellow-border';
const HIGHLIGHT_CLASS_RED = 'highlight-red-border';
const MODAL_ID = 'highlight-modal';

const processedIds = new Set();

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

    // Add a close button inside the modal
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

    // Content area for title and URL
    const content = document.createElement('div');
    content.id = `${MODAL_ID}-content`;
    modal.appendChild(content);

    document.body.appendChild(modal);
}

/**
 * Displays the modal above the target element with the tweet's title and URL.
 * @param {HTMLElement} element - The tweet element.
 */
function showModal(element) {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    const title = element.getAttribute('data-title') || 'No title available';
    const url = element.getAttribute('data-url') || '#';

    const content = document.getElementById(`${MODAL_ID}-content`);
    // Clear previous content
    content.innerHTML = '';

    // Create and append title element
    const titleElem = document.createElement('h2');
    titleElem.innerText = title;
    content.appendChild(titleElem);

    // Create and append URL element
    const urlElem = document.createElement('a');
    urlElem.href = url;
    urlElem.target = '_blank';
    urlElem.innerText = url;
    content.appendChild(urlElem);

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

/**
 * Hides the modal with a fade-out effect.
 */
function hideModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300); // Match the transition duration
    }
}

/**
 * Assigns unique IDs to tweet elements and sets up hover listeners to show the modal.
 * @param {HTMLElement[]} elements - Array of tweet elements.
 */
function assignUniqueIds(elements) {
    elements.forEach((element) => {
        if (!element.id) {
            element.id = `custom-${element.tagName.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`;
            console.log(`Assigned ID: ${element.id} to tweet container:`, element);
        } else {
            console.log(`Tweet container already has ID: ${element.id}`);
        }

        // Set up hover listeners
        element.addEventListener('mouseenter', () => {
            showModal(element);
        });
    });
}

/**
 * Maps the verdict to the corresponding CSS class.
 * @param {string} verdict - The verdict string from the backend.
 * @returns {string} - The CSS class name.
 */
function getClassByVerdict(verdict) {
    const mapping = {
        'true': HIGHLIGHT_CLASS_GREEN,
        'mostly true': HIGHLIGHT_CLASS_GREEN,
        'half true': HIGHLIGHT_CLASS_YELLOW,
        'mostly false': HIGHLIGHT_CLASS_YELLOW,
        'false': HIGHLIGHT_CLASS_RED,
        'very false': HIGHLIGHT_CLASS_RED,
        'partially true': 'highlight-orange-border', // Example for orange
    };
    return mapping[verdict.toLowerCase()] || HIGHLIGHT_CLASS_RED; // Default to red if unknown
}

/**
 * Highlights elements by adding appropriate classes based on verdict and sets data attributes for modal.
 * @param {Object[]} matchingElements - Array of matching elements with id, title, url, and verdict.
 */
function highlightElements(matchingElements) {
    matchingElements.forEach(elem => {
        try {
            const element = document.getElementById(elem.id);
            if (element) {
                // Determine the class based on verdict
                const verdictClass = getClassByVerdict(elem.verdict);
                element.classList.add(verdictClass);
                console.log(`Highlighted tweet with ID: ${elem.id} using class: ${verdictClass}`);

                // Set data attributes for modal
                element.setAttribute('data-title', elem.title || 'No Title');
                element.setAttribute('data-url', elem.url || '#');
            } else {
                console.warn(`Element with ID ${elem.id} not found.`);
            }
        } catch (error) {
            console.error('Error highlighting element:', error, 'ID:', elem.id);
        }
    });
}

/**
 * Debounce utility to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} - Debounced function.
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Sends collected tweet elements to the background script for processing.
 * @param {HTMLElement[]} elements - Array of tweet elements.
 */
function sendDataToBackground(elements) {
    console.log(elements);
    const dataToSend = elements
        .filter(el => {
            if (processedIds.has(el.id)) {
                console.log(`Skipping already processed tweet ID: ${el.id}`);
                return false;
            }
            return true;
        })
        .map(el => ({
            id: el.id,
            tag: el.tagName.toLowerCase(),
            text: el.innerText || el.textContent || ""
        }));

    if (dataToSend.length === 0) {
        console.log('No new elements to send to backend.');
        return;
    }

    console.log('Sending elements to backend:', dataToSend);

    chrome.runtime.sendMessage({
        type: 'process_elements',
        elements: dataToSend,
        min_word_count: 10 // Removed 'target_word' as per the new backend logic
    });

    // Add the IDs to the processedIds set to prevent re-processing
    dataToSend.forEach(el => processedIds.add(el.id));
}


/**
 * Listener for messages from the background script.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'highlight_ids') {
        console.log('Received IDs to highlight:', request.ids);
        highlightElements(request.ids);
    } else if (request.type === 'error') {
        console.error('Extension Error:', request.message);
        // Optionally, display an alert or notification to the user
    }
});

/**
 * Utility function to pause execution for a given number of milliseconds.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise} - Promise that resolves after the specified time.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Collects relevant tweet elements from mutation records.
 * @param {MutationRecord[]} mutationsList - List of mutation records.
 * @returns {HTMLElement[]} - Array of new tweet elements.
 */
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

/**
 * Sets up a MutationObserver to monitor for new tweet elements.
 */
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

/**
 * Main function executed on page load.
 */
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

// Initialize the script once the window has fully loaded
window.addEventListener('load', main);
