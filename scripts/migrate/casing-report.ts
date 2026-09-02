import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deriveEventName } from './casing.ts';
import { readSignature } from './signatures.ts';

// Prints the derived rename map for every grandfathered violation, so the
// eventual 4.0.0 change can be reviewed as data before any code moves.
const baseline: readonly string[] = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/event-casing-baseline.json'), 'utf8')
);

let unresolved = 0;
for (const entry of baseline) {
  const [file, prop] = entry.split('::');
  const component = file.split('/')[2];
  const result = deriveEventName(prop, readSignature(join(process.cwd(), file), prop));
  if (result.kind === 'unresolved') {
    unresolved += 1;
    console.log(
      `${component.padEnd(18)} ${prop.padEnd(24)} UNRESOLVED ${result.candidates.join(' | ')}`
    );
    continue;
  }
  console.log(
    `${component.padEnd(18)} ${prop.padEnd(24)} -> ${result.target.padEnd(26)} (${result.kind})`
  );
}
console.log(`\n${baseline.length} violations, ${unresolved} unresolved`);
