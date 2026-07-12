let siteData = {};

document.addEventListener('DOMContentLoaded', () => {
    // Listen for live preview messages from Admin Panel
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'LIVE_PREVIEW') {
            siteData = event.data.content;
            renderPage();
        }
    });

    // Fetch initial data
    fetch('content.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            siteData = data;
            renderPage();
        })
        .catch(err => console.error("Error loading content:", err));
});

function renderPage() {
    if (!siteData || !siteData.settings) return;

    // Render SEO
    document.title = siteData.seo.title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if(!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = siteData.seo.description;

    // Render Global Settings
    document.querySelectorAll('[data-global]').forEach(el => {
        const key = el.getAttribute('data-global');
        if (siteData.settings[key]) el.textContent = siteData.settings[key];
    });

    // Render Navigation
    const navLinks = document.getElementById('nav-links');
    if (navLinks && siteData.navigation) {
        const currentPage = document.body.getAttribute('data-page') + '.html';
        navLinks.innerHTML = siteData.navigation.map(nav => `
            <a href="${nav.url}" class="${currentPage === nav.url ? 'active' : ''}">${nav.label}</a>
        `).join('');
    }
    
    const navCta = document.getElementById('nav-cta');
    if (navCta) {
        navCta.textContent = siteData.settings.ctaText;
        navCta.href = siteData.settings.ctaLink;
    }

    // Render Footer Navigation
    const footerLinks = document.getElementById('footer-nav-links');
    if (footerLinks && siteData.navigation) {
        footerLinks.innerHTML = siteData.navigation.map(nav => `
            <a href="${nav.url}">${nav.label}</a>
        `).join('');
    }

    // Render Page Sections
    const pageId = document.body.getAttribute('data-page');
    const mainContainer = document.getElementById('page-builder-content');
    
    if (mainContainer && siteData.pages[pageId] && siteData.pages[pageId].sections) {
        mainContainer.innerHTML = siteData.pages[pageId].sections.map(section => {
            return renderSection(section.type, section.data);
        }).join('');
    }

    initAnimations();
}

function renderSection(type, data) {
    switch (type) {
        case 'Hero':
            return `
            <section class="hero fade-in-up">
                <div class="hero-content">
                    <div class="status-badge"><span class="status-dot"></span> ${data.status}</div>
                    <h1>${data.title}</h1>
                    <h2>${data.subtitle}</h2>
                    <p>${data.desc}</p>
                    <div class="hero-btns">
                        <a href="${data.btn1Link}" class="btn-primary">${data.btn1Text}</a>
                        <a href="${data.btn2Link}" class="btn-outline">${data.btn2Text}</a>
                    </div>
                </div>
                <div class="hero-image">
                    <img src="${data.image}" alt="Hero Image">
                </div>
            </section>`;
        
        case 'Architect':
            return `
            <section class="section section-secondary fade-in-up">
                <div class="architect-grid">
                    <div class="architect-text">
                        <h3>${data.eyebrow}</h3>
                        <h2>${data.title}</h2>
                        <p>${data.desc}</p>
                    </div>
                    <div class="grid-2">
                        ${data.services.map(s => `
                            <div class="glass-card">
                                <div class="card-icon">${s.icon}</div>
                                <h4>${s.title}</h4>
                                <p>${s.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
        
        case 'Timeline':
            return `
            <section class="section fade-in-up">
                <h2 class="section-title"><span>${data.title}</span></h2>
                <p class="section-subtitle">${data.desc}</p>
                <div class="timeline">
                    ${data.items.map(item => `
                        <div class="timeline-item">
                            <div class="timeline-year">${item.year}</div>
                            <h4>${item.title}</h4>
                            <p>${item.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </section>`;

        case 'Ecosystem':
            return `
            <section class="section section-secondary fade-in-up">
                <h2 class="section-title"><span>${data.title}</span></h2>
                <p class="section-subtitle">${data.desc}</p>
                <div class="grid-2">
                    ${data.cards.map(card => `
                        <div class="glass-card" style="padding:2.5rem;">
                            <div class="eco-header">
                                <div class="eco-logo" style="background:${card.logoBg};">${card.logoLetter}</div>
                                <div class="eco-title">
                                    <h4>${card.title}</h4>
                                    <span>${card.subtitle}</span>
                                </div>
                            </div>
                            <p style="color:var(--text-light); margin-bottom:1.5rem;">${card.desc}</p>
                            <div class="eco-tags">
                                ${card.tags.map(t => `<span>${t}</span>`).join('')}
                            </div>
                            <a href="${card.linkUrl}" class="eco-link">${card.linkText}</a>
                        </div>
                    `).join('')}
                </div>
            </section>`;
            
        case 'Expertise':
            return `
            <section class="section fade-in-up">
                <h2 class="section-title"><span>${data.title}</span></h2>
                <p class="section-subtitle">${data.desc}</p>
                <div class="grid-4">
                    ${data.items.map(item => `
                        <div class="glass-card" style="padding:1.5rem;">
                            <div class="card-icon" style="margin-bottom:1rem; width:40px; height:40px; font-size:1.2rem;">${item.icon}</div>
                            <h4>${item.title}</h4>
                            <p>${item.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </section>`;

        case 'CTA':
            return `
            <section class="section fade-in-up" style="display:flex; justify-content:center;">
                <div class="glass-card" style="text-align:center; max-width:800px; width:100%; border-color:var(--primary-color);">
                    <h2 style="font-size: 2.5rem; font-weight:700; margin-bottom:1rem;">${data.title}</h2>
                    <p style="color:var(--text-light); margin-bottom:2rem;">${data.desc}</p>
                    <a href="${data.btnLink}" class="btn-primary">${data.btnText}</a>
                </div>
            </section>`;

        case 'Header':
            return `
            <section class="section fade-in-up" style="padding-bottom: 20px;">
                <h1 class="section-title"><span>${data.title}</span></h1>
                <p class="section-subtitle">${data.desc}</p>
            </section>`;

        case 'ProductsGrid':
            return `
            <section class="section section-secondary fade-in-up" style="padding-top: 60px;">
                <div class="grid-3">
                    ${data.items.map(p => `
                        <div class="glass-card product-card">
                            <div class="product-img">
                                ${p.badgeText ? `<span class="product-badge" style="background:${p.badgeBg}; color:${p.badgeColor};">${p.badgeText}</span>` : ''}
                                <img src="${p.image}" alt="${p.title}">
                            </div>
                            <div class="product-content">
                                <div class="product-header">
                                    <span style="font-size:1.5rem; color:var(--primary-color);">${p.icon}</span>
                                    <h3>${p.title}</h3>
                                </div>
                                <p class="product-desc">${p.desc}</p>
                                <ul class="feature-list">
                                    ${p.features.map(f => `<li><i style="color:var(--primary-color);">✓</i> ${f}</li>`).join('')}
                                </ul>
                                <div class="eco-tags" style="margin-bottom:1.5rem;">
                                    ${p.tags.map(t => `<span>${t}</span>`).join('')}
                                </div>
                                <button class="btn-full">${p.btnText}</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>`;

        case 'ContactHero':
            return `
            <section class="section fade-in-up" style="padding-bottom: 20px;">
                <h1 style="font-size: 3.5rem; font-weight: 700; margin-bottom: 1rem; letter-spacing:-1px;">
                    <span>${data.eyebrow}</span> 
                    <span style="color: var(--primary-color);">${data.title}</span>
                </h1>
                <p style="color: var(--text-light); font-size: 1.15rem; max-width: 600px;">${data.desc}</p>
            </section>`;

        case 'ContactForm':
            return `
            <section class="section fade-in-up" style="padding-top:40px;">
                <div class="contact-container">
                    <div class="contact-form glass-card">
                        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 2rem;">${data.formTitle}</h3>
                        <form action="#" method="POST">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
                                <div class="form-group" style="margin-bottom:0;"><label>Name</label><input type="text"></div>
                                <div class="form-group" style="margin-bottom:0;"><label>Email</label><input type="email"></div>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem;">
                                <div class="form-group" style="margin-bottom:0;"><label>Phone</label><input type="text"></div>
                                <div class="form-group" style="margin-bottom:0;"><label>Company</label><input type="text"></div>
                            </div>
                            <div class="form-group" style="margin-bottom: 2rem;"><label>Message</label><textarea rows="5"></textarea></div>
                            <button type="submit" class="btn-primary" style="width: 100%;">${data.formBtn}</button>
                        </form>
                    </div>
                    <div class="contact-info">
                        <div class="glass-card" style="margin-bottom:1.5rem; display:flex; align-items:center; gap:1rem; padding:1.5rem;">
                            <div class="card-icon" style="margin-bottom:0; width:48px; height:48px;">✉️</div>
                            <div class="info-text">
                                <span style="font-size:0.85rem; color:var(--text-light); font-weight:500;">Email</span>
                                <p style="font-weight:500; font-size:1.05rem;">${data.email}</p>
                            </div>
                        </div>
                        <div class="glass-card" style="margin-bottom:1.5rem; display:flex; align-items:center; gap:1rem; padding:1.5rem;">
                            <div class="card-icon" style="margin-bottom:0; width:48px; height:48px;">📞</div>
                            <div class="info-text">
                                <span style="font-size:0.85rem; color:var(--text-light); font-weight:500;">Phone</span>
                                <p style="font-weight:500; font-size:1.05rem;">${data.phone}</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                            <a href="${data.whatsappLink}" class="btn-outline" style="flex: 1; text-align: center; padding: 12px; background:rgba(255,255,255,0.7);">${data.whatsappText}</a>
                            <a href="${data.meetingLink}" class="btn-outline" style="flex: 1; text-align: center; padding: 12px; background:rgba(255,255,255,0.7);">${data.meetingText}</a>
                        </div>
                        <div class="glass-card map-card" style="padding:0; overflow:hidden;">
                            <img src="${data.mapImage}" alt="Map" style="width:100%; height:100%; object-fit:cover; position:absolute; z-index:0;">
                            <div style="background: rgba(255,255,255,0.85); backdrop-filter:blur(10px); padding: 12px 16px; border-radius: 12px; font-size: 0.85rem; z-index:1; margin:1rem; width:calc(100% - 2rem);">
                                <span style="color: var(--primary-color); font-weight: 600; font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase;">LOCATION</span>
                                <div style="font-weight: 600; font-size:1rem;">${data.mapLocation}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;

        default:
            return `<div style="padding: 2rem; text-align: center; border: 1px dashed red;">Unknown Section Type: ${type}</div>`;
    }
}

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => {
        el.classList.remove('visible'); // Reset
        observer.observe(el);
    });
}
