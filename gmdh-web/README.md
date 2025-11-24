# gmdh web interface with ai

ai-powered web app for running group method of data handling (gmdh) analysis on csv datasets

## features

### core gmdh
- **csv upload** - drag and drop or select csv files
- **interactive column selection** - choose target variable from your dataset
- **combinatorial gmdh** - exhaustive search through all feature pairs
- **multi-row gmdh** - evolutionary layers that breed better features
- **results visualization** - see polynomial equations, rmse, and r² scores

### ai-powered features (new!)
- **ai data preprocessing** - intelligent suggestions for cleaning and preparing data
- **ai algorithm selection** - recommendations on which gmdh variant to use
- **ai results analysis** - automated interpretation of model performance and insights
- **coding agent** - interactive ai assistant for custom implementations and debugging

## getting started

```bash
bun install
bun run dev
```

create `.env` file with your api keys:
```bash
cp .env.example .env
# add OPENAI_API_KEY=your_key_here
```

open [http://localhost:3000](http://localhost:3000)

## usage

### main workflow (with ai)

1. **upload csv file** - click to select or drag a csv file with numeric data
2. **ai preprocessing** - get intelligent suggestions for data preparation
3. **select target column** - choose which column to predict
4. **ai algorithm selection** - receive recommendations on best gmdh variant
5. **run analysis** - execute gmdh algorithms
6. **ai results analysis** - get automated insights and recommendations

### coding agent

visit `/agent` for an interactive ai assistant that helps with:
- writing custom preprocessing code
- implementing new features
- debugging issues
- understanding gmdh concepts

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
- vercel ai sdk + ai gateway
- tailwindcss
- recharts (visualization)
- papaparse (csv parsing)
- pure js implementation of gmdh (no wasm needed)

## algorithm source

based on the c implementation in parent directory (`../`)

invented by alexey ivakhnenko (ukraine, 1968) - early form of automated machine learning
