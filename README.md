# B4RRHH — payroll designer

**B4RRHH is a personnel administration system and a configurable payroll engine.**
Employment history is temporal by construction — the domain itself refuses overlaps and
gaps instead of hoping the database will catch them — and payroll is computed from a
dependency graph that is configuration rather than code, so any amount on a payslip can be
opened all the way down to the step that produced it.

This repository is where that graph is drawn — and edited. Everything else — the other
repositories and the documents they share — starts at **`b4rrhh/workspace`**, which is
[`../README.md`](../README.md) once it is laid out beside this one.

---

## What it is

The engine calculates from configuration: concepts, the operands they read, the feeds that
connect them, the assignments that decide who each one applies to, and the salary tables
they look values up in. All of that is rows in a database. Reading it as rows is possible;
understanding it is not.

So the designer draws it, and lets you change it:

| Screen | What you do there |
|---|---|
| **Canvas** | The concept graph. Follow what feeds what, open a concept and see how it computes. |
| **Objects** | Payroll objects and their salary tables, down to the row. |
| **Assignments** | Who a concept applies to, and from when. |

It writes for real — concepts, operands, feeds, assignments and salary-table rows. Adding a
payroll concept is work done here, not in Java.

There is a fourth way in: **receipt mode**. The same canvas opened for one specific
payslip, so the graph shows the values that produced *that* receipt. The backoffice embeds
it in a drawer, which is why the route carries the receipt's whole business key —
presence number included, because it cannot be assumed.

## It does not live on its own domain

The designer hangs off **`/designer/` of the same origin as the backoffice**. That is not
a deployment convenience: same origin is what makes the two share `localStorage` and, with
it, the session, and what lets the embedded canvas talk to the backoffice with
`postMessage` without crossing a boundary.

In the demo, the backoffice's nginx proxies `/designer/` to this container. In development
there is no nginx, so the backoffice's dev server mirrors that one rule.

## Running it

**You need** Node and the backend running on `localhost:8080`.

```bash
npm install
npm run dev      # Vite on 5173, serving under /designer/
```

Two dev servers, and you open the **backoffice**, never this one directly:

```bash
cd ../b4rrhh_designer && npm run dev    # 5173
cd ../b4rrhh_frontend && npm start      # 4200, proxies /api and /designer
```

Opening `localhost:5173` directly gets you a designer with no session and an embed that is
cross-origin — which fails in confusing ways rather than obvious ones.

```bash
npm run build    # tsc -b && vite build — this is what type-checks the project
npm test
npm run lint:colors
npm run lint:api-paths
```

`npm run build` is in the test suite on purpose: `npm run dev` does not type-check, so
without the build nothing does.

## The contract, and its three locks

The backend owns the API contract. This repository versions a copy of it in `openapi/` and
generates `src/api/schema.d.ts` from that copy. **Neither is written by hand.**

```bash
npm run api:pull       # bring the contract from a sibling b4rrhh_backend checkout
npm run api:generate   # regenerate schema.d.ts from the local copy
npm run api:refresh    # both
```

The generator version is pinned in `package.json` and the installed binary is the one
invoked — never an `npx …@latest` — because two generator versions write different files
without the contract changing at all.

That chain has three links, and each one has a lock, because a chain is only worth the
weakest:

| Lock | What it refuses |
|---|---|
| `api:check` | The versioned `.yaml` is not the one on the backend's `main`. |
| `api:check:types` | `schema.d.ts` is not what generating that `.yaml` produces — an `api:pull` whose `api:generate` never happened. |
| `lint:api-paths` | The code calls an API path that `schema.d.ts` does not declare. |

The third one exists because the first two, on their own, protected a file nothing
imported: calls carried their paths written by hand, and one of them had been served,
undeclared and happily called, for months. A lock at the end of a chain that stops short of
the code is a lock on a door nobody uses.

## Visual identity

The application icons in `public/` and the logotype in `public/brand/` are **copies** of
`b4rrhh_frontend/public/`. The source is the generator in `b4rrhh_frontend/tools/identidad/`,
and the rules are in `b4rrhh_frontend/docs/identidad-visual.md`. They are not retouched
here: if the brand changes, it is regenerated there and copied again.

The only file that is genuinely this repository's is `site.webmanifest`, which hangs off
`/designer/` and carries its own name.

## Tech

React, TypeScript, Vite, Tailwind, Vitest.

## License

Business Source License. The source is visible for learning and evaluation; commercial use
needs an explicit licence. See [`LICENSE.md`](LICENSE.md) and [`NOTICE.md`](NOTICE.md).
