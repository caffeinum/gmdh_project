---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## GMDH Implementation

This project implements GMDH (Group Method of Data Handling) in C.

### Two Implementations:

1. **Quadratic Pairs** (`gmdh_combinatorial.c`):
   - Tries all pairs of features (xi, xj)
   - Fits bivariate quadratic polynomials: `y = a0 + a1*xi + a2*xj + a3*xi² + a4*xj² + a5*xi*xj`
   - Good for modeling non-linear relationships

2. **Linear Multivariate** (`gmdh_linear_combinatorial.c`):
   - Tries all subsets of features (any combination size)
   - Fits simple linear regression: `y = a0 + a1*x1 + a2*x2 + ... + an*xn`
   - Matches classical GMDH papers methodology
   - Use this for reproducing academic results

### Building and Testing:

```bash
make clean && make all    # build all binaries
make example              # run test on example_test_sample.csv
make run                  # run water quality demo
make test                 # run unit tests
```

### Key Files:

- `gmdh.h` - main header with type definitions
- `data.c` - csv loading and data utilities
- `polynomial.c` - polynomial fitting and evaluation
- `gmdh_combinatorial.c` - quadratic pairs approach
- `gmdh_linear_combinatorial.c` - linear multivariate approach
- `gmdh_multirow.c` - multi-layer GMDH
- `test_example.c` - test on academic paper sample data

## GMDH Web Interface (gmdh-web/)

ai-powered web interface built with next.js 14 and vercel ai sdk.

### ai features:

1. **data preprocessing** (`/api/ai/preprocess`) - analyzes dataset statistics and suggests cleaning steps
2. **algorithm selection** (`/api/ai/algorithm-select`) - recommends which gmdh variant based on data characteristics
3. **results analysis** (`/api/ai/analyze`) - interprets model performance and provides insights
4. **coding agent** (`/agent`) - interactive ai assistant for custom implementations

### tech stack:

- next.js 14 with app router
- vercel ai sdk v5 (`ai`, `@ai-sdk/react`, `@ai-sdk/gateway`)
- react-markdown for ai response rendering
- typescript
- tailwindcss + recharts
- pure typescript gmdh implementation

### key patterns:

```tsx
// useChat with DefaultChatTransport for custom api endpoints
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const transport = useMemo(
  () => new DefaultChatTransport({ api: "/api/ai/endpoint", body: { data } }),
  [data]
);
const { messages, status, sendMessage } = useChat({ transport });

// status values: "streaming" | "submitted" | "ready"
// send message: sendMessage({ text: "..." })
```

```tsx
// api route with gateway
import { createGateway } from "@ai-sdk/gateway";
import { streamText } from "ai";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

export async function POST(req: Request) {
  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    messages,
  });
  return result.toUIMessageStreamResponse();
}
```

### setup:

```bash
cd gmdh-web
bun install
cp .env.example .env  # add AI_GATEWAY_API_KEY
bun run dev
```

### workflow:

1. upload csv → 2. ai preprocessing suggestions → 3. select target → 4. ai algorithm recommendation → 5. run gmdh → 6. ai analysis

components: `AIPreprocessing`, `AIAlgorithmSelect`, `AIAnalysis` all use `useChat` from `@ai-sdk/react` with `DefaultChatTransport`
