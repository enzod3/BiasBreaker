from flask import Flask, request, jsonify
import asyncio
from server import check_passage  # Ensure server.py is in the same directory or adjust the import path accordingly

app = Flask(__name__)

@app.route('/process_elements', methods=['POST'])
async def process_elements():
    """
    Endpoint to process tweet elements. It evaluates each element's text by passing it to the check_passage function.
    If the passage meets the criteria, it collects relevant information for highlighting.
    """
    data = request.get_json()
    elements = data.get('elements', [])
    min_word_count = data.get('min_word_count', 10)
    print(elements)
    print(f"Received {len(elements)} elements to process.")

    matching_elements = []

    async def process_element(element):
        """
        Processes a single element by checking its text.
        """
        element_id = element.get('id')
        text = element.get('text', '').strip()
        word_count = len(text.split())

        print(f"Processing element ID: {element_id} | Word Count: {word_count}")

        if word_count > min_word_count:
            try:
                # Directly call the asynchronous check_passage function
                result = await check_passage(text)

                print(f"check_passage response for ID {element_id}: {result}")

                if result.get('result') == "true":
                    matched_element = {
                        'id': element_id,
                        'url': result.get('url'),
                        'verdict': result.get('verdict'),
                        'title': result.get('title')
                    }
                    matching_elements.append(matched_element)
                    print(f"Element ID: {element_id} matched. Added to matching list.")
            except Exception as e:
                print(f"Exception while processing element ID {element_id}: {e}")

    # Create a list of tasks for concurrent processing
    tasks = [process_element(elem) for elem in elements]
    await asyncio.gather(*tasks)

    print(f"Total matching elements: {len(matching_elements)}")
    print(f"Matching Elements: {matching_elements}")

    return jsonify({'ids': matching_elements}), 200

if __name__ == '__main__':
    # You can install/update Flask using:
    # pip install --upgrade Flask
    app.run(host='0.0.0.0', port=5000)

