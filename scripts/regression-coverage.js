const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const catalog = require('../tests/integration-regressions/cases.json');
assert.equal(new Set(catalog.cases.map(entry => entry.id)).size, catalog.cases.length, 'Case IDs must be unique');
const lines = ['# Integration regression coverage', '', catalog.policy, ''];
for (const entry of catalog.cases) {
  for (const field of ['id', 'environment', 'given', 'when', 'then', 'remaining']) {
    assert.ok(typeof entry[field] === 'string' && entry[field].trim(), `${entry.id}: missing ${field}`);
  }
  lines.push(`## ${entry.id}`, '', `**Environment:** ${entry.environment}`, '', `**Given:** ${entry.given}`, '', `**When:** ${entry.when}`, '', `**Then:** ${entry.then}`, '');
  for (const test of entry.automated) {
    assert.ok(test.scope, `${entry.id}: missing scope`);
    assert.ok(fs.readFileSync(path.join(root, test.file), 'utf8').includes(test.match), `${entry.id}: stale reference ${test.match}`);
    lines.push(`- [${test.file}](../${test.file.replace(/^tests\//, '')}) — ${test.scope}`, '');
  }
  lines.push(`**Remaining:** ${entry.remaining}`, '');
}
console.log(`${catalog.cases.length} behavior specifications; ${catalog.cases.filter(entry => entry.automated.length).length} have partial automated coverage. Reference validation does not establish test outcomes.`);
if (process.argv.includes('--write')) fs.writeFileSync(path.join(root, 'tests/integration-regressions/COVERAGE.md'), lines.join('\n'));
