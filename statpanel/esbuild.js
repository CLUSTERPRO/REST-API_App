import esbuild from 'esbuild';
import fse from 'fs-extra';

const srcdir = './src';
const destdir = './dist';

// create directory and copy files
try {
    fse.rmSync(destdir, { recursive: true, force: true });
    fse.mkdirsSync(`${destdir}/lib`);
    fse.copyFileSync(`static/index.html`, `${destdir}/index.html`);
    fse.copyFileSync(`static/statpanel.css`, `${destdir}/lib/statpanel.css`);
    fse.copyFileSync(`static/cluster.svg`, `${destdir}/lib/cluster.svg`);
} catch (err) {
    console.error('copying files or directories for distibution failed:', err);
    process.exit(1);
}

// build CommonJS library
await esbuild.build({
    target: 'esnext',
    platform: 'node',
    format: 'cjs',
    entryPoints: [`${srcdir}/clusterapi.ts`, `${srcdir}/webserver.ts`, `${srcdir}/statpanel.ts`],
    outdir: `${destdir}/lib/cjs`,
    bundle: false,
    minify: false,
    sourcemap: true,
});

// build ESM Library
await esbuild.build({
    target: 'esnext',
    platform: 'node',
    format: 'esm',
    entryPoints: [`${srcdir}/clusterapi.ts`, `${srcdir}/webserver.ts`, `${srcdir}/statpanel.ts`],
    outdir: `${destdir}/lib/esm`,
    bundle: false,
    minify: false,
    sourcemap: true,
});
