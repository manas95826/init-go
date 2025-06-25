function fetchMessage() {
    fetch('/api/message')
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').innerHTML = 
                '<strong>API Response:</strong> ' + data.text;
        })
        .catch(error => {
            document.getElementById('result').innerHTML = 
                'Error: ' + error.message;
        });
} 