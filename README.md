
# BiasBreaker

This Chrome extension reads text content on web pages (such as social media feeds) and highlights text containing specific keywords, while also analyzing the text to flag potential biases and fact-check important information. The goal is to provide users with a more balanced view of online content and help them identify biased or misleading language.


## Features

- **Keyword-Based Highlighting**: Highlights text content containing specific target keywords, with dynamic colors indicating varying levels of relevance.
- **Bias Detection**: Analyzes text for biased language, marking statements that may reflect partiality or unsupported claims.
- **Fact-Checking**: Sends highlighted text to a backend for further analysis, including cross-referencing with reliable sources to flag any false or misleading information.
- **Hover Modal**: Displays the full highlighted text and additional contextual information when the user hovers over highlighted content.
- **Real-Time Analysis**: Uses a MutationObserver to track changes in dynamically loaded content, ensuring accurate and up-to-date highlighting as new text appears on the page.

## Getting Started

### Prerequisites

- Chrome Browser
- [Node.js](https://nodejs.org)
- Flask

### Installation

1. **Clone the Repository**:
2. 
3. **Backend Setup**:
   - Navigate to the `backend` folder:
     ```bash
     cd backend
     ```
   - Install required packages:
     ```bash
     pip install flask flask-cors
     ```
   - Run the backend server:
     ```bash
     python app.py
     ```
   This server receives text data from the extension, analyzes it for biases or misleading information, and returns the results to the extension.

4. **Load the Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`.
   - Enable **Developer mode** (toggle it on at the top right).
   - Click **Load unpacked** and select the root folder of the project.
   - The extension should now be loaded and active in your browser.

### Usage

1. **Navigate to a Web Page**:
   - Open Twitter, news sites, or any web page with substantial text content. The extension is set to scan the page and highlight relevant content automatically.

2. **View Highlights and Hover Modal**:
   - Text containing specific keywords (e.g., biased terms or phrases flagged for fact-checking) will appear highlighted in red (or dynamically assigned colors based on relevance).
   - Hover over a highlighted text section to view a modal displaying the full content of the text and additional information, such as context or a summary of relevant sources.

3. **Bias and Fact-Checking Analysis**:
   - The extension sends highlighted text to a backend server to detect bias or unverified information. If biases or unsupported claims are found, these are marked directly in the browser for easy review.

## Future Enhancements

- **User Configurations**: Allow users to set custom keywords, target word count, and color ranges for more personalized highlighting.
- **Sentiment Analysis**: Add sentiment scoring for highlighted text to provide insight into the tone (positive, negative, neutral) of content.
- **Improved Fact-Checking**: Integrate with external fact-checking APIs to provide real-time fact-checking.
- **User Feedback and Customization**: Allow users to provide feedback on flagged content to improve bias detection and create personalized, adaptive settings.
- **Expanded Cross-Browser Support**: Extend support to Firefox and other popular browsers.

## Contributing

1. **Fork the repository**.
2. **Create a new branch**:
   ```bash
   git checkout -b feature-branch
   ```
3. **Commit your changes**.
4. **Push the branch**:
   ```bash
   git push origin feature-branch
   ```
5. **Open a pull request**.

## License

This project is licensed under the MIT License.

## Contact

For questions or suggestions, please reach out at [your-email@example.com].

--- 

This README should help users understand how to install, use, and contribute to your Chrome extension. Let me know if you'd like to expand on any part!
