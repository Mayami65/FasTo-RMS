
const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    // Try to find the DB in common locations
    const dbPaths = [
        './dev.db',
        path.join(app.getPath('userData'), 'app.db')
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
        console.log('Checked paths:', dbPaths.map(p => path.resolve(p)));
        app.quit();
        return;
    }

    console.log('Found database at:', dbPath);
    const db = new Database(dbPath);

    try {
        const users = db.prepare('SELECT id, username, role, password FROM users').all();
        console.log('Users found:', users.length);
        users.forEach(u => {
            console.log(`- ID: ${u.id}, Username: ${u.username}, Role: ${u.role}, PasswordHash: ${u.password ? u.password.substring(0, 10) + '...' : 'NULL'}`);
        });

        if (users.length === 0) {
            console.log('No users found. You should restart the main app to trigger seeding.');
        }
    } catch (error) {
        console.error('Error querying users:', error.message);
    }
    app.quit();
});
