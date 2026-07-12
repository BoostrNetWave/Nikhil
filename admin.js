const GITHUB_REPO = 'BoostrNetWave/Nikhil';
const CONTENT_FILE_PATH = 'content.json';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/`;

let fileSha = '';
let currentContent = {};
let currentView = 'page-home';
let mediaLibraryCache = [];
let activeImageInputPath = null; // Stores the JSON path when opening modal

// UI Elements
const btnLogin = document.getElementById('login-btn');
const btnPublish = document.getElementById('publish-btn');
const editorPanel = document.getElementById('editor-panel');
const iframe = document.getElementById('preview-frame');
const mediaModal = document.getElementById('media-modal');
const modalGrid = document.getElementById('modal-media-grid');
const modalSearch = document.getElementById('modal-search');

// Init
document.getElementById('logout-btn').addEventListener('click', logout);
btnLogin.addEventListener('click', authenticate);
btnPublish.addEventListener('click', publishToGitHub);
modalSearch.addEventListener('input', (e) => filterMedia(e.target.value, modalGrid, true));

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

function decryptToken(password) {
    const ciphertext = 'CQEbNy1cSGYHUzsPLgEzXFBxZGwYDQQrDCZhV0hvFiomLFsWQAllYg==';
    let result = '';
    const decoded = atob(ciphertext);
    for(let i=0; i<decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return result;
}

function authenticate() {
    const username = document.getElementById('username') ? document.getElementById('username').value.trim() : '';
    const password = document.getElementById('password') ? document.getElementById('password').value.trim() : '';
    
    let token = sessionStorage.getItem('gh_token');
    
    if (!token) {
        if (username !== 'admin') {
            document.getElementById('login-error').style.display = 'block';
            return;
        }
        token = decryptToken(password);
        if (!token.startsWith('ghp_')) {
            document.getElementById('login-error').style.display = 'block';
            return;
        }
    }
    
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
        
        const draft = localStorage.getItem('cms_draft');
        if (draft) currentContent = JSON.parse(draft);

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        renderEditor();
        updatePreview();
        
        // Pre-fetch media
        fetchMedia();
    })
    .catch(err => {
        document.getElementById('login-error').style.display = 'block';
        btnLogin.textContent = 'Login →';
    });
}

function setPreviewUrl(url) {
    iframe.src = url;
    setTimeout(updatePreview, 1000);
}

function updatePreview() {
    iframe.contentWindow.postMessage({ type: 'LIVE_PREVIEW', content: currentContent }, '*');
    localStorage.setItem('cms_draft', JSON.stringify(currentContent));
    document.getElementById('save-status').textContent = 'Saved to Draft';
    document.getElementById('save-status').className = 'status-msg success';
}

function handleInput(path, value) {
    const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = currentContent;
    for (let i = 0; i < parts.length - 1; i++) current = current[parts[i]];
    current[parts[parts.length - 1]] = value;
    
    // Update input visually if changed via modal
    const inputEl = document.querySelector(`input[data-path="${path}"]`);
    if(inputEl) inputEl.value = value;
    
    updatePreview();
}

function renderEditor() {
    editorPanel.innerHTML = '';
    if (currentView.startsWith('page-')) {
        renderPageSections(currentView.split('-')[1]);
    } else if (currentView === 'navigation') {
        editorPanel.appendChild(createArrayEditor("Navigation Links", currentContent.navigation, "navigation"));
    } else if (currentView === 'seo') {
        renderSEO();
    } else if (currentView === 'media') {
        renderMediaLibrary();
    }
}

// --- EDITOR FORMS ---

function createInput(labelTxt, value, path, type='text') {
    const group = document.createElement('div');
    group.className = 'form-group';
    const label = document.createElement('label');
    label.textContent = labelTxt;
    group.appendChild(label);

    const isImage = path.toLowerCase().includes('image') || path.toLowerCase().includes('logo') || path.toLowerCase().includes('icon');

    if (isImage && type !== 'textarea') {
        const wrap = document.createElement('div');
        wrap.className = 'image-field-wrap';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.dataset.path = path;
        input.addEventListener('input', e => handleInput(path, e.target.value));
        
        const btn = document.createElement('button');
        btn.className = 'btn-outline';
        btn.textContent = 'Select Image';
        btn.onclick = () => openMediaModal(path);
        
        wrap.appendChild(input);
        wrap.appendChild(btn);
        group.appendChild(wrap);
    } else {
        let input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
        if(type === 'textarea') input.rows = 4;
        else input.type = type;
        input.value = value;
        input.dataset.path = path;
        input.addEventListener('input', e => handleInput(path, e.target.value));
        group.appendChild(input);
    }
    return group;
}

function renderPageSections(pageId) {
    const sections = currentContent.pages[pageId].sections;
    const listWrapper = document.createElement('div');
    
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
        for (const key in sec.data) {
            const val = sec.data[key];
            const dataPath = `pages.${pageId}.sections[${index}].data.${key}`;
            if (Array.isArray(val)) {
                body.appendChild(createArrayEditor(key, val, dataPath, pageId));
            } else {
                const isLong = String(val).length > 50 && !String(val).startsWith('http');
                body.appendChild(createInput(formatKey(key), val, dataPath, isLong ? 'textarea' : 'text'));
            }
        }
    });

    editorPanel.appendChild(listWrapper);

    new Sortable(listWrapper, {
        handle: '.section-header', animation: 150,
        onEnd: function (evt) {
            const item = currentContent.pages[pageId].sections.splice(evt.oldIndex, 1)[0];
            currentContent.pages[pageId].sections.splice(evt.newIndex, 0, item);
            updatePreview();
            renderEditor();
        }
    });
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

function renderSEO() {
    editorPanel.appendChild(createInput('Site Name', currentContent.settings.siteName, 'settings.siteName'));
    editorPanel.appendChild(createInput('Footer Description', currentContent.settings.footerDesc, 'settings.footerDesc', 'textarea'));
    editorPanel.appendChild(createInput('Footer Copyright', currentContent.settings.footerCopyright, 'settings.footerCopyright'));
    editorPanel.innerHTML += `<hr style="margin:20px 0; border-top:1px solid #ddd;">`;
    editorPanel.appendChild(createInput('Global Meta Title', currentContent.seo.title, 'seo.title'));
    editorPanel.appendChild(createInput('Global Meta Description', currentContent.seo.description, 'seo.description', 'textarea'));
    editorPanel.appendChild(createInput('Open Graph Image URL', currentContent.seo.ogImage, 'seo.ogImage'));
}

// --- ADVANCED MEDIA MANAGER ---

function fetchMedia(callback) {
    const token = sessionStorage.getItem('gh_token');
    fetch(API_URL + 'uploads', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => {
        mediaLibraryCache = Array.isArray(data) ? data : [];
        if(callback) callback();
    })
    .catch(() => { mediaLibraryCache = []; if(callback) callback(); });
}

function renderMediaLibrary() {
    editorPanel.innerHTML = `
        <div class="upload-box" id="drop-zone">
            <h3>Drag & Drop Files Here</h3>
            <p>Images will be compressed and optimized before uploading</p>
            <input type="file" id="file-input" style="display:none;" accept="image/*">
        </div>
        <div id="upload-status" class="status-msg"></div>
        <input type="text" class="search-bar" id="media-search" placeholder="Search uploads...">
        <div class="media-grid" id="main-media-grid"></div>
    `;

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    // Drag & Drop
    dropZone.ondragover = e => { e.preventDefault(); dropZone.classList.add('dragging'); };
    dropZone.ondragleave = e => { e.preventDefault(); dropZone.classList.remove('dragging'); };
    dropZone.ondrop = e => {
        e.preventDefault(); dropZone.classList.remove('dragging');
        if(e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0], 'main');
    };
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = e => { if(e.target.files.length) handleFileUpload(e.target.files[0], 'main'); };

    document.getElementById('media-search').addEventListener('input', (e) => filterMedia(e.target.value, document.getElementById('main-media-grid'), false));
    
    fetchMedia(() => renderMediaGrid(document.getElementById('main-media-grid'), mediaLibraryCache, false));
}

function openMediaModal(path) {
    activeImageInputPath = path;
    mediaModal.style.display = 'flex';
    modalSearch.value = '';
    fetchMedia(() => renderMediaGrid(modalGrid, mediaLibraryCache, true));
}

function filterMedia(query, gridEl, isModal) {
    const filtered = mediaLibraryCache.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));
    renderMediaGrid(gridEl, filtered, isModal);
}

function renderMediaGrid(gridEl, files, isModal) {
    gridEl.innerHTML = '';
    files.forEach(file => {
        if (!file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return;
        
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${file.path}`;
        const item = document.createElement('div');
        item.className = 'media-item';
        item.innerHTML = `<img src="${rawUrl}" loading="lazy">`;
        
        if (isModal) {
            item.onclick = () => {
                handleInput(activeImageInputPath, rawUrl);
                mediaModal.style.display = 'none';
            };
        } else {
            item.innerHTML += `
                <button class="copy-btn" onclick="navigator.clipboard.writeText('${rawUrl}'); alert('URL Copied!')">Copy URL</button>
                <button class="del-btn" onclick="deleteMedia('${file.name}', '${file.sha}')">Delete</button>
            `;
        }
        gridEl.appendChild(item);
    });
    if (files.length === 0) gridEl.innerHTML = '<p style="color:var(--text-light)">No images found.</p>';
}

