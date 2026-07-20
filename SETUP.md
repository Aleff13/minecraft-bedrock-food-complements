# Setup do Projeto — Food Complements (Bedrock Add-on)

Guia de preparação do ambiente para desenvolver o add-on com Script API.

## 1. Pré-requisitos

- **Minecraft Bedrock Edition** instalado (Windows 11 ou o launcher oficial), versão atual estável (linha 1.21.x).
- **Node.js** LTS (18+) e **npm** — usados para compilar/empacotar os scripts (TypeScript → JS).
- Editor de código (VS Code recomendado, com extensão *Minecraft Bedrock* opcional só para autocomplete de JSON).
- Acesso à pasta `com.mojang` do jogo:
  - Windows: `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang`
  - Preview: pacote `Microsoft.MinecraftWindowsBeta_...`

## 2. Habilitar recursos experimentais no mundo de teste

Ao criar (ou editar) o mundo usado para testar o add-on:

1. Vá em **Configurações do mundo → Recursos experimentais**.
2. Ative o toggle **"APIs Beta"** (*Beta APIs*) — necessário para o módulo `@minecraft/server` funcionar.
3. Em **Complementos**, ative o Behavior Pack do projeto (e o Resource Pack, se houver um).

## 3. Estrutura de pastas do projeto

```
minecraft-bedrock-food-complements/
├── packs/
│   ├── BP_food_complements/
│   │   ├── manifest.json
│   │   ├── pack_icon.png
│   │   └── scripts/            # saída compilada (gerada pelo build, não editar)
│   │       └── main.js
│   └── RP_food_complements/     # opcional: só ícone/traduções, sem assets novos no MVP
│       ├── manifest.json
│       └── pack_icon.png
├── src/
│   └── scripts/                 # código-fonte TypeScript
│       ├── main.ts
│       ├── heldItemTracker.ts
│       ├── foodData.ts
│       └── display.ts
├── package.json
├── tsconfig.json
├── esbuild.config.mjs           # ou config equivalente (webpack/just-scripts)
└── spec.md
```

Manter o código-fonte (`src/`) separado do pacote final (`packs/`) evita editar arquivo compilado por engano.

## 4. Toolchain de build

Usar TypeScript + `esbuild` (mais simples que `just-scripts`) para compilar `src/scripts/main.ts` em `packs/BP_food_complements/scripts/main.js` como um único bundle ESM.

```bash
npm init -y
npm install --save-dev typescript esbuild
npm install --save-dev @minecraft/server@2.8.0
```

Scripts sugeridos no `package.json`:

```json
{
  "scripts": {
    "build": "esbuild src/scripts/main.ts --bundle --outfile=packs/BP_food_complements/scripts/main.js --format=esm --external:@minecraft/server --external:@minecraft/server-ui",
    "watch": "npm run build -- --watch",
    "deploy": "node scripts/deploy.js"
  }
}
```

`--external:@minecraft/server` é obrigatório: o módulo é injetado pela engine em tempo de execução, não deve ser incluído no bundle.

## 5. manifest.json (Behavior Pack)

Pontos-chave a configurar:

- `format_version`: `2` (estável).
- `header.uuid` e `modules[].uuid`: gerar UUIDs v4 únicos (`npx uuid v4` ou `uuidgen` no terminal).
- Módulo de dados (`"type": "data"`) + módulo de script:
  ```json
  {
    "type": "script",
    "language": "javascript",
    "uuid": "<novo-uuid>",
    "entry": "scripts/main.js",
    "version": [1, 0, 0]
  }
  ```
- `dependencies`:
  ```json
  [{ "module_name": "@minecraft/server", "version": "2.8.0" }]
  ```
- `min_engine_version`: acompanhar a versão do engine correspondente à release do módulo (checar changelog do `@minecraft/server` antes de builds finais, pois o número exato de versão do módulo muda com frequência).

## 6. Deploy local (dev loop)

Como não há repositório git ainda, o build deve ser copiado (ou symlink) para dentro de `com.mojang/development_behavior_packs/`:

- **macOS/Linux** (rodando Minecraft via emulação/Preview) ou ao usar symlink em vez de cópia:
  ```bash
  ln -s "$(pwd)/packs/BP_food_complements" "<com.mojang>/development_behavior_packs/BP_food_complements"
  ```
- Alternativa simples sem symlink: um script `deploy.js` que copia `packs/*` para as pastas `development_*` a cada build.

Fluxo de teste: `npm run watch` → dentro do jogo, sair e reentrar no mundo (ou `/reload` quando aplicável) para recarregar os scripts.

## 7. Verificação

- Abrir o **Content Log** (Configurações → Criador de Conteúdo → Log de Conteúdo) para ver `console.warn`/erros do script.
- Testar em um mundo novo com "APIs Beta" ativado antes de qualquer outra validação.

## 8. Controle de versão

Inicializar git no projeto (`git init`), com `.gitignore` cobrindo `node_modules/`, `packs/**/scripts/*.js` (artefato de build) e arquivos de sistema (`.DS_Store`).
