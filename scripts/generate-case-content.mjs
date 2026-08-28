import { readFile } from 'node:fs/promises';
import path from 'node:path';

const REQUIRED_TEXT_FIELDS = [
  'seedId',
  'slug',
  'title',
  'excerpt',
  'objectType',
  'product',
  'context',
  'task',
  'conclusion',
  'fallbackImage'
];

function assertText(record, field) {
  if (typeof record[field] !== 'string' || record[field].trim() === '') {
    throw new Error(`Case ${record.slug ?? record.seedId ?? '(unknown)'} requires ${field}`);
  }
}

function assertRepeater(record, field, limit, requiredFields) {
  const rows = record[field];
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > limit) {
    throw new Error(`Case ${record.slug} requires 1-${limit} ${field}`);
  }
  for (const [index, row] of rows.entries()) {
    for (const requiredField of requiredFields) {
      if (typeof row?.[requiredField] !== 'string' || row[requiredField].trim() === '') {
        throw new Error(`Case ${record.slug} ${field}[${index}] requires ${requiredField}`);
      }
    }
  }
}

export async function loadCases(projectRoot) {
  const file = path.join(projectRoot, 'content', 'cases.json');
  return JSON.parse(await readFile(file, 'utf8'));
}

export function validateCases(cases) {
  if (!Array.isArray(cases) || cases.length !== 7) {
    throw new Error('Case content must contain exactly seven initial records');
  }

  const seedIds = new Set();
  const slugs = new Set();
  const orders = new Set();
  const featuredRanks = [];

  for (const record of cases) {
    for (const field of REQUIRED_TEXT_FIELDS) assertText(record, field);
    if (!/^case-[1-7]$/.test(record.seedId)) throw new Error(`Invalid seedId: ${record.seedId}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error(`Invalid slug: ${record.slug}`);
    if (!/^assets\/images\/[a-z0-9-]+\.webp$/.test(record.fallbackImage)) {
      throw new Error(`Invalid fallback image: ${record.fallbackImage}`);
    }
    if (!Number.isInteger(record.menuOrder) || record.menuOrder < 10 || record.menuOrder % 10 !== 0) {
      throw new Error(`Invalid menuOrder for ${record.slug}`);
    }
    if (!Number.isInteger(record.featuredRank) || record.featuredRank < 0 || record.featuredRank > 3) {
      throw new Error(`Invalid featuredRank for ${record.slug}`);
    }

    assertRepeater(record, 'steps', 8, ['title', 'body']);
    assertRepeater(record, 'metrics', 6, ['value', 'label']);

    if (seedIds.has(record.seedId)) throw new Error(`Duplicate seedId: ${record.seedId}`);
    if (slugs.has(record.slug)) throw new Error(`Duplicate slug: ${record.slug}`);
    if (orders.has(record.menuOrder)) throw new Error(`Duplicate menuOrder: ${record.menuOrder}`);
    seedIds.add(record.seedId);
    slugs.add(record.slug);
    orders.add(record.menuOrder);
    if (record.featuredRank > 0) featuredRanks.push(record.featuredRank);
  }

  if (featuredRanks.join(',') !== '1,2,3') {
    throw new Error('Featured case ranks must be unique and ordered 1,2,3');
  }

  return cases;
}

