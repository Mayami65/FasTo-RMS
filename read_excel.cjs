const ExcelJS = require('exceljs');
const fs = require('fs');

async function readExcel(filePath) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        let rows = [];
        worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
            if (rowNumber <= 5) {
                // handle exceljs values which might be objects or rich text
                const formattedRow = row.values.slice(1).map(v => {
                    if (v === null || v === undefined) return '';
                    if (typeof v === 'object') {
                        if ('result' in v) return v.result;
                        if ('text' in v) return v.text;
                        if ('richText' in v) return v.richText.map(t => t.text).join('');
                    }
                    return v.toString();
                });
                rows.push(formattedRow);
            }
        });
        return rows;
    } catch (e) {
        return { error: e.message };
    }
}

async function main() {
    const oldStock = await readExcel('c:/Users/mayam/Desktop/fasto-rms/product_import_template.xlsx');
    const newStock = await readExcel('c:/Users/mayam/Desktop/fasto-rms/March-5-26.xlsx');
    fs.writeFileSync('c:/Users/mayam/Desktop/fasto-rms/excel_compare.json', JSON.stringify({ oldStock, newStock }, null, 2));
}

main();
