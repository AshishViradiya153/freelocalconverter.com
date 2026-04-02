<div align="center">

<a href="https://freelocalconverter.com/">
  <img src="https://github.com/user-attachments/assets/e5abbc76-0d80-4764-b2f3-e3dfa5d5887c" alt="FreeLocalConverter logo" width="100" height="100" />
</a>

## FreeLocalConverter

**Free, privacy-friendly utilities in the browser** — CSV, JSON, Parquet, PDF, images, and dozens of other tools. Workflows run **entirely on the client** so your files often never leave your device.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Live site](https://freelocalconverter.com/) · [Source](https://github.com/AshishViradiya153/csvvieweronline)

</div>

![Landing image 1](public/landing/image1.png)
![Landing image 2](public/landing/image.png)
![Landing image 3](public/landing/image%20copy.png)
![Landing image 4](public/landing/image%20copy%202.png)

---

## Table of contents

- [Why FreeLocalConverter?](#why-freelocalconverter)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Internationalization](#internationalization)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Why FreeLocalConverter?

- **Local-first**: Core data tools are built so processing happens in your browser when possible.
- **Multilingual**: UI is translated across many locales via [next-intl](https://next-intl-docs.vercel.app/).
- **Modern stack**: Next.js App Router, React 19, TypeScript, Tailwind CSS v4, and accessible UI primitives (Radix / shadcn-style components).

---

## Features

- **Data**: CSV viewer, converters (JSON, Parquet, SQL, and more), grids, and validation-style workflows.
- **Documents & media**: PDF, images, video/audio helpers where applicable (some use WASM, e.g. FFmpeg-related assets).
- **Developer & misc**: JSON/YAML tools, colors, mesh gradients, and other small utilities.
- **Content**: Programmatic SEO pages (guides/topics), blog, legal pages, and a contact page.

> **Note:** Behavior can vary by tool. If a feature uploads to a server, the UI should say so explicitly.

---

## Tech stack

| Area      | Choices                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| Framework | [Next.js](https://nextjs.org/) (App Router)                                                                                 |
| UI        | React 19, [Tailwind CSS](https://tailwindcss.com/) v4, [Radix UI](https://www.radix-ui.com/), [Lucide](https://lucide.dev/) |
| i18n      | [next-intl](https://next-intl-docs.vercel.app/)                                                                             |
| Quality   | [Biome](https://biomejs.dev/), TypeScript, [Vitest](https://vitest.dev/)                                                    |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) — version pinned via `packageManager` in `package.json` (Corepack: `corepack enable`)

### Install and run

```bash
pnpm install
pnpm dev
```

Then open the URL shown in the terminal (usually `http://localhost:3000`).

`postinstall` copies static assets required by some tools (for example FFmpeg WASM).

### Production build

```bash
pnpm build
pnpm start
```

---

## Scripts

| Command                       | Description                                               |
| ----------------------------- | --------------------------------------------------------- |
| `pnpm dev`                    | Development server                                        |
| `pnpm build`                  | Production build                                          |
| `pnpm start`                  | Run production server                                     |
| `pnpm lint` / `pnpm lint:fix` | Biome lint (and auto-fix)                                 |
| `pnpm typecheck`              | TypeScript, no emit                                       |
| `pnpm check`                  | `lint` + `typecheck`                                      |
| `pnpm test`                   | Vitest                                                    |
| `pnpm messages:sync`          | Fill/update non-`en` locale files from `messages/en.json` |
| `pnpm validate:messages`      | Full i18n parity and related checks                       |
| `pnpm validate:pseo`          | Validate programmatic SEO data                            |

---

## Internationalization

- Canonical strings: `**messages/en.json**`
- Other locales live in `**messages/*.json**`
- Supported locale codes include: `en`, `zh`, `es`, `pt`, `fr`, `de`, `nl`, `it`, `ja`, `tr`, `az`, `ko`, `ar`, `fa`, `ru`, `he`, `el` (see `src/i18n/routing.ts`)
- After adding or changing keys in English, run:

```bash
pnpm messages:sync
```

---

## Project structure

```
src/app/           # App Router: pages, layouts, route handlers
src/app/api/       # API routes (e.g. contact)
src/components/    # Shared UI and layout
src/lib/           # Libraries, helpers, SEO, tool logic
src/i18n/          # Routing and i18n config
messages/          # next-intl JSON per locale
public/            # Static assets
scripts/           # Build and maintenance scripts
```

---

## Contributing

Contributions are welcome.

By submitting a pull request, you agree to the **Contributor Copyright Assignment Agreement**
in `[docs/legal/CONTRIBUTOR-COPYRIGHT-ASSIGNMENT.md](./docs/legal/CONTRIBUTOR-COPYRIGHT-ASSIGNMENT.md)`.
If you do not agree, please do not contribute code.

1. **Fork** the repository and create a branch from `main` (or the default branch).
2. **Make changes** with clear commits.
3. **Run checks** before opening a PR:

```bash
 pnpm check
 pnpm test
```

4. If you change `**messages/en.json**`, run `**pnpm messages:sync**` and ensure `**pnpm validate:messages**` passes when you touch copy or locales.
5. Open a **pull request** with a short description of what changed and why.

Please keep PRs focused. Match existing patterns (TypeScript, Biome formatting, and component style).

---

## Security

If you discover a security issue, please **do not** open a public issue. Contact the maintainers privately (for example via security advisories on GitHub or the contact channel the maintainers publish for the project).

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0-only)** — see the [LICENSE](./LICENSE) file.

---

Built with care by [contributors](https://github.com/AshishViradiya153/csvvieweronline/graphs/contributors) like you.

</div>

## Authors

<a href="https://github.com/AshishViradiya153/freelocalconverter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=AshishViradiya153/freelocalconverter" />
</a>