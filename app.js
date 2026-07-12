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
        mainContainer.innerHTML = siteData.pages[pageId].sections.map((section, index) => {
            return renderSection(section.type, section.data, index);
        }).join('');
    } else if (mainContainer) {
        mainContainer.innerHTML = '<p style="padding:100px; text-align:center;">Loading page content...</p>';
    }

    // Footer Codespot layout
    const footerContainer = document.getElementById('footer');
    if (footerContainer) {
        footerContainer.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <a href="index.html" class="footer-logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#10b981"/>
                            <path d="M15 12L10 8V16L15 12Z" fill="white"/>
                        </svg>
                        ${siteData.settings.siteName.split(' ')[0]}<span>.</span>
                    </a>
                    <div style="font-size: 0.9rem;">
                        Subscribe to receive news, guides and product updates.
                    </div>
                    <div class="footer-subscribe">
                        <input type="email" placeholder="Email address *">
                        <button class="btn-primary" style="padding: 10px 20px;">Subscribe Now</button>
                    </div>
                </div>
                <div class="footer-bottom-grid">
                    <div class="footer-links-small">
                        ${(siteData.navigation || []).map(nav => `<a href="${nav.link}">${nav.label}</a>`).join('')}
                    </div>
                    <div>Privacy Policy &nbsp;&nbsp; Terms & Conditions</div>
                    <div>📍 ${siteData.settings.footerCopyright}</div>
                </div>
            </div>
        `;
    }
}

function renderSection(type, data, index) {
    const bgClass = index % 2 === 0 ? 'has-bg-geometry' : '';
    
    switch(type) {
        case 'Hero':
            return `
            <section class="hero ${bgClass}" id="hero">
                <div class="container">
                    <div class="hero-codespot">
                        <div class="hero-content">
                            <h1>${data.title}</h1>
                            <p>${data.subtitle || data.desc || 'We help build the operating system for data-driven companies to find and pull their performance levers.'}</p>
                            <div class="btn-group">
                                ${data.btn1Text ? `<a href="${data.btn1Link}" class="btn-primary">${data.btn1Text} ➔</a>` : ''}
                                ${data.btn2Text ? `<a href="${data.btn2Link}" class="btn-link">${data.btn2Text} ➔</a>` : ''}
                            </div>
                            <div class="trust-badges">
                                <div class="trust-avatars">
                                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="User">
                                    <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" alt="User">
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="User">
                                </div>
                                <div>
                                    <p class="text-small" style="margin-bottom:0; font-weight:600;">Trusted by industry experts</p>
                                    <div class="trust-stars">★★★★★ <span style="color:var(--text-primary); font-size:0.8rem; font-weight:bold;">4.9</span></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="hero-images-staggered">
                            <div class="hero-card-1">
                                <h2 style="color:var(--accent-color); font-size: 3rem; margin-bottom: 5px;">$500K</h2>
                                <p class="text-small">Saved Through<br>Resource Optimization</p>
                                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=200&fit=crop" style="width: 150px; margin-top: auto;">
                                <p class="text-small" style="font-weight: 600; margin-bottom: 0;">100% Code Quality</p>
                            </div>
                            <div class="hero-card-2">
                                <img src="${data.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop'}" alt="Hero Image">
                                <div class="overlay">
                                    <h3 style="font-size:2.5rem; margin-bottom:0;">10+</h3>
                                    <p class="text-small">Years of Coding</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="container" style="margin-top: 60px;">
                    <div class="logo-cloud">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Y_Combinator_logo.svg" alt="YC">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix">
                    </div>
                </div>
            </section>`;
        
        case 'Architect':
            return `
            <section class="${bgClass}" id="about">
                <div class="container">
                    <div class="grid-asymmetric">
                        <div class="large-card" style="background: white; border: 1px solid var(--border-color); color: var(--text-primary);">
                            <div class="large-card-content">
                                <h2>What we provide</h2>
                                <p>We help build the operating system for data-driven companies to find and pull their performance levers.</p>
                                
                                <div style="margin-top: 40px;">
                                    <h3>Optimizing Business Performance</h3>
                                    <p>An intelligent system designed for data-driven teams to measure, manage, and amplify performance.</p>
                                    <a href="#" class="btn-link">Get Started Now ➔</a>
                                </div>
                            </div>
                            <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80" alt="Working">
                        </div>
                        
                        <div class="large-card" style="background: var(--text-primary);">
                            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80" alt="Tech">
                            <div class="large-card-content">
                                <span class="large-card-icon">AI</span>
                                <h3>Artificial Intelligence</h3>
                                <p style="font-size: 0.9rem;">We design the core infrastructure for the data-driven future.</p>
                                <a href="#" class="btn-link" style="color: var(--accent-color);">More Information ➔</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;

        case 'Ecosystem':
        case 'Services':
            return `
            <section class="${bgClass}" id="services">
                <div class="container">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <h2 style="font-size: 1.8rem; color: var(--text-primary); margin-bottom: 20px;">Transforming Ideas<br>Into Impact</h2>
                        </div>
                        <div class="stat-item">
                            <h2>500+</h2>
                            <p class="text-small" style="font-weight: 600;">Successful projects</p>
                        </div>
                        <div class="stat-item">
                            <h2>60%</h2>
                            <p class="text-small" style="font-weight: 600;">Faster launch time</p>
                        </div>
                        <div class="stat-item">
                            <h2>120%</h2>
                            <p class="text-small" style="font-weight: 600;">Average ROI increase</p>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 40px; max-width: 600px;">
                        <h2>Discover All The Powerful Codespot Features</h2>
                        <p>Unlock powerful features designed to streamline workflows, enhance collaboration, spark innovation, and help your ideas reach the world faster.</p>
                    </div>

                    <div class="grid-4">
                        ${(data.services || data.cards || []).slice(0, 4).map(item => `
                            <div class="codespot-card">
                                <div class="icon-circle">${item.icon || '🚀'}</div>
                                <h4>${item.title}</h4>
                                <p class="text-small">${item.desc || item.description}</p>
                                <a href="#" class="btn-link text-small">Get Started Now ➔</a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'Timeline':
            return `
            <section class="${bgClass}" id="experience">
                <div class="container">
                    <h2 style="text-align:center; margin-bottom: 50px;">${data.title}</h2>
                    <div class="grid-4">
                        ${(data.items || []).map(item => `
                            <div class="codespot-card">
                                <h4 class="highlight">${item.title || item.role}</h4>
                                <p class="text-small" style="font-weight: 600;">${item.year || item.duration}</p>
                                <p class="text-small">${item.desc || item.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;
            
        case 'Header':
        case 'ContactHero':
            return `
            <section class="hero ${bgClass}" style="padding-bottom: 50px;">
                <div class="container text-center">
                    <div class="hero-content">
                        ${data.eyebrow ? `<p class="highlight" style="font-weight: 600; margin-bottom: 10px;">${data.eyebrow}</p>` : ''}
                        <h1>${data.title}</h1>
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
                            <div class="large-card" style="background: white; border: 1px solid var(--border-color); color: var(--text-primary);">
                                <div style="position: absolute; top: 15px; right: 15px; background: ${item.badgeBg}; color: ${item.badgeColor}; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; z-index: 10;">${item.badgeText}</div>
                                <img src="${item.image}" alt="${item.title}">
                                <div class="large-card-content">
                                    <h3>${item.title}</h3>
                                    <p style="color: var(--text-secondary);">${item.desc}</p>
                                    <ul style="list-style: none; margin: 20px 0;">
                                        ${(item.features || []).map(f => `<li style="margin-bottom: 8px; color: var(--text-secondary);">✓ ${f}</li>`).join('')}
                                    </ul>
                                    <a href="#" class="btn-primary" style="width: 100%;">${item.btnText}</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'CTA':
            return `
            <section class="cta" style="background: var(--accent-color); color: white; text-align: center; border-radius: 24px; margin: 50px 20px; padding: 60px 20px;">
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
                    <div class="grid-2" style="align-items: flex-start;">
                        <div>
                            <h2 style="margin-bottom: 20px;">Get in Touch</h2>
                            <p style="margin-bottom: 40px;">Ready to discuss your next project?</p>
                            <div style="margin-bottom: 20px;">
                                <h4 style="margin-bottom: 5px;">Email</h4>
                                <a href="mailto:${data.email}" class="btn-link" style="font-size: 1.1rem; font-weight: 500;">${data.email}</a>
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
