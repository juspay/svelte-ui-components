import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// These are consumer-side uses of the released 4.x API, rather than checks
// that merely repeat the new implementation's own declarations.
const legacyConsumer = `
import type { MediaType, MediaPlayerProperties } from './MediaPlayer/properties';
import type { PillRootTag, PillProperties } from './Pill/properties';
import type { FileInputProperties, FileInputSnippetProps } from './FileInput/properties';
import type { ImgEventProperties } from './Img/properties';
import type { Snippet } from 'svelte';
const mediaNames: Record<MediaType, string> = { image: 'Image', video: 'Video' };
const mediaPropNames: Record<MediaPlayerProperties['type'], string> = mediaNames;
const pillNames: Record<PillRootTag, string> = { div: 'Container', button: 'Action' };
const pillPropNames: Record<NonNullable<PillProperties['as']>, string> = pillNames;
function renderUpload(props: FileInputProperties) {
  const trigger: Snippet<[FileInputSnippetProps]> = props.trigger;
  return trigger;
}
function reportImageError(props: ImgEventProperties) { props.onerror?.(); }
void [mediaPropNames, pillPropNames, renderUpload, reportImageError];
`;

const nativeConsumer = `
import type { MediaPlayerProperties } from './MediaPlayer/properties';
import type { PillProperties } from './Pill/properties';
import type { FileInputProperties } from './FileInput/properties';
import type { NativeFileInputProperties } from './NativeFileInput/properties';
import type { ImgEventProperties } from './Img/properties';
declare const trigger: FileInputProperties['trigger'];
const audio: MediaPlayerProperties = { type: 'video', audioOnly: true, src: '/voice.mp3' };
const inlinePill: PillProperties = { text: 'Ready', inline: true };
const picker: NativeFileInputProperties = { name: 'photo' };
const legacyPicker: FileInputProperties = { trigger };
const callbacks: ImgEventProperties = { onerror: () => {}, onimageerror: (event: Event) => { void event.target; } };
void [audio, inlinePill, picker, legacyPicker, callbacks];
`;

function diagnostics(source: string): string[] {
  const filename = resolve('src/lib/__4x_consumer__.ts');
  const options: ts.CompilerOptions = {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: []
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, languageVersion, ...rest) =>
    file === filename
      ? ts.createSourceFile(file, source, languageVersion, true)
      : getSourceFile(file, languageVersion, ...rest);
  return ts
    .getPreEmitDiagnostics(ts.createProgram([filename], options, host))
    .map((error) => ts.flattenDiagnosticMessageText(error.messageText, '\n'));
}

describe('released 4.x consumer source compatibility', () => {
  it('accepts opt-in audio, inline pills, native pickers and native image errors', () => {
    expect(diagnostics(nativeConsumer)).toEqual([]);
  });
  it('keeps exhaustive public types, required trigger access and zero-argument error callbacks', () => {
    expect(diagnostics(legacyConsumer)).toEqual([]);
  });
});
