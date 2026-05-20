#! /usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { run as runIngest } from './ingest.js';
import { startServer } from './server.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--ingest')) {
        await runIngest();
        process.exit(0);
    }
    else if (args.includes('--version')) {
        try {
            const metaPath = path.resolve(__dirname, '../data/meta.json');
            const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
            console.log(`Ingested commit: ${meta.sha}`);
            console.log(`Ingested date: ${meta.date}`);
        }
        catch (e) {
            console.log('No ingest metadata found. Run with --ingest first.');
        }
        process.exit(0);
    }
    else {
        await startServer();
    }
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
