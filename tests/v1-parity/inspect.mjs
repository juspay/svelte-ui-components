// Prints the first differing event and the pixel-difference box for the given case ids (or prefixes).
import { readFileSync } from 'node:fs';
const { results } = JSON.parse(
  readFileSync(new URL('./.report/summary.json', import.meta.url), 'utf8')
);
const wanted = process.argv.slice(2);
const firstDifference = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && JSON.stringify(a[i]) === JSON.stringify(b[i])) {
    i++;
  }
  return i;
};
for (const result of results) {
  if (result.pass || result.control) {
    continue;
  }
  if (wanted.length && !wanted.some((w) => result.id === w || result.id.startsWith(w))) {
    continue;
  }
  const i = firstDifference(result.eventsBefore, result.eventsAfter);
  console.log(
    `## ${result.id} | ${result.problems.join('; ')} | box ${JSON.stringify(result.differentBox)}`
  );
  if (JSON.stringify(result.eventsBefore) !== JSON.stringify(result.eventsAfter)) {
    console.log(
      `   events ${result.eventsBefore.length} vs ${result.eventsAfter.length}, first difference at ${i}`
    );
    console.log(
      '   before:',
      JSON.stringify(result.eventsBefore.slice(Math.max(0, i - 1), i + 3)).slice(0, 330)
    );
    console.log(
      '   after :',
      JSON.stringify(result.eventsAfter.slice(Math.max(0, i - 1), i + 3)).slice(0, 330)
    );
  }
  if (JSON.stringify(result.errorsBefore) !== JSON.stringify(result.errorsAfter)) {
    console.log(
      '   errors:',
      JSON.stringify(result.errorsBefore).slice(0, 150),
      '/',
      JSON.stringify(result.errorsAfter).slice(0, 200)
    );
  }
}
