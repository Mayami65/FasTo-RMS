const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
    try {
        const dbPath = './dev.db';
        console.log('Opening database at:', dbPath);
        const db = new Database(dbPath);

        console.log('--- HP Agreements ---');
        const agreements = db.prepare('SELECT hpa.*, c.name as customer_name FROM hire_purchase_agreements hpa JOIN customers c ON hpa.customer_id = c.id').all();
        console.log(JSON.stringify(agreements, null, 2));

        console.log('--- Raw HP Table (First 10) ---');
        const rawAgreements = db.prepare('SELECT * FROM hire_purchase_agreements LIMIT 10').all();
        console.log(JSON.stringify(rawAgreements, null, 2));

        console.log('--- Customers ---');
        const customers = db.prepare('SELECT id, name FROM customers').all();
        console.log(JSON.stringify(customers, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
    app.quit();
});
