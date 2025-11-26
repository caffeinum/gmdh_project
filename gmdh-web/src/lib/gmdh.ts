export interface PolynomialModel {
  coeffs: number[];
  feature1: number;
  feature2: number;
  error: number;
  r2: number;
}

export interface GMDHLayer {
  models: PolynomialModel[];
  layer: number;
}

export interface Dataset {
  features: number[][];
  target: number[];
  nSamples: number;
  nFeatures: number;
}

export interface GMDHResults {
  combinatorial: PolynomialModel[];
  multirow: GMDHLayer[];
  trainSize: number;
  validSize: number;
}

// fit polynomial: y = a0 + a1*x1 + a2*x2 + a3*x1^2 + a4*x2^2 + a5*x1*x2
function fitPolynomial(
  x1: number[],
  x2: number[],
  y: number[]
): number[] | null {
  const n = y.length;
  const nCoeffs = 6;

  // build design matrix
  const X: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (isNaN(x1[i]) || isNaN(x2[i]) || isNaN(y[i])) {
      X.push([0, 0, 0, 0, 0, 0]);
      continue;
    }
    X.push([
      1.0,
      x1[i],
      x2[i],
      x1[i] * x1[i],
      x2[i] * x2[i],
      x1[i] * x2[i],
    ]);
  }

  // build normal equations: X'X * coeffs = X'y
  const XtX: number[][] = Array(nCoeffs)
    .fill(0)
    .map(() => Array(nCoeffs).fill(0));
  const Xty: number[] = Array(nCoeffs).fill(0);

  for (let i = 0; i < nCoeffs; i++) {
    for (let j = 0; j < nCoeffs; j++) {
      for (let k = 0; k < n; k++) {
        if (!isNaN(y[k])) {
          XtX[i][j] += X[k][i] * X[k][j];
        }
      }
    }
    for (let k = 0; k < n; k++) {
      if (!isNaN(y[k])) {
        Xty[i] += X[k][i] * y[k];
      }
    }
  }

  // solve linear system using gaussian elimination
  return solveLinearSystem(XtX, Xty);
}

function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  // forward elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }

    // swap rows
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

    // check for singular matrix
    if (Math.abs(aug[i][i]) < 1e-10) {
      return null;
    }

    // eliminate
    for (let k = i + 1; k < n; k++) {
      const factor = aug[k][i] / aug[i][i];
      for (let j = i; j <= n; j++) {
        aug[k][j] -= factor * aug[i][j];
      }
    }
  }

  // back substitution
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= aug[i][j] * x[j];
    }
    x[i] /= aug[i][i];
  }

  return x;
}

function predictPolynomial(x1: number, x2: number, coeffs: number[]): number {
  return (
    coeffs[0] +
    coeffs[1] * x1 +
    coeffs[2] * x2 +
    coeffs[3] * x1 * x1 +
    coeffs[4] * x2 * x2 +
    coeffs[5] * x1 * x2
  );
}

function calculateRMSE(pred: number[], actual: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < pred.length; i++) {
    if (!isNaN(pred[i]) && !isNaN(actual[i])) {
      const diff = pred[i] - actual[i];
      sum += diff * diff;
      count++;
    }
  }
  return count > 0 ? Math.sqrt(sum / count) : Infinity;
}

function calculateR2(pred: number[], actual: number[]): number {
  let mean = 0;
  let count = 0;

  for (let i = 0; i < actual.length; i++) {
    if (!isNaN(actual[i])) {
      mean += actual[i];
      count++;
    }
  }
  mean /= count;

  let ssTot = 0,
    ssRes = 0;
  for (let i = 0; i < pred.length; i++) {
    if (!isNaN(pred[i]) && !isNaN(actual[i])) {
      ssTot += (actual[i] - mean) * (actual[i] - mean);
      ssRes += (actual[i] - pred[i]) * (actual[i] - pred[i]);
    }
  }

  return 1.0 - ssRes / ssTot;
}

function splitDataset(
  data: number[][],
  target: number[],
  trainRatio: number
): { train: Dataset; valid: Dataset } {
  const n = data.length;
  const trainSize = Math.floor(n * trainRatio);

  const trainFeatures = data.slice(0, trainSize);
  const trainTarget = target.slice(0, trainSize);

  const validFeatures = data.slice(trainSize);
  const validTarget = target.slice(trainSize);

  return {
    train: {
      features: trainFeatures,
      target: trainTarget,
      nSamples: trainFeatures.length,
      nFeatures: trainFeatures[0]?.length || 0,
    },
    valid: {
      features: validFeatures,
      target: validTarget,
      nSamples: validFeatures.length,
      nFeatures: validFeatures[0]?.length || 0,
    },
  };
}

