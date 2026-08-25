import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEFAULT_SKILLS = [
  'website-build-workflow',
  'website-visual-polish',
  'website-release-qa'
];

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error('SKILL.md has no valid YAML frontmatter');
  const name = match[1].match(/^name:\s*['"]?([^'"\r\n]+)['"]?\s*$/m)?.[1]?.trim();
  const description = match[1].match(/^description:\s*['"]?([\s\S]*?)['"]?\s*$/m)?.[1]?.trim();
  return { name, description };
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function validateSkill(skillName) {
  const directory = path.join(ROOT, skillName);
  const skillFile = path.join(directory, 'SKILL.md');
  if (!(await exists(skillFile))) throw new Error(`${skillName}: SKILL.md not found`);

  const markdown = await readFile(skillFile, 'utf8');
  const meta = frontmatter(markdown);
  if (meta.name !== skillName) throw new Error(`${skillName}: frontmatter name mismatch`);
  if (!meta.description || meta.description.length < 120) {
    throw new Error(`${skillName}: description is too short for reliable triggering`);
  }
  if (/\b(?:TBD|TODO|PLACEHOLDER)\b/i.test(markdown)) {
    throw new Error(`${skillName}: unresolved placeholder in SKILL.md`);
  }

  const references = [...markdown.matchAll(/references\/([a-z0-9-]+\.md)/g)].map((match) => match[1]);
  if (references.length === 0) throw new Error(`${skillName}: no progressive-disclosure references`);
  for (const reference of new Set(references)) {
    if (!(await exists(path.join(directory, 'references', reference)))) {
      throw new Error(`${skillName}: missing reference ${reference}`);
    }
  }

  const evalFile = path.join(directory, 'evals', 'evals.json');
  const evals = JSON.parse(await readFile(evalFile, 'utf8'));
  if (evals.skill_name !== skillName) throw new Error(`${skillName}: eval skill_name mismatch`);
  if (!Array.isArray(evals.evals) || evals.evals.length < 3) {
    throw new Error(`${skillName}: at least three evals are required`);
  }
  for (const item of evals.evals) {
    if (!Number.isInteger(item.id) || !item.prompt || !item.expected_output) {
      throw new Error(`${skillName}: malformed eval ${item.id ?? 'unknown'}`);
    }
    if (!Array.isArray(item.expectations) || item.expectations.length < 3) {
      throw new Error(`${skillName}: eval ${item.id} needs at least three expectations`);
    }
  }

  const ui = await readFile(path.join(directory, 'agents', 'openai.yaml'), 'utf8');
  for (const field of ['display_name:', 'short_description:', 'default_prompt:', 'allow_implicit_invocation: true']) {
    if (!ui.includes(field)) throw new Error(`${skillName}: openai.yaml missing ${field}`);
  }
}

const requested = process.argv.slice(2);
const skills = requested.length > 0 ? requested : DEFAULT_SKILLS;
const errors = [];
for (const skill of skills) {
  try {
    await validateSkill(skill);
  } catch (error) {
    errors.push(error.message);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${skills.length} skill(s).`);
