// ── SHARED UI LOGIC ─────────────────────────────────────────────────────────

// Theme Toggle Logic
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
    themeBtn.addEventListener('click', function () {
        const currentTheme = document.body.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', nextTheme);
        this.textContent = nextTheme === 'light' ? '🌙 रात' : '☀️ दिन';
        localStorage.setItem('theme', nextTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        themeBtn.textContent = savedTheme === 'light' ? '🌙 रात' : '☀️ दिन';
    }
}

// Hamburger Mobile Menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        this.setAttribute('aria-label', isOpen ? 'मेनू बंद करें' : 'मेनू खोलें');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            hamburger.classList.remove('open');
        });
    });
}

// Search Bar Expansion & Functionality
const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');
if (searchBtn && searchInput) {
    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            // Redirect to index with search query (future-proofing)
            window.location.href = `Index.html?search=${encodeURIComponent(query)}`;
        }
    };

    searchBtn.addEventListener('click', (e) => {
        if (!searchInput.classList.contains('expanded')) {
            searchInput.classList.add('expanded');
            searchInput.focus();
        } else {
            performSearch();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

// Back to Top Button
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Article Expansion (Expandable Articles)
function toggleArticle(btn, e) {
    if (e) e.preventDefault();
    const card = btn.closest('.clickable-card');
    const content = card.querySelector('.full-article-content');
    if (!content) return;
    
    const isVisible = content.style.display === 'block';
    content.style.display = isVisible ? 'none' : 'block';
    btn.textContent = isVisible ? 'पूरा पढ़ें ↓' : 'कम दिखाएं ↑';
}

// Global reveal on scroll (Intersection Observer)
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const fill = e.target.querySelector('.progress-fill');
            if (fill) fill.style.width = fill.getAttribute('data-percent');
            e.target.classList.add('revealed');
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.clickable-card, .section-title').forEach(el => {
    revealObserver.observe(el);
});

// Newsletter Validation
const subBtn = document.querySelector('.subscribe-btn');
const newsletterForm = document.querySelector('form[name="newsletter"]');
if (subBtn && newsletterForm) {
    subBtn.addEventListener('click', function (e) {
        const inp = document.querySelector('.newsletter-input');
        if (inp && inp.value && inp.value.includes('@')) {
            // Let the form submit to Netlify, but show success state
            const originalText = this.textContent;
            this.textContent = '✅ धन्यवाद!';
            this.style.background = '#25D366';
            
            // The form will naturally submit after this unless we e.preventDefault()
            // We want it to submit to Netlify, so we don't prevent default.
        } else if (inp) {
            e.preventDefault(); // Stop submission if invalid
            inp.style.borderColor = '#ff5252';
            inp.placeholder = "कृपया मान्य ईमेल लिखें";
            setTimeout(() => inp.style.borderColor = '', 2000);
        }
    });
}
// ── ADMIN BAR LOGIC ──────────────────────────────────────────────────────────
function initAdminBar() {
    // Only proceed if Netlify Identity is available
    if (!window.netlifyIdentity) return;

    const user = window.netlifyIdentity.currentUser();
    if (!user) return;

    // Check if bar already exists
    if (document.querySelector('.admin-bar')) return;

    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    const isArticlePage = window.location.pathname.includes('article.html');

    const adminBar = document.createElement('div');
    adminBar.className = 'admin-bar';
    adminBar.innerHTML = `
        <a href="/admin" class="admin-bar-btn">🚀 <span>Dashboard</span></a>
        <div class="admin-bar-divider"></div>
        <a href="/admin/#/collections/pages/new" class="admin-bar-btn">➕ <span>New Article</span></a>
        ${isArticlePage && articleId ? `
            <div class="admin-bar-divider"></div>
            <a href="/admin/#/collections/pages/entries/articles" class="admin-bar-btn">📝 <span>Edit This</span></a>
        ` : ''}
        <div class="admin-bar-divider"></div>
        <button onclick="window.netlifyIdentity.logout()" class="admin-bar-btn" style="background:none; border:none; cursor:pointer; font-family:inherit;">🚪 <span>Logout</span></button>
    `;

    document.body.prepend(adminBar);
}

// Watch for login/logout events to show/hide the bar
if (window.netlifyIdentity) {
    window.netlifyIdentity.on('login', () => {
        initAdminBar();
        window.netlifyIdentity.close();
    });
    window.netlifyIdentity.on('logout', () => {
        const bar = document.querySelector('.admin-bar');
        if (bar) bar.remove();
    });
    
    // Check status on load
    document.addEventListener('DOMContentLoaded', initAdminBar);
}
