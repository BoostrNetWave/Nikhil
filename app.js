document.addEventListener('DOMContentLoaded', () => {
    // Fetch the content file (with a cache buster to see updates immediately)
    fetch('content.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            // Find all elements with the data-content attribute
            const elements = document.querySelectorAll('[data-content]');
            elements.forEach(el => {
                const key = el.getAttribute('data-content');
                if (data[key]) {
                    // Update image source if it's an image, otherwise update text content
                    if (el.tagName === 'IMG') {
                        el.src = data[key];
                    } else {
                        el.textContent = data[key];
                    }
                }
            });
        })
        .catch(err => console.error("Error loading content:", err));
});
