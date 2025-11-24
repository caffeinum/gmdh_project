#include "gmdh.h"

// fit linear model: y = a0 + a1*x1 + a2*x2 + ... + an*xn
static void fit_linear_multivariate(double **X, double *y, int n_samples, int n_features, double *coeffs) {
    int n_coeffs = n_features + 1; // +1 for intercept

    // build design matrix with intercept column
    double **design = malloc(n_samples * sizeof(double*));
    for (int i = 0; i < n_samples; i++) {
        design[i] = malloc(n_coeffs * sizeof(double));
        design[i][0] = 1.0; // intercept
        for (int j = 0; j < n_features; j++) {
            design[i][j + 1] = X[i][j];
        }
    }

    // build normal equations: X'X * coeffs = X'y
    double **XtX = malloc(n_coeffs * sizeof(double*));
    double *Xty = malloc(n_coeffs * sizeof(double));

    for (int i = 0; i < n_coeffs; i++) {
        XtX[i] = malloc(n_coeffs * sizeof(double));
        for (int j = 0; j < n_coeffs; j++) {
            XtX[i][j] = 0;
            for (int k = 0; k < n_samples; k++) {
                XtX[i][j] += design[k][i] * design[k][j];
            }
        }
        Xty[i] = 0;
        for (int k = 0; k < n_samples; k++) {
            Xty[i] += design[k][i] * y[k];
        }
    }

    // solve using gaussian elimination
    double **aug = malloc(n_coeffs * sizeof(double*));
    for (int i = 0; i < n_coeffs; i++) {
        aug[i] = malloc((n_coeffs + 1) * sizeof(double));
        memcpy(aug[i], XtX[i], n_coeffs * sizeof(double));
        aug[i][n_coeffs] = Xty[i];
    }

    // forward elimination
    for (int i = 0; i < n_coeffs; i++) {
        int max_row = i;
        for (int k = i + 1; k < n_coeffs; k++) {
            if (fabs(aug[k][i]) > fabs(aug[max_row][i])) {
                max_row = k;
            }
        }
        double *tmp = aug[i];
        aug[i] = aug[max_row];
        aug[max_row] = tmp;

        if (fabs(aug[i][i]) < 1e-10) {
            // singular matrix, set coeffs to 0
            for (int j = 0; j < n_coeffs; j++) {
                coeffs[j] = 0;
            }
            goto cleanup;
        }

        for (int k = i + 1; k < n_coeffs; k++) {
            double factor = aug[k][i] / aug[i][i];
            for (int j = i; j <= n_coeffs; j++) {
                aug[k][j] -= factor * aug[i][j];
            }
        }
    }

    // back substitution
    for (int i = n_coeffs - 1; i >= 0; i--) {
        coeffs[i] = aug[i][n_coeffs];
        for (int j = i + 1; j < n_coeffs; j++) {
            coeffs[i] -= aug[i][j] * coeffs[j];
        }
        coeffs[i] /= aug[i][i];
    }

cleanup:
    for (int i = 0; i < n_samples; i++) {
        free(design[i]);
    }
    free(design);
    for (int i = 0; i < n_coeffs; i++) {
        free(XtX[i]);
        free(aug[i]);
    }
    free(XtX);
    free(Xty);
    free(aug);
}

static double predict_linear(double *x, double *coeffs, int n_features) {
    double result = coeffs[0]; // intercept
    for (int i = 0; i < n_features; i++) {
        result += coeffs[i + 1] * x[i];
    }
    return result;
}

