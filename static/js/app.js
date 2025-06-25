document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const includeAnswer = document.getElementById('includeAnswer');
    const includeImages = document.getElementById('includeImages');
    const searchDepth = document.getElementById('searchDepth');
    const maxResults = document.getElementById('maxResults');
    const loader = document.getElementById('loader');
    const results = document.getElementById('results');
    const answerContainer = document.getElementById('answerContainer');
    const imagesContainer = document.getElementById('imagesContainer');
    const sourcesContainer = document.getElementById('sourcesContainer');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const themeSwitch = document.querySelector('.theme-switch');

    let currentFilter = 'all';
    let typingTimer;
    const doneTypingInterval = 1000;

    // Theme handling
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem('theme');

    // Set initial theme
    if (storedTheme === 'dark' || (!storedTheme && prefersDarkScheme.matches)) {
        document.documentElement.classList.add('dark');
        themeSwitch.querySelector('i').className = 'fas fa-moon';
    } else {
        document.documentElement.classList.remove('dark');
        themeSwitch.querySelector('i').className = 'fas fa-sun';
    }

    // Theme Toggle
    themeSwitch.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        const icon = themeSwitch.querySelector('i');
        
        // Update icon and store preference
        if (isDark) {
            icon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'dark');
        } else {
            icon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'light');
        }

        // Add animation to theme switch
        themeSwitch.style.transform = 'scale(0.8)';
        setTimeout(() => {
            themeSwitch.style.transform = 'scale(1)';
        }, 200);
    });

    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.documentElement.classList.add('dark');
                themeSwitch.querySelector('i').className = 'fas fa-moon';
            } else {
                document.documentElement.classList.remove('dark');
                themeSwitch.querySelector('i').className = 'fas fa-sun';
            }
        }
    });

    // Animated Search Input
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.classList.add('focused');
    });

    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.classList.remove('focused');
    });

    // Event Listeners
    searchButton.addEventListener('click', () => {
        if (searchInput.value.trim()) {
            animateSearchStart();
            performSearch();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim()) {
            animateSearchStart();
            performSearch();
        }
    });

    // Search input debounce for suggestions (if needed)
    searchInput.addEventListener('keyup', () => {
        clearTimeout(typingTimer);
        if (searchInput.value) {
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        }
    });

    searchInput.addEventListener('keydown', () => {
        clearTimeout(typingTimer);
    });

    function doneTyping() {
        // Could be used for search suggestions
        console.log('Done typing');
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            
            // Animate filter change
            results.style.opacity = '0';
            setTimeout(() => {
                filterResults(filter);
                results.style.opacity = '1';
            }, 300);
            
            // Update active button with animation
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.transform = 'scale(1)';
            });
            button.classList.add('active');
            button.style.transform = 'scale(1.05)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 200);
        });
    });

    function animateSearchStart() {
        // Animate search container
        const searchContainer = document.querySelector('.search-container');
        searchContainer.style.transform = 'scale(0.98)';
        setTimeout(() => {
            searchContainer.style.transform = 'scale(1)';
        }, 200);
    }

    function filterResults(filter) {
        currentFilter = filter;
        
        const containers = {
            answer: answerContainer,
            images: imagesContainer,
            sources: sourcesContainer
        };
        
        // Prepare animations
        Object.values(containers).forEach(container => {
            container.style.transition = 'all 0.3s ease';
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
        });
        
        // Show/hide containers based on filter
        setTimeout(() => {
            switch (filter) {
                case 'articles':
                    containers.answer.style.display = 'block';
                    containers.images.style.display = 'none';
                    containers.sources.style.display = 'block';
                    break;
                case 'images':
                    containers.answer.style.display = 'none';
                    containers.images.style.display = 'block';
                    containers.sources.style.display = 'none';
                    break;
                default: // 'all'
                    Object.values(containers).forEach(container => {
                        container.style.display = 'block';
                    });
            }
            
            // Animate visible containers
            Object.values(containers).forEach(container => {
                if (container.style.display === 'block') {
                    setTimeout(() => {
                        container.style.opacity = '1';
                        container.style.transform = 'translateY(0)';
                    }, 50);
                }
            });
        }, 300);
    }

    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        // Show loader with animation
        loader.style.display = 'flex';
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.opacity = '1';
        }, 50);

        results.style.display = 'none';
        answerContainer.innerHTML = '';
        imagesContainer.innerHTML = '<div class="images-grid" id="imagesGrid"></div>';
        sourcesContainer.innerHTML = '';

        try {
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    include_answer: includeAnswer.checked,
                    search_depth: searchDepth.value,
                    auto_parameters: false,
                    topic: 'general',
                    chunks_per_source: 3,
                    max_results: parseInt(maxResults.value),
                    include_raw_content: true,
                    include_images: includeImages.checked,
                    include_image_descriptions: includeImages.checked,
                    time_range: null,
                    days: 7,
                    include_domains: [],
                    exclude_domains: [],
                    country: null
                })
            });

            if (!response.ok) {
                throw new Error('Search request failed');
            }

            const data = await response.json();
            
            // Animate loader out
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                displayResults(data);
                results.style.display = 'block';
                setTimeout(() => {
                    filterResults(currentFilter);
                }, 50);
            }, 300);
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred while performing the search. Please try again.');
            loader.style.display = 'none';
        }
    }

    function displayResults(data) {
        // Display AI Answer with animation
        if (data.answer) {
            answerContainer.innerHTML = `
                <h2><i class="fas fa-robot"></i>AI Answer</h2>
                <div class="answer-content animate-fade-in">${formatContent(data.answer)}</div>
            `;
        }

        // Display Images with animation
        if (data.images && data.images.length > 0) {
            const imagesGrid = document.getElementById('imagesGrid');
            imagesGrid.innerHTML = data.images.map((image, index) => `
                <div class="image-item animate-fade-in" style="animation-delay: ${index * 0.1}s">
                    <img src="${image.url}" alt="${image.title || 'Search result image'}" 
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22><rect width=%221%22 height=%221%22 fill=%22%23eee%22/></svg>'">
                    <div class="image-overlay">
                        <div class="image-title">${image.title || 'Image'}</div>
                    </div>
                </div>
            `).join('');
        }

        // Display Sources with animation
        if (data.results && data.results.length > 0) {
            sourcesContainer.innerHTML = `
                <h2><i class="fas fa-newspaper"></i>Sources</h2>
                ${data.results.map((result, index) => `
                    <div class="source-item animate-fade-in" style="animation-delay: ${index * 0.1}s">
                        <div class="source-title">
                            <a href="${result.url}" target="_blank" rel="noopener noreferrer">
                                ${result.title}
                            </a>
                        </div>
                        <div class="source-snippet">${formatContent(result.content)}</div>
                    </div>
                `).join('')}
            `;
        } else {
            sourcesContainer.innerHTML = '<p class="animate-fade-in">No results found</p>';
        }
    }

    function formatContent(content) {
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
            .replace(/\n/g, '<br>');
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message animate-fade-in';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        results.prepend(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                errorDiv.remove();
            }, 300);
        }, 4700);
    }
}); 