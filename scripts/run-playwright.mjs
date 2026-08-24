import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const cacheDirectory = resolve('.playwright-cache');
const playwrightCli = resolve('node_modules/@playwright/test/cli.js');

mkdirSync(cacheDirectory, { recursive: true });

const result = spawnSync(process.execPath, [playwrightCli, 'test'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PWTEST_CACHE_DIR: cacheDirectory,
    TEMP: cacheDirectory,
    TMP: cacheDirectory
  }
});

process.exit(result.status ?? 1);
