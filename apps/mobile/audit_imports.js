const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const deps = new Set(Object.keys(pkg.dependencies || {}));
const devDeps = new Set(Object.keys(pkg.devDependencies || {}));

const allFiles = [];
function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (file === 'node_modules' || file === '.expo' || file === 'android' || file === 'ios') continue;
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            walk(filepath);
        } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
            allFiles.push(filepath);
        }
    }
}
walk(__dirname);

const usedPackages = new Set();
const importRegex = /from\s+['"]([^'".\\][^'"]*)['"]/g;
const requireRegex = /require\(['"]([^'".\\][^'"]*)['"]\)/g;

for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        usedPackages.add(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
        usedPackages.add(match[1]);
    }
}

const missing = [];
for (let p of usedPackages) {
    // Handle subpaths e.g. "moti/skeleton" -> "moti"
    let pkgName = p;
    if (p.startsWith('@')) {
        const parts = p.split('/');
        pkgName = parts[0] + '/' + parts[1];
    } else {
        pkgName = p.split('/')[0];
    }
    
    // Ignore node built-ins
    if (['fs', 'path', 'http', 'https', 'crypto', 'stream', 'util', 'events', 'buffer'].includes(pkgName)) continue;
    
    // Ignore react-native internals that somehow got required
    if (pkgName === 'react-native-worklets') continue; // We will check this separately

    if (!deps.has(pkgName) && !devDeps.has(pkgName)) {
        missing.push(pkgName);
    }
}

console.log(JSON.stringify(missing, null, 2));
