import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_FILE = path.resolve('src/data/titleCatalog.generated.ts');
const LOCAL_SOURCE_DIR = path.resolve('title-sources.local');

const REMOTE_SOURCES = [
  {
    id: 'conzzah-txt',
    label: 'ConzZah Xbox 360 Title IDs',
    type: 'txt',
    priority: 20,
    url: 'https://gist.githubusercontent.com/ConzZah/5482b9e748f5de5ec49114cacc6c28f1/raw/Xbox360TitleIDs.txt',
  },
  {
    id: 'ironringx-csv',
    label: 'IronRingX Xbox 360 Game List',
    type: 'csv',
    priority: 10,
    url: 'https://raw.githubusercontent.com/IronRingX/xbox360-gamelist/main/xbox360_gamelist.csv',
  },
];

function normalizeTitleName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}

function isValidTitleId(id) {
  return /^[0-9A-F]{8}$/.test(id);
}

function normalizeTitleId(id) {
  const normalized = String(id || '').trim().toUpperCase();
  return isValidTitleId(normalized) ? normalized : null;
}

function createEntry(input = {}) {
  const id = normalizeTitleId(input.id || input.titleId || input.TitleID || input.titleID);
  const name = normalizeTitleName(input.name || input.title || input.Title || input.gameName || input['Game Name']);
  if (!id || !name) {
    return null;
  }

  const aliases = Array.isArray(input.aliases)
    ? input.aliases.map(normalizeTitleName).filter(Boolean)
    : [];
  const franchise = normalizeTitleName(input.franchise || input.category || '');
  const releaseYear = Number.isFinite(Number(input.releaseYear)) ? Number(input.releaseYear) : undefined;

  return {
    id,
    name,
    aliases,
    ...(franchise ? { franchise } : {}),
    ...(releaseYear ? { releaseYear } : {}),
  };
}

function parseTxt(text) {
  const entries = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, '').trim();
    if (!line || line.startsWith('##')) {
      continue;
    }

    const delimiterIndex = line.includes('~') ? line.indexOf('~') : line.indexOf(',');
    if (delimiterIndex === -1) {
      continue;
    }

    const entry = createEntry({
      id: line.slice(0, delimiterIndex),
      name: line.slice(delimiterIndex + 1),
    });

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((value) => value.trim());

  return dataRows
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index]?.trim() || '';
      });
      return createEntry({
        id: record['Title ID'] || record.id || record.titleId,
        name: record['Game Name'] || record.name || record.title,
      });
    })
    .filter(Boolean);
}

function parseJson(text) {
  const payload = JSON.parse(text);
  const entries = [];

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const entry = createEntry(item);
      if (entry) {
        entries.push(entry);
      }
    }
    return entries;
  }

  for (const [id, value] of Object.entries(payload || {})) {
    const entry = typeof value === 'string'
      ? createEntry({ id, name: value })
      : createEntry({ id, ...(value || {}) });
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

function getPreferredName(candidates) {
  return [...candidates].sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority;
    }

    const leftWords = left.name.split(' ').length;
    const rightWords = right.name.split(' ').length;
    if (leftWords !== rightWords) {
      return rightWords - leftWords;
    }

    return left.name.localeCompare(right.name);
  })[0];
}

async function loadSource(source) {
  const text = source.kind === 'local'
    ? await fs.readFile(source.filePath, 'utf8')
    : await fetch(source.url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to download ${source.label}: ${response.status} ${response.statusText}`);
      }
      return response.text();
    });

  if (source.type === 'csv') {
    return parseCsv(text);
  }

  if (source.type === 'json') {
    return parseJson(text);
  }

  return parseTxt(text);
}

async function loadLocalSources() {
  try {
    const stat = await fs.stat(LOCAL_SOURCE_DIR);
    if (!stat.isDirectory()) {
      return [];
    }
  } catch {
    return [];
  }

  const files = await fs.readdir(LOCAL_SOURCE_DIR, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const extension = path.extname(entry.name).toLowerCase();
      const type = extension === '.csv' ? 'csv' : extension === '.json' ? 'json' : 'txt';
      return {
        id: `local:${entry.name}`,
        label: `Local Source ${entry.name}`,
        kind: 'local',
        priority: 0,
        type,
        filePath: path.join(LOCAL_SOURCE_DIR, entry.name),
      };
    });
}

function buildFile(entries, sources) {
  return `// This file is generated by scripts/update-title-db.mjs.\n// Sources:\n${sources.map((source) => `// - ${source.label}: ${source.kind === 'local' ? source.filePath : source.url}`).join('\n')}\n// Do not edit manually.\n\nexport interface RawTitleCatalogEntry {\n  id: string;\n  name: string;\n  aliases?: string[];\n  franchise?: string;\n  releaseYear?: number;\n  sources: string[];\n}\n\nexport const XBOX_360_TITLE_DB_RAW: RawTitleCatalogEntry[] = ${JSON.stringify(entries, null, 2)};\n`;
}

const sources = [...REMOTE_SOURCES, ...(await loadLocalSources())];
const merged = new Map();

for (const source of sources) {
  const entries = await loadSource(source);

  for (const entry of entries) {
    if (!merged.has(entry.id)) {
      merged.set(entry.id, {
        id: entry.id,
        candidates: [],
        aliasSet: new Set(),
        sourceSet: new Set(),
        franchise: undefined,
        releaseYear: undefined,
      });
    }

    const record = merged.get(entry.id);
    record.candidates.push({
      name: entry.name,
      priority: source.priority,
    });
    record.sourceSet.add(source.id);

    for (const alias of entry.aliases || []) {
      if (alias && alias !== entry.name) {
        record.aliasSet.add(alias);
      }
    }

    if (!record.franchise && entry.franchise) {
      record.franchise = entry.franchise;
    }

    if (!record.releaseYear && entry.releaseYear) {
      record.releaseYear = entry.releaseYear;
    }
  }
}

const outputEntries = [...merged.values()]
  .map((record) => {
    const preferred = getPreferredName(record.candidates);
    const aliases = [...record.aliasSet];

    for (const candidate of record.candidates) {
      if (candidate.name !== preferred.name && !aliases.includes(candidate.name)) {
        aliases.push(candidate.name);
      }
    }

    return {
      id: record.id,
      name: preferred.name,
      ...(aliases.length > 0 ? { aliases: aliases.sort((left, right) => left.localeCompare(right)) } : {}),
      ...(record.franchise ? { franchise: record.franchise } : {}),
      ...(record.releaseYear ? { releaseYear: record.releaseYear } : {}),
      sources: [...record.sourceSet].sort((left, right) => left.localeCompare(right)),
    };
  })
  .sort((left, right) => left.id.localeCompare(right.id));

await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
await fs.writeFile(OUTPUT_FILE, buildFile(outputEntries, sources), 'utf8');

console.log(`Generated ${outputEntries.length} title records at ${OUTPUT_FILE}`);
