// ── PRAJNA CMS LOADER (secure) ───────────────────────────────────────────
// All dynamic content is built with DOM APIs + textContent (never string
// concatenated into innerHTML). Markdown is rendered via marked and then
// sanitized with DOMPurify before insertion. JSON is shape-validated.
// Styling is CSS classes only — zero inline styles.
(function () {
    'use strict';

    // ── helpers ──────────────────────────────────────────────────
    async function fetchJSON(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return await response.json();
        } catch (e) {
            console.error('[CMS] Error fetching ' + path + ':', e);
            return null;
        }
    }

    // Only allow same-origin relative URLs or https URLs (no javascript: etc.)
    function safeURL(url) {
        if (typeof url !== 'string' || !url) return '';
        if (/^https:\/\//i.test(url)) return url;
        if (/^(?!\/\/)[\w][\w\-./?=&%#]*$/.test(url) && url.indexOf(':') === -1) return url; // relative
        return '';
    }

    function safeText(v, max) {
        if (typeof v !== 'string') return '';
        return v.slice(0, max || 500);
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function articleLink(article, className) {
        const a = el('a', className);
        const id = safeText(article.slug || article.title, 200);
        a.href = 'article.html?id=' + encodeURIComponent(id);
        return a;
    }

    function setBgImage(node, url) {
        const u = safeURL(url);
        if (u) node.style.backgroundImage = 'url("' + u.replace(/["\\]/g, '') + '")';
    }

    function validArticles(data) {
        if (!data || !Array.isArray(data.articles)) return null;
        return data.articles.filter(function (a) {
            return a && typeof a === 'object' &&
                typeof a.title === 'string' && a.title &&
                typeof a.category === 'string' &&
                a.status !== 'Draft';
        });
    }

    function renderMarkdownSafe(text) {
        if (!text) return '';
        let html;
        if (window.marked && typeof window.marked.parse === 'function') {
            html = window.marked.parse(text);
        } else {
            // fallback: paragraphs only, fully escaped
            const div = document.createElement('div');
            text.split('\n').filter(function (p) { return p.trim(); }).forEach(function (p) {
                div.appendChild(el('p', null, p.trim()));
            });
            return div.innerHTML;
        }
        if (window.DOMPurify) {
            return window.DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h2', 'h3', 'h4',
                    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'hr', 'img', 'table',
                    'thead', 'tbody', 'tr', 'th', 'td'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
                ALLOWED_URI_REGEXP: /^(?:https:|mailto:|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
            });
        }
        // No sanitizer available: refuse to inject raw HTML.
        const safe = document.createElement('div');
        safe.textContent = text;
        return '<p>' + safe.innerHTML + '</p>';
    }

    // ── article state (language toggle) ─────────────────────────
    let currentArticle = null;
    let currentLang = 'hindi';

    function renderLangBody(lang) {
        const target = document.getElementById('article-lang-body');
        if (!target || !currentArticle) return;
        const fieldMap = { hindi: 'body_hindi', awadhi: 'body_awadhi', english: 'body_english' };
        let text = currentArticle[fieldMap[lang] || 'body_hindi'];
        if (lang === 'hindi' && (!text || !text.trim()) && typeof currentArticle.body === 'string') {
            text = currentArticle.body; // legacy field
        }
        if (!text || !text.trim()) {
            target.textContent = '';
            target.appendChild(el('p', 'lang-unavailable', 'यह लेख अभी इस भाषा में उपलब्ध नहीं है।'));
            return;
        }
        target.innerHTML = renderMarkdownSafe(text); // sanitized above
    }

    function wireLangToggle() {
        const toggle = document.getElementById('lang-toggle');
        if (!toggle) return;
        toggle.querySelectorAll('.lang-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                currentLang = btn.getAttribute('data-lang') || 'hindi';
                toggle.querySelectorAll('.lang-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                renderLangBody(currentLang);
            });
        });
    }

    // ── nav loader ───────────────────────────────────────────────
    async function loadCMSNav() {
        const desktopMenu = document.querySelector('.menu-tabs');
        const mobileMenu = document.querySelector('.mobile-menu ul');
        if (!desktopMenu && !mobileMenu) return;

        const data = await fetchJSON('content/nav.json');
        if (!data || !Array.isArray(data.items)) return;

        function buildItems(container) {
            container.textContent = '';
            data.items.forEach(function (item) {
                if (!item || typeof item.label !== 'string') return;
                const href = safeURL(item.link);
                if (!href) return;
                const li = document.createElement('li');
                let a;
                if (href === 'index.html') {
                    // होम -> home icon element
                    a = document.createElement('a');
                    a.setAttribute('aria-label', 'होम');
                    a.title = 'होम';
                    const NS = 'http://www.w3.org/2000/svg';
                    const svg = document.createElementNS(NS, 'svg');
                    svg.setAttribute('class', 'nav-home-icon');
                    svg.setAttribute('viewBox', '0 0 24 24');
                    svg.setAttribute('width', '18');
                    svg.setAttribute('height', '18');
                    svg.setAttribute('fill', 'none');
                    svg.setAttribute('stroke', 'currentColor');
                    svg.setAttribute('stroke-width', '2');
                    svg.setAttribute('stroke-linecap', 'round');
                    svg.setAttribute('stroke-linejoin', 'round');
                    svg.setAttribute('aria-hidden', 'true');
                    const p1 = document.createElementNS(NS, 'path');
                    p1.setAttribute('d', 'M3 10.5 12 3l9 7.5');
                    const p2 = document.createElementNS(NS, 'path');
                    p2.setAttribute('d', 'M5 9.5V21h14V9.5');
                    svg.appendChild(p1); svg.appendChild(p2);
                    a.appendChild(svg);
                } else {
                    a = el('a', null, safeText(item.label, 60));
                }
                a.href = href;
                if (window.location.pathname.split('/').pop() === href) a.className = 'active';
                li.appendChild(a);
                container.appendChild(li);
            });
        }
        if (desktopMenu) buildItems(desktopMenu);
        if (mobileMenu) buildItems(mobileMenu);
    }

    // ── card builders (classes only) ─────────────────────────────
    function buildCard(article) {
        const a = articleLink(article, 'clickable-card');
        const img = el('div', 'card-img');
        setBgImage(img, article.image);
        const pad = el('div', 'card-pad');
        pad.appendChild(el('span', 'tag', safeText(article.category, 40)));
        pad.appendChild(el('h3', 'card-title', safeText(article.title, 200)));
        pad.appendChild(el('p', 'card-summary', safeText(article.summary, 300)));
        a.appendChild(img);
        a.appendChild(pad);
        return a;
    }

    function buildFeaturedMain(article) {
        const a = articleLink(article, 'clickable-card featured-main');
        const img = el('div', 'featured-img');
        setBgImage(img, article.image);
        const content = el('div', 'featured-content');
        content.appendChild(el('span', 'tag', safeText(article.tag || 'FEATURED', 40)));
        content.appendChild(el('h3', 'featured-title card-title', safeText(article.title, 200)));
        content.appendChild(el('p', 'featured-summary', safeText(article.summary, 400)));
        a.appendChild(img);
        a.appendChild(content);
        return a;
    }

    function formatDate(dateStr) {
        try {
            const d = new Date(dateStr);
            return isNaN(d) ? '' : d.toLocaleDateString('hi-IN');
        } catch (e) { return ''; }
    }

    // ── homepage ─────────────────────────────────────────────────
    async function loadCMSHome(latestContainerId) {
        const data = await fetchJSON('content/articles.json');
        const articles = validArticles(data);
        if (!articles || articles.length === 0) return;

        const featuredGrid = document.querySelector('.featured-grid');
        if (featuredGrid) {
            featuredGrid.textContent = '';
            featuredGrid.appendChild(buildFeaturedMain(articles[0]));
            const side = el('div', 'side-news');
            articles.slice(1, 4).forEach(function (s) {
                const a = articleLink(s, 'clickable-card side-news-card');
                a.appendChild(el('h4', null, safeText(s.title, 200)));
                a.appendChild(el('p', 'side-news-meta',
                    safeText(s.category, 40) + ' · ' + formatDate(s.date)));
                side.appendChild(a);
            });
            featuredGrid.appendChild(side);
        }

        const latestGrid = document.getElementById(latestContainerId);
        if (latestGrid) {
            latestGrid.textContent = '';
            articles.slice(4).forEach(function (article) {
                latestGrid.appendChild(buildCard(article));
            });
        }
    }

    // ── category pages ───────────────────────────────────────────
    async function loadCMSCategoryArticles(containerId, categoryName) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data = await fetchJSON('content/articles.json');
        const articles = validArticles(data);
        if (!articles) return;

        const filtered = articles.filter(function (a) { return a.category === categoryName; });
        container.textContent = '';

        if (filtered.length === 0) {
            container.appendChild(el('p', 'center-msg', 'इस श्रेणी में अभी कोई लेख नहीं हैं।'));
            return;
        }

        const featuredWrap = el('div', 'featured-grid');
        featuredWrap.appendChild(buildFeaturedMain(filtered[0]));
        if (filtered.length > 1) {
            const side = el('div', 'side-news');
            filtered.slice(1, 4).forEach(function (s) {
                const a = articleLink(s, 'clickable-card side-news-card');
                a.appendChild(el('h4', null, safeText(s.title, 200)));
                a.appendChild(el('p', 'side-news-meta',
                    safeText(s.tag || s.category, 40) + ' · ' + formatDate(s.date)));
                side.appendChild(a);
            });
            featuredWrap.appendChild(side);
        }
        container.appendChild(featuredWrap);

        if (filtered.length > 4) {
            const grid = el('div', 'card-grid');
            filtered.slice(4).forEach(function (article) {
                grid.appendChild(buildCard(article));
            });
            container.appendChild(grid);
        }
    }

    // ── ticker (Hindi, self-refreshing every hour) ───────────────
    async function loadCMSTicker(containerClass) {
        const tracks = document.querySelectorAll('.' + containerClass);
        if (tracks.length === 0) return;

        const results = await Promise.all([
            fetchJSON('content/ticker.json'),
            fetchJSON('content/articles.json')
        ]);
        const tickerData = results[0];
        const articles = validArticles(results[1]) || [];

        // merge: curated ticker items + newest article headlines (Hindi)
        const items = [];
        if (tickerData && Array.isArray(tickerData.items)) {
            tickerData.items.forEach(function (item) {
                if (item && typeof item.text === 'string') items.push(safeText(item.text, 200));
            });
        }
        articles
            .slice()
            .sort(function (a, b) { return new Date(b.date || 0) - new Date(a.date || 0); })
            .slice(0, 6)
            .forEach(function (a) { items.push(safeText(a.title, 160)); });

        if (items.length === 0) return;

        tracks.forEach(function (track) {
            track.textContent = '';
            // duplicate content so the loop animation is seamless
            for (let round = 0; round < 2; round++) {
                items.forEach(function (text) {
                    track.appendChild(el('span', null, text));
                    track.appendChild(el('span', null, '●'));
                });
            }
        });
    }

    // refresh the ticker every hour so new articles surface automatically
    setInterval(function () {
        if (document.querySelector('.ticker-track')) loadCMSTicker('ticker-track');
    }, 60 * 60 * 1000);

    // ── full article page ────────────────────────────────────────
    async function loadFullArticle() {
        const contentArea = document.getElementById('markdown-content');
        if (!contentArea) return;

        let articleId = null;
        try {
            articleId = new URL(window.location.href).searchParams.get('id');
        } catch (e) { /* ignore */ }

        if (!articleId) {
            contentArea.textContent = '';
            contentArea.appendChild(el('div', 'loading-state', 'लेख का पता नहीं चला (Missing ID)।'));
            return;
        }
        articleId = safeText(articleId, 200);

        const results = await Promise.all([
            fetchJSON('content/articles.json'),
            fetchJSON('content/authors.json')
        ]);
        const articles = validArticles(results[0]);
        const authorData = results[1];

        if (!articles) {
            contentArea.textContent = '';
            contentArea.appendChild(el('div', 'loading-state', 'डेटा लोड करने में असमर्थ।'));
            return;
        }

        const article = articles.find(function (a) {
            return a.slug === articleId || a.title === articleId;
        });
        if (!article) {
            contentArea.textContent = '';
            contentArea.appendChild(el('div', 'loading-state', 'क्षमा करें, यह लेख हमारी लाइब्रेरी में नहीं मिला।'));
            return;
        }

        currentArticle = article;

        const hero = document.getElementById('article-hero');
        if (hero) setBgImage(hero, article.image);

        const titleEl = document.getElementById('article-title');
        if (titleEl) titleEl.textContent = safeText(article.title, 300);

        const metaEl = document.getElementById('article-meta');
        if (metaEl) {
            const dateStr = article.date ? formatDate(article.date) : '';
            metaEl.textContent = safeText(article.tag || 'NEWS', 40) + ' · ' +
                safeText(article.category, 40) + (dateStr ? ' · ' + dateStr : '');
        }

        // body container
        contentArea.textContent = '';
        const langBody = el('div', 'article-text-content');
        langBody.id = 'article-lang-body';
        contentArea.appendChild(langBody);

        // optional video (validated ID)
        if (typeof article.video_id === 'string' && /^[A-Za-z0-9_-]{6,20}$/.test(article.video_id)) {
            const vc = el('div', 'video-container');
            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube-nocookie.com/embed/' + article.video_id;
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('title', 'YouTube video');
            vc.appendChild(iframe);
            contentArea.appendChild(vc);
        }

        // author card
        if (article.author_id && authorData && Array.isArray(authorData.authors)) {
            const author = authorData.authors.find(function (a) {
                return a && a.id === article.author_id;
            });
            if (author && typeof author.name === 'string') {
                const card = el('div', 'author-card');
                const imgSrc = safeURL(author.image);
                if (imgSrc) {
                    const img = document.createElement('img');
                    img.className = 'author-img';
                    img.src = imgSrc;
                    img.alt = safeText(author.name, 100);
                    card.appendChild(img);
                }
                const info = el('div', 'author-info');
                info.appendChild(el('span', 'author-role', 'लेखक परिचय'));
                info.appendChild(el('h4', null, safeText(author.name, 100)));
                info.appendChild(el('p', 'author-bio', safeText(author.bio, 500)));
                card.appendChild(info);
                contentArea.appendChild(card);
            }
        }

        renderLangBody(currentLang);
        document.title = safeText(article.title, 150) + ' — PrajnaAGI';
    }

    // ── search ───────────────────────────────────────────────────
    async function handleSearch(query) {
        if (document.querySelector('.ticker-track')) loadCMSTicker('ticker-track');

        const latestGrid = document.getElementById('cms-latest-grid');
        const mainSection = latestGrid ? latestGrid.closest('section') : document.querySelector('section.section');
        if (!mainSection) return;

        mainSection.textContent = '';
        // query rendered via textContent — no injection possible
        const title = el('h2', 'section-title');
        title.appendChild(el('span', 'px', '⌕'));
        title.appendChild(document.createTextNode(' खोज परिणाम: "' + query + '"'));
        mainSection.appendChild(title);

        const grid = el('div', 'card-grid');
        grid.appendChild(el('div', 'loading-box', 'खोज रहे हैं...'));
        mainSection.appendChild(grid);

        const data = await fetchJSON('content/articles.json');
        const articles = validArticles(data);
        if (!articles) return;

        const q = query.toLowerCase();
        const filtered = articles.filter(function (a) {
            return a.title.toLowerCase().indexOf(q) !== -1 ||
                a.category.toLowerCase().indexOf(q) !== -1 ||
                (typeof a.summary === 'string' && a.summary.toLowerCase().indexOf(q) !== -1);
        });

        grid.textContent = '';
        if (filtered.length === 0) {
            grid.appendChild(el('p', 'center-msg', 'कोई परिणाम नहीं मिला।'));
            return;
        }
        filtered.forEach(function (article) { grid.appendChild(buildCard(article)); });
    }

    // ── init ─────────────────────────────────────────────────────
    function initCMS() {
        if (document.getElementById('cms-latest-grid')) loadCMSHome('cms-latest-grid');
        if (document.querySelector('.ticker-track')) loadCMSTicker('ticker-track');
        if (document.getElementById('article-detail-container')) {
            wireLangToggle();
            loadFullArticle();
        }

        [
            { id: 'cms-tech-grid', cat: 'तकनीक' },
            { id: 'cms-science-grid', cat: 'विज्ञान' },
            { id: 'cms-space-grid', cat: 'अंतरिक्ष' },
            { id: 'cms-environment-grid', cat: 'पर्यावरण' },
            { id: 'cms-health-grid', cat: 'स्वास्थ्य' },
            { id: 'cms-srijan-grid', cat: 'सृजन रोबॉटिक्स' }
        ].forEach(function (g) {
            if (document.getElementById(g.id)) loadCMSCategoryArticles(g.id, g.cat);
        });
    }

    function boot() {
        loadCMSNav();
        let searchQuery = null;
        try {
            searchQuery = new URLSearchParams(window.location.search).get('search');
        } catch (e) { /* ignore */ }
        if (searchQuery) {
            handleSearch(safeText(searchQuery.toLowerCase(), 80));
        } else {
            initCMS();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
