document.addEventListener('DOMContentLoaded', () => {
    fetch('content.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            // 1. Populate Scalar Values (data-content="section.key")
            const elements = document.querySelectorAll('[data-content]');
            elements.forEach(el => {
                const path = el.getAttribute('data-content').split('.');
                let val = data;
                for (let k of path) {
                    if(val) val = val[k];
                }
                if (val !== undefined && val !== null) {
                    if (el.tagName === 'IMG') el.src = val;
                    else if (el.tagName === 'A' && el.hasAttribute('data-link')) el.href = val;
                    else el.textContent = val;
                }
            });

            // 2. Render Architect Services
            if(data.home && data.home.architectServices && document.getElementById('architect-services-container')) {
                const container = document.getElementById('architect-services-container');
                container.innerHTML = data.home.architectServices.map(s => `
                    <div class="glass-card fade-in-up">
                        <div class="card-icon">${s.icon}</div>
                        <h4>${s.title}</h4>
                        <p>${s.desc}</p>
                    </div>
                `).join('');
            }

            // 3. Render Timeline
            if(data.home && data.home.timelineItems && document.getElementById('timeline-container')) {
                const container = document.getElementById('timeline-container');
                container.innerHTML = data.home.timelineItems.map(item => `
                    <div class="timeline-item fade-in-up">
                        <div class="timeline-year">${item.year}</div>
                        <h4>${item.title}</h4>
                        <p>${item.desc}</p>
                    </div>
                `).join('');
            }

            // 4. Render Ecosystem
            if(data.home && data.home.ecosystemCards && document.getElementById('ecosystem-container')) {
                const container = document.getElementById('ecosystem-container');
                container.innerHTML = data.home.ecosystemCards.map(card => `
                    <div class="glass-card fade-in-up" style="padding:2.5rem;">
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
                `).join('');
            }

            // 5. Render Expertise
            if(data.home && data.home.expertiseItems && document.getElementById('expertise-container')) {
                const container = document.getElementById('expertise-container');
                container.innerHTML = data.home.expertiseItems.map(item => `
                    <div class="glass-card fade-in-up" style="padding:1.5rem;">
                        <div class="card-icon" style="margin-bottom:1rem; width:40px; height:40px; font-size:1.2rem;">${item.icon}</div>
                        <h4>${item.title}</h4>
                        <p>${item.desc}</p>
                    </div>
                `).join('');
            }

            // 6. Render Tech Stack
            if(data.home && data.home.techStackItems && document.getElementById('tech-stack-container')) {
                const container = document.getElementById('tech-stack-container');
                container.innerHTML = data.home.techStackItems.map(tech => `
                    <span class="tech-item fade-in-up">${tech}</span>
                `).join('');
            }

            // 7. Render Products
            if(data.products && data.products.items && document.getElementById('products-container')) {
                const container = document.getElementById('products-container');
                container.innerHTML = data.products.items.map(p => `
                    <div class="glass-card product-card fade-in-up">
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
                `).join('');
            }

            // Init scroll animations
            initAnimations();
        })
        .catch(err => console.error("Error loading content:", err));
});

function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
}
