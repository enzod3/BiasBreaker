
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/process-text', methods=['POST'])
def process_text():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    original_text = data['text']
    processed_text = original_text[::-1]

    return jsonify({'original': original_text, 'processed': processed_text}), 200

if __name__ == '__main__':
    app.run(host='localhost', port=5000, debug=True)

