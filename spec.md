# spec.md — Food Complements

Especificação funcional e técnica do add-on. Add-on para Minecraft Bedrock que mostra, em tempo real, quanto de **fome** e **saturação** o item de comida na mão do jogador vai restaurar ao ser consumido.

## 1. Objetivo

Enquanto o jogador segura um item na hotbar (mão principal), exibir um indicador não intrusivo com:
- Pontos de fome que o item restaura.
- Saturação que o item restaura.

Quando o item na mão não é comestível, ou a mão está vazia, nenhum indicador é mostrado.

## 2. Escopo do MVP

Incluído:
- Detecção do item atualmente selecionado na hotbar de cada jogador.
- Lookup de valores de fome/saturação (itens vanilla via tabela própria; itens custom via componente `minecraft:food`, se presente).
- Exibição via action bar, atualizada sempre que o item selecionado mudar.
- Suporte a múltiplos jogadores simultâneos (multiplayer), cada um vendo apenas sua própria mão.

Fora do escopo (fase 1):
- Itens na mão secundária (offhand) — Bedrock Script API não expõe o slot de offhand de forma confiável hoje; revisitar depois.
- Novos itens de comida ou balanceamento de fome/saturação do jogo.
- UI de formulário (`@minecraft/server-ui`) — reservado para uma fase futura (ex.: tela de configurações do add-on).

## 3. Por que uma tabela própria de dados

A API `ItemStack.getComponent('minecraft:food')` (`ItemFoodComponent`, com campos `nutrition` e `saturationModifier`) **só retorna valor para itens data-driven** (definidos via JSON de item de um add-on). Para itens vanilla (maçã, pão, carne, etc.) o componente retorna `undefined`, mesmo eles sendo comestíveis no jogo.

Consequência de design: o add-on mantém uma tabela estática `VANILLA_FOOD_DATA: Record<string, {nutrition: number; saturationModifier: number}>` mapeando `typeId` (ex. `"minecraft:apple"`) para os valores oficiais (conforme wiki/dados do jogo). Para qualquer item **não** encontrado na tabela, o add-on tenta `getComponent('minecraft:food')` — cobrindo itens de comida adicionados por outros add-ons instalados junto. Se nenhuma das duas fontes tiver dado, o item é tratado como não comestível.

## 4. Fórmula de exibição

A partir de `nutrition` (N) e `saturationModifier` (S):

- **Fome restaurada**: `N` pontos de fome (1 ponto = meia coxa de carne na HUD vanilla).
- **Saturação restaurada**: `saturação = N * S * 2` (fórmula padrão do jogo).

Texto exibido (exemplo para um Pão, N=5, S=0.6):

```
🍞 Fome +5 | Saturação +6.0
```

Formatação:
- Ícone fixo genérico (🍗 ou 🍞) — não há como usar a textura real do item na action bar; manter simples.
- Uma casa decimal para saturação, inteiro para fome.
- Strings centralizadas em um módulo de tradução simples (`display.ts`) para facilitar i18n futuro (pt-BR/en-US).

## 5. Arquitetura

```
main.ts              → bootstrap: registra listeners e o loop de polling
heldItemTracker.ts    → detecta troca do item selecionado, por jogador
foodData.ts           → tabela vanilla + resolução de dados (vanilla ou componente)
display.ts            → formata e chama player.onScreenDisplay.setActionBar(...)
```

### 5.1 Detecção do item selecionado

Duas fontes se complementam, pois nenhuma sozinha cobre todos os casos de troca:

- `world.afterEvents.playerInventoryItemChange`: dispara quando o conteúdo do inventário muda (pegar/perder item), mas **não** dispara ao apenas rolar a hotbar para outro slot já preenchido.
- `system.runInterval(fn, intervalTicks)` (intervalo sugerido: 4 ticks ≈ 0,2s): a cada tick de verificação, lê `player.selectedSlotIndex` e o `typeId` do item nesse slot via `player.getComponent('minecraft:inventory').container.getItem(selectedSlotIndex)`; só atualiza a action bar se o `typeId` (ou slot vazio) mudou desde a última leitura, evitando chamadas desnecessárias a `setActionBar`.

Estado por jogador: um `Map<string playerId, string|undefined lastTypeId>` para deduplicar atualizações.

### 5.2 Ciclo de vida do jogador

- `world.afterEvents.playerSpawn` (com `initialSpawn === true`): inicializa entrada no `Map` de estado.
- Ao jogador sair (`world.beforeEvents.playerLeave` ou verificação de `player.isValid()` a cada intervalo): remover entrada do `Map` para não vazar memória.

## 6. Casos especiais

| Situação | Comportamento |
|---|---|
| Mão vazia (`getItem` retorna `undefined`) | Limpa a action bar (`setActionBar("")`) |
| Item não comestível (sem entrada na tabela nem componente `minecraft:food`) | Limpa a action bar |
| Item com `canAlwaysEat: true` (ex. dourados) | Mostra normalmente; não há diferença de exibição no MVP |
| Item de outro add-on com `minecraft:food` customizado | Usa os valores do componente diretamente |
| Jogador em modo criativo | Mesmo comportamento — a info é sobre o item, não sobre a possibilidade de comer |
| Poção/item líquido não-comida (ex. balde de leite) | Não comestível → sem exibição, mesmo que remova efeitos no jogo |

## 7. Não-funcionais

- **Performance**: um único `runInterval` global percorrendo todos os jogadores online (não um interval por jogador), para manter custo previsível com muitos jogadores.
- **Multiplayer/autoridade**: scripts de Behavior Pack rodam no processo autoritativo (host/servidor), então `setActionBar` por jogador funciona corretamente sem sincronização manual.
- **i18n**: strings do MVP em pt-BR; estrutura do `display.ts` já preparada para troca de idioma futura.

## 8. Plano de testes manuais

1. Segurar um item vanilla comestível conhecido (ex. maçã) → valores batem com a wiki.
2. Segurar item não comestível (ex. pedra) → nenhuma action bar.
3. Mão vazia → nenhuma action bar.
4. Trocar de slot rolando a roda do mouse entre dois itens de comida diferentes → texto atualiza em ≤0,5s.
5. Dois jogadores simultâneos segurando itens diferentes → cada um vê apenas o próprio.
6. Jogador sai do mundo enquanto segurava comida → sem erro no Content Log; entrada removida do estado.
7. (Se houver outro add-on com comida custom instalado) segurar esse item → valores do componente `minecraft:food` aparecem corretamente.

## 9. Roadmap (pós-MVP)

- Suporte a offhand quando a API permitir leitura confiável do slot.
- Tela de configurações (`@minecraft/server-ui`) para escolher idioma ou ligar/desligar o indicador.
- Indicador visual mais rico (ex. HUD customizado via resource pack, se a API de UI evoluir).
