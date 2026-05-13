const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../content/articles');
const outputFile = path.join(__dirname, '../content/articles.json');

// Ensure content directory exists
if (!fs.existsSync(path.join(__dirname, '../content'))) {
    fs.mkdirSync(path.join(__dirname, '../content'), { recursive: true });
}
if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
}

const articles = [];

const files = fs.readdirSync(articlesDir);

files.forEach(file => {
    if (path.extname(file) === '.md') {
        const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
        
        // Very basic frontmatter parser for Decap CMS output
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (match) {
            const frontmatter = match[1];
            const article = { id: file };
            
            frontmatter.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > -1) {
                    const key = line.slice(0, colonIndex).trim();
                    let value = line.slice(colonIndex + 1).trim();
                    // Remove surrounding quotes if they exist
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    } else if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.slice(1, -1);
                    }
                    article[key] = value;
                }
            });
            
            articles.push(article);
        }
    }
});

// Sort by date descending
articles.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(outputFile, JSON.stringify(articles, null, 2));
console.log(`Generated ${outputFile} with ${articles.length} articles.`);
