let siteData = {};

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'LIVE_PREVIEW') {
            siteData = event.data.content;
            renderPage();
        }
    });

    const draft = localStorage.getItem('cms_draft');
    if (draft) {
        siteData = JSON.parse(draft);
        renderPage();
    } else {
        fetch('content.json?t=' + new Date().getTime())
            .then(res => res.json())
            .then(data => {
                siteData = data;
                renderPage();
            })
            .catch(err => {
                document.body.innerHTML = '<h2>Error loading content. Please check content.json</h2>';
            });
    }
});

function renderPage() {
    if (!siteData || !siteData.settings) return;

    // SEO
    document.title = siteData.seo.title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if(!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
    metaDesc.content = siteData.seo.description;

    // Global Settings
    document.querySelectorAll('[data-global]').forEach(el => {
        const key = el.getAttribute('data-global');
        if (siteData.settings[key]) el.textContent = siteData.settings[key];
    });

    // Navbar
    const navMenu = document.getElementById('nav-menu');
    if (navMenu && siteData.navigation) {
        navMenu.innerHTML = siteData.navigation.map(nav => `<a href="${nav.link}">${nav.label}</a>`).join('');
    }

    // Dynamic Sections
    const pageId = document.body.getAttribute('data-page');
    const mainContainer = document.getElementById('main-content');
    
    if (mainContainer && siteData.pages[pageId] && siteData.pages[pageId].sections) {
        mainContainer.innerHTML = siteData.pages[pageId].sections.map(section => {
            return renderSection(section.type, section.data);
        }).join('');
    } else if (mainContainer) {
        mainContainer.innerHTML = '<p style="padding:100px; text-align:center;">Loading page content...</p>';
    }

    // Footer
    const footerContainer = document.getElementById('footer');
    if (footerContainer) {
        footerContainer.innerHTML = `
            <div class="container">
                <a href="index.html" class="logo">${siteData.settings.siteName.split(' ')[0]}<span>.</span></a>
                <p class="footer-desc">${siteData.settings.footerDesc}</p>
                <div class="copyright">${siteData.settings.footerCopyright}</div>
            </div>
        `;
    }
}

function renderSection(type, data) {
    switch(type) {
        case 'Hero':
            return `
            <section class="hero" id="hero">
                <div class="container">
                    <div class="hero-content">
                        <h1>${data.title}</h1>
                        <p>${data.subtitle}</p>
                        <div class="btn-group">
                            ${data.btn1Text ? `<a href="${data.btn1Link}" class="btn-primary">${data.btn1Text}</a>` : ''}
                            ${data.btn2Text ? `<a href="${data.btn2Link}" class="btn-secondary">${data.btn2Text}</a>` : ''}
                        </div>
                    </div>
                    ${data.image ? `
                    <div class="hero-mockup">
                        <img src="${data.image}" alt="Hero Image">
                    </div>` : ''}
                    
                    <div class="logo-cloud">
                        <div>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon">
                        </div>
                    </div>
                </div>
            </section>`;
        
        case 'Architect':
        case 'Ecosystem':
        case 'Services':
            return `
            <section id="services">
                <div class="container">
                    <div style="text-align:center; max-width:600px; margin: 0 auto 50px;">
                        <h2>${data.title || 'Features'}</h2>
                        <p>${data.desc || ''}</p>
                    </div>
                    <div class="grid-3">
                        ${(data.services || data.cards || []).map(item => `
                            <div class="card">
                                <div class="card-icon">${item.icon || '🚀'}</div>
                                <h3>${item.title}</h3>
                                <p>${item.desc || item.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'Timeline':
            return `
            <section id="experience">
                <div class="container">
                    <h2 style="text-align:center; margin-bottom: 50px;">${data.title}</h2>
                    <div class="timeline">
                        ${(data.items || []).map(item => `
                            <div class="timeline-item">
                                <h3 class="highlight">${item.title || item.role}</h3>
                                <h4>${item.year || item.duration}</h4>
                                <p style="margin-top:10px;">${item.desc || item.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'Contact':
            return `
            <section id="contact">
                <div class="container">
                    <h2 style="text-align:center; margin-bottom: 40px;">${data.title || 'Contact'}</h2>
                    <div class="contact-form">
                        <form onsubmit="event.preventDefault(); alert('Message sent!');">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" placeholder="Your Name" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" placeholder="Your Email" required>
                            </div>
                            <div class="form-group">
                                <label>Message</label>
                                <textarea rows="5" placeholder="How can we help?" required></textarea>
                            </div>
                            <button type="submit" class="btn-primary" style="width:100%;">Send Message</button>
                        </form>
                    </div>
                </div>
            </section>`;

        default:
            return '';
    }
}
