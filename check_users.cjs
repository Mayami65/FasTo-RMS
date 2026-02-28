
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Try to find the DB in common locations
const dbPaths = [
    './dev.db',
    path.join(process.env.APPDATA, 'dees-joy-rms', 'app.db'), // Adjust app name if needed
    path.join(process.env.APPDATA, 'dees-joy-rms', 'Data', 'app.db')
];

let dbPath;
for (const p of dbPaths) {
    if (fs.existsSync(p)) {
        dbPath = p;
        break;
    }
}

if (!dbPath) {
    console.log('Could not find database file.');
    console.log('Checked paths:', dbPaths);
    process.exit(1);
}

console.log('Found database at:', dbPath);
const db = new Database(dbPath);

try {
    const users = db.prepare('SELECT id, username, role, password FROM users').all();
    console.log('Users found:', users.length);
    users.forEach(u => {
        console.log(`- ID: ${u.id}, Username: ${u.username}, Role: ${u.role}, PasswordHash: ${u.password.substring(0, 10)}...`);
    });
} catch (error) {
    console.error('Error querying users:', error.message);
}
