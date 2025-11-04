#include "gmdh.h"

// solve Ax = b using gaussian elimination
static void solve_linear_system(double **A, double *b, double *x, int n) {
    double **aug = malloc(n * sizeof(double*));
    for (int i = 0; i < n; i++) {
        aug[i] = malloc((n + 1) * sizeof(double));
        memcpy(aug[i], A[i], n * sizeof(double));
        aug[i][n] = b[i];
    }
    
    // forward elimination
    for (int i = 0; i < n; i++) {
        // find pivot
        int max_row = i;
        for (int k = i + 1; k < n; k++) {
            if (fabs(aug[k][i]) > fabs(aug[max_row][i])) {
                max_row = k;
            }
        }
        
        // swap rows
        double *tmp = aug[i];
        aug[i] = aug[max_row];
        aug[max_row] = tmp;
        
        // eliminate
        for (int k = i + 1; k < n; k++) {
            double factor = aug[k][i] / aug[i][i];
            for (int j = i; j <= n; j++) {
                aug[k][j] -= factor * aug[i][j];
            }
        }
    }
    
    // back substitution
    for (int i = n - 1; i >= 0; i--) {
        x[i] = aug[i][n];
        for (int j = i + 1; j < n; j++) {
            x[i] -= aug[i][j] * x[j];
        }
        x[i] /= aug[i][i];
    }
    
    for (int i = 0; i < n; i++) {
        free(aug[i]);
    }
    free(aug);
}

// fit polynomial: y = a0 + a1*x1 + a2*x2 + a3*x1^2 + a4*x2^2 + a5*x1*x2
void fit_polynomial(double *x1, double *x2, double *y, int n, double *coeffs) {
    const int n_coeffs = 6;
    double **X = malloc(n * sizeof(double*));
    
    // build design matrix
    for (int i = 0; i < n; i++) {
        X[i] = malloc(n_coeffs * sizeof(double));
        if (isnan(x1[i]) || isnan(x2[i]) || isnan(y[i])) {
            // skip missing values
            for (int j = 0; j < n_coeffs; j++) {
                X[i][j] = 0;
            }
            continue;
        }
        X[i][0] = 1.0;
        X[i][1] = x1[i];
        X[i][2] = x2[i];
        X[i][3] = x1[i] * x1[i];
        X[i][4] = x2[i] * x2[i];
        X[i][5] = x1[i] * x2[i];
    }
    
    // build normal equations: X'X * coeffs = X'y
    double **XtX = malloc(n_coeffs * sizeof(double*));
    double *Xty = malloc(n_coeffs * sizeof(double));
    
    for (int i = 0; i < n_coeffs; i++) {
        XtX[i] = malloc(n_coeffs * sizeof(double));
        for (int j = 0; j < n_coeffs; j++) {
            XtX[i][j] = 0;
            for (int k = 0; k < n; k++) {
                if (!isnan(y[k])) {
                    XtX[i][j] += X[k][i] * X[k][j];
                }
            }
        }
        Xty[i] = 0;
        for (int k = 0; k < n; k++) {
            if (!isnan(y[k])) {
                Xty[i] += X[k][i] * y[k];
            }
        }
    }
    
    // solve system
    solve_linear_system(XtX, Xty, coeffs, n_coeffs);
    
    // cleanup
    for (int i = 0; i < n; i++) {
        free(X[i]);
    }
    free(X);
    
    for (int i = 0; i < n_coeffs; i++) {
        free(XtX[i]);
    }
    free(XtX);
    free(Xty);
}

double predict_polynomial(double x1, double x2, double *coeffs) {
    return coeffs[0] + 
           coeffs[1] * x1 + 
           coeffs[2] * x2 + 
           coeffs[3] * x1 * x1 + 
           coeffs[4] * x2 * x2 + 
           coeffs[5] * x1 * x2;
}

double calculate_rmse(double *pred, double *actual, int n) {
    double sum = 0;
    int count = 0;
    for (int i = 0; i < n; i++) {
        if (!isnan(pred[i]) && !isnan(actual[i])) {
            double diff = pred[i] - actual[i];
            sum += diff * diff;
            count++;
        }
    }
    return count > 0 ? sqrt(sum / count) : INFINITY;
}

double calculate_r2(double *pred, double *actual, int n) {
    double mean = 0;
    int count = 0;
    
    for (int i = 0; i < n; i++) {
        if (!isnan(actual[i])) {
            mean += actual[i];
            count++;
        }
    }
    mean /= count;
    
    double ss_tot = 0, ss_res = 0;
    for (int i = 0; i < n; i++) {
        if (!isnan(pred[i]) && !isnan(actual[i])) {
            ss_tot += (actual[i] - mean) * (actual[i] - mean);
            ss_res += (actual[i] - pred[i]) * (actual[i] - pred[i]);
        }
    }
    
    return 1.0 - (ss_res / ss_tot);
}

void print_model(polynomial_model_t *model, char **feature_names) {
    printf("model: f(%s, %s)\n", 
           feature_names[model->feature1], 
           feature_names[model->feature2]);
    printf("  y = %.4f + %.4f*x1 + %.4f*x2 + %.4f*x1² + %.4f*x2² + %.4f*x1*x2\n",
           model->coeffs[0], model->coeffs[1], model->coeffs[2],
           model->coeffs[3], model->coeffs[4], model->coeffs[5]);
    printf("  rmse: %.4f, r²: %.4f\n", model->error, model->r2);
}
