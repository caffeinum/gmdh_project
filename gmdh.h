#ifndef GMDH_H
#define GMDH_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <time.h>

#define MAX_FEATURES 64
#define MAX_SAMPLES 2048
#define MAX_LINE 8192

typedef struct {
    double **data;
    double *target;
    int n_samples;
    int n_features;
    char **feature_names;
} dataset_t;

typedef struct {
    double coeffs[6];
    int feature1;
    int feature2;
    double error;
    double r2;
} polynomial_model_t;

typedef struct {
    polynomial_model_t *models;
    int n_models;
    int layer;
} gmdh_layer_t;

typedef struct {
    double *coeffs;
    int *feature_indices;
    int n_features;
    double error;
    double r2;
} linear_model_t;

// data loading
dataset_t* load_csv(const char *filename, int target_col);
void free_dataset(dataset_t *ds);
void split_dataset(dataset_t *ds, dataset_t **train, dataset_t **test, double train_ratio);
void normalize_dataset(dataset_t *ds, double *mean, double *std);

// polynomial regression
void fit_polynomial(double *x1, double *x2, double *y, int n, double *coeffs);
double predict_polynomial(double x1, double x2, double *coeffs);
double calculate_rmse(double *pred, double *actual, int n);
double calculate_r2(double *pred, double *actual, int n);

// combinatorial gmdh (quadratic pairs)
polynomial_model_t* combinatorial_gmdh(dataset_t *train, dataset_t *valid, int *n_models);

// combinatorial gmdh (linear multivariate)
linear_model_t* linear_combinatorial_gmdh(dataset_t *train, dataset_t *valid,
                                          int min_features, int max_features,
                                          int *n_models);
void print_linear_model(linear_model_t *model, char **feature_names);
void free_linear_models(linear_model_t *models, int n_models);

// multi-row gmdh
gmdh_layer_t* multirow_gmdh(dataset_t *train, dataset_t *valid, int n_layers, int models_per_layer);

// utils
void print_model(polynomial_model_t *model, char **feature_names);
void print_dataset_info(dataset_t *ds);

#endif
