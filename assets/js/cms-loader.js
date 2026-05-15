// ── HELPERS ──────────────────────────────────────────────────────────
async function fetchJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error(`Error fetching ${path}:`, e);
        return null;
    }
}

// ── NAVIGATION LOADER ─────────────────────────────────────────────
async function loadCMSNav() {
    const desktopMenu = document.querySelector('.menu-tabs');
    const mobileMenu = document.querySelector('.mobile-menu ul');
    if (!desktopMenu && !mobileMenu) return;

    const data = await fetchJSON('content/nav.json');
    if (!data || !data.items) return;

    const navHTML = data.items.map(item => `
        <li><a href="${item.link}">${item.label}</a></li>
    `).join('');

    if (desktopMenu) desktopMenu.innerHTML = navHTML;
    if (mobileMenu) mobileMenu.innerHTML = navHTML;
}

// ── CATEGORY PAGE LOADER ──────────────────────────────────────────
async function loadCMSCategoryArticles(containerId, categoryName) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = await fetchJSON('content/articles.json');
    if (!data || !data.articles) return;

    const filtered = data.articles.filter(a => a.category === categoryName && a.status !== 'Draft');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:2rem; opacity:0.6;">इस श्रेणी में अभी कोई लेख नहीं हैं।</p>';
        return;
    }

    // First Article is Featured, next 3 are Side News, rest are Grid
    const featured = filtered[0];
    const sideNews = filtered.slice(1, 4);
    const others = filtered.slice(4);

    let html = `
        <div class="featured-grid" style="margin-bottom:2.5rem;">
            <a href="article.html?id=${encodeURIComponent(featured.slug || featured.title)}" class="clickable-card featured-main">
                <div class="featured-img" style="background-image: url('${featured.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000'}')"></div>
                <div class="featured-content">
                    <span class="tag" style="color:var(--accent); font-weight:800; font-size:0.75rem;">${featured.tag || '⭐ Featured'}</span>
                    <h3 style="margin:10px 0 8px; font-size:1.5rem;">${featured.title}</h3>
                    <p style="color:var(--text-muted); font-size:0.95rem;">${featured.summary}</p>
                </div>
            </a>
            <div class="side-news">
                ${sideNews.map(sn => `
                    <a href="article.html?id=${encodeURIComponent(sn.slug || sn.title)}" class="clickable-card">
                        <h4 style="font-size:0.95rem; margin:0;">${sn.title}</h4>
                    </a>
                `).join('')}
            </div>
        </div>
        <div class="card-grid">
            ${others.map(article => `
                <a href="article.html?id=${encodeURIComponent(article.slug || article.title)}" class="clickable-card">
                    <div style="height:180px; background:url('${article.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'}') center/cover;"></div>
                    <div style="padding:1.4rem;">
                        <span class="tag" style="color:var(--accent); font-weight:800; font-size:0.7rem;">${article.category}</span>
                        <h3 style="margin:8px 0; font-size:1.1rem;">${article.title}</h3>
                        <p style="color:var(--text-muted); font-size:0.85rem; line-height:1.4;">${article.summary}</p>
                    </div>
                </a>
            `).join('')}
        </div>
    `;

    container.innerHTML = html;

    if (window.revealObserver) {
        container.querySelectorAll('.clickable-card').forEach(el => window.revealObserver.observe(el));
    }
}

// ── HOMEPAGE LOADER ───────────────────────────────────────────────
async function loadCMSLatestNews(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = await fetchJSON('content/articles.json');
    if (!data || !data.articles) return;

    const latest = data.articles.filter(a => a.status !== 'Draft').slice(0, 4);

    container.innerHTML = latest.map(article => `
        <a href="article.html?id=${encodeURIComponent(article.slug || article.title)}" class="clickable-card">
            <div style="height:180px; background:url('${article.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'}') center/cover;"></div>
            <div style="padding:1.4rem;">
                <span class="tag" style="color:var(--accent); font-weight:800; font-size:0.7rem;">${article.category}</span>
                <h3 style="margin:8px 0; font-size:1.1rem;">${article.title}</h3>
                <p style="color:var(--text-muted); font-size:0.85rem; line-height:1.4;">${article.summary}</p>
            </div>
        </a>
    `).join('');

    if (window.revealObserver) {
        container.querySelectorAll('.clickable-card').forEach(el => window.revealObserver.observe(el));
    }
}

// ── TICKER LOADER ────────────────────────────────────────────────
async function loadCMSTicker(containerClass) {
    const tracks = document.querySelectorAll(`.${containerClass}`);
    if (tracks.length === 0) return;

    const tickerData = await fetchJSON('content/ticker.json');
    if (!tickerData || !tickerData.items) return;

    const tickerHTML = tickerData.items.map(item => `
        <span>${item.text}</span><span>•</span>
    `).join('');

    tracks.forEach(track => {
        track.innerHTML = tickerHTML + tickerHTML;
    });
}

