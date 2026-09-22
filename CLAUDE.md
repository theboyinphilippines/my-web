# Project: My Personal Blog

Astro static blog. Deploys to GitHub Pages via GitHub Actions.
Follow Figma design to develop this website.

## Commands
- `yarn dev`: Start dev server (port 4321)
- `yarn build`: Production build
- `yarn preview`: Preview built site
- `yarn add <pkg>`: Add a dependency

## Architecture
- `src/pages/` → Routes (file-based routing)
- `src/layouts/` → Page layouts
- `src/components/` → Reusable components
- `src/content/` → Blog posts (Markdown)
- `public/` → Static assets

## Conventions
- Use `.astro` components. No React/Vue unless explicitly requested.
- Blog posts live in `src/content/blog/` with frontmatter: title, date, description.
- Styling: Use scoped `<style>` in `.astro` files. No Tailwind unless added.

## Gotchas
- `yarn build` outputs to `dist/`
- Never edit files in `dist/` — it's generated


<!-- ## Development

When starting the dev server, use background mode:

```
astro dev --background
``` -->

<!-- Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`. -->

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
