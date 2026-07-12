const GITHUB_REPO = 'BoostrNetWave/Nikhil';
const FILE_PATH = 'content.json';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;

let fileSha = '';
let currentContent = {};

document.getElementById('login-btn').addEventListener('click', authenticate);
document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('save-btn').addEventListener('click', saveContent);

function authenticate() {
    const token = document.getElementById('token').value.trim();
    if (!token) return;

    document.getElementById('login-btn').textContent = 'Loading...';
    document.getElementById('login-error').style.display = 'none';

    fetch(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
    })
    .then(data => {
        fileSha = data.sha;
        // GitHub API returns Base64 encoded content
        const decodedString = decodeURIComponent(escape(atob(data.content)));
        currentContent = JSON.parse(decodedString);
        
        sessionStorage.setItem('gh_token', token);
        showDashboard();
    })
    .catch(err => {
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('login-btn').textContent = 'Login →';
    });
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    const container = document.getElementById('fields-container');
    container.innerHTML = '';

    for (const key in currentContent) {
        const value = currentContent[key];
        const isUrl = value.startsWith('http');
        const isLongText = value.length > 80 && !isUrl;

        const group = document.createElement('div');
        group.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = formatKey(key);
        group.appendChild(label);

        let input;
        if (isLongText) {
            input = document.createElement('textarea');
            input.rows = 4;
        } else {
            input = document.createElement('input');
            input.type = isUrl ? 'url' : 'text';
        }
        
        input.id = `field_${key}`;
        input.value = value;
        group.appendChild(input);
        
        container.appendChild(group);
    }
}

function saveContent() {
    const token = sessionStorage.getItem('gh_token');
    const saveBtn = document.getElementById('save-btn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    document.getElementById('save-success').style.display = 'none';
    document.getElementById('save-error').style.display = 'none';

    // Update currentContent from inputs
    for (const key in currentContent) {
        const val = document.getElementById(`field_${key}`).value;
        currentContent[key] = val;
    }

    const updatedJson = JSON.stringify(currentContent, null, 2);
    // Base64 encode for GitHub API (handles utf-8 correctly)
    const encodedContent = btoa(unescape(encodeURIComponent(updatedJson)));

    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Admin Panel: Update content.json',
            content: encodedContent,
            sha: fileSha,
            branch: 'main'
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to save');
        return res.json();
    })
    .then(data => {
        fileSha = data.content.sha; // Update sha for future saves
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled = false;
        document.getElementById('save-success').style.display = 'block';
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            document.getElementById('save-success').style.display = 'none';
        }, 5000);
    })
    .catch(err => {
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled = false;
        document.getElementById('save-error').style.display = 'block';
    });
}

function logout() {
    sessionStorage.removeItem('gh_token');
    document.getElementById('token').value = '';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('login-btn').textContent = 'Login →';
}

function formatKey(key) {
    // converts heroTitle to Hero Title
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// Auto login if token exists in session
if (sessionStorage.getItem('gh_token')) {
    document.getElementById('token').value = sessionStorage.getItem('gh_token');
    authenticate();
}
