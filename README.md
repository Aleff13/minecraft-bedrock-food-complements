# Food Complements

Add-on para Minecraft Bedrock que mostra, na action bar, quanto de **fome** e **saturação** o item de comida que está na mão do jogador vai restaurar.

Documentação completa:
- [`SETUP.md`](SETUP.md) — preparação do ambiente de desenvolvimento.
- [`spec.md`](spec.md) — especificação funcional/técnica do add-on.

## Estrutura do projeto

```
data/vanilla-food-data.json   # tabela de fome/saturação de todos os itens vanilla
src/scripts/                  # código-fonte TypeScript
  main.ts                     # bootstrap
  heldItemTracker.ts          # detecta troca do item selecionado na hotbar
  foodData.ts                 # lookup de dados de comida (vanilla + componente minecraft:food)
  display.ts                  # formata e escreve na action bar
packs/BP_food_complements/    # Behavior Pack final (o que vai pro jogo)
  manifest.json
  scripts/main.js             # gerado pelo build — não editar direto
```

## Como buildar

Pré-requisitos: Node.js 18+ (ver [`SETUP.md`](SETUP.md) para detalhes do ambiente).

```bash
npm install        # instala @minecraft/server, esbuild, typescript
npm run build       # compila src/scripts/*.ts -> packs/BP_food_complements/scripts/main.js
npm run watch        # mesma coisa, mas recompila a cada mudança de arquivo
```

Para checar erros de tipo sem gerar arquivo:

```bash
npx tsc --noEmit
```

## Como testar

### Windows (com.mojang direto)

1. Rode `npm run build`.
2. Copie (ou crie um symlink de) `packs/BP_food_complements` para dentro de:
   `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\`

### iPhone / iPad / qualquer dispositivo sem acesso à pasta com.mojang

Como não dá pra acessar a pasta do jogo diretamente, é preciso empacotar num arquivo `.mcpack` e importar pelo próprio app:

```bash
npm run build
mkdir -p dist
rm -f dist/FoodComplements.mcpack
cd packs/BP_food_complements
zip -r -X ../../dist/FoodComplements.mcpack . -x ".*"
cd ../..
```

Isso gera `dist/FoodComplements.mcpack`. Depois:

1. Transfira o arquivo pro celular (AirDrop do Mac é o mais fácil; ou iCloud/Drive/e-mail).
2. Toque no arquivo `.mcpack` no celular e escolha "Abrir no Minecraft" — o jogo importa o pack sozinho.
3. Crie (ou edite) um mundo → **Configurações do mundo → Recursos experimentais** → ative **"APIs Beta"** (obrigatório pro Script API funcionar).
4. Em **Complementos**, ative o Behavior Pack "Food Complements" nesse mundo.
5. Entre no mundo e segure um alimento na hotbar.

Repita esse processo (build → zip → transferir) toda vez que o código mudar — não há live-reload remoto em iOS.

### Verificar erros no jogo

Configurações → Criador de Conteúdo → **Log de Conteúdo**, para ver `console.warn`/erros do script em tempo real.
