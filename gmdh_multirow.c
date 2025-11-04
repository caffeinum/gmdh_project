#include "gmdh.h"

// multi-row gmdh: layer-by-layer evolution
gmdh_layer_t* multirow_gmdh(dataset_t *train, dataset_t *valid, int n_layers, int models_per_layer) {
    gmdh_layer_t *layers = malloc(n_layers * sizeof(gmdh_layer_t));
    
    printf("multi-row gmdh: %d layers, %d models per layer\n", n_layers, models_per_layer);
    
    // layer 0: select best models from original features
    int n_pairs = (train->n_features * (train->n_features - 1)) / 2;
    polynomial_model_t *all_models = malloc(n_pairs * sizeof(polynomial_model_t));
    
    int model_idx = 0;
    for (int i = 0; i < train->n_features; i++) {
        for (int j = i + 1; j < train->n_features; j++) {
            double *x1_train = malloc(train->n_samples * sizeof(double));
            double *x2_train = malloc(train->n_samples * sizeof(double));
            
            for (int k = 0; k < train->n_samples; k++) {
                x1_train[k] = train->data[k][i];
                x2_train[k] = train->data[k][j];
            }
            
            polynomial_model_t *model = &all_models[model_idx];
            model->feature1 = i;
            model->feature2 = j;
            
            fit_polynomial(x1_train, x2_train, train->target, train->n_samples, model->coeffs);
            
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
    
    // sort by error
    for (int i = 0; i < model_idx - 1; i++) {
        for (int j = 0; j < model_idx - i - 1; j++) {
            if (all_models[j].error > all_models[j + 1].error) {
                polynomial_model_t tmp = all_models[j];
                all_models[j] = all_models[j + 1];
                all_models[j + 1] = tmp;
            }
        }
    }
    
    // keep top models
    int n_selected = models_per_layer < model_idx ? models_per_layer : model_idx;
    layers[0].models = malloc(n_selected * sizeof(polynomial_model_t));
    memcpy(layers[0].models, all_models, n_selected * sizeof(polynomial_model_t));
    layers[0].n_models = n_selected;
    layers[0].layer = 0;
    
    printf("layer 0: selected %d best models, best rmse: %.4f\n", 
           n_selected, layers[0].models[0].error);
    
    free(all_models);
    
    // subsequent layers: breed new features from previous layer outputs
    for (int layer = 1; layer < n_layers; layer++) {
        int prev_n_models = layers[layer - 1].n_models;
        
        // generate new dataset with outputs from previous layer as features
        dataset_t *new_train = malloc(sizeof(dataset_t));
        dataset_t *new_valid = malloc(sizeof(dataset_t));
        
        new_train->n_samples = train->n_samples;
        new_train->n_features = prev_n_models;
        new_train->data = malloc(train->n_samples * sizeof(double*));
        new_train->target = train->target;
        
        new_valid->n_samples = valid->n_samples;
        new_valid->n_features = prev_n_models;
        new_valid->data = malloc(valid->n_samples * sizeof(double*));
        new_valid->target = valid->target;
        
        // compute outputs from previous layer
        for (int i = 0; i < train->n_samples; i++) {
            new_train->data[i] = malloc(prev_n_models * sizeof(double));
            for (int j = 0; j < prev_n_models; j++) {
                polynomial_model_t *prev_model = &layers[layer - 1].models[j];
                new_train->data[i][j] = predict_polynomial(
                    train->data[i][prev_model->feature1],
                    train->data[i][prev_model->feature2],
                    prev_model->coeffs
                );
            }
        }
        
        for (int i = 0; i < valid->n_samples; i++) {
            new_valid->data[i] = malloc(prev_n_models * sizeof(double));
            for (int j = 0; j < prev_n_models; j++) {
                polynomial_model_t *prev_model = &layers[layer - 1].models[j];
                new_valid->data[i][j] = predict_polynomial(
                    valid->data[i][prev_model->feature1],
                    valid->data[i][prev_model->feature2],
                    prev_model->coeffs
                );
            }
        }
        
        // try all pairs from new features
        int new_n_pairs = (prev_n_models * (prev_n_models - 1)) / 2;
        if (new_n_pairs == 0) {
            printf("layer %d: not enough models to continue\n", layer);
            layers[layer].n_models = 0;
            free(new_train->data);
            free(new_train);
            free(new_valid->data);
            free(new_valid);
            break;
        }
        
        polynomial_model_t *new_models = malloc(new_n_pairs * sizeof(polynomial_model_t));
        model_idx = 0;
        
        for (int i = 0; i < prev_n_models; i++) {
            for (int j = i + 1; j < prev_n_models; j++) {
                double *x1_train = malloc(new_train->n_samples * sizeof(double));
                double *x2_train = malloc(new_train->n_samples * sizeof(double));
                
                for (int k = 0; k < new_train->n_samples; k++) {
                    x1_train[k] = new_train->data[k][i];
                    x2_train[k] = new_train->data[k][j];
                }
                
                polynomial_model_t *model = &new_models[model_idx];
                model->feature1 = i;
                model->feature2 = j;
                
                fit_polynomial(x1_train, x2_train, new_train->target, 
                             new_train->n_samples, model->coeffs);
                
                double *predictions = malloc(new_valid->n_samples * sizeof(double));
                for (int k = 0; k < new_valid->n_samples; k++) {
                    predictions[k] = predict_polynomial(
                        new_valid->data[k][i],
                        new_valid->data[k][j],
                        model->coeffs
                    );
                }
                
                model->error = calculate_rmse(predictions, new_valid->target, new_valid->n_samples);
                model->r2 = calculate_r2(predictions, new_valid->target, new_valid->n_samples);
                
                free(x1_train);
                free(x2_train);
                free(predictions);
                
                model_idx++;
            }
        }
        
        // sort and select best
        for (int i = 0; i < model_idx - 1; i++) {
            for (int j = 0; j < model_idx - i - 1; j++) {
                if (new_models[j].error > new_models[j + 1].error) {
                    polynomial_model_t tmp = new_models[j];
                    new_models[j] = new_models[j + 1];
                    new_models[j + 1] = tmp;
                }
            }
        }
        
        n_selected = models_per_layer < model_idx ? models_per_layer : model_idx;
        layers[layer].models = malloc(n_selected * sizeof(polynomial_model_t));
        memcpy(layers[layer].models, new_models, n_selected * sizeof(polynomial_model_t));
        layers[layer].n_models = n_selected;
        layers[layer].layer = layer;
        
        printf("layer %d: selected %d models, best rmse: %.4f\n", 
               layer, n_selected, layers[layer].models[0].error);
        
        // cleanup
        for (int i = 0; i < new_train->n_samples; i++) {
            free(new_train->data[i]);
        }
        free(new_train->data);
        free(new_train);
        
        for (int i = 0; i < new_valid->n_samples; i++) {
            free(new_valid->data[i]);
        }
        free(new_valid->data);
        free(new_valid);
        
        free(new_models);
    }
    
    return layers;
}
