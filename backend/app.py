from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/process_elements', methods=['POST'])
def process_elements():
    data = request.get_json()
    elements = data.get('elements', [])
    min_word_count = data.get('min_word_count', 10)

    print(f"Received {len(elements)} elements to process.")

    matching_elements = []

    for element in elements:
        element_id = element.get('id')
        text = element.get('text', '').strip()
        word_count = len(text.split())

        print(f"Processing element ID: {element_id} | Word Count: {word_count}")

        if word_count > min_word_count:
            try:
                response = requests.post(
                    'http://localhost:8000/check-passage',
                    json={'text': text},
                    timeout=5  # Timeout after 5 seconds
                )

                if response.status_code == 200:
                    result = response.json()

                    print(f"/check-passage response for ID {element_id}: {result}")

                    if result.get('result') == "true":
                        matched_element = {
                            'id': element_id,
                            'url': result.get('url'),
                            'verdict': result.get('verdict'),
                            'title': result.get('title')
                        }
                        matching_elements.append(matched_element)
                        print(f"Element ID: {element_id} matched. Added to matching list.")
                else:
                    print(f"Error: /check-passage returned status code {response.status_code} for ID {element_id}")

            except requests.exceptions.RequestException as e:
                print(f"RequestException for element ID {element_id}: {e}")

    print(f"Total matching elements: {len(matching_elements)}")
    print(f"Matching Elements: {matching_elements}")

    return jsonify({'ids': matching_elements}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

