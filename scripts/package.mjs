#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packDir = path.join(rootDir, 'packs', 'BP_food_complements');
const distDir = path.join(rootDir, 'dist');
const outputFile = path.join(distDir, 'FoodComplements.mcpack');

if (!existsSync(packDir)) {
  console.error(`Pasta do behavior pack não encontrada: ${packDir}`);
  process.exit(1);
}

mkdirSync(distDir, { recursive: true });
rmSync(outputFile, { force: true });

try {
  // O manifest.json precisa ficar na raiz do .zip, por isso rodamos o zip
  // de dentro da pasta do pack (packDir) em vez de zipar a pasta inteira.
  execFileSync('zip', ['-r', '-X', outputFile, '.', '-x', '.*'], {
    cwd: packDir,
    stdio: 'inherit',
  });
} catch {
  console.error(
    '\nFalha ao gerar o .mcpack. É necessário ter o comando "zip" disponível no PATH ' +
      '(já vem por padrão no macOS e Linux; no Windows use o Git Bash, WSL ou 7-Zip).'
  );
  process.exit(1);
}

console.log(`\n.mcpack gerado em: ${path.relative(rootDir, outputFile)}`);
console.log('Transfira esse arquivo para o celular (AirDrop, iCloud, etc.) e abra com o Minecraft.');
