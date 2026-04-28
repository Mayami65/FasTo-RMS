const ExcelJS = require('exceljs');
const fs = require('fs');

async function readExcelAllColumns(filePath) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.getWorksheet(1);

        let allRows = [];
        worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
            if (rowNumber <= 5) {
                const values = row.values.slice(1).map(v => {
                    if (v === null || v === undefined) return '';
                    if (typeof v === 'object') {
                        if ('result' in v) return v.result;
                        if ('text' in v) return v.text;
                        if ('richText' in v) return v.richText.map(t => t.text).join('');
                    }
                    return v.toString();
                });
                allRows.push(values);
            }
        });
        console.log("Full Headers:", allRows[0]);
        console.log("Row 1:", allRows[1]);
        console.log("Row 2:", allRows[2]);
    } catch (e) {
        console.error(e.message);
    }
}

readExcelAllColumns('c:/Users/mayam/Desktop/fasto-rms/March-5-26.xlsx');
