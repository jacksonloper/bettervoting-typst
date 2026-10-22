// Browser-side Typst compilation of the repo's ballot.typ (typst.ts / wasm).
import { createTypstCompiler, initOptions, loadFonts, type TypstCompiler } from '@myriaddreamin/typst.ts';
import { CompileFormatEnum } from '@myriaddreamin/typst.ts/compiler';
import compilerWasm from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';

import ballotSource from '../../ballot.typ?raw';
import logoUrl from '../../images/STAR_Voting_Logo-color.jpg?url';
import archivoUrl from '../../fonts/ArchivoBlack-Regular.ttf?url';
import dejavuUrl from '../../fonts/DejaVuSans.ttf?url';
import dejavuBoldUrl from '../../fonts/DejaVuSans-Bold.ttf?url';

const fetchBytes = async (url: string) => new Uint8Array(await (await fetch(url)).arrayBuffer());

export type ExtraFonts = Uint8Array[];

let current: { compiler: TypstCompiler; key: string } | null = null;
let pending: Promise<TypstCompiler> | null = null;
let assets: Promise<{ logo: Uint8Array; fonts: Uint8Array[] }> | null = null;

const loadAssets = () =>
  (assets ??= Promise.all([logoUrl, archivoUrl, dejavuUrl, dejavuBoldUrl].map(fetchBytes)).then(
    ([logo, ...fonts]) => ({ logo, fonts }),
  ));

// Fonts are fixed when a compiler is built, so a new set of extra fonts
// (e.g. the user's own Verdana) means a new compiler.
async function getCompiler(extra: ExtraFonts, key: string): Promise<TypstCompiler> {
  if (current?.key === key) return current.compiler;
  if (pending) await pending.catch(() => undefined);
  if (current?.key === key) return current.compiler;
  pending = (async () => {
    const { logo, fonts } = await loadAssets();
    const compiler = createTypstCompiler();
    await compiler.init({
      getModule: () => compilerWasm,
      beforeBuild: [initOptions.disableDefaultFontAssets(), loadFonts([...extra, ...fonts])],
    });
    compiler.addSource('/ballot.typ', ballotSource);
    compiler.mapShadow('/images/STAR_Voting_Logo-color.jpg', logo);
    current = { compiler, key };
    return compiler;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

export interface CompileResult {
  pdf?: Uint8Array;
  errors: string[];
}

const MAIN = '#import "/ballot.typ": election\n#election(..json("/election.json"))\n';

let queue: Promise<unknown> = Promise.resolve();

export function compileElection(election: unknown, extra: ExtraFonts, fontKey: string): Promise<CompileResult> {
  // typst.ts compilers are not re-entrant: serialise compiles.
  const run = queue.then(async (): Promise<CompileResult> => {
    const compiler = await getCompiler(extra, fontKey);
    compiler.addSource('/main.typ', MAIN);
    compiler.mapShadow('/election.json', new TextEncoder().encode(JSON.stringify(election)));
    const out = await compiler.compile({ mainFilePath: '/main.typ', format: CompileFormatEnum.pdf, diagnostics: 'full' });
    const diags = (out.diagnostics ?? []) as { severity?: string; message: string; path?: string; range?: string }[];
    const errors = diags
      .filter((d) => (d.severity ?? 'error').toLowerCase() === 'error')
      .map((d) => d.message.replace(/^assertion failed: /, ''));
    return { pdf: out.result ?? undefined, errors };
  });
  queue = run.catch(() => undefined);
  return run;
}

export { ballotSource };
