const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

app.whenReady().then(() => {
    try {
        const dbPath = './dev.db';
        console.log('Reading DB from:', dbPath);
        const db = new Database(dbPath);

        const agreements = db.prepare('SELECT hpa.*, c.name FROM hire_purchase_agreements hpa JOIN customers c ON hpa.customer_id = c.id').all();
        const output = JSON.stringify(agreements, null, 2);

        console.log(output);
        fs.writeFileSync('debug_output.txt', output);

        const customers = db.prepare('SELECT * FROM customers').all();
        fs.writeFileSync('debug_customers.txt', JSON.stringify(customers, null, 2));

    } catch (e) {
        console.error(e);
        fs.writeFileSync('debug_error.txt', 'Error: ' + e.message);
    }
    app.quit();
});
