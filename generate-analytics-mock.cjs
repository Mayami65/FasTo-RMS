const Database = require('better-sqlite3');
const path = require('path');
const { format, subDays } = require('date-fns');

// Path to your local database
const dbPath = path.join(__dirname, 'dees-joy.sqlite');
console.log('Connecting to database:', dbPath);

try {
    const db = new Database(dbPath);

    // Get a test customer or create one if none exist
    let customerId = null;
    let customerId2 = null;
    const existingCustomers = db.prepare('SELECT id FROM customers LIMIT 2').all();

    if (existingCustomers.length === 0) {
        console.log('Creating mock customers...');
        const insertCustomer = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
        customerId = insertCustomer.run('VIP John Doe', '0241112222').lastInsertRowid;
        customerId2 = insertCustomer.run('Jane Smith', '0543334444').lastInsertRowid;
    } else {
        customerId = existingCustomers[0].id;
        if (existingCustomers.length > 1) {
            customerId2 = existingCustomers[1].id;
        } else {
            const insertCustomer = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
            customerId2 = insertCustomer.run('Jane Smith', '0543334444').lastInsertRowid;
        }
    }

    // Get a mock product variant
    let productDetails = null;

    const existingVariants = db.prepare('SELECT pv.id as variant_id, pv.product_id, pv.cost_price, pv.selling_price FROM product_variants pv LIMIT 1').all();
    if (existingVariants.length > 0) {
        productDetails = existingVariants[0];
    } else {
        console.log('Warning: No products found in database. Please add a product through the UI first for the mock data script to work properly.');
        process.exit(1);
    }

    const insertSale = db.prepare(`
        INSERT INTO sales (user_id, total_amount, payment_method, timestamp, customer_id)
        VALUES (1, ?, 'CASH', ?, ?)
    `);

    const insertSaleItem = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, variant_id, quantity, price_at_sale, cost_price_at_sale, discount_amount)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `);

    db.transaction(() => {
        const today = new Date();

        // 1. VIP Customer (Bought 3 times, high spend)
        console.log('Inserting VIP Customer Sales...');
        for (let i = 0; i < 3; i++) {
            const timestamp = subDays(today, i * 2).toISOString();
            const total = 1500;
            const saleInfo = insertSale.run(total, timestamp, customerId);
            insertSaleItem.run(saleInfo.lastInsertRowid, productDetails.product_id, productDetails.variant_id, 1, 1500, 1000);
        }

        // 2. Dormant Customer (Bought once 65 days ago, high spend)
        console.log('Inserting Dormant Customer Sale...');
        const dormantTimestamp = subDays(today, 65).toISOString();
        const dormantSaleInfo = insertSale.run(2000, dormantTimestamp, customerId2);
        insertSaleItem.run(dormantSaleInfo.lastInsertRowid, productDetails.product_id, productDetails.variant_id, 1, 2000, 1200);

        // 3. Walk-in Customer (Bought today)
        console.log('Inserting Walk-in Sale...');
        const walkinTimestamp = today.toISOString();
        const walkinSaleInfo = insertSale.run(500, walkinTimestamp, null);
        insertSaleItem.run(walkinSaleInfo.lastInsertRowid, productDetails.product_id, productDetails.variant_id, 1, 500, 300);

    })();

    console.log('✅ Mock data inserted successfully!');
    db.close();
} catch (error) {
    console.error('❌ Failed to insert mock data:', error);
}
