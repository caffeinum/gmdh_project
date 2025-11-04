# gmdh web interface

web app for running group method of data handling (gmdh) analysis on csv datasets

## features

- **csv upload** - drag and drop or select csv files
- **interactive column selection** - choose target variable from your dataset
- **combinatorial gmdh** - exhaustive search through all feature pairs
- **multi-row gmdh** - evolutionary layers that breed better features
- **results visualization** - see polynomial equations, rmse, and r² scores
- **json export** - download complete results for further analysis

## getting started

```bash
npm install
npm run dev
```

open [http://localhost:3000](http://localhost:3000)

## usage

1. **upload csv file** - click to select or drag a csv file with numeric data
2. **select target column** - choose which column to predict
3. **run analysis** - click "run analysis" to execute gmdh algorithms
4. **view results** - explore top models from both algorithms
5. **export** - download results as json

## how it works

gmdh builds polynomial models automatically by:
- testing pairs of features
- fitting quadratic polynomials: y = a₀ + a₁x₁ + a₂x₂ + a₃x₁² + a₄x₂² + a₅x₁x₂
- keeping the best models based on validation error
- stacking them into deeper layers (multi-row only)

**combinatorial**: one-shot exhaustive search  
**multi-row**: iterative layer-by-layer construction

## tech stack

- next.js 14 (app router)
- typescript
- tailwindcss
- papaparse (csv parsing)
- pure js implementation of gmdh (no wasm needed)

## algorithm source

based on the c implementation in parent directory (`../`)

invented by alexey ivakhnenko (ukraine, 1968) - early form of automated machine learning
