import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://127.0.0.1:8088';
const SOURCE_STYLE_URL = `${BASE_URL}/styles/basic-preview/style.json`;
const OUTPUT_DIR = path.join(__dirname, '../public/styles');

// Standard OpenMapTiles Basic Style (Minimal subset) 
// Used if we cannot reach the local TileServer
const FALLBACK_STYLE = {
    "version": 8,
    "name": "Basic Preview (Fallback)",
    "metadata": { "maputnik:renderer": "mbgljs" },
    "sources": {
        "openmaptiles": {
            "type": "vector",
            "url": "http://127.0.0.1:8088/data/v3.json"
        }
    },
    "sprite": "http://127.0.0.1:8088/styles/basic-preview/sprite",
    "glyphs": "http://127.0.0.1:8088/fonts/{fontstack}/{range}.pbf",
    "layers": [
        { "id": "background", "type": "background", "paint": { "background-color": "#f8f4f0" } },
        { "id": "water", "type": "fill", "source": "openmaptiles", "source-layer": "water", "paint": { "fill-color": "#a0cfdf" } },
        { "id": "landuse-residential", "type": "fill", "source": "openmaptiles", "source-layer": "landuse", "filter": ["==", "class", "residential"], "paint": { "fill-color": "#e0dfdf" } },
        { "id": "road_major", "type": "line", "source": "openmaptiles", "source-layer": "transportation", "filter": ["in", "class", "primary", "secondary", "tertiary"], "paint": { "line-color": "#ffffff", "line-width": 2 } },
        { "id": "place_label", "type": "symbol", "source": "openmaptiles", "source-layer": "place", "layout": { "text-field": "{name}", "text-size": 14 }, "paint": { "text-color": "#333" } },
        // POI layers usually named 'poi' in OMT
        { "id": "poi_label", "type": "symbol", "source": "openmaptiles", "source-layer": "poi", "minzoom": 14, "layout": { "text-field": "{name}", "text-size": 12 }, "paint": { "text-color": "#666" } }
    ]
};

async function main() {
    let style;
    try {
        console.log(`Fetching base style from ${SOURCE_STYLE_URL}...`);
        const res = await fetch(SOURCE_STYLE_URL);
        if (!res.ok) throw new Error(`Failed to fetch style: ${res.statusText}`);
        style = await res.json();
        console.log('✅ Successfully fetched style from server.');
    } catch (err) {
        console.warn('⚠️ Could not fetch from TileServer. Using basic OpenMapTiles fallback template to generate files.');
        style = FALLBACK_STYLE;
    }

    // Fix absolute URLs to point to localhost:8080
    if (style.sprite && !style.sprite.startsWith('http')) {
        style.sprite = `${BASE_URL}/styles/basic-preview/sprite`;
    }
    if (style.glyphs && !style.glyphs.startsWith('http')) {
        style.glyphs = `${BASE_URL}/fonts/{fontstack}/{range}.pbf`;
    }

    // --- FIESTA STYLE (CLEAN) ---
    const fiestaStyle = JSON.parse(JSON.stringify(style));
    fiestaStyle.name = 'FULLD FIESTA';
    fiestaStyle.layers = fiestaStyle.layers.filter(layer => {
        const id = layer.id.toLowerCase();

        // Remove POIs: generic 'poi' layer or specific ones
        if (id.includes('poi') || id.includes('amenity') || id.includes('shop') || id.includes('tourism') || id.includes('leisure') || id.includes('attraction')) return false;

        // Remove Mountains/Peaks
        if (id.includes('mountain') || id.includes('peak') || id.includes('summit') || id.includes('hillshade_label') || id.includes('elevation')) return false;

        // Remove Landuse labels
        if (id.includes('landuse') && layer.type === 'symbol') return false;

        // Remove noise
        if (id.includes('housenumber')) return false;
        if (id.includes('airport_label')) return false;

        return true;
    });

    // --- MOTOR STYLE (RICH) ---
    const motorStyle = JSON.parse(JSON.stringify(style));
    motorStyle.name = 'FULLD MOTOR';
    motorStyle.layers = motorStyle.layers.filter(layer => {
        const id = layer.id.toLowerCase();

        // Remove peaks but keep other things
        if (id.includes('mountain') || id.includes('peak') || id.includes('summit') || id.includes('elevation')) return false;

        // Keep transport POIs. If it is generic "poi", we keep it. 
        // In our fallback, we have 'poi_label'.
        // We might want to remove commercial shops for motor too?
        if (id.includes('shop_label')) return false;

        return true;
    });

    // Write Files
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'fulldfiesta.json'), JSON.stringify(fiestaStyle, null, 2));
    console.log('Created public/styles/fulldfiesta.json (Active)');

    fs.writeFileSync(path.join(OUTPUT_DIR, 'fulldmotor.json'), JSON.stringify(motorStyle, null, 2));
    console.log('Created public/styles/fulldmotor.json (Active)');
}

main();
