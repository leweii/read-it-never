# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development build with watch mode
npm run build    # Production build (minified)
npm run lint     # ESLint with auto-fix (src/ only)
npm test         # Vitest unit tests (test/), `obsidian` is aliased to test/obsidian-stub.ts
```

The build output is a single `main.js` file bundled by esbuild. Unit tests cover pure logic only (template engine, file name helpers, parser URL matching); parsers that hit the network are not tested.

## Architecture

**ReadItNever** is an Obsidian plugin that saves web content as markdown notes. It supports several content types via a parser chain pattern.

### Data Flow

1. User triggers action (ribbon icon, command, or context menu) → clipboard or provided content
2. `ReadItNeverApi.processContent()` → `NoteService.createNote()`
3. `ParserCreator` iterates registered parsers calling `parser.test(content)` until one matches
4. Matched parser's `prepareNote()` fetches metadata and returns a `Note` object
5. `TemplateEngine` renders note title and body using per-content-type templates from settings (single pass — substituted values are never re-parsed as template syntax)
6. `DefaultVaultRepository` checks for duplicates, then calls `note.getFinalContent()` (runs deferred work such as image downloads) and writes the file
7. `NoteService` shows progress/result notices and opens the note; errors from parsers are surfaced as a single notice

### Key Components

- **`src/main.ts`** — Plugin entry point; registers parsers in priority order, sets up commands/ribbon/settings
- **`src/NoteService.ts`** — Core business logic: note creation, batch processing, file conflict handling (Ask/Append/Nothing strategies), cursor insertion
- **`src/parsers/Parser.ts`** — Abstract base: `test(content): boolean` and `prepareNote(content): Promise<Note>`
- **`src/parsers/ParserCreator.ts`** — Factory that selects the right parser; parsers are registered in priority order (specific parsers before `WebsiteParser`, with `TextSnippetParser` as catch-all)
- **`src/parsers/Note.ts`** — Data model returned by parsers (fileName, content, contentType, metadata)
- **`src/template/TemplateEngine.ts`** — Custom template engine: `{{ variable }}`, `{{ value | filter }}`, `{% for item in array %}...{% endfor %}`
- **`src/repository/DefaultVaultRepository.ts`** — Vault I/O: creates directories (supports path templating with `date`/`fileName`/`contentType` variables), handles file existence, appends content
- **`src/settings.ts`** — 80+ settings; per-content-type title template, note template, and content slug
- **`src/views/settings-tab.ts`** — Tabbed settings UI (General / Content types / Accounts & API / Advanced); content types are declared in `getContentTypeDefinitions()` together with their template variables

### Adding a New Parser

1. Create `src/parsers/MyParser.ts` extending `Parser`
2. Implement `test()` to identify matching URLs/content
3. Implement `prepareNote()` to fetch metadata and return a `Note`
4. Register in `src/main.ts` before `WebsiteParser` in the parser list
5. Add corresponding settings and defaults in `src/settings.ts`
6. Add an entry to `getContentTypeDefinitions()` in `src/views/settings-tab.ts` and i18n keys to both locale files

### Template Engine

Templates use `{{ variableName }}` syntax. Filters chain with `|`:
- `blockquote`, `capitalize`, `upper`, `lower`
- `replace(search, replacement)`
- `join(separator)`
- `striptags`
- `map(key)` (picks `key` from each object in an array)
- `numberLexify` (formats numbers)

Loops: `{% for item in array %}...{% endfor %}`

### Code Style

- TypeScript strict mode (`noImplicitAny`)
- Single quotes, 4-space indent, 120-char line width, trailing commas
- Target: ES2022, ESNext modules
- Platform: Desktop + Mobile (no Node.js APIs; use Obsidian's `requestUrl` instead of `fetch`)
