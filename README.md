# PC Migration Assistant

**Formatei meu PC, e agora?**

PC Migration Assistant é uma aplicação desktop local-first para Windows, criada para ajudar usuários a registrar, comparar e futuramente restaurar o ambiente de software de um computador após uma formatação.

A ideia central do projeto é simples:

> Não fazer backup do Windows. Fazer backup do ambiente do usuário.

Em vez de tentar clonar o sistema operacional inteiro, o aplicativo cria um inventário estruturado do computador: programas instalados, compatibilidade com Winget, informações básicas do sistema e, nas próximas fases, ambiente de desenvolvimento, extensões do VS Code, fontes, inicialização, variáveis de ambiente e snapshots portáteis.

Este projeto foi pensado como uma aplicação real de portfólio, com foco em arquitetura segura, separação de responsabilidades, validação de dados, interface moderna e integração cuidadosa com recursos do Windows.

## Sumário

- [Status do projeto](#status-do-projeto)
- [Demonstração](#demonstração)
- [Objetivo](#objetivo)
- [O problema que o app resolve](#o-problema-que-o-app-resolve)
- [Funcionalidades atuais](#funcionalidades-atuais)
- [O que ainda não está implementado](#o-que-ainda-não-está-implementado)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Segurança](#segurança)
- [Como o scanner funciona](#como-o-scanner-funciona)
- [IPC exposto ao renderer](#ipc-exposto-ao-renderer)
- [Modo mock](#modo-mock)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Scripts disponíveis](#scripts-disponíveis)
- [Testes](#testes)
- [Build e instalador Windows](#build-e-instalador-windows)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)
- [Licença](#licença)

## Status do projeto

**Versão atual:** `0.1.0`

**Fase atual do MVP:** base Electron funcional + interface inicial + scanner real de programas instalados.

O projeto já possui:

- Aplicação Electron iniciando corretamente.
- Interface React com dashboard, sidebar e tela de programas.
- IPC seguro entre renderer e main process.
- Scanner real de programas instalados no Windows via Registro.
- Detecção real do Winget.
- Parser inicial para saída de `winget list`.
- Normalização e deduplicação básica de programas.
- Testes unitários para partes críticas.
- Teste de integração opcional para o scanner real.
- Build de produção.
- Empacotamento Windows via `electron-builder` com instalador NSIS.

O projeto ainda não possui:

- Criação real de arquivo `.pcma`.
- Importação de snapshot.
- Comparação entre PC antigo e PC atual.
- Instalação automática via Winget.
- Restauração de extensões do VS Code.
- Banco SQLite.
- Histórico persistente.

Essas partes estão planejadas no roadmap e a arquitetura já foi organizada para recebê-las.

## Demonstração

Screenshots ainda serão adicionadas quando o fluxo visual estiver mais estável.

Sugestão de arquivos futuros:

```text
docs/
└── screenshots/
    ├── dashboard.png
    ├── create-snapshot.png
    ├── programs.png
    └── restore.png
```

## Objetivo

O objetivo do PC Migration Assistant é permitir que uma pessoa analise seu computador antes de formatá-lo e gere um snapshot do ambiente.

Fluxo desejado do produto completo:

```text
Antes de formatar
1. Abrir o PC Migration Assistant.
2. Escanear programas instalados.
3. Identificar programas compatíveis com Winget.
4. Selecionar o que deve entrar no snapshot.
5. Criar um arquivo portátil .pcma.

Depois de formatar
1. Instalar novamente o PC Migration Assistant.
2. Importar o snapshot .pcma.
3. Comparar o PC atual com o antigo.
4. Ver o que já está instalado e o que está faltando.
5. Restaurar aplicativos compatíveis via Winget.
6. Receber orientação para aplicativos que precisam de instalação manual.
```

## O problema que o app resolve

Formatar um PC costuma gerar uma pergunta bem comum: "o que eu tinha instalado mesmo?"

Mesmo usuários experientes normalmente esquecem:

- Programas utilitários pequenos.
- Ferramentas de desenvolvimento.
- Extensões do VS Code.
- Fontes usadas em projetos.
- Apps que iniciavam com o Windows.
- Dependências instaladas há meses.
- Programas pagos que precisam de reinstalação manual.

O PC Migration Assistant tenta transformar essa bagunça em um inventário legível, versionado e restaurável.

Ele não tenta copiar senhas, sessões, cookies ou credenciais. O foco é mapear o ambiente de software, não extrair dados sensíveis.

## Funcionalidades atuais

### Aplicação desktop

- Shell Electron configurado.
- Renderer React com TypeScript.
- Dark mode como experiência principal.
- Sidebar com navegação entre áreas do produto.
- Dashboard inicial.
- Tela de criação de snapshot inicial.
- Tela de programas encontrados.
- Estados vazios e feedback visual de scanner.

### Scanner de programas

O scanner atual combina:

- Leitura do Registro do Windows.
- Detecção do Winget.
- Listagem de pacotes conhecidos pelo Winget, quando disponível.
- Normalização de nomes.
- Deduplicação básica.
- Classificação do método de restauração.

Tipos de restauração atuais:

```ts
type RestoreMethod = 'winget' | 'manual' | 'unknown'
```

Modelo principal:

```ts
interface InstalledApplication {
  id: string
  name: string
  version?: string
  publisher?: string
  installLocation?: string
  icon?: string
  winget?: {
    packageId: string
    source?: string
    version?: string
  }
  restoreMethod: 'winget' | 'manual' | 'unknown'
}
```

### Segurança do Electron

O projeto usa uma arquitetura conservadora:

- O renderer não acessa Node.js diretamente.
- O renderer não acessa `child_process`.
- O renderer não lê Registro do Windows.
- O renderer não executa comandos arbitrários.
- A ponte exposta pelo preload é pequena e tipada.
- O main process valida payloads com Zod.

Configuração principal da janela:

```ts
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  preload: ...
}
```

### Interface

A interface atual possui:

- Sidebar fixa.
- Dashboard com resumo do computador.
- Card para iniciar criação de snapshot.
- Tela de scanner com progresso.
- Lista de programas.
- Busca.
- Filtros.
- Seleção de programas compatíveis.
- Badges de status.

## O que ainda não está implementado

Por enquanto, o aplicativo não instala programas automaticamente.

Também ainda não cria o snapshot `.pcma` final. A tela de criação de snapshot já existe e o scanner já popula a lista real de programas, mas a serialização do snapshot entrará na próxima fase.

Funcionalidades planejadas:

- Criar snapshot `.pcma`.
- Validar checksum de arquivos internos.
- Importar snapshot.
- Comparar inventários.
- Gerar plano de restauração.
- Executar dry run.
- Instalar programas via Winget com confirmação.
- Registrar histórico em SQLite.
- Gerar relatório local de restauração.

## Stack

Principais tecnologias:

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [electron-vite](https://electron-vite.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [electron-builder](https://www.electron.build/)

Dependências de runtime:

```json
{
  "clsx": "^2.1.1",
  "lucide-react": "^0.468.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "zod": "^3.24.1"
}
```

## Arquitetura

O projeto separa claramente as responsabilidades entre `main`, `preload`, `renderer` e `shared`.

```text
src/
├── main/
│   ├── index.ts
│   ├── ipc/
│   │   └── appIpc.ts
│   ├── services/
│   │   └── processRunner.ts
│   ├── scanners/
│   │   ├── appNormalizer.ts
│   │   ├── installedAppsScanner.ts
│   │   ├── mockApps.ts
│   │   ├── registryScanner.ts
│   │   ├── systemInfoScanner.ts
│   │   ├── wingetService.ts
│   │   └── wingetValidation.ts
│   ├── installers/
│   ├── snapshot/
│   ├── database/
│   └── security/
│       ├── secretDetector.ts
│       └── windowSecurity.ts
│
├── preload/
│   ├── index.ts
│   └── api.ts
│
├── renderer/
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── styles.css
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── stores/
│       ├── types/
│       └── utils/
│
└── shared/
    ├── constants/
    ├── schemas/
    └── types/
```

### Main process

Responsável por operações privilegiadas:

- Leitura do Registro do Windows.
- Execução de processos conhecidos.
- Detecção do Winget.
- Scanner de aplicativos.
- Informações básicas do sistema.
- Segurança da janela.
- Registro de handlers IPC.

### Preload

Responsável por expor uma API mínima ao renderer:

- Não expõe `ipcRenderer` diretamente.
- Não permite execução arbitrária.
- Usa contratos compartilhados.
- Valida respostas críticas com Zod.

### Renderer

Responsável apenas pela interface:

- Páginas.
- Componentes.
- Estado visual.
- Filtros.
- Seleção de apps.
- Feedback de progresso.

O renderer não acessa:

- `fs`
- `child_process`
- Registro do Windows
- PowerShell
- SQLite
- APIs nativas do Electron

### Shared

Contém contratos reutilizados pelos dois lados:

- Tipos TypeScript.
- Schemas Zod.
- Constantes de IPC.

## Segurança

Segurança é uma preocupação central do projeto.

### Princípios

- Nenhuma credencial deve ser coletada.
- Nenhuma senha deve ser lida.
- Nenhum cookie deve ser extraído.
- Nenhum token deve ser salvo.
- Nenhum comando arbitrário deve vir do renderer.
- Nenhum script remoto deve ser baixado e executado.
- Nenhum dado deve ser enviado para servidor externo por padrão.

### Proteções já aplicadas

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `contextBridge.exposeInMainWorld()`
- IPC com canais explícitos.
- Payloads validados com Zod.
- Execução de processos via `spawn()` com `shell: false`.
- Argumentos passados como array.
- Bloqueio de `window.open`.
- Bloqueio de `webview`.
- CSP em produção.
- Redaction inicial de potenciais secrets.

### O que não existe de propósito

Não existe uma API como:

```ts
window.api.exec(command)
```

Também não existe:

```ts
window.api.shell(command)
```

Isso seria inseguro, porque permitiria ao renderer influenciar diretamente comandos privilegiados.

## Como o scanner funciona

### 1. Registro do Windows

O scanner consulta locais conhecidos de programas instalados:

```text
HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall
HKLM\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall
HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall
```

Campos lidos quando disponíveis:

- `DisplayName`
- `DisplayVersion`
- `Publisher`
- `InstallLocation`
- `DisplayIcon`
- `UninstallString`

O scanner apenas lê essas informações. Ele não modifica o Registro.

### 2. Winget

O serviço de Winget tenta executar:

```powershell
winget --version
```

Se o Winget estiver disponível, o app tenta listar pacotes instalados:

```powershell
winget list --accept-source-agreements --disable-interactivity
```

O resultado é usado para relacionar programas instalados a Package IDs do Winget.

Exemplo:

```text
Google Chrome -> Google.Chrome
Discord       -> Discord.Discord
VS Code       -> Microsoft.VisualStudioCode
```

### 3. Normalização

Programas podem aparecer com nomes diferentes em fontes diferentes.

Exemplos:

```text
Google Chrome
Google Chrome (64-bit)
Google Chrome x64
```

O normalizador remove sufixos comuns, caracteres decorativos e variações simples para reduzir duplicatas.

### 4. Resultado consolidado

O resultado final inclui:

- Programas encontrados.
- Programas compatíveis com Winget.
- Programas que exigem instalação manual.
- Contagem por fonte.
- Status do Winget.
- Data do scan.

## IPC exposto ao renderer

A API pública do preload é intencionalmente pequena.

```ts
interface PcMigrationApi {
  scanApps: () => Promise<ScanAppsResult>
  getSystemInfo: () => Promise<SystemInfo>
  getWingetStatus: () => Promise<WingetStatus>
  onScanProgress: (callback: (event: ScanProgressEvent) => void) => () => void
}
```

Canais principais:

```ts
export const IPC_CHANNELS = {
  APPS_SCAN: 'apps:scan',
  SYSTEM_GET: 'system:get',
  WINGET_STATUS: 'winget:status',
} as const
```

Eventos:

```ts
export const IPC_EVENTS = {
  SCAN_PROGRESS: 'scan:progress',
} as const
```

## Modo mock

Para desenvolver a interface sem depender do estado real do computador, existe um modo mock:

```bash
PCMA_MOCK_MODE=true npm run dev
```

No PowerShell:

```powershell
$env:PCMA_MOCK_MODE="true"; npm run dev
```

Nesse modo, o scanner retorna dados simulados como:

- Google Chrome
- Discord
- VS Code
- Adobe Photoshop
- Ferramenta interna

Isso permite demonstrar a UI mesmo em máquinas sem Winget ou com poucos programas instalados.

## Como rodar o projeto

### Pré-requisitos

- Windows 10 ou Windows 11.
- Node.js instalado.
- npm instalado.
- Git instalado.
- Winget opcional, mas recomendado para testar detecção de Package IDs.

Verifique:

```bash
node --version
npm --version
git --version
```

No Windows, verifique Winget:

```powershell
winget --version
```

Se o comando não existir, o aplicativo ainda funciona, mas os programas serão classificados majoritariamente como instalação manual.

### Instalação

```bash
npm install
```

### Rodar em desenvolvimento

```bash
npm run dev
```

Isso inicia:

- Processo main do Electron.
- Preload.
- Dev server do renderer.
- Janela desktop do aplicativo.

## Scripts disponíveis

```json
{
  "dev": "electron-vite dev",
  "build": "npm run typecheck && electron-vite build",
  "test": "vitest run",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json",
  "dist": "npm run build && electron-builder"
}
```

### `npm run dev`

Inicia o aplicativo em modo desenvolvimento.

### `npm run typecheck`

Executa TypeScript no projeto Node/Electron e no renderer.

### `npm run lint`

Executa ESLint.

### `npm run test`

Executa testes automatizados com Vitest.

### `npm run build`

Gera os bundles de produção em `out/`.

### `npm run dist`

Gera o aplicativo empacotado e o instalador Windows em `release/`.

## Testes

Testes atuais:

- Normalização de nomes de aplicativos.
- Deduplicação de programas.
- Associação com Winget Package ID.
- Validação de Package ID do Winget.
- Redaction de potenciais secrets.
- Teste de integração opcional do scanner real.

Rodar testes unitários:

```bash
npm run test
```

Rodar typecheck:

```bash
npm run typecheck
```

Rodar lint:

```bash
npm run lint
```

### Teste de integração do scanner real

O teste de integração acessa o ambiente real do Windows, executando scanner de Registro e detecção do Winget.

No PowerShell:

```powershell
$env:PCMA_RUN_INTEGRATION="true"; npm run test -- tests/main/installedAppsScanner.integration.test.ts --testTimeout=180000
```

Esse teste é opcional e fica desabilitado no `npm run test` padrão.

## Build e instalador Windows

Gerar build:

```bash
npm run build
```

Gerar instalador:

```bash
npm run dist
```

Saídas esperadas:

```text
out/
├── main/
├── preload/
└── renderer/

release/
├── win-unpacked/
│   └── PC Migration Assistant.exe
└── PC Migration Assistant Setup 0.1.0.exe
```

O projeto usa `electron-builder` com alvo NSIS:

```json
{
  "win": {
    "signAndEditExecutable": false,
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

Durante desenvolvimento, assinatura digital não é obrigatória.

## Estrutura de pastas

### `src/main`

Código do processo principal do Electron.

Arquivos importantes:

- `index.ts`: criação da janela e bootstrap do app.
- `ipc/appIpc.ts`: registro dos handlers IPC.
- `services/processRunner.ts`: execução segura de processos conhecidos.
- `scanners/installedAppsScanner.ts`: orquestra o scanner de programas.
- `scanners/registryScanner.ts`: leitura do Registro do Windows.
- `scanners/wingetService.ts`: detecção e parsing do Winget.
- `scanners/appNormalizer.ts`: normalização e deduplicação.
- `security/windowSecurity.ts`: hardening da janela.
- `security/secretDetector.ts`: detecção/redaction inicial de secrets.

### `src/preload`

Ponte segura entre main e renderer.

- `index.ts`: expõe a API no `window`.
- `api.ts`: implementa chamadas IPC específicas.

### `src/renderer`

Interface React.

Áreas principais:

- `components/`: componentes reutilizáveis.
- `pages/`: páginas da aplicação.
- `hooks/`: hooks React.
- `utils/`: utilitários de UI.
- `types/`: tipos globais do renderer.

### `src/shared`

Contratos compartilhados:

- `types/`: interfaces TypeScript.
- `schemas/`: schemas Zod.
- `constants/`: constantes de IPC.

### `tests`

Testes unitários e integração opcional.

## Fluxo atual do MVP

O fluxo funcional atual é:

```text
1. Abrir o app.
2. Entrar em Criar snapshot.
3. Rodar scanner de programas.
4. Ler programas instalados no Registro do Windows.
5. Detectar Winget, se disponível.
6. Consolidar lista de programas.
7. Exibir programas na interface.
8. Filtrar por Winget, manual, desconhecido ou selecionados.
9. Selecionar programas compatíveis.
```

O app ainda não grava o arquivo `.pcma` nessa fase.

## Formato planejado do snapshot

Extensão planejada:

```text
.pcma
```

Internamente, o arquivo poderá ser um ZIP com estrutura semelhante a:

```text
snapshot.pcma
├── manifest.json
├── data/
│   ├── system.json
│   ├── applications.json
│   ├── winget.json
│   ├── developer.json
│   ├── vscode.json
│   ├── fonts.json
│   ├── startup.json
│   ├── environment.json
│   └── folders.json
├── config/
└── backup/
```

Manifest planejado:

```json
{
  "format": "pcma",
  "schemaVersion": 1,
  "appVersion": "0.1.0",
  "createdAt": "2026-08-20T18:30:00-03:00",
  "computer": {
    "name": "DESKTOP-JOAO"
  },
  "contents": {
    "applications": true,
    "developerEnvironment": true,
    "vscode": true,
    "fonts": true,
    "startup": true,
    "environment": true,
    "files": false
  }
}
```

## Roadmap

### Fase 1: base desktop

Status: implementada.

- Electron.
- React.
- TypeScript.
- Tailwind.
- Sidebar.
- Dashboard.
- IPC seguro.
- Estrutura Main/Preload/Renderer/Shared.

### Fase 2: scanner de programas

Status: parcialmente implementada.

- Detecção do Winget.
- Scanner de Registro.
- Normalização.
- Deduplicação.
- UI de programas.

Próximas melhorias:

- Melhor matching entre Registro e Winget.
- Suporte a aliases do Winget em cenários onde `winget.exe` não está no PATH.
- Cache local de ícones.
- Mais testes com fixtures reais de diferentes máquinas.

### Fase 3: snapshots

Status: planejada.

- Criar `.pcma`.
- Gerar `manifest.json`.
- Gerar `system.json`.
- Gerar `applications.json`.
- Calcular checksums SHA-256.
- Persistir histórico inicial.

### Fase 4: importação

Status: planejada.

- Abrir `.pcma`.
- Validar extensão.
- Validar schema.
- Validar checksum.
- Proteger contra path traversal e Zip Slip.
- Comparar snapshot com computador atual.

### Fase 5: restauração

Status: planejada.

- Selecionar apps ausentes.
- Simular restauração.
- Confirmar antes de instalar.
- Instalar pacote por pacote via Winget.
- Mostrar progresso.
- Permitir cancelamento seguro.
- Registrar resultado.

### Fase 6: ambiente de desenvolvimento

Status: planejada.

- Git.
- Node.js.
- npm.
- pnpm.
- Yarn.
- Python.
- pip.
- Java.
- .NET.
- Docker.
- PowerShell.
- VS Code.
- Extensões do VS Code.

### Fase 7: recursos adicionais

Status: planejada.

- Fontes.
- Apps de inicialização.
- Variáveis de ambiente.
- Configurações selecionadas.
- Histórico completo.
- Logs estruturados.
- SQLite.
- Relatórios locais.

## Privacidade

O projeto é local-first.

Por padrão:

- Nenhum dado é enviado para servidores externos.
- Nenhuma telemetria é coletada.
- Nenhum token é lido.
- Nenhuma senha é lida.
- Nenhum cookie é lido.
- Nenhuma sessão de navegador é copiada.

O objetivo é inventariar o ambiente de software, não capturar dados pessoais.

## Troubleshooting

### `winget` aparece como indisponível

Verifique:

```powershell
winget --version
where.exe winget
Get-Command winget
```

Se todos falharem, o Winget provavelmente não está instalado ou não está visível no PATH do processo.

O app ainda consegue listar programas via Registro, mas não conseguirá associar Package IDs do Winget.

### Electron não abre após `npm install`

Algumas versões recentes do npm podem bloquear scripts de pós-instalação.

Se necessário, rode:

```bash
npm approve-scripts electron esbuild
npm rebuild electron esbuild
```

Depois:

```bash
npm run dev
```

### `npm run dist` falha ao extrair `winCodeSign`

Em alguns ambientes Windows, a extração do pacote de assinatura pode falhar por falta de privilégio de symlink.

Este projeto usa:

```json
"signAndEditExecutable": false
```

Isso evita a etapa problemática durante desenvolvimento. Para releases oficiais assinados, a configuração deve ser revisada com certificado de assinatura adequado.

### Scanner não retorna programas

Verifique se o app está rodando no Windows. Em sistemas não Windows, o scanner de Registro retorna lista vazia.

Também é possível testar a UI com:

```powershell
$env:PCMA_MOCK_MODE="true"; npm run dev
```

## Contribuição

Este projeto ainda está em fase inicial. Antes de contribuir, rode:

```bash
npm run typecheck
npm run lint
npm run test
```

Sugestões de contribuição:

- Melhorar matching entre Registro e Winget.
- Adicionar fixtures de diferentes ambientes Windows.
- Criar screenshots para o README.
- Implementar criação do snapshot `.pcma`.
- Adicionar SQLite e migrations.
- Melhorar cobertura de testes.

## Licença

Este projeto está licenciado sob a licença MIT.

## English summary

PC Migration Assistant is a local-first Windows desktop application built with Electron, React and TypeScript. It helps users inventory their software environment before formatting a PC, with future support for portable snapshots, comparison and guided restoration through Winget.

Current MVP status: secure Electron shell, modern React UI, Windows Registry app scanner, Winget detection, typed IPC, tests and Windows packaging.
