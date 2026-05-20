import MiniSearch from 'minisearch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Chunk } from './ingest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let searchIndex: MiniSearch<Chunk>;
let chunks: Chunk[] = [];

export async function initSearch() {
  if (searchIndex) return;
  const chunksPath = path.resolve(__dirname, '../data/chunks.json');
  try {
    const data = await fs.readFile(chunksPath, 'utf8');
    chunks = JSON.parse(data);
    searchIndex = new MiniSearch<Chunk>({
      fields: ['heading_path', 'content'],
      storeFields: ['id', 'source_file', 'heading_path', 'content', 'url']
    });
    searchIndex.addAll(chunks);
  } catch (error) {
    console.error('Failed to load chunks.json. Did you run the ingest script?', error);
    throw error;
  }
}

export async function searchDocs(query: string, topK: number = 5): Promise<Chunk[]> {
  await initSearch();
  const results = searchIndex.search(query);
  return results.slice(0, topK).map(r => chunks.find(c => c.id === r.id)!);
}

export async function getSection(headingPath: string): Promise<Chunk[]> {
  await initSearch();
  const lowerPath = headingPath.toLowerCase();
  return chunks.filter(c => c.heading_path.toLowerCase().includes(lowerPath));
}

export async function listSections(): Promise<string[]> {
  await initSearch();
  const sections = new Set<string>();
  for (const c of chunks) {
    const parts = c.heading_path.split(' > ');
    if (parts.length > 0) sections.add(parts[0]);
    if (parts.length > 1) sections.add(`${parts[0]} > ${parts[1]}`);
  }
  return Array.from(sections).sort();
}

export async function searchParameters(parameterName: string): Promise<Chunk[]> {
  await initSearch();
  const results = searchIndex.search(parameterName, { fields: ['content', 'heading_path'], combineWith: 'AND' });
  return results.slice(0, 5).map(r => chunks.find(c => c.id === r.id)!);
}