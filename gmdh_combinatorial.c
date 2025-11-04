#include "gmdh.h"

// combinatorial gmdh: try all pairs of features
polynomial_model_t* combinatorial_gmdh(dataset_t *train, dataset_t *valid, int *n_models) {
    int n_pairs = (train->n_features * (train->n_features - 1)) / 2;
    polynomial_model_t *models = malloc(n_pairs * sizeof(polynomial_model_t));
    
    int model_idx = 0;
    
    printf("combinatorial gmdh: trying %d feature pairs...\n", n_pairs);
    
    for (int i = 0; i < train->n_features; i++) {
        for (int j = i + 1; j < train->n_features; j++) {
            // extract features
            double *x1_train = malloc(train->n_samples * sizeof(double));
            double *x2_train = malloc(train->n_samples * sizeof(double));
            
            for (int k = 0; k < train->n_samples; k++) {
                x1_train[k] = train->data[k][i];
                x2_train[k] = train->data[k][j];
            }
            
            // fit model
            polynomial_model_t *model = &models[model_idx];
            model->feature1 = i;
            model->feature2 = j;
            
            fit_polynomial(x1_train, x2_train, train->target, train->n_samples, model->coeffs);
            
            // evaluate on validation set
            double *predictions = malloc(valid->n_samples * sizeof(double));
            for (int k = 0; k < valid->n_samples; k++) {
                predictions[k] = predict_polynomial(
                    valid->data[k][i],
                    valid->data[k][j],
                    model->coeffs
                );
            }
            
            model->error = calculate_rmse(predictions, valid->target, valid->n_samples);
            model->r2 = calculate_r2(predictions, valid->target, valid->n_samples);
            
            free(x1_train);
            free(x2_train);
            free(predictions);
            
            model_idx++;
        }
    }
    
    *n_models = model_idx;
    
    // sort by error (ascending)
    for (int i = 0; i < model_idx - 1; i++) {
        for (int j = 0; j < model_idx - i - 1; j++) {
            if (models[j].error > models[j + 1].error) {
                polynomial_model_t tmp = models[j];
                models[j] = models[j + 1];
                models[j + 1] = tmp;
            }
        }
    }
    
    printf("best model: ");
    print_model(&models[0], train->feature_names);
    
    return models;
}
