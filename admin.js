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
    renderEditor();
}

function renderEditor() {
    const container = document.getElementById('fields-container');
    container.innerHTML = '';
    
    // Build recursive editor
    const html = buildEditorNode(currentContent, '', 'Website Content');
    container.appendChild(html);
}

function buildEditorNode(node, path, name) {
    const wrapper = document.createElement('div');
    
    if (typeof node === 'string' || typeof node === 'number') {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.marginLeft = path.includes('.') ? '20px' : '0';
        
        const label = document.createElement('label');
        label.textContent = formatKey(name);
        group.appendChild(label);
        
        const isUrl = String(node).startsWith('http');
        const isLongText = String(node).length > 60 && !isUrl;
        
        let input = document.createElement(isLongText ? 'textarea' : 'input');
        if (!isLongText) input.type = isUrl ? 'url' : 'text';
        if (isLongText) input.rows = 3;
        
        input.value = node;
        input.dataset.path = path;
        
        // Data binding
        input.addEventListener('input', (e) => {
            setValueByPath(currentContent, path, e.target.value);
        });
        
        group.appendChild(input);
        wrapper.appendChild(group);
    } 
    else if (Array.isArray(node)) {
        const section = document.createElement('div');
        section.style.border = '1px solid var(--border-color)';
        section.style.padding = '15px';
        section.style.borderRadius = '12px';
        section.style.marginBottom = '20px';
        section.style.marginLeft = path ? '20px' : '0';
        section.style.background = 'rgba(0,0,0,0.02)';
        
        const title = document.createElement('h3');
        title.textContent = formatKey(name) + ' (List)';
        title.style.marginBottom = '15px';
        section.appendChild(title);
        
        node.forEach((item, index) => {
            const itemWrapper = document.createElement('div');
            itemWrapper.style.position = 'relative';
            itemWrapper.style.padding = '15px';
            itemWrapper.style.background = 'white';
            itemWrapper.style.borderRadius = '8px';
            itemWrapper.style.marginBottom = '10px';
            itemWrapper.style.border = '1px solid rgba(0,0,0,0.05)';
            
            const itemTitle = document.createElement('h4');
            itemTitle.textContent = `Item ${index + 1}`;
            itemTitle.style.marginBottom = '10px';
            itemWrapper.appendChild(itemTitle);
            
            // Delete button
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Remove';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '10px';
            delBtn.style.right = '10px';
            delBtn.style.background = '#dc2626';
            delBtn.style.color = 'white';
            delBtn.style.border = 'none';
            delBtn.style.padding = '4px 8px';
            delBtn.style.borderRadius = '4px';
            delBtn.style.cursor = 'pointer';
            delBtn.onclick = () => {
                node.splice(index, 1);
                renderEditor();
            };
            itemWrapper.appendChild(delBtn);
            
            itemWrapper.appendChild(buildEditorNode(item, `${path}[${index}]`, `Item ${index+1}`));
            section.appendChild(itemWrapper);
        });
        
        // Add button
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add Item';
        addBtn.className = 'btn-outline';
        addBtn.style.padding = '8px 16px';
        addBtn.onclick = () => {
            // copy structure of first item or empty object
            let newItem = node.length > 0 ? Array.isArray(node[0]) ? [] : typeof node[0] === 'object' ? {} : "" : "";
            if (typeof newItem === 'object' && !Array.isArray(newItem) && node.length > 0) {
                // shallow copy keys with empty strings
                for (let k in node[0]) {
                    newItem[k] = Array.isArray(node[0][k]) ? [] : "";
                }
            }
            node.push(newItem);
            renderEditor();
        };
        section.appendChild(addBtn);
        
        wrapper.appendChild(section);
    } 
    else if (typeof node === 'object' && node !== null) {
        const section = document.createElement('div');
        if (path !== '') {
            section.style.borderLeft = '3px solid var(--primary-color)';
            section.style.paddingLeft = '15px';
            section.style.marginBottom = '20px';
            section.style.marginLeft = path.includes('.') ? '20px' : '0';
            
            const title = document.createElement('h3');
            title.textContent = formatKey(name);
            title.style.marginBottom = '15px';
            title.style.color = 'var(--primary-color)';
            section.appendChild(title);
        }
        
        for (const key in node) {
            const childPath = path ? (path.endsWith(']') ? `${path}.${key}` : `${path}.${key}`) : key;
            section.appendChild(buildEditorNode(node[key], childPath, key));
        }
        wrapper.appendChild(section);
    }
    
    return wrapper;
}

function setValueByPath(obj, path, value) {
    // path could be "home.heroTitle" or "products.items[0].title"
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

function saveContent() {
    const token = sessionStorage.getItem('gh_token');
    const saveBtn = document.getElementById('save-btn');
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    document.getElementById('save-success').style.display = 'none';
    document.getElementById('save-error').style.display = 'none';

    const updatedJson = JSON.stringify(currentContent, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(updatedJson)));

    fetch(API_URL, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Admin Panel: Full content update',
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
        fileSha = data.content.sha;
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled = false;
        document.getElementById('save-success').style.display = 'block';
        
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
    if(!key) return '';
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

// Auto login
if (sessionStorage.getItem('gh_token')) {
    document.getElementById('token').value = sessionStorage.getItem('gh_token');
    authenticate();
}