export function combinatorialGMDH(
  train: Dataset,
  valid: Dataset
): PolynomialModel[] {
  const models: PolynomialModel[] = [];
  const nFeatures = train.nFeatures;

  // try all pairs of features
  for (let i = 0; i < nFeatures; i++) {
    for (let j = i + 1; j < nFeatures; j++) {
      const x1Train = train.features.map((row) => row[i]);
      const x2Train = train.features.map((row) => row[j]);

      const coeffs = fitPolynomial(x1Train, x2Train, train.target);
      if (!coeffs) continue;

      // evaluate on validation set
      const x1Valid = valid.features.map((row) => row[i]);
      const x2Valid = valid.features.map((row) => row[j]);
      const predictions = x1Valid.map((x1, idx) =>
        predictPolynomial(x1, x2Valid[idx], coeffs)
      );

      const error = calculateRMSE(predictions, valid.target);
      const r2 = calculateR2(predictions, valid.target);

      models.push({
        coeffs,
        feature1: i,
        feature2: j,
        error,
        r2,
      });
    }
  }

  // sort by error
  models.sort((a, b) => a.error - b.error);
  return models;
}

export function multirowGMDH(
  train: Dataset,
  valid: Dataset,
  nLayers: number,
  modelsPerLayer: number
): GMDHLayer[] {
  const layers: GMDHLayer[] = [];

  let currentTrain = { ...train };
  let currentValid = { ...valid };

  for (let layer = 0; layer < nLayers; layer++) {
    const models = combinatorialGMDH(currentTrain, currentValid);

    // keep top models
    const topModels = models.slice(0, modelsPerLayer);
    layers.push({ models: topModels, layer });

    if (topModels.length === 0) break;

    // prepare features for next layer (predictions from top models)
    const nextTrainFeatures: number[][] = Array(currentTrain.nSamples)
      .fill(0)
      .map(() => []);
    const nextValidFeatures: number[][] = Array(currentValid.nSamples)
      .fill(0)
      .map(() => []);

    for (const model of topModels) {
      // generate predictions for training set
      for (let i = 0; i < currentTrain.nSamples; i++) {
        const x1 = currentTrain.features[i][model.feature1];
        const x2 = currentTrain.features[i][model.feature2];
        const pred = predictPolynomial(x1, x2, model.coeffs);
        nextTrainFeatures[i].push(pred);
      }

      // generate predictions for validation set
      for (let i = 0; i < currentValid.nSamples; i++) {
        const x1 = currentValid.features[i][model.feature1];
        const x2 = currentValid.features[i][model.feature2];
        const pred = predictPolynomial(x1, x2, model.coeffs);
        nextValidFeatures[i].push(pred);
      }
    }

    // check if we have enough features for next layer
    if (nextTrainFeatures[0].length < 2) break;

    currentTrain = {
      features: nextTrainFeatures,
      target: currentTrain.target,
      nSamples: nextTrainFeatures.length,
      nFeatures: nextTrainFeatures[0].length,
    };

    currentValid = {
      features: nextValidFeatures,
      target: currentValid.target,
      nSamples: nextValidFeatures.length,
      nFeatures: nextValidFeatures[0].length,
    };
  }

  return layers;
}

export function runGMDH(
  data: number[][],
  targetColumn: number,
  trainRatio: number = 0.7
): GMDHResults {
  // separate features and target
  const features = data.map((row) =>
    row.filter((_, idx) => idx !== targetColumn)
  );
  const target = data.map((row) => row[targetColumn]);

  // split into train/validation
  const { train, valid } = splitDataset(features, target, trainRatio);

  // run combinatorial gmdh
  const combModels = combinatorialGMDH(train, valid);

  // run multi-row gmdh
  const layers = multirowGMDH(train, valid, 3, 5);

  return {
    combinatorial: combModels.slice(0, 10), // top 10 models
    multirow: layers,
    trainSize: train.nSamples,
    validSize: valid.nSamples,
  };
}
