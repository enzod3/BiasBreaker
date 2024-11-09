
document.getElementById('processBtn').addEventListener('click', () => {
  const inputText = document.getElementById('inputText').value.trim();

  if (!inputText) {
    alert('Please enter some text to process.');
    return;
  }

  fetch('http://localhost:5000/process-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: inputText })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
      } else {
        document.getElementById('outputText').value = data.processed;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to connect to the backend server. Please ensure it is running.');
    });
});

