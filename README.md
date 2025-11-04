# gmdh - group method of data handling

soviet-era inductive modeling algorithms (мгуа) implemented in c

## what it does

builds polynomial models automatically by:
- testing pairs of features
- keeping the best ones
- combining them into deeper layers
- stopping when accuracy plateaus

## two algorithms

**combinatorial**: exhaustive one-shot search through all feature pairs

**multi-row**: evolutionary layers that breed better features from winners

## build & run

```bash
make          # compile
make test     # run unit tests
./bin/demo    # demo on water quality dataset
make clean    # cleanup
```

## example results

dataset: water treatment plant (595 samples, 38 features)  
target: pH_tank3 (output pH)

```
best model: multi-row layer 1
rmse: 0.30 pH units
r²: 0.993 (99.3% variance explained)
```

polynomial automatically discovered:
```
pH = 357.12 + 34.46·f₁ - 126.32·f₂ + 0.087·f₁² + 10.46·f₂² - 4.51·f₁·f₂
```

where f₁, f₂ are derived features from layer 0

## files

- `gmdh.h` - types and function declarations
- `data.c` - csv parsing, train/test split
- `polynomial.c` - least squares regression
- `gmdh_combinatorial.c` - exhaustive search
- `gmdh_multirow.c` - evolutionary layers
- `main.c` - demo program
- `test.c` - unit tests
- `water_quality.csv` - sample dataset

## how it works

each polynomial has fixed form:
```
y = a₀ + a₁x₁ + a₂x₂ + a₃x₁² + a₄x₂² + a₅x₁x₂
```

**layer 0**: fits this for all pairs of original features  
**layer 1**: fits this for all pairs of layer 0 winners  
**layer 2**: fits this for all pairs of layer 1 winners  
...

creates complex models from simple building blocks

## history

invented by alexey ivakhnenko (ukraine, 1968)  
early form of automated machine learning  
popular in soviet computing research

## license

mit
