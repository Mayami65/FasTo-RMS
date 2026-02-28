import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';
import * as isDev from 'electron-is-dev';
import * as bcrypt from 'bcryptjs';
import { getAppPaths } from './utils/paths';
import { logger } from './utils/logger';
import * as fs from 'fs';

let db: InstanceType<typeof Database> | null = null;
export type AppDatabase = InstanceType<typeof Database>;

export function getDb() {
    if (!db) {
        throw new Error("Database not initialized. Call initDatabase() first.");
    }
    return db;
}

export function initDb() {
    const paths = getAppPaths();
    const dbPath = path.join(paths.db, 'main.sqlite');

    // 1. Integrity Check
    try {
        const checkDb = new Database(dbPath);
        const integrity = checkDb.prepare('PRAGMA integrity_check').get() as any;
        if (integrity.integrity_check !== 'ok') {
            logger.error('DATABASE CORRUPTION DETECTED: ' + JSON.stringify(integrity));
            // In a real app, we might force a restore here.
        }
        checkDb.close();
    } catch (e) {
        logger.warn('Initial integrity check skipped (DB may not exist yet)');
    }

    // 2. Auto-Backup (Once every 24h)
    try {
        const lastBackupFile = path.join(paths.autoBackups, '.last_backup');
        let shouldBackup = true;
        if (fs.existsSync(lastBackupFile)) {
            const lastBackupTime = parseInt(fs.readFileSync(lastBackupFile, 'utf8'));
            if (Date.now() - lastBackupTime < 24 * 60 * 60 * 1000) {
                shouldBackup = false;
            }
        }

        if (shouldBackup && fs.existsSync(dbPath)) {
            logger.info('Performing daily auto-backup...');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(paths.autoBackups, `auto-backup-${timestamp}.sqlite`);

            // Use VACUUM INTO for a clean backup
            const tempDb = new Database(dbPath);
            tempDb.prepare(`VACUUM INTO '${backupPath}'`).run();
            tempDb.close();

            fs.writeFileSync(lastBackupFile, Date.now().toString());

            // Rotation: Keep last 5
            const files = fs.readdirSync(paths.autoBackups)
                .filter(f => f.startsWith('auto-backup-'))
                .map(f => ({ name: f, time: fs.statSync(path.join(paths.autoBackups, f)).mtimeMs }))
                .sort((a, b) => b.time - a.time);

            if (files.length > 5) {
                files.slice(5).forEach(f => fs.unlinkSync(path.join(paths.autoBackups, f.name)));
            }
            logger.info('Auto-backup complete.');
        }
    } catch (e: any) {
        logger.error('Auto-backup failed: ' + e.message);
    }

    db = new Database(dbPath);
    logger.info('Database connected at: ' + dbPath);
    logger.info('Initializing database schema and migrations...');

    // Initialize Schema
    const schema = `

    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'SHOP_REP',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        category TEXT,
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 5,
        description TEXT,
        category_id INTEGER,
        image_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS categories(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        color TEXT,
        icon TEXT,
        parent_id INTEGER,
        is_archived INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(parent_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sales(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS sale_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER,
        product_id INTEGER,
        variant_id INTEGER,
        quantity INTEGER NOT NULL,
        price_at_sale REAL NOT NULL,
        cost_price_at_sale REAL DEFAULT 0,
        FOREIGN KEY(sale_id) REFERENCES sales(id),
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(variant_id) REFERENCES product_variants(id)
    );

    CREATE TABLE IF NOT EXISTS stock_movements(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity_change INTEGER NOT NULL,
        reason TEXT NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS customers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        id_card_number TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hire_purchase_agreements(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        sale_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        balance_due REAL NOT NULL,
        status TEXT DEFAULT 'ACTIVE', --ACTIVE, COMPLETED, DEFAULTED, OVERDUE
      next_payment_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id),
        FOREIGN KEY(sale_id) REFERENCES sales(id)
    );

    CREATE TABLE IF NOT EXISTS installments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agreement_id INTEGER NOT NULL,
        amount_paid REAL NOT NULL,
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date DATETIME,
        notes TEXT,
        FOREIGN KEY(agreement_id) REFERENCES hire_purchase_agreements(id)
    );

    CREATE TABLE IF NOT EXISTS day_closings(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        closing_date DATE UNIQUE NOT NULL,
        total_sales_count INTEGER DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        cash_total REAL DEFAULT 0,
        momo_total REAL DEFAULT 0,
        hp_total REAL DEFAULT 0,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refunds(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        user_id INTEGER,
        reason TEXT NOT NULL,
        refund_amount REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sale_id) REFERENCES sales(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS refund_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        refund_id INTEGER NOT NULL,
        sale_item_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        variant_id INTEGER,
        quantity INTEGER NOT NULL,
        refund_amount REAL NOT NULL,
        FOREIGN KEY(refund_id) REFERENCES refunds(id),
        FOREIGN KEY(sale_item_id) REFERENCES sale_items(id),
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(variant_id) REFERENCES product_variants(id)
    );

    CREATE TABLE IF NOT EXISTS product_variants(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        variation_name TEXT,
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 5,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings(
        key TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS license(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT,
        license_key TEXT,
        plan_type TEXT DEFAULT 'LITE', -- LITE, STANDARD, PRO
        expires_at DATETIME,
        is_active INTEGER DEFAULT 0,
        activated_at DATETIME,
        machine_fingerprint TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS held_sales(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS held_sale_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        held_sale_id INTEGER NOT NULL,
        product_id INTEGER,
        variant_id INTEGER,
        quantity INTEGER NOT NULL,
        price_at_hold REAL NOT NULL,
        FOREIGN KEY(held_sale_id) REFERENCES held_sales(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(variant_id) REFERENCES product_variants(id)
    );

    -- Indices for performance
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    `;
    db.exec(schema);

    // Explicit migration for day_closings to ensure it exists
    try {
        db.prepare('SELECT count(*) FROM day_closings').get();
    } catch (e) {
        console.log('Table day_closings missing. Creating...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS day_closings(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        closing_date DATE UNIQUE NOT NULL,
        total_sales_count INTEGER DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        cash_total REAL DEFAULT 0,
        momo_total REAL DEFAULT 0,
        hp_total REAL DEFAULT 0,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `);
        console.log('Table day_closings created.');
    }

    // Schema Migration helpers
    const addColumnIfNotExists = (table: string, column: string, type: string) => {
        try {
            const tableInfo = db!.prepare(`PRAGMA table_info(${table})`).all();
            const hasColumn = tableInfo.some((col: any) => col.name === column);
            if (!hasColumn) {
                console.log(`[MIGRATION] Adding column ${column} to ${table}...`);
                db!.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
                console.log(`[MIGRATION] Column ${column} added to ${table}.`);
            } else {
                console.log(`[MIGRATION] Column ${column} already exists in ${table}.`);
            }
        } catch (e) {
            console.error(`[MIGRATION ERROR] Failed to add ${column} to ${table}:`, e);
        }
    };

    // Run migrations
    try {
        console.log('[MIGRATION] Checking for missing columns...');
        addColumnIfNotExists('sales', 'is_locked', 'BOOLEAN DEFAULT 0');
        addColumnIfNotExists('sales', 'momo_transaction_id', 'TEXT');
        addColumnIfNotExists('sales', 'momo_provider', 'TEXT');
        addColumnIfNotExists('sales', 'customer_id', 'INTEGER');
        addColumnIfNotExists('hire_purchase_agreements', 'next_payment_date', 'DATETIME');
        addColumnIfNotExists('hire_purchase_agreements', 'due_date', 'DATETIME');
        addColumnIfNotExists('sale_items', 'cost_price_at_sale', 'REAL DEFAULT 0');

        // Backfill cost_price_at_sale for existing sales if it's 0 or null
        try {
            console.log('[MIGRATION] Backfilling cost_price_at_sale...');
            db.exec(`
                UPDATE sale_items 
                SET cost_price_at_sale = (
                    SELECT cost_price 
                    FROM product_variants 
                    WHERE product_variants.id = sale_items.variant_id
                )
                WHERE cost_price_at_sale = 0 OR cost_price_at_sale IS NULL;
            `);
            console.log('[MIGRATION] Backfill complete.');
        } catch (e) {
            console.error('[MIGRATION ERROR] Failed to backfill cost_price_at_sale:', e);
        }

        // Add indices for performance

        try {
            addColumnIfNotExists('sales', 'customer_id', 'INTEGER');
            db.exec('CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id)');
            db.exec('CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)');
        } catch (e: any) {
            logger.error('Failed to create sales indices: ' + e.message);
        }

        // Initialize settings
        const initialSettings = [
            { key: 'tier', value: 'PRO' },
            { key: 'customer_tracking_enabled', value: 'false' }
        ];

        for (const { key, value } of initialSettings) {
            db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run(key, value);
        }
        addColumnIfNotExists('hire_purchase_agreements', 'grace_period_end_date', 'DATETIME');
        addColumnIfNotExists('hire_purchase_agreements', 'penalty_applied', 'BOOLEAN DEFAULT 0');
        addColumnIfNotExists('installments', 'due_date', 'DATETIME');
        addColumnIfNotExists('products', 'category_id', 'INTEGER');
        addColumnIfNotExists('categories', 'parent_id', 'INTEGER');
        addColumnIfNotExists('categories', 'is_archived', 'INTEGER DEFAULT 0');
        addColumnIfNotExists('sale_items', 'variant_id', 'INTEGER');
        addColumnIfNotExists('refund_items', 'variant_id', 'INTEGER');
        addColumnIfNotExists('products', 'image_path', 'TEXT');
        addColumnIfNotExists('sales', 'discount_amount', 'REAL DEFAULT 0');
        addColumnIfNotExists('sales', 'coupon_id', 'INTEGER');
        addColumnIfNotExists('sale_items', 'discount_amount', 'REAL DEFAULT 0');

        // Migrate refunds table: total_amount -> refund_amount
        try {
            const refundInfo = db!.prepare("PRAGMA table_info(refunds)").all();
            const hasTotalAmount = refundInfo.some((col: any) => col.name === 'total_amount');
            const hasRefundAmount = refundInfo.some((col: any) => col.name === 'refund_amount');
            if (hasTotalAmount && !hasRefundAmount) {
                console.log("[MIGRATION] Renaming refunds.total_amount to refund_amount...");
                db!.prepare("ALTER TABLE refunds RENAME COLUMN total_amount TO refund_amount").run();
            } else if (!hasRefundAmount) {
                addColumnIfNotExists('refunds', 'refund_amount', 'REAL DEFAULT 0');
            }
        } catch (e) { console.error("Refund migration failed:", e); }

        // Migrate refund_items table: amount -> refund_amount
        try {
            const refundItemInfo = db!.prepare("PRAGMA table_info(refund_items)").all();
            const hasAmount = refundItemInfo.some((col: any) => col.name === 'amount');
            const hasRefundAmount = refundItemInfo.some((col: any) => col.name === 'refund_amount');
            if (hasAmount && !hasRefundAmount) {
                console.log("[MIGRATION] Renaming refund_items.amount to refund_amount...");
                db!.prepare("ALTER TABLE refund_items RENAME COLUMN amount TO refund_amount").run();
            } else if (!hasRefundAmount) {
                addColumnIfNotExists('refund_items', 'refund_amount', 'REAL DEFAULT 0');
            }
        } catch (e) { console.error("Refund items migration failed:", e); }

        db.exec(`
            CREATE TABLE IF NOT EXISTS discounts(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL, 
                value REAL NOT NULL,
                min_purchase REAL DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                start_date DATETIME,
                end_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('[MIGRATION] Migration check complete.');
    } catch (error) {
        console.error('[MIGRATION ERROR] Critical migration failure:', error);
    }

    // Data Repair: Set default next_payment_date for existing active agreements if null
    try {
        const updateDates = db.prepare(`
            UPDATE hire_purchase_agreements 
            SET next_payment_date = datetime(created_at, '+30 days') 
            WHERE status = 'ACTIVE' AND next_payment_date IS NULL
        `);
        const info = updateDates.run();
        if (info.changes > 0) {
            console.log(`Updated ${info.changes} agreements with default next payment date.`);
        }
    } catch (e) {
        console.error('Data repair failed:', e);
    }

    // Create default Owner user if not exists - REMOVED for Desktop Product Model
    // The Setup Wizard will handle creating the first user.
    /*
    try {
        const checkUser = db.prepare('SELECT count(*) as count FROM users');
        const result: any = checkUser.get();
        if (result.count === 0) {
            console.log('Seeding default admin user...');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'OWNER');
        }
    } catch (error) {
        console.error('Failed to seed default user:', error);
    }
    */

    // Seed default tier
    try {
        const checkTier = db.prepare("SELECT count(*) as count FROM settings WHERE key = 'tier'");
        const result: any = checkTier.get();
        if (result.count === 0) {
            console.log('Seeding default tier: PRO');
            db.prepare("INSERT INTO settings (key, value) VALUES ('tier', 'PRO')").run();
        }
    } catch (error) {
        console.error('Failed to seed default tier:', error);
    }

    // Migration for Existing Products to Variants
    try {
        const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
        const variantsCount = db.prepare('SELECT COUNT(*) as count FROM product_variants').get() as any;

        if (productsCount.count > 0 && variantsCount.count === 0) {
            console.log('Migrating products to variants...');
            const products = db.prepare('SELECT * FROM products').all() as any[];
            const insertVariant = db.prepare(`
                INSERT INTO product_variants (product_id, sku, variation_name, cost_price, selling_price, stock_quantity, reorder_level)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const transaction = db.transaction(() => {
                for (const p of products) {
                    insertVariant.run(p.id, p.sku || `SKU-${p.id}`, 'Default', p.cost_price, p.selling_price, p.stock_quantity, p.reorder_level);
                }
            });
            transaction();
            console.log(`Successfully migrated ${products.length} products to variants.`);
        }
    } catch (error) {
        console.error('Products to variants migration failed:', error);
    }

    // Migration for Existing Categories
    try {
        const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as any;
        if (categoriesCount.count === 0) {
            console.log('Migrating unique categories from products...');
            const uniqueCategories = db.prepare(`
                SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''
            `).all() as any[];

            if (uniqueCategories.length > 0) {
                const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
                const updateProductCategory = db.prepare('UPDATE products SET category_id = ? WHERE category = ?');

                const transaction = db.transaction(() => {
                    for (const cat of uniqueCategories) {
                        const info = insertCategory.run(cat.category);
                        updateProductCategory.run(info.lastInsertRowid, cat.category);
                    }
                });
                transaction();
                console.log(`Successfully migrated ${uniqueCategories.length} categories.`);
            }
        }
    } catch (error) {
        console.error('Categories migration failed:', error);
    }

    return db;
}

export function logAction(userId: number | null, action: string, details: string) {
    if (!db) return;
    try {
        db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)').run(userId, action, details);
    } catch (e) {
        console.error('Failed to log action:', e);
    }
}
