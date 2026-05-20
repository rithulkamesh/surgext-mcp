import fs from 'fs/promises';
import path from 'path';

export interface Chunk {
  id: string;
  source_file: string;
  heading_path: string;
  content: string;
  url: string;
}

const REPO = 'surge-synthesizer/surge';
const BRANCH = 'main';

async function fetchTree() {
  const url = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'surgext-mcp' } });
  if (!res.ok) throw new Error(`Failed to fetch tree: ${res.statusText}`);
  const data = await res.json();
  return data.tree;
}

async function fetchCommitSha() {
  const url = `https://api.github.com/repos/${REPO}/branches/${BRANCH}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'surgext-mcp' } });
  if (!res.ok) throw new Error(`Failed to fetch branch info: ${res.statusText}`);
  const data = await res.json();
  return data.commit.sha;
}

function chunkMarkdown(markdown: string, filePath: string): Chunk[] {
  const lines = markdown.split('\n');
  const chunks: Chunk[] = [];
  let currentHeadings: { level: number; text: string }[] = [];
  let currentContent: string[] = [];
  
  function saveCurrentChunk() {
    if (currentContent.join('\n').trim()) {
      const heading_path = currentHeadings.map(h => h.text).join(' > ') || 'Document Root';
      chunks.push({
        id: `${filePath}-${chunks.length}`,
        source_file: filePath,
        heading_path,
        content: currentContent.join('\n').trim(),
        url: `https://github.com/${REPO}/blob/${BRANCH}/${filePath}`
      });
    }
  }

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (match) {
      saveCurrentChunk();
      const level = match[1].length;
      const text = match[2].trim();
      currentHeadings = currentHeadings.filter(h => h.level < level);
      currentHeadings.push({ level, text });
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }
  saveCurrentChunk();
  return chunks;
}

export async function run() {
  console.log('Fetching repo tree...');
  const tree = await fetchTree();
  const sha = await fetchCommitSha();
  
  const filesToProcess = tree.filter((item: any) => 
    item.type === 'blob' && 
    (item.path.startsWith('docs/') || (!item.path.includes('/') && item.path.endsWith('.md')))
  );

  console.log(`Found ${filesToProcess.length} files to process.`);
  
  const allChunks: Chunk[] = [];

  for (const file of filesToProcess) {
    console.log(`Fetching ${file.path}...`);
    const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${file.path}`;
    const res = await fetch(rawUrl);
    if (!res.ok) {
      console.error(`Failed to fetch ${file.path}`);
      continue;
    }
    const content = await res.text();
    const chunks = chunkMarkdown(content, file.path);
    allChunks.push(...chunks);
  }

  await fs.mkdir('data', { recursive: true });
  await fs.writeFile('data/chunks.json', JSON.stringify(allChunks, null, 2));
  await fs.writeFile('data/meta.json', JSON.stringify({ sha, date: new Date().toISOString() }));
  console.log(`Saved ${allChunks.length} chunks to data/chunks.json`);
  console.log(`Ingested commit SHA: ${sha}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(console.error);
}