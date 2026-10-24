import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

/** Exercise the real package exports and inferred component props after declaration emit. */
export function check4xConsumer(directory = resolve('dist')) {
  if (!existsSync(resolve(directory, 'index.d.ts'))) {
    throw new Error('4.x consumer verification requires the built package declarations.');
  }
  const filename = resolve('__packaged_4x_consumer__.ts');
  const packagePath = JSON.stringify(resolve(directory, 'index.js'));
  const source = `
import { MediaPlayer, Pill, FileInput, Img } from ${packagePath};
import type { FileInputSnippetProps } from ${packagePath};
import type { ComponentProps, Snippet } from 'svelte';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const exactMedia: Equal<ComponentProps<typeof MediaPlayer>['type'], 'image' | 'video'> = true;
const exactPill: Equal<NonNullable<ComponentProps<typeof Pill>['as']>, 'div' | 'button'> = true;
const exactTrigger: Equal<ComponentProps<typeof FileInput>['trigger'], Snippet<[FileInputSnippetProps]>> = true;
const exactError: Equal<NonNullable<ComponentProps<typeof Img>['onerror']>, () => void> = true;
const media: Record<ComponentProps<typeof MediaPlayer>['type'], string> = { image: 'Image', video: 'Video' };
const pills: Record<NonNullable<ComponentProps<typeof Pill>['as']>, string> = { div: 'Container', button: 'Action' };
function trigger(props: ComponentProps<typeof FileInput>) {
  const slot: Snippet<[FileInputSnippetProps]> = props.trigger;
  return slot;
}
function error(props: ComponentProps<typeof Img>) { props.onerror?.(); }
void [exactMedia, exactPill, exactTrigger, exactError, media, pills, trigger, error];
`;
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
    paths: {
      svelte: [resolve('node_modules/svelte/types/index.d.ts')],
      'svelte/elements': [resolve('node_modules/svelte/elements.d.ts')]
    }
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, version, ...rest) =>
    file === filename
      ? ts.createSourceFile(file, source, version, true)
      : getSourceFile(file, version, ...rest);
  return ts
    .getPreEmitDiagnostics(ts.createProgram([filename], options, host))
    .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = check4xConsumer();
  if (errors.length > 0) {
    console.error('Packaged 4.x consumer compatibility failed:\n' + errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Packaged 4.x consumer compatibility passed (exports and ComponentProps).');
  }
}
