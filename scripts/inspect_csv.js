import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

const csvPath = 'src/data/tabla_actividades_pgoedf.csv';
const fullPath = path.resolve(process.cwd(), csvPath);

console.log(`Reading CSV from: ${fullPath}`);

try {
    const csvFile = fs.readFileSync(fullPath, 'utf8');

    Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            console.log("CSV Parsed successfully.");
            console.log(`Total rows: ${results.data.length}`);

            if (results.data.length > 0) {
                const headers = Object.keys(results.data[0]);
                console.log("\n--- Headers ---");
                console.log(headers);

                console.log("\n--- First 3 Rows ---");
                results.data.slice(0, 3).forEach((row, i) => {
                    console.log(`Row ${i}:`, row);
                });

                console.log("\n--- Checking for zoning keys ---");
                const zoningKeys = ['FC', 'FCE', 'FP', 'FPE', 'AE', 'AEE', 'AF', 'AFE', 'PDU', 'PDU_PP', 'PDU_PR', 'PDU_ZU'];

                zoningKeys.forEach(key => {
                    if (headers.includes(key)) {
                        console.log(`[OK] Column '${key}' found.`);

                        // Check if any row has data for this key
                        const hasData = results.data.some(row => row[key] && row[key].trim() !== '');
                        if (hasData) {
                            // detailed check
                            const values = results.data.map(r => r[key]).filter(v => v).slice(0, 5);
                            console.log(`   Data example: ${JSON.stringify(values)}`);
                        } else {
                            console.log(`   [WARNING] Column '${key}' exists but seems empty in all rows.`);
                        }

                    } else {
                        // Fuzzy check
                        const potential = headers.find(h => h.trim().toUpperCase() === key);
                        if (potential) {
                            console.log(`[WARNING] Column '${key}' NOT found strictly, but found '${potential}'. Whitespace/Case mismatch?`);
                        } else {
                            console.log(`[ERROR] Column '${key}' NOT found.`);
                        }
                    }
                });
            } else {
                console.log("CSV is empty.");
            }
        },
        error: (err) => {
            console.error("PapaParse error:", err);
        }
    });

} catch (err) {
    console.error("Error reading file:", err.message);
}