// Image Optimization (Canvas compression to WebP)
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to WebP at 80% quality
            const dataUrl = canvas.toDataURL('image/webp', 0.8);
            const base64Data = dataUrl.split(',')[1];
            callback(base64Data, file.name.split('.')[0] + '.webp');
        };
    };
}

function handleFileUpload(file, source) {
    const status = document.getElementById(source === 'main' ? 'upload-status' : 'modal-upload-status');
    status.textContent = `Optimizing & Uploading ${file.name}...`;
    status.className = 'status-msg';
    
    compressImage(file, (base64Data, newName) => {
        const token = sessionStorage.getItem('gh_token');
        const fileName = `uploads/${Date.now()}-${newName.replace(/\s+/g, '-')}`;
        
        fetch(API_URL + fileName, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Media Manager: Upload ${newName}`, content: base64Data, branch: 'main' })
        })
        .then(res => res.json())
        .then(data => {
            status.textContent = 'Upload Successful!';
            status.className = 'status-msg success';
            setTimeout(() => status.textContent = '', 3000);
            
            // Refresh Library
            fetchMedia(() => {
                if(source === 'main') renderMediaGrid(document.getElementById('main-media-grid'), mediaLibraryCache, false);
                else renderMediaGrid(modalGrid, mediaLibraryCache, true);
            });
        })
        .catch(err => {
            status.textContent = 'Upload failed.';
            status.className = 'status-msg error';
        });
    });
}

window.deleteMedia = function(filename, sha) {
    if(!confirm("Permanently delete this image from the repository?")) return;
    const token = sessionStorage.getItem('gh_token');
    
    fetch(API_URL + `uploads/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Media Manager: Delete ${filename}`, sha: sha, branch: 'main' })
    })
    .then(res => {
        if(res.ok) fetchMedia(() => renderMediaGrid(document.getElementById('main-media-grid'), mediaLibraryCache, false));
    });
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
        body: JSON.stringify({ message: 'Boostr CMS: Published changes', content: encodedContent, sha: fileSha, branch: 'main' })
    })
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => {
        fileSha = data.content.sha; 
        btnPublish.textContent = 'Publish to Live Site';
        btnPublish.disabled = false;
        
        localStorage.removeItem('cms_draft');
        document.getElementById('save-status').textContent = 'Live on GitHub!';
        document.getElementById('save-status').className = 'status-msg success';
        setTimeout(() => document.getElementById('save-status').textContent='', 5000);
    })
    .catch(() => {
        btnPublish.textContent = 'Publish to Live Site';
        btnPublish.disabled = false;
        document.getElementById('save-status').textContent = 'Error publishing.';
        document.getElementById('save-status').className = 'status-msg error';
    });
}

function logout() { sessionStorage.removeItem('gh_token'); location.reload(); }
function formatKey(key) { if(!key) return ''; const result = key.replace(/([A-Z])/g, " $1"); return result.charAt(0).toUpperCase() + result.slice(1); }
if (sessionStorage.getItem('gh_token')) { authenticate(); }