// combinatorial linear gmdh: try all subsets of features
linear_model_t* linear_combinatorial_gmdh(dataset_t *train, dataset_t *valid,
                                          int min_features, int max_features,
                                          int *n_models_out) {
    // count total combinations
    int total_combinations = 0;
    for (int s = min_features; s <= max_features; s++) {
        // approximate C(n,k) for counting
        int count = 1;
        for (int i = 0; i < s; i++) {
            count = count * (train->n_features - i) / (i + 1);
        }
        total_combinations += count;
    }

    printf("testing up to %d feature combinations...\n", total_combinations);

    linear_model_t *models = malloc(total_combinations * sizeof(linear_model_t));
    int model_idx = 0;

    // iterate through all subset sizes
    for (int subset_size = min_features; subset_size <= max_features; subset_size++) {
        // generate all combinations of subset_size features
        int *indices = malloc(subset_size * sizeof(int));
        for (int i = 0; i < subset_size; i++) {
            indices[i] = i;
        }

        int done = 0;
        while (!done) {
            // extract features for this combination
            double **X_train = malloc(train->n_samples * sizeof(double*));
            double **X_valid = malloc(valid->n_samples * sizeof(double*));

            for (int i = 0; i < train->n_samples; i++) {
                X_train[i] = malloc(subset_size * sizeof(double));
                for (int j = 0; j < subset_size; j++) {
                    X_train[i][j] = train->data[i][indices[j]];
                }
            }

            for (int i = 0; i < valid->n_samples; i++) {
                X_valid[i] = malloc(subset_size * sizeof(double));
                for (int j = 0; j < subset_size; j++) {
                    X_valid[i][j] = valid->data[i][indices[j]];
                }
            }

            // fit model
            double *coeffs = malloc((subset_size + 1) * sizeof(double));
            fit_linear_multivariate(X_train, train->target, train->n_samples, subset_size, coeffs);

            // evaluate on validation set
            double *predictions = malloc(valid->n_samples * sizeof(double));
            for (int i = 0; i < valid->n_samples; i++) {
                predictions[i] = predict_linear(X_valid[i], coeffs, subset_size);
            }

            double error = calculate_rmse(predictions, valid->target, valid->n_samples);
            double r2 = calculate_r2(predictions, valid->target, valid->n_samples);

            // store model
            models[model_idx].coeffs = coeffs;
            models[model_idx].feature_indices = malloc(subset_size * sizeof(int));
            memcpy(models[model_idx].feature_indices, indices, subset_size * sizeof(int));
            models[model_idx].n_features = subset_size;
            models[model_idx].error = error;
            models[model_idx].r2 = r2;

            model_idx++;

            // cleanup
            for (int i = 0; i < train->n_samples; i++) {
                free(X_train[i]);
            }
            free(X_train);
            for (int i = 0; i < valid->n_samples; i++) {
                free(X_valid[i]);
            }
            free(X_valid);
            free(predictions);

            // next combination
            int i = subset_size - 1;
            while (i >= 0 && indices[i] == train->n_features - subset_size + i) {
                i--;
            }
            if (i < 0) {
                done = 1;
            } else {
                indices[i]++;
                for (int j = i + 1; j < subset_size; j++) {
                    indices[j] = indices[j - 1] + 1;
                }
            }
        }

        free(indices);
    }

    *n_models_out = model_idx;

    // sort by error
    for (int i = 0; i < model_idx - 1; i++) {
        for (int j = 0; j < model_idx - i - 1; j++) {
            if (models[j].error > models[j + 1].error) {
                linear_model_t tmp = models[j];
                models[j] = models[j + 1];
                models[j + 1] = tmp;
            }
        }
    }

    return models;
}

void print_linear_model(linear_model_t *model, char **feature_names) {
    printf("y = %.3f", model->coeffs[0]);
    for (int i = 0; i < model->n_features; i++) {
        printf(" %c %.3f*%s",
               model->coeffs[i + 1] >= 0 ? '+' : '-',
               fabs(model->coeffs[i + 1]),
               feature_names[model->feature_indices[i]]);
    }
    printf("\n");
    printf("  rmse: %.4f, r²: %.4f, features: %d\n", model->error, model->r2, model->n_features);
}

void free_linear_models(linear_model_t *models, int n_models) {
    for (int i = 0; i < n_models; i++) {
        free(models[i].coeffs);
        free(models[i].feature_indices);
    }
    free(models);
}
