const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

async function build() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: 'dist/extension.js',
    external: ['vscode'],
    sourcemap: true,
    minify: !isWatch,
  });

  if (isWatch) {
    await ctx.watch();
    console.log('Watching extension...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('Extension built successfully.');
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