// ── FULL ARTICLE LOADER (Detailed) ───────────────────────────────
async function loadFullArticle() {
    const container = document.getElementById('article-detail-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = decodeURIComponent(urlParams.get('id'));
    if (!articleId) {
        window.location.href = 'Index.html';
        return;
    }

    try {
        const [articleData, authorData] = await Promise.all([
            fetchJSON('content/articles.json'),
            fetchJSON('content/authors.json')
        ]);

        if (!articleData) return;

        const article = articleData.articles.find(a => (a.slug === articleId || a.title === articleId));
        if (!article) {
            container.innerHTML = '<div class="loading-state">लेख नहीं मिला।</div>';
            return;
        }

        // Set Hero
        document.getElementById('article-hero').style.backgroundImage = `url('${article.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200'}')`;
        document.getElementById('article-title').textContent = article.title;
        document.getElementById('article-meta').innerHTML = `${article.tag || '🚀 News'} • ${article.category} • ${new Date(article.date).toLocaleDateString('hi-IN')}`;

        // Build Body HTML
        let bodyHtml = article.body;
        
        // Add Video if exists
        if (article.video_id) {
            bodyHtml += `
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${article.video_id}" allowfullscreen></iframe>
                </div>
            `;
        }

        document.getElementById('markdown-content').innerHTML = bodyHtml;

        // Add Author Card
        if (article.author_id && authorData) {
            const author = authorData.authors.find(a => a.id === article.author_id);
            if (author) {
                const authorCard = `
                    <div class="author-card">
                        <img src="${author.image}" class="author-img" alt="${author.name}">
                        <div class="author-info">
                            <span class="author-role">${author.role}</span>
                            <h4>${author.name}</h4>
                            <p class="author-bio">${author.bio}</p>
                            ${author.x_link ? `<a href="${author.x_link}" target="_blank" class="tag" style="text-decoration:none;">X पर फॉलो करें →</a>` : ''}
                        </div>
                    </div>
                `;
                document.getElementById('markdown-content').innerHTML += authorCard;
            }
        }

        // SEO and Meta
        document.title = `${article.title} — PrajnaAGI`;

    } catch (e) {
        console.error(e);
    }
}

// ── INITIALIZE ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadCMSNav(); // Load navigation everywhere

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search')?.toLowerCase();

    if (searchQuery) {
        handleSearch(searchQuery);
    } else {
        initCMS();
    }
});

async function initCMS() {
    if (document.getElementById('cms-latest-grid')) loadCMSLatestNews('cms-latest-grid');
    if (document.querySelector('.ticker-track')) loadCMSTicker('ticker-track');
    if (document.getElementById('article-detail-container')) loadFullArticle();

    const categoryGrids = [
        { id: 'cms-tech-grid', cat: 'तकनीक' },
        { id: 'cms-science-grid', cat: 'विज्ञान' },
        { id: 'cms-space-grid', cat: 'अंतरिक्ष' },
        { id: 'cms-environment-grid', cat: 'पर्यावरण' },
        { id: 'cms-health-grid', cat: 'स्वास्थ्य' }
    ];

    categoryGrids.forEach(grid => {
        if (document.getElementById(grid.id)) {
            loadCMSCategoryArticles(grid.id, grid.cat);
        }
    });
}

async function handleSearch(query) {
    const mainSection = document.querySelector('section.section');
    if (!mainSection) return;

    mainSection.innerHTML = `
        <h2 class="section-title">🔍 खोज परिणाम: "${query}"</h2>
        <div class="card-grid" id="search-results-grid">
            <div class="loading-box">खोज रहे हैं...</div>
        </div>
    `;

    const data = await fetchJSON('content/articles.json');
    if (!data || !data.articles) return;

    const filtered = data.articles.filter(a => 
        (a.title.toLowerCase().includes(query) || 
        a.category.toLowerCase().includes(query) ||
        (a.summary && a.summary.toLowerCase().includes(query))) && a.status !== 'Draft'
    );

    const grid = document.getElementById('search-results-grid');
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:5rem; opacity:0.6;">कोई परिणाम नहीं मिला।</p>';
        return;
    }

    grid.innerHTML = filtered.map(article => `
        <a href="article.html?id=${encodeURIComponent(article.slug || article.title)}" class="clickable-card">
            <div style="height:180px; background:url('${article.image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'}') center/cover;"></div>
            <div style="padding:1.4rem;">
                <span class="tag" style="color:var(--accent); font-weight:800; font-size:0.7rem;">${article.category}</span>
                <h3 style="margin:8px 0; font-size:1.1rem;">${article.title}</h3>
                <p style="color:var(--text-muted); font-size:0.85rem; line-height:1.4;">${article.summary}</p>
            </div>
        </a>
    `).join('');
}


