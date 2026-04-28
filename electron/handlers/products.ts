import { type IpcMain, dialog, app, BrowserWindow } from 'electron';
import type { AppDatabase } from '../db';
import * as path from 'path';
import * as fs from 'fs';
import { audit } from "../services/audit";

export function registerProductHandlers(ipcMain: IpcMain, db: AppDatabase) {

    const productImagesDir = path.join(app.getPath('userData'), 'product_images');
    if (!fs.existsSync(productImagesDir)) {
        fs.mkdirSync(productImagesDir, { recursive: true });
    }

    // Image Handlers
    ipcMain.handle('select-product-image', async () => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return null;
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
        });

        if (result.canceled || result.filePaths.length === 0) return null;

        try {
            const sourcePath = result.filePaths[0];
            const ext = path.extname(sourcePath);
            const fileName = `${Date.now()}${ext}`;
            const targetPath = path.join(productImagesDir, fileName);
            fs.copyFileSync(sourcePath, targetPath);
            return fileName;
        } catch (error) {
            console.error('Failed to save product image:', error);
            return null;
        }
    });

    ipcMain.handle('get-product-image-path', async (_event, fileName) => {
        if (!fileName) return null;
        return path.join(productImagesDir, fileName);
    });

    // Get Products
    ipcMain.handle('get-trip-names', async () => {
        if (!db) return [];
        try {
            const trips = db.prepare('SELECT DISTINCT trip_name FROM products WHERE trip_name IS NOT NULL AND trip_name != "" ORDER BY trip_name DESC').all() as any[];
            return trips.map(t => t.trip_name);
        } catch (error) {
            console.error('Failed to get trip names:', error);
            return [];
        }
    });

    ipcMain.handle('get-products', async (_event, { page = 1, limit = 10, search = '', categoryId = null, stockStatus = 'all', tripName = 'all' } = {}) => {
        if (!db) return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        try {
            const offset = (page - 1) * limit;
            let query = 'SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as count FROM products p WHERE 1=1';
            const params: any[] = [];

            if (search) {
                const searchClause = ' AND (p.name LIKE ? OR p.sku LIKE ?)';
                query += searchClause;
                countQuery += searchClause;
                params.push(`%${search}%`, `%${search}%`);
            }

            if (categoryId && categoryId !== 'none') {
                const catClause = ' AND p.category_id = ?';
                query += catClause;
                countQuery += catClause;
                params.push(categoryId);
            } else if (categoryId === 'none') {
                const catClause = ' AND p.category_id IS NULL';
                query += catClause;
                countQuery += catClause;
            }

            if (stockStatus === 'low_stock') {
                const stockClause = ' AND p.stock_quantity <= p.reorder_level AND p.stock_quantity > 0';
                query += stockClause;
                countQuery += stockClause;
            } else if (stockStatus === 'out_of_stock') {
                const stockClause = ' AND p.stock_quantity = 0';
                query += stockClause;
                countQuery += stockClause;
            } else if (stockStatus === 'in_stock') {
                const stockClause = ' AND p.stock_quantity > p.reorder_level';
                query += stockClause;
                countQuery += stockClause;
            }

            if (tripName && tripName !== 'all') {
                if (tripName === 'undefined_sizes') {
                    const undefinedClause = ` AND p.id IN (SELECT product_id FROM product_variants WHERE variation_name LIKE 'Undefined%')`;
                    query += undefinedClause;
                    countQuery += undefinedClause;
                } else {
                    const tripClause = ' AND p.trip_name = ?';
                    query += tripClause;
                    countQuery += tripClause;
                    params.push(tripName);
                }
            }

            const totalResult = db.prepare(countQuery).get(...params) as any;
            const total = totalResult ? totalResult.count : 0;
            const totalPages = Math.ceil(total / limit);

            query += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
            const products = db.prepare(query).all(...params, limit, offset) as any[];

            // Fetch variants for each product
            const getVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?');
            const data = products.map(p => ({
                ...p,
                variants: getVariants.all(p.id)
            }));

            return {
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            console.error('Failed to get products:', error);
            return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
        }
    });

    // Add Product
    ipcMain.handle('add-product', async (_event, product) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const transaction = db.transaction((p: any) => {
                const stmt = db.prepare(`
                    INSERT INTO products(name, sku, category, category_id, cost_price, selling_price, stock_quantity, reorder_level, description, image_path)
                    VALUES(@name, @sku, @category, @category_id, @cost_price, @selling_price, @stock_quantity, @reorder_level, @description, @image_path)
                `);
                const info = stmt.run({
                    category: null,
                    category_id: null,
                    description: null,
                    image_path: null,
                    ...p
                });
                const productId = info.lastInsertRowid;

                if (p.variants && p.variants.length > 0) {
                    const insertVariant = db.prepare(`
                        INSERT INTO product_variants (product_id, sku, variation_name, cost_price, selling_price, stock_quantity, reorder_level)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
                    for (const v of p.variants) {
                        insertVariant.run(productId, v.sku, v.variation_name, v.cost_price, v.selling_price, v.stock_quantity, v.reorder_level);
                    }
                } else {
                    // Create a default variant if none provided (for backward compatibility)
                    const insertVariant = db.prepare(`
                        INSERT INTO product_variants (product_id, sku, variation_name, cost_price, selling_price, stock_quantity, reorder_level)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
                    insertVariant.run(productId, p.sku || `SKU-${productId}`, 'Default', p.cost_price, p.selling_price, p.stock_quantity, p.reorder_level);
                }
                return productId;
            });

            const productId = transaction(product);

            audit(db, {
                action: 'PRODUCT_CREATE',
                details: `Created product ${product.name}`,
                entity: 'product',
                entityId: productId
            });

            return { success: true, id: productId };
        } catch (error: any) {
            console.error('Failed to add product:', error);
            return { success: false, error: error.message };
        }
    });

    // Update Product
    ipcMain.handle('update-product', async (_event, product) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const transaction = db.transaction((p: any) => {
                const stmt = db.prepare(`
                    UPDATE products SET 
                        name = @name, 
                        sku = @sku, 
                        category_id = @category_id, 
                        cost_price = @cost_price, 
                        selling_price = @selling_price, 
                        stock_quantity = @stock_quantity, 
                        reorder_level = @reorder_level, 
                        description = @description,
                        image_path = @image_path
                    WHERE id = @id
                `);

                stmt.run({
                    category_id: null,
                    description: null,
                    image_path: null,
                    ...p
                });

                // Update variants (simplified: delete all and re-insert? Or update existing?)
                // For now, let's keep it simple: strict updates to variants might be complex if IDs change.
                // Assuming variants are handled by ID if provided, or added if new?
                // The current main.ts logic for update isn't shown in the snippets but implied.
                // Let's implement a safe update strategy.

                if (p.variants && p.variants.length > 0) {
                    // Check existing variants
                    const existingVariants = db.prepare('SELECT id FROM product_variants WHERE product_id = ?').all(p.id) as any[];
                    const existingIds = existingVariants.map(v => v.id);
                    const incomingIds = p.variants.map((v: any) => v.id).filter((id: any) => id); // Filter out undefined/null

                    // Delete removed variants
                    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
                    if (toDelete.length > 0) {
                        const deleteStmt = db.prepare('DELETE FROM product_variants WHERE id = ?');
                        for (const id of toDelete) deleteStmt.run(id);
                    }

                    const upsertVariant = db.prepare(`
                        INSERT INTO product_variants (id, product_id, sku, variation_name, cost_price, selling_price, stock_quantity, reorder_level)
                        VALUES (@id, @product_id, @sku, @variation_name, @cost_price, @selling_price, @stock_quantity, @reorder_level)
                        ON CONFLICT(id) DO UPDATE SET
                            sku = excluded.sku,
                            variation_name = excluded.variation_name,
                            cost_price = excluded.cost_price,
                            selling_price = excluded.selling_price,
                            stock_quantity = excluded.stock_quantity,
                            reorder_level = excluded.reorder_level
                     `);

                    for (const v of p.variants) {
                        upsertVariant.run({
                            id: v.id || null, // null triggers auto-increment for new
                            product_id: p.id,
                            sku: v.sku,
                            variation_name: v.variation_name,
                            cost_price: v.cost_price,
                            selling_price: v.selling_price,
                            stock_quantity: v.stock_quantity,
                            reorder_level: v.reorder_level
                        });
                    }
                }
            });

            transaction(product);

            audit(db, {
                action: 'PRODUCT_UPDATE',
                details: `Updated product ${product.name} (ID: ${product.id})`,
                entity: 'product',
                entityId: product.id
            });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to update product:', error);
            return { success: false, error: error.message };
        }
    });

    // Inventory Summary
    ipcMain.handle('get-inventory-summary', async () => {
        if (!db) return null;
        try {
            const summary = db.prepare(`
                SELECT 
                    COUNT(*) as total_products,
                    SUM(stock_quantity) as total_stock,
                    SUM(stock_quantity * cost_price) as total_value,
                    COUNT(CASE WHEN stock_quantity <= reorder_level AND stock_quantity > 0 THEN 1 END) as low_stock_count,
                    COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_count
                FROM products
            `).get() as any;

            return {
                totalProducts: summary.total_products || 0,
                totalStock: summary.total_stock || 0,
                totalValue: summary.total_value || 0,
                lowStockCount: summary.low_stock_count || 0,
                outOfStockCount: summary.out_of_stock_count || 0
            };
        } catch (error) {
            console.error('Failed to get inventory summary:', error);
            return null;
        }
    });

    // Delete Product
    ipcMain.handle('delete-product', async (_event, id) => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            let productName = 'Unknown Product';
            try {
                const p = db.prepare('SELECT name FROM products WHERE id = ?').get(id);
                if (p) productName = (p as any).name;
            } catch (e) { /* ignore */ }

            const stmt = db.prepare('DELETE FROM products WHERE id = ?');
            stmt.run(id);

            audit(db, {
                action: 'PRODUCT_DELETE',
                details: `Deleted product: ${productName} (ID: ${id})`,
                entity: 'product',
                entityId: id
            });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete product:', error);
            return { success: false, error: error.message };
        }
    });

    // Delete All Products
    ipcMain.handle('delete-all-products', async () => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const transaction = db.transaction(() => {
                db.prepare('DELETE FROM products').run();
                db.prepare('DELETE FROM product_variants').run();
                db.prepare('DELETE FROM stock_movements').run();
            });

            transaction();

            // Clear image directory
            if (fs.existsSync(productImagesDir)) {
                const files = fs.readdirSync(productImagesDir);
                for (const file of files) {
                    fs.unlinkSync(path.join(productImagesDir, file));
                }
            }

            audit(db, {
                action: 'PRODUCT_DELETE_ALL',
                details: 'Deleted all products, variants, and stock movements from the system.',
                entity: 'product',
                entityId: 0
            });

            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete all products:', error);
            return { success: false, error: error.message };
        }
    });

    // Stock Management
    ipcMain.handle('adjust-stock', async (_event, { productId, quantityChange, reason, notes }) => {
        if (!db) return { success: false, error: 'Database not initialized' };

        try {
            const updateProduct = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?');
            const insertMovement = db.prepare('INSERT INTO stock_movements (product_id, quantity_change, reason, notes) VALUES (?, ?, ?, ?)');
            const getProduct = db.prepare('SELECT id, name, stock_quantity FROM products WHERE id = ?');

            const transaction = db.transaction(() => {
                const product = getProduct.get(productId) as any;
                if (!product) throw new Error('Product not found');

                const newStockLevel = product.stock_quantity + quantityChange;
                if (newStockLevel < 0) throw new Error(`Insufficient stock. Available: ${product.stock_quantity}`);

                const result = updateProduct.run(quantityChange, productId);
                if (result.changes === 0) throw new Error('Product not found');

                insertMovement.run(productId, quantityChange, reason, notes);
                audit(db, {
                    action: 'STOCK_ADJUSTMENT',
                    details: `Adjusted stock for ${product.name}: ${quantityChange > 0 ? '+' : ''}${quantityChange}. Reason: ${reason}`,
                    entity: 'product',
                    entityId: productId,
                    after: { newStock: newStockLevel, previousStock: product.stock_quantity }
                });
            });

            transaction();
            return { success: true };
        } catch (error: any) {
            console.error('Failed to adjust stock:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-stock-movements', async (_event, productId) => {
        if (!db) return [];
        try {
            return db.prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY timestamp DESC').all(productId);
        } catch (error) {
            console.error('Failed to get stock movements:', error);
            return [];
        }
    });

    // Import Handlers
    ipcMain.handle('download-template', async () => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return { success: false, error: 'Window not found' };

        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Save Import Template',
            defaultPath: 'product_import_template.xlsx',
            filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
        });

        if (!filePath) return { success: false, error: 'Operation cancelled' };

        try {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Template');

            const headers = ['Name', 'SKU', 'Category', 'Price', 'Stock', 'Description', 'Image Path', 'Size', 'Color'];
            worksheet.addRow(headers);
            worksheet.addRow(['Example Product', 'EX-001', 'General', 50, 100, 'Description here', '', 'M', 'Red']);

            // Formatting
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
            };

            await workbook.xlsx.writeFile(filePath);

            return { success: true, filePath };
        } catch (error: any) {
            console.error('Failed to download template:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('select-excel-file', async () => {
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (!mainWindow) return null;
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
        });
        if (result.canceled || result.filePaths.length === 0) return null;
        return result.filePaths[0];
    });

    ipcMain.handle('import-products', async (_event, filePath, tripName: string = '') => {
        if (!db) return { success: false, error: 'Database not initialized' };
        try {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(filePath);
            const worksheet = workbook.getWorksheet(1);
            if (!worksheet) return { success: false, error: 'Worksheet not found' };

            const rows: any[] = [];
            const headers: { [col: number]: string } = {};

            // Get headers from first row and normalize them
            const firstRow = worksheet.getRow(1);
            firstRow.eachCell((cell: any, colNumber: number) => {
                let header = cell.value?.toString() || '';
                // Remove BOM and non-printable characters, then trim and lowercase
                header = header.replace(/[^\x20-\x7E]/g, '').trim().toLowerCase();
                if (header) {
                    headers[colNumber] = header;
                }
            });

            // Iterate over data rows
            worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
                if (rowNumber === 1) return; // Skip headers
                const rowData: any = {};
                let hasData = false;

                row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
                    const header = headers[colNumber];
                    if (header) {
                        let value = cell.value;
                        if (value && typeof value === 'object') {
                            if ('result' in value) value = (value as any).result;
                            else if ('text' in value) value = (value as any).text;
                            else if ('richText' in value) value = (value as any).richText.map((t: any) => t.text).join('');
                        }
                        rowData[header] = value !== null && value !== undefined ? value : '';
                        if (value !== null && value !== undefined && value !== '') hasData = true;
                    }
                });

                if (hasData) {
                    rows.push(rowData);
                }
            });

            if (rows.length === 0) return { success: false, error: 'File is empty' };

            let imported = 0;
            let skipped = 0;
            let failed = 0;
            const errors: string[] = [];
            const productImagesDir = path.join(app.getPath('userData'), 'product_images');

            const findCol = (row: any, ...aliases: string[]) => {
                for (const alias of aliases) {
                    const normalizedAlias = alias.toLowerCase().replace(/\s+/g, '');
                    for (const key of Object.keys(row)) {
                        if (key.replace(/\s+/g, '').toLowerCase() === normalizedAlias) {
                            return row[key];
                        }
                    }
                }
                return null;
            };

            const transaction = db.transaction(() => {
                const productGroups: { [key: string]: any[] } = {};
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const name = findCol(row, 'name', 'product name', 'item name', 'product');
                    if (!name) {
                        skipped++;
                        errors.push(`Row ${i + 2}: Missing "Name" column.`);
                        continue;
                    }
                    const normalizedName = name.toString().trim();
                    if (!productGroups[normalizedName]) productGroups[normalizedName] = [];
                    productGroups[normalizedName].push(row);
                }

                const insertProduct = db!.prepare(`
                    INSERT INTO products (name, sku, category, category_id, cost_price, selling_price, stock_quantity, reorder_level, description, image_path, trip_name)
                    VALUES (@name, @sku, @category, @category_id, @cost_price, @selling_price, @stock_quantity, @reorder_level, @description, @image_path, @trip_name)
                `);

                const insertVariant = db!.prepare(`
                    INSERT INTO product_variants (product_id, sku, variation_name, cost_price, selling_price, stock_quantity, reorder_level)
                    VALUES (@product_id, @sku, @variation_name, @cost_price, @selling_price, @stock_quantity, @reorder_level)
                `);

                const checkCategory = db!.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE');
                const insertCategory = db!.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');

                // Random Number Generator for Sequential SKU fallback
                const generateSequence = () => Math.floor(Math.random() * 900) + 100;

                for (const [productName, groupRows] of Object.entries(productGroups)) {
                    try {
                        const firstRow = groupRows[0];

                        const categoryName = (findCol(firstRow, 'category', 'item category') || 'Uncategorized').toString().trim();
                        let categoryId = null;
                        if (categoryName) {
                            const existingCat = checkCategory.get(categoryName) as any;
                            if (existingCat) {
                                categoryId = existingCat.id;
                            } else {
                                const colors = ['#059669', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
                                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                const info = insertCategory.run(categoryName, randomColor);
                                categoryId = info.lastInsertRowid;
                            }
                        }

                        // Auto SKU Generation Mapping
                        const catPrefixRaw = categoryName.substring(0, 3).toUpperCase();
                        const prefixMap: Record<string, string> = {
                            'DRESSES': 'DJV-CAL',
                            'MEN': 'DJV-JAY',
                            'MENS': 'DJV-JAY',
                            'SHOES': 'DJV-SHO',
                            'BAGS': 'DJV-BAG',
                            'ACCESSORIES': 'DJV-ACC'
                        };
                        const skuPrefix = prefixMap[categoryName.toUpperCase()] || `DJV-${catPrefixRaw}`;
                        const productSequenceNum = generateSequence();
                        const generatedBaseSku = `${skuPrefix}-${productSequenceNum}`;

                        let imagePath = null;
                        const rawImagePath = findCol(firstRow, 'imagepath', 'image_path', 'image');
                        if (rawImagePath && typeof rawImagePath === 'string') {
                            const cleanPath = rawImagePath.replace(/"/g, '').trim();
                            if (cleanPath && fs.existsSync(cleanPath)) {
                                try {
                                    const ext = path.extname(cleanPath);
                                    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
                                    if (!fs.existsSync(productImagesDir)) fs.mkdirSync(productImagesDir, { recursive: true });
                                    fs.copyFileSync(cleanPath, path.join(productImagesDir, fileName));
                                    imagePath = fileName;
                                } catch (e) { /* ignore */ }
                            }
                        }

                        const costPrice = parseFloat(findCol(firstRow, 'cost price', 'cost_price', 'cost') || 0);
                        const sellingPrice = parseFloat(findCol(firstRow, 'selling price', 'selling_price', 'price', 'selling') || 0);
                        const reorderLevel = parseInt(findCol(firstRow, 'reorder level', 'reorder_level', 'reorder') || 5);

                        // Use provided SKU or auto-generated one
                        const providedSku = findCol(firstRow, 'sku', 'product sku');
                        const finalBaseSku = providedSku ? providedSku.toString().trim() : generatedBaseSku;

                        const productInfo = insertProduct.run({
                            name: productName,
                            sku: finalBaseSku,
                            category: categoryName,
                            category_id: categoryId,
                            cost_price: costPrice,
                            selling_price: sellingPrice,
                            stock_quantity: 0,
                            reorder_level: reorderLevel,
                            description: findCol(firstRow, 'description', 'desc', 'product description'),
                            image_path: imagePath,
                            trip_name: tripName || null
                        });

                        const productId = productInfo.lastInsertRowid;
                        let totalProductStock = 0;

                        for (const row of groupRows) {
                            // Quantity Extraction, handling formats like '4pcs'
                            let totalRowStock = 0;
                            const rawQty = findCol(row, 'stock', 'stock quantity', 'quantity', 'qty');
                            if (rawQty !== null) {
                                const qtyStr = rawQty.toString().toLowerCase();
                                const match = qtyStr.match(/\d+/); // extracts numbers even from '10pcs'
                                if (match) {
                                    totalRowStock = parseInt(match[0], 10);
                                }
                            }

                            // Range extraction
                            const sizeRaw = (findCol(row, 'size range', 'sizes', 'size', 'item size') || '').toString().trim();
                            const color = (findCol(row, 'color', 'item color') || '').toString().trim();

                            let sizes: string[] = [];
                            if (sizeRaw) {
                                if (sizeRaw.includes('-')) {
                                    // Parse Range (e.g., 38-44)
                                    const parts = sizeRaw.split('-');
                                    if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                                        const start = parseInt(parts[0]);
                                        const end = parseInt(parts[1]);
                                        for (let s = start; s <= end; s += 2) {
                                            sizes.push(s.toString());
                                        }
                                    } else {
                                        sizes = [sizeRaw]; // Fallback if dash used non-numerically
                                    }
                                } else if (sizeRaw.includes(',')) {
                                    // Parse CSV (e.g., S, M, L)
                                    sizes = sizeRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                                } else {
                                    sizes = [sizeRaw];
                                }
                            }

                            // Smart Fallback Generation if no sizes provided
                            if (sizes.length === 0) {
                                if (totalRowStock > 0) {
                                    for (let i = 1; i <= totalRowStock; i++) {
                                        sizes.push(`Undefined ${i}`);
                                    }
                                } else {
                                    sizes = ['Default'];
                                }
                            }

                            // Distribute stock among sizes
                            const baseVariantStock = Math.floor(Math.max(totalRowStock, 0) / sizes.length);
                            const remainder = Math.max(totalRowStock, 0) % sizes.length;

                            sizes.forEach((size: string, index: number) => {
                                const cleanSize = size.trim();
                                if (!cleanSize) return;

                                const variantName = color ? `${cleanSize} - ${color}` : cleanSize;
                                const suffix = cleanSize.substring(0, 3).toUpperCase().replace(/\s+/g, '');
                                const variantSku = `${finalBaseSku}-${suffix}-${index}`; // Added index to ensure uniqueness

                                let variantStock = baseVariantStock;
                                if (index === 0) variantStock += remainder; // Add remainder to first size

                                insertVariant.run({
                                    product_id: productId,
                                    sku: variantSku,
                                    variation_name: variantName,
                                    cost_price: parseFloat(findCol(row, 'cost price', 'cost_price', 'cost') || costPrice),
                                    selling_price: parseFloat(findCol(row, 'selling price', 'selling_price', 'price') || sellingPrice),
                                    stock_quantity: variantStock,
                                    reorder_level: reorderLevel
                                });
                                totalProductStock += variantStock;
                            });
                        }

                        db!.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(totalProductStock, productId);
                        imported++;
                    } catch (err: any) {
                        failed++;
                        errors.push(`Product "${productName}": ${err.message}`);
                    }
                }
            });

            transaction();
            return { success: true, summary: { total: rows.length, imported, skipped, failed, errors } };
        } catch (error: any) {
            console.error('Failed to import products:', error);
            return { success: false, error: error.message };
        }
    });

}
