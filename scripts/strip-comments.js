const fs = require('fs');
const path = require('path');

function stripComments(content, ext) {
    if (ext === '.html') {
        return content.replace(/<!--[\s\S]*?-->/g, '');
    } else if (ext === '.css') {
        return content.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    return content;
}

function processDir(dir) {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            processDir(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.css')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const cleanContent = stripComments(content, path.extname(file));
            if (content !== cleanContent) {
                fs.writeFileSync(filePath, cleanContent);
                console.log(`✅ Limpiado: ${filePath}`);
            }
        }
    });
}

processDir(path.join(__dirname, '../public/css'));
processDir(path.join(__dirname, '../public/components'));
const indexPath = path.join(__dirname, '../public/index.html');
if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const cleanContent = stripComments(content, '.html');
    fs.writeFileSync(indexPath, cleanContent);
    console.log(`✅ Limpiado: ${indexPath}`);
}
