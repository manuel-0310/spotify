from flask import Flask, request
import requests
import base64

app = Flask(__name__)

CLIENT_ID = 'd03b826ade884822b71d25a3b592a836'
CLIENT_SECRET = 'f337272166764c9cbbf4ff20e52eb810'  # ← pon aquí tu client secret
REDIRECT_URI = 'http://127.0.0.1:5500/callback.html'

@app.route('/get_token')
def get_token():
    code = request.args.get('code')
    if not code:
        return "No se recibió ningún código de autorización."

    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        'Authorization': f'Basic {b64_auth}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI
    }

    res = requests.post('https://accounts.spotify.com/api/token', headers=headers, data=data)
    return res.json()

if __name__ == '__main__':
    app.run(port=5000)
