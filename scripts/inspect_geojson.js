import fs from 'fs';
import path from 'path';

const geojsonPath = 'src/data/zoonificacion_pgoedf_2000_sin_anp.geojson';
const fullPath = path.resolve(process.cwd(), geojsonPath);

console.log(`Reading GeoJSON from: ${fullPath}`);

try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);

    console.log("GeoJSON Parsed successfully.");
    console.log(`Total features: ${data.features.length}`);

    if (data.features.length > 0) {
        const first = data.features[0];
        console.log("\n--- First Feature Properties ---");
        console.log(JSON.stringify(first.properties, null, 2));

        console.log("\n--- Checking for CLAVE usage ---");
        // Check uniqueness of CLAVE
        const claves = new Set();
        let missingClave = 0;

        data.features.forEach(f => {
            if (f.properties && f.properties.CLAVE) {
                claves.add(f.properties.CLAVE);
            } else {
                missingClave++;
            }
        });

        console.log(`Unique CLAVE values found: ${Array.from(claves).join(', ')}`);
        if (missingClave > 0) {
            console.log(`[WARNING] ${missingClave} features are missing the CLAVE property.`);
        } else {
            console.log("[OK] All features have CLAVE property.");
        }

    } else {
        console.log("GeoJSON has no features.");
    }

} catch (err) {
    console.error("Error reading file:", err.message);
}
