const GITHUB_REPO = 'BoostrNetWave/Nikhil';
const CONTENT_FILE_PATH = 'content.json';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/`;

let fileSha = '';
let currentContent = {};
let currentView = 'page-home';

// UI Elements
const btnLogin = document.getElementById('login-btn');
const btnPublish = document.getElementById('publish-btn');
const editorPanel = document.getElementById('editor-panel');
const iframe = document.getElementById('preview-frame');

// Init
document.getElementById('logout-btn').addEventListener('click', logout);
btnLogin.addEventListener('click', authenticate);
btnPublish.addEventListener('click', publishToGitHub);

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        e.target.classList.add('active');
        currentView = e.target.getAttribute('data-view');
        document.getElementById('current-view-title').textContent = 'Editing: ' + e.target.textContent;
        renderEditor();
    });
});

function authenticate() {
    const token = document.getElementById('token').value.trim();
    if (!token) return;
    btnLogin.textContent = 'Loading...';
    
    fetch(API_URL + CONTENT_FILE_PATH, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    })
    .then(res => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
    })
    .then(data => {
        fileSha = data.sha;
        currentContent = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        sessionStorage.setItem('gh_token', token);
        
        // Check local storage for unsaved drafts
        const draft = localStorage.getItem('cms_draft');
        if (draft) currentContent = JSON.parse(draft);

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        renderEditor();
        updatePreview();
    })
    .catch(err => {
        document.getElementById('login-error').style.display = 'block';
        btnLogin.textContent = 'Login →';
    });
}

function setPreviewUrl(url) {
    iframe.src = url;
    setTimeout(updatePreview, 1000); // Give it time to load
}

function updatePreview() {
    iframe.contentWindow.postMessage({ type: 'LIVE_PREVIEW', content: currentContent }, '*');
    // Auto-save draft
    localStorage.setItem('cms_draft', JSON.stringify(currentContent));
    document.getElementById('save-status').textContent = 'Saved to Draft';
    document.getElementById('save-status').className = 'status-msg success';
}

function handleInput(path, value) {
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = currentContent;
    for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    updatePreview();
}

function renderEditor() {
    editorPanel.innerHTML = '';
    
    if (currentView.startsWith('page-')) {
        const pageId = currentView.split('-')[1];
        renderPageSections(pageId);
    } else if (currentView === 'navigation') {
        renderNavigation();
    } else if (currentView === 'seo') {
        renderSEO();
    } else if (currentView === 'media') {
        renderMediaLibrary();
    }
}

// --- RENDERERS ---

function createInput(labelTxt, value, path, type='text') {
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = labelTxt;
    group.appendChild(label);

    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 4;
    } else {
        input = document.createElement('input');
        input.type = type;
    }
    input.value = value;
    input.addEventListener('input', e => handleInput(path, e.target.value));
    group.appendChild(input);
    return group;
}

function renderPageSections(pageId) {
    const sections = currentContent.pages[pageId].sections;
    const listWrapper = document.createElement('div');
    listWrapper.id = 'sections-list';
    
    sections.forEach((sec, index) => {
        const block = document.createElement('div');
        block.className = 'section-block';
        block.innerHTML = `
            <div class="section-header">
                <span class="section-title">☰ ${sec.type} Section</span>
                <button class="btn-remove" onclick="removeSection('${pageId}', ${index})">Delete</button>
            </div>
            <div class="section-body" id="sec-body-${index}"></div>
        `;
        listWrapper.appendChild(block);
        
        const body = block.querySelector(`#sec-body-${index}`);
        
        // Recursively render data fields
        for (const key in sec.data) {
            const val = sec.data[key];
            const dataPath = `pages.${pageId}.sections[${index}].data.${key}`;
            
            if (Array.isArray(val)) {
                // Render Array (e.g., Products, Services)
                body.appendChild(createArrayEditor(key, val, dataPath, pageId));
            } else {
                // Render String
                const isLong = String(val).length > 50 && !String(val).startsWith('http');
                body.appendChild(createInput(formatKey(key), val, dataPath, isLong ? 'textarea' : 'text'));
            }
        }
    });

    editorPanel.appendChild(listWrapper);

    // Initialize Drag and Drop
    new Sortable(listWrapper, {
        handle: '.section-header',
        animation: 150,
        onEnd: function (evt) {
            const item = currentContent.pages[pageId].sections.splice(evt.oldIndex, 1)[0];
            currentContent.pages[pageId].sections.splice(evt.newIndex, 0, item);
            updatePreview();
            renderEditor(); // Redraw
        }
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-outline';
    addBtn.style.marginTop = '20px';
    addBtn.textContent = '+ Add New Section';
    addBtn.onclick = () => alert("Adding new sections dynamically coming soon. Please duplicate an existing section via code for now.");
    editorPanel.appendChild(addBtn);
}

function createArrayEditor(title, array, arrayPath, pageId) {
    const wrapper = document.createElement('div');
    wrapper.style.marginTop = '20px';
    wrapper.innerHTML = `<h4>${formatKey(title)}</h4><div id="${arrayPath}-list"></div>`;
    const list = wrapper.querySelector('div');

    array.forEach((item, idx) => {
        const itemBlock = document.createElement('div');
        itemBlock.className = 'array-item';
        const itemPath = `${arrayPath}[${idx}]`;
        
        itemBlock.innerHTML = `<button class="btn-remove" onclick="removeArrayItem('${arrayPath}', ${idx})">X</button>`;
        
        for (const k in item) {
            if (typeof item[k] === 'string') {
                const isLong = item[k].length > 40 && !item[k].startsWith('http');
                itemBlock.appendChild(createInput(formatKey(k), item[k], `${itemPath}.${k}`, isLong ? 'textarea' : 'text'));
            } else if (Array.isArray(item[k])) {
                // e.g. tags array of strings
                const tagGroup = document.createElement('div');
                tagGroup.className = 'form-group';
                tagGroup.innerHTML = `<label>${formatKey(k)} (Comma separated)</label>`;
                const tagInput = document.createElement('input');
                tagInput.value = item[k].join(', ');
                tagInput.addEventListener('input', e => handleInput(`${itemPath}.${k}`, e.target.value.split(',').map(s=>s.trim())));
                tagGroup.appendChild(tagInput);
                itemBlock.appendChild(tagGroup);
            }
        }
        list.appendChild(itemBlock);
    });

    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Add Item';
    addBtn.className = 'btn-outline';
    addBtn.style.fontSize = '0.8rem';
    addBtn.style.padding = '4px 12px';
    addBtn.onclick = () => {
        let template = {};
        if (array.length > 0) {
            for(let k in array[0]) template[k] = Array.isArray(array[0][k]) ? [] : "";
        }
        array.push(template);
        updatePreview();
        renderEditor();
    };
    wrapper.appendChild(addBtn);
    return wrapper;
}

window.removeSection = function(pageId, index) {
    if(confirm("Delete this section?")) {
        currentContent.pages[pageId].sections.splice(index, 1);
        updatePreview();
        renderEditor();
    }
}
window.removeArrayItem = function(arrayPath, index) {
    if(confirm("Delete this item?")) {
        const parts = arrayPath.replace(/\[(\d+)\]/g, '.$1').split('.');
        let arr = currentContent;
        for (let i = 0; i < parts.length; i++) arr = arr[parts[i]];
        arr.splice(index, 1);
        updatePreview();
        renderEditor();
    }
}

function renderNavigation() {
    editorPanel.appendChild(createArrayEditor("Navigation Links", currentContent.navigation, "navigation"));
}

function renderSEO() {
    editorPanel.appendChild(createInput('Site Name', currentContent.settings.siteName, 'settings.siteName'));
    editorPanel.appendChild(createInput('Footer Description', currentContent.settings.footerDesc, 'settings.footerDesc', 'textarea'));
    editorPanel.appendChild(createInput('Footer Copyright', currentContent.settings.footerCopyright, 'settings.footerCopyright'));
    editorPanel.innerHTML += `<hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">`;
    editorPanel.appendChild(createInput('Global Meta Title', currentContent.seo.title, 'seo.title'));
    editorPanel.appendChild(createInput('Global Meta Description', currentContent.seo.description, 'seo.description', 'textarea'));
    editorPanel.appendChild(createInput('Open Graph Image URL', currentContent.seo.ogImage, 'seo.ogImage'));
}

function renderMediaLibrary() {
    editorPanel.innerHTML = `
        <div class="upload-box" id="drop-zone">
            <h3>Drag & Drop Files Here</h3>
            <p>or click to select images to upload to GitHub</p>
            <input type="file" id="file-input" style="display:none;" accept="image/*">
        </div>
        <div id="upload-status" class="status-msg"></div>
        <h4>Recent Uploads</h4>
        <div class="media-grid" id="media-grid"></div>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.onclick = () => fileInput.click();
    
    fileInput.onchange = e => {
        if(e.target.files.length > 0) uploadFile(e.target.files[0]);
    };
}

function uploadFile(file) {
    const status = document.getElementById('upload-status');
    status.textContent = `Uploading ${file.name}...`;
    status.className = 'status-msg';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // e.target.result is data:image/png;base64,.....
        const base64Data = e.target.result.split(',')[1];
        const token = sessionStorage.getItem('gh_token');
        const fileName = `uploads/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        
        fetch(API_URL + fileName, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Upload media: ${file.name}`,
                content: base64Data,
                branch: 'main'
            })
        })
        .then(res => res.json())
        .then(data => {
            status.textContent = 'Upload Successful! URL copied to clipboard.';
            status.className = 'status-msg success';
            
            // The raw URL format for GitHub pages or raw.githubusercontent
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${fileName}`;
            navigator.clipboard.writeText(rawUrl);
            
            // Show preview
            const grid = document.getElementById('media-grid');
            grid.innerHTML += `<div class="media-item"><img src="${rawUrl}"><button class="copy-btn" onclick="navigator.clipboard.writeText('${rawUrl}')">Copy URL</button></div>`;
        })
        .catch(err => {
            status.textContent = 'Upload failed.';
            status.className = 'status-msg error';
        });
    };
    reader.readAsDataURL(file);
}

function publishToGitHub() {
    const token = sessionStorage.getItem('gh_token');
    btnPublish.textContent = 'Publishing...';
    btnPublish.disabled = true;
    
    const updatedJson = JSON.stringify(currentContent, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(updatedJson)));

    fetch(API_URL + CONTENT_FILE_PATH, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: 'Boostr CMS: Published changes',
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
        btnPublish.textContent = 'Publish to Live Site';
        btnPublish.disabled = false;
        
        localStorage.removeItem('cms_draft');
        document.getElementById('save-status').textContent = 'Live on GitHub!';
        document.getElementById('save-status').className = 'status-msg success';
        setTimeout(() => document.getElementById('save-status').textContent='', 5000);
    })
    .catch(err => {
        btnPublish.textContent = 'Publish to Live Site';
        btnPublish.disabled = false;
        document.getElementById('save-status').textContent = 'Error publishing.';
        document.getElementById('save-status').className = 'status-msg error';
    });
}

function logout() {
    sessionStorage.removeItem('gh_token');
    location.reload();
}

function formatKey(key) {
    if(!key) return '';
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
}

if (sessionStorage.getItem('gh_token')) {
    document.getElementById('token').value = sessionStorage.getItem('gh_token');
    authenticate();
}
