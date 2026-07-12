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

        case 'Header':
        case 'ContactHero':
            return `
            <section class="hero" style="padding-bottom: 50px;">
                <div class="container text-center">
                    <div class="hero-content">
                        ${data.eyebrow ? `<p class="highlight" style="font-weight: 600; margin-bottom: 10px;">${data.eyebrow}</p>` : ''}
                        <h1 style="font-size: 3rem;">${data.title}</h1>
                        <p>${data.desc}</p>
                    </div>
                </div>
            </section>`;
            
        case 'ProductsGrid':
            return `
            <section id="products-grid" style="padding-top: 0;">
                <div class="container">
                    <div class="grid-2">
                        ${(data.items || []).map(item => `
                            <div class="card" style="padding: 0;">
                                <div style="height: 250px; overflow: hidden; position: relative;">
                                    <div style="position: absolute; top: 15px; right: 15px; background: ${item.badgeBg}; color: ${item.badgeColor}; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; z-index: 10;">${item.badgeText}</div>
                                    <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div style="padding: 30px;">
                                    <h3>${item.title}</h3>
                                    <p>${item.desc}</p>
                                    <ul style="list-style: none; margin-bottom: 25px;">
                                        ${(item.features || []).map(f => `<li style="margin-bottom: 8px; color: var(--text-secondary);">✓ ${f}</li>`).join('')}
                                    </ul>
                                    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                                        ${(item.tags || []).map(t => `<span style="background: var(--bg-alt); padding: 5px 12px; border-radius: 4px; font-size: 0.85rem; border: 1px solid var(--border-color);">${t}</span>`).join('')}
                                    </div>
                                    <a href="#" class="btn-secondary" style="width: 100%; text-align: center;">${item.btnText}</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'CTA':
            return `
            <section class="cta" style="background: var(--accent-color); color: white; text-align: center;">
                <div class="container">
                    <h2 style="color: white; margin-bottom: 20px;">${data.title}</h2>
                    <p style="color: rgba(255,255,255,0.9); max-width: 600px; margin: 0 auto 30px;">${data.desc}</p>
                    <a href="${data.btnLink}" class="btn-primary" style="background: white; color: var(--accent-color);">${data.btnText}</a>
                </div>
            </section>`;

        case 'ContactForm':
        case 'Contact':
            return `
            <section id="contact" style="padding-top: 0;">
                <div class="container">
                    <div class="grid-2">
                        <div>
                            <h2 style="margin-bottom: 20px;">Get in Touch</h2>
                            <p style="margin-bottom: 40px;">Ready to discuss your next project?</p>
                            <div style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 5px;">Email</h4>
                                <a href="mailto:${data.email}" style="color: var(--accent-color); text-decoration: none; font-size: 1.1rem; font-weight: 500;">${data.email}</a>
                            </div>
                            <div>
                                <h4 style="margin-bottom: 5px;">Phone</h4>
                                <p style="font-size: 1.1rem;">${data.phone}</p>
                            </div>
                        </div>
                        <div class="contact-form">
                            <h3 style="margin-bottom: 25px;">${data.formTitle || 'Send a Message'}</h3>
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
                                <button type="submit" class="btn-primary" style="width:100%;">${data.formBtn || 'Send Message'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>`;

        default:
            return '';
    }
}
