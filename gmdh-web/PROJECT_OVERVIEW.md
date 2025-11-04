# gmdh web app - project overview

## what was built

a complete web application that brings the c-based gmdh algorithm to the browser, allowing users to upload csv datasets and run polynomial modeling analysis without any installation or setup.

## architecture

### frontend
- **framework**: next.js 14 with app router
- **language**: typescript
- **styling**: tailwindcss
- **csv parsing**: papaparse library

### algorithm
- **implementation**: pure javascript/typescript port of the c algorithm
- **no dependencies**: self-contained linear algebra (gaussian elimination)
- **algorithms**: both combinatorial and multi-row gmdh variants

### components structure

```
src/
├── app/
│   ├── page.tsx           # main page with upload + orchestration
│   ├── layout.tsx         # root layout
│   └── globals.css        # global styles
├── components/
│   ├── DataPreview.tsx    # csv preview + target selection
│   ├── GMDHRunner.tsx     # run button + progress
│   └── ModelResults.tsx   # results visualization + export
└── lib/
    └── gmdh.ts           # core algorithm implementation
```

## key features

### 1. csv upload
- drag-and-drop or file picker
- automatic numeric parsing
- nan handling for missing values
- sample dataset included

### 2. data preview
- shows first 5 rows of data
- highlights target column
- displays dataset dimensions
- interactive column selection

### 3. gmdh algorithms

**combinatorial gmdh**
- exhaustive one-shot search
- tests all feature pairs
- quadratic polynomials: y = a₀ + a₁x₁ + a₂x₂ + a₃x₁² + a₄x₂² + a₅x₁x₂
- returns top 10 models ranked by validation rmse

**multi-row gmdh**
- iterative layer construction
- each layer uses best models from previous layer
- 3 layers, 5 models per layer
- automatic feature engineering through composition

### 4. results visualization
- summary card with train/validation split
- best overall model highlighted
- top models from each algorithm
- polynomial equations in readable format
- rmse and r² metrics
- variance explained percentage

### 5. export
- json download of complete results
- includes all model coefficients
- preserves layer structure for multi-row

## algorithm implementation

### polynomial fitting
uses normal equations: X'X·β = X'y

solved via gaussian elimination with partial pivoting:
1. forward elimination
2. back substitution

### metrics
- **rmse**: root mean square error on validation set
- **r²**: coefficient of determination (variance explained)

### train/test split
- 70% training
- 30% validation
- stratified by index (no shuffling)

## technical decisions

### why typescript instead of wasm?
- easier to maintain and modify
- no build complexity
- fast enough for typical datasets (< 1000 samples)
- better debugging experience
- avoids wasm async loading complexity

### why next.js?
- modern react framework
- excellent developer experience
- built-in optimization
- easy deployment to vercel/netlify
- server components for future enhancements

### why no database?
- purely client-side processing
- no data leaves user's browser
- privacy-focused
- zero backend costs
- instant startup

## performance characteristics

### time complexity
- **combinatorial**: O(n² · m) where n=features, m=samples
- **multi-row**: O(k · n² · m) where k=layers

### space complexity
- O(n · m) for dataset storage
- O(n²) for model storage

### practical limits
- works well: < 1000 samples, < 20 features
- acceptable: < 5000 samples, < 50 features
- slow: > 10000 samples or > 100 features

## future enhancements

potential improvements:
- web worker for non-blocking computation
- progress bar with estimated time remaining
- model comparison charts (recharts already included)
- cross-validation instead of single split
- feature importance visualization
- prediction interface for new data
- wasm port for large datasets
- model persistence (localStorage)
- interactive polynomial equation editor

## deployment

ready to deploy to:
- vercel (recommended, zero config)
- netlify
- cloudflare pages
- any static host

```bash
npm run build
# outputs to .next/ directory
```

## comparison with c version

| aspect | c version | web version |
|--------|-----------|-------------|
| speed | faster (native) | slower (js) |
| portability | compile required | runs in browser |
| ui | command line | interactive web |
| data input | csv file path | upload or sample |
| output | terminal + html | interactive display |
| dependencies | gcc, make | modern browser |
| audience | developers | everyone |

## conclusion

successfully created a production-ready web application that democratizes access to gmdh analysis. users can now perform sophisticated polynomial modeling without technical expertise or software installation.

the pure typescript implementation proves that complex numerical algorithms can run effectively in the browser, making scientific computing accessible to a broader audience.
