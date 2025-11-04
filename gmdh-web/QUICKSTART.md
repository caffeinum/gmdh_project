# quickstart guide

## installation

```bash
npm install
```

## run development server

```bash
npm run dev
```

open [http://localhost:3000](http://localhost:3000) in your browser

## build for production

```bash
npm run build
npm start
```

## using the app

1. click "load sample dataset" button to load the water quality dataset
   - or upload your own csv file with numeric data
   
2. select a target column by clicking one of the column buttons
   - this is the variable you want to predict
   
3. click "run analysis" to execute both gmdh algorithms
   - combinatorial: exhaustive search (faster)
   - multi-row: iterative layers (more powerful)
   
4. view results showing:
   - top models ranked by validation error
   - polynomial equations for each model
   - rmse and r² scores
   - variance explained percentage
   
5. download results as json for further analysis

## sample dataset

the included `water_quality.csv` contains:
- 595 samples from a water treatment plant
- 39 features (sensor readings, flow rates, chemical measurements)
- try predicting `pH_tank3` (column 24) for best results

## tips

- datasets with 5-20 features work best
- larger datasets may take longer to process
- combinatorial scales as O(n²) where n = number of features
- multi-row builds on top of combinatorial results

## troubleshooting

**parsing error**: make sure csv has headers and numeric data

**slow performance**: try using fewer features or smaller dataset

**no results**: check that data contains valid numeric values
