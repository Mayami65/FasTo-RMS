
const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

app.whenReady().then(() => {
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
        console.log('DB not found');
        app.quit();
        return;
    }

    console.log('Resetting password in:', dbPath);
    const db = new Database(dbPath);

    try {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashedPassword, 'admin');
        console.log('Password for admin reset to admin123');
    } catch (error) {
        console.error('Error resetting password:', error.message);
    }
    app.quit();
});
