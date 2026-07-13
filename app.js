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
        navMenu.innerHTML = siteData.navigation.map(nav => `<a href="${nav.url}">${nav.label}</a>`).join('');
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

    // Footer (Growly Style)
    const footerContainer = document.getElementById('footer');
    if (footerContainer) {
        footerContainer.innerHTML = `
            <div class="container">
                <div class="newsletter-banner">
                    <div>
                        <h2>Important updates waiting for you!</h2>
                        <p>Join our newsletter for the latest strategies and growth tips.</p>
                    </div>
                    <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Subscribed!');">
                        <input type="email" placeholder="Your email *" required>
                        <button type="submit" class="btn btn-accent" style="padding: 10px 24px;">Subscribe Now</button>
                    </form>
                </div>
                
                <div class="footer-grid">
                    <div class="footer-col">
                        <h4>Platform</h4>
                        <a href="#">Features</a>
                        <a href="#">Integrations</a>
                        <a href="#">Pricing</a>
                        <a href="#">Analytics</a>
                    </div>
                    <div class="footer-col">
                        <h4>Solutions</h4>
                        <a href="#">SEO Optimization</a>
                        <a href="#">Conversion Strategy</a>
                        <a href="#">Paid Advertising</a>
                        <a href="#">Email Campaigns</a>
                    </div>
                    <div class="footer-col">
                        <h4>Resources</h4>
                        <a href="#">Blog</a>
                        <a href="#">Case Studies</a>
                        <a href="#">Help Center</a>
                        <a href="#">API Documentation</a>
                    </div>
                    <div class="footer-col">
                        <h4>Company</h4>
                        <a href="#">About Us</a>
                        <a href="#">Careers</a>
                        <a href="#">Contact</a>
                        <a href="#">Privacy Policy</a>
                    </div>
                </div>
                
                <div class="footer-contact">
                    <div>
                        <h3>Let's Build Something Smarter</h3>
                        <p style="margin:0; font-size:0.95rem;">Have questions or ready to scale?</p>
                    </div>
                    <div class="contact-block">
                        <div class="contact-icon">📞</div>
                        <div class="contact-text">
                            <h5>Give us a call</h5>
                            <p>${siteData.settings.contactPhone || '(000) 777 888 999'}</p>
                        </div>
                    </div>
                    <div class="contact-block">
                        <div class="contact-icon">@</div>
                        <div class="contact-text">
                            <h5>Send us an email</h5>
                            <p>${siteData.settings.contactEmail || 'hello@yourwebsite.com'}</p>
                        </div>
                    </div>
                    <div class="contact-block">
                        <div class="contact-icon">📍</div>
                        <div class="contact-text">
                            <h5>Visit us in person</h5>
                            <p>${siteData.settings.contactAddress || 'Innovation Street, SF'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <div>&copy; 2026 - ${siteData.settings.siteName}</div>
                    <div class="social-icons">
                        <a href="#">f</a>
                        <a href="#">X</a>
                        <a href="#">in</a>
                        <a href="#">ig</a>
                    </div>
                    <div class="footer-links-small">
                        <a href="#">Terms of Service</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Cookie Policy</a>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderSection(type, data, index) {
    const pastelColors = ['peach', 'mint', 'lavender'];
    
    switch(type) {
        case 'Hero':
        case 'Header':
            return `
            <section class="hero" id="hero">
                <div class="container">
                    <div class="pill-badge">
                        <span>✦</span> ${data.eyebrow || data.status || 'Best marketing agency of 2025'} <span>✦</span>
                    </div>
                    <h1>${data.title}</h1>
                    <p>${data.subtitle || data.desc}</p>
                    <div class="hero-btns">
                        ${data.btn1Text ? `<a href="${data.btn1Link}" class="btn btn-dark">${data.btn1Text} ↗</a>` : ''}
                        ${data.btn2Text ? `<a href="${data.btn2Link}" class="btn btn-peach">${data.btn2Text} ↗</a>` : ''}
                    </div>
                    ${data.image ? `
                    <div style="margin-top: 60px;">
                        <img src="${data.image}" alt="Hero Image" style="max-width: 100%; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); display: block; margin: 0 auto; max-height: 500px; object-fit: cover;">
                    </div>` : ''}
                </div>
                
                <div class="container">
                    <div class="logo-cloud">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b2/Y_Combinator_logo.svg" alt="YC">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" alt="Netflix">
                    </div>
                </div>
            </section>`;
        
        case 'Ecosystem':
            return `
            <section id="ecosystem" style="padding-top: 0;">
                <div class="container">
                    <div class="grid-3">
                        ${(data.cards || data.items || []).map((item, i) => {
                            const colorClass = pastelColors[i % pastelColors.length];
                            return `
                            <div class="pastel-card ${colorClass}">
                                <h3>${item.title}</h3>
                                <p>${item.desc || item.description}</p>
                                <div class="card-img-placeholder">
                                    <img src="${item.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400&h=300'}" alt="${item.title}" style="border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.05);">
                                </div>
                                <div class="card-bottom">
                                    <a href="#" class="arrow-link">${item.btnText || item.linkText || 'Find out more'} ↗</a>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </section>`;

        case 'ProductsGrid':
            return `
            <section id="products-grid" style="padding-top: 0;">
                <div class="container">
                    <div class="grid-3">
                        ${(data.items || []).map((item, i) => {
                            const colorClass = pastelColors[i % pastelColors.length];
                            return `
                            <div class="pastel-card ${colorClass}" style="padding: 0; overflow: hidden; justify-content: flex-start; min-height: auto;">
                                <div style="position: relative; height: 220px;">
                                    <div style="position: absolute; top: 20px; right: 20px; background: white; padding: 6px 16px; border-radius: 50px; font-weight: 700; font-size: 0.85rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); z-index: 10;">${item.badgeText || 'Live'}</div>
                                    <img src="${item.image || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400&h=300'}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                                <div style="padding: 30px;">
                                    <h3 style="margin-bottom: 10px;">${item.title}</h3>
                                    <p style="margin-bottom: 20px;">${item.desc}</p>
                                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 25px;">
                                        ${(item.tags || []).map(t => `<span style="background: white; padding: 6px 12px; border-radius: 50px; font-size: 0.8rem; font-weight: 600;">${t}</span>`).join('')}
                                    </div>
                                    <a href="#" class="btn btn-dark" style="width: 100%;">${item.btnText || 'Learn More'} ↗</a>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </section>`;

        case 'Services':
        case 'Expertise':
            return `
            <section id="services">
                <div class="container">
                    <h2 style="max-width: 600px; margin: 0 auto 50px;">${data.title || 'Powerful Strategies Built for Measurable Growth'}</h2>
                    
                    <div class="services-grid">
                        ${(data.services || data.items || []).map(item => `
                            <div class="service-item">
                                <div class="service-icon">${item.icon || '🚀'}</div>
                                <h4>${item.title}</h4>
                                <p>${item.desc || item.description}</p>
                                <a href="#" class="arrow-link text-small">Find out more ↗</a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>`;

        case 'Architect':
            return `
            <section id="about">
                <div class="container">
                    <div class="grid-3">
                        <div class="pastel-card peach" style="grid-column: span 2;">
                            <h3>${data.title}</h3>
                            <p>${data.desc}</p>
                            <div class="card-img-placeholder" style="justify-content: flex-start;">
                                ${(data.services || []).map(s => `<span style="background: white; padding: 5px 15px; border-radius: 50px; margin-right: 10px; margin-bottom: 10px; font-weight: 600; font-size: 0.9rem;">${s.title}</span>`).join('')}
                            </div>
                            <div class="card-bottom">
                                <a href="#" class="arrow-link">Explore approach ↗</a>
                            </div>
                        </div>
                        <div class="pastel-card lavender">
                            <h3>${data.eyebrow}</h3>
                            <div class="card-img-placeholder">
                                <h1 style="font-size: 5rem; margin:0; color: var(--accent);">100%</h1>
                            </div>
                            <div class="card-bottom">
                                <a href="#" class="arrow-link">View metrics ↗</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>`;

        case 'Timeline':
            return `
            <section id="experience">
                <div class="container">
                    <h2 style="margin-bottom: 50px;">${data.title}</h2>
                    <div class="grid-3">
                        ${(data.items || []).map((item, i) => {
                            const colorClass = pastelColors[i % pastelColors.length];
                            return `
                            <div class="pastel-card ${colorClass}" style="min-height: 250px;">
                                <h4 style="color: var(--accent); margin-bottom: 5px;">${item.year || item.duration}</h4>
                                <h3>${item.title || item.role}</h3>
                                <p>${item.desc || item.description}</p>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </section>`;

        case 'CTA':
            return `
            <section class="cta" style="text-align: center;">
                <div class="container">
                    <h2>${data.title}</h2>
                    <p style="max-width: 600px; margin: 0 auto 40px;">${data.desc}</p>
                    <a href="${data.btnLink}" class="btn btn-accent">${data.btnText} ↗</a>
                </div>
            </section>`;

        case 'ContactHero':
            return `
            <section class="hero" id="hero">
                <div class="container">
                    <div class="pill-badge">
                        <span>✦</span> ${data.eyebrow || 'Contact Us'} <span>✦</span>
                    </div>
                    <h1>${data.title}</h1>
                    <p style="max-width: 700px; margin: 0 auto;">${data.desc}</p>
                </div>
            </section>`;

        case 'ContactForm':
        case 'Contact':
            return `
            <section id="contact" style="padding-top: 50px;">
                <div class="container">
                    <h2 style="margin-bottom: 20px;">${data.title || data.formTitle || 'Get in Touch'}</h2>
                    <p style="text-align: center; margin-bottom: 50px;">${data.desc || 'Ready to discuss your next project?'}</p>
                    
                    <div class="grid-3" style="margin-bottom: 50px;">
                        <div class="pastel-card peach" style="min-height: auto; padding: 30px; align-items: center; text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">✉️</div>
                            <h4>Email Us</h4>
                            <p style="margin: 0;"><a href="mailto:${data.email}" class="arrow-link">${data.email || 'hello@nikhilpatra.ai'}</a></p>
                        </div>
                        <div class="pastel-card mint" style="min-height: auto; padding: 30px; align-items: center; text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">📞</div>
                            <h4>Call Us</h4>
                            <p style="margin: 0;"><a href="tel:${data.phone}" class="arrow-link">${data.phone || '+1 234 567 8900'}</a></p>
                        </div>
                        <div class="pastel-card lavender" style="min-height: auto; padding: 30px; align-items: center; text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 10px;">📍</div>
                            <h4>Visit Us</h4>
                            <p style="margin: 0; color: var(--text-dark);">${data.mapLocation || 'Silicon Valley HQ'}</p>
                        </div>
                    </div>

                    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 50px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                        <form onsubmit="event.preventDefault(); alert('Message sent!');">
                            <div style="margin-bottom: 20px;">
                                <input type="text" placeholder="Your Name" style="width: 100%; padding: 15px 20px; border-radius: 50px; border: 1px solid transparent; background: var(--bg-main); font-size: 1rem; outline: none; transition: 0.3s;" onfocus="this.style.border='1px solid var(--accent)'" onblur="this.style.border='1px solid transparent'" required>
                            </div>
                            <div style="margin-bottom: 20px;">
                                <input type="email" placeholder="Your Email" style="width: 100%; padding: 15px 20px; border-radius: 50px; border: 1px solid transparent; background: var(--bg-main); font-size: 1rem; outline: none; transition: 0.3s;" onfocus="this.style.border='1px solid var(--accent)'" onblur="this.style.border='1px solid transparent'" required>
                            </div>
                            <div style="margin-bottom: 25px;">
                                <textarea rows="5" placeholder="How can we help?" style="width: 100%; padding: 20px; border-radius: 24px; border: 1px solid transparent; background: var(--bg-main); font-size: 1rem; outline: none; transition: 0.3s;" onfocus="this.style.border='1px solid var(--accent)'" onblur="this.style.border='1px solid transparent'" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-accent" style="width:100%;">${data.formBtn || 'Send Message'}</button>
                        </form>
                    </div>
                </div>
            </section>`;

        default:
            return '';
    }
}
