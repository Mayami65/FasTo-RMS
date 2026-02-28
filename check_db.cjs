const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dev.db');
const db = new Database(dbPath);

console.log('Checking sales table...');
const lastSales = db.prepare('SELECT id, timestamp, total_amount FROM sales ORDER BY id DESC LIMIT 5').all();
console.log('Last 5 sales:', JSON.stringify(lastSales, null, 2));

const today = new Date().toISOString().split('T')[0];
console.log('Testing with date:', today);

const count = db.prepare("SELECT COUNT(*) as count FROM sales WHERE date(timestamp) = ?").get(today);
console.log(`Count with date(timestamp) = '${today}':`, count.count);

const betweenCount = db.prepare("SELECT COUNT(*) as count FROM sales WHERE date(timestamp) BETWEEN ? AND ?").get(today, today);
console.log(`Count with date(timestamp) BETWEEN '${today}' AND '${today}':`, betweenCount.count);

const stringBetweenCount = db.prepare("SELECT COUNT(*) as count FROM sales WHERE timestamp BETWEEN ? AND ?").get(`${today} 00:00:00`, `${today} 23:59:59`);
console.log(`Count with string BETWEEN '${today} 00:00:00' AND '${today} 23:59:59':`, stringBetweenCount.count);

db.close();
