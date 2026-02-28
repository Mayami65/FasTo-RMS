const Database = require('better-sqlite3');
const db = new Database('dev.db', { verbose: console.log });

console.log('--- Inspecting hire_purchase_agreements ---');
try {
    const agreements = db.prepare('SELECT * FROM hire_purchase_agreements').all();
    console.log('Total Agreements:', agreements.length);
    console.table(agreements);
} catch (e) {
    console.error('Error reading agreements:', e.message);
}

console.log('\n--- Inspecting installments ---');
try {
    const installments = db.prepare('SELECT * FROM installments').all();
    console.log('Total Installments:', installments.length);
    console.table(installments);
} catch (e) {
    console.error('Error reading installments:', e.message);
}

console.log('\n--- Inspecting customers ---');
try {
    const customers = db.prepare('SELECT * FROM customers').all();
    console.log('Total Customers:', customers.length);
    console.table(customers);
} catch (e) {
    console.error('Error reading customers:', e.message);
}
