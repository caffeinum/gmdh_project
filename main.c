#include "gmdh.h"

void run_demo() {
    printf("=== gmdh demo on water quality dataset ===\n\n");
    
    // load data (predict pH_output from input features - column 27, 0-indexed)
    printf("loading water_quality.csv...\n");
    printf("target: pH_output (column 28)\n");
    dataset_t *ds = load_csv("water_quality.csv", 27);
    if (!ds) {
        fprintf(stderr, "failed to load dataset\n");
        return;
    }
    
    print_dataset_info(ds);
    
    // use subset of features for demo (full dataset is slow)
    int orig_features = ds->n_features;
    ds->n_features = 10;
    printf("\nusing first %d features for demo\n", ds->n_features);
    
    // split data
    printf("\nsplitting data (70%% train, 30%% validation)...\n");
    dataset_t *train, *valid;
    split_dataset(ds, &train, &valid, 0.7);
    printf("train: %d samples, validation: %d samples\n", 
           train->n_samples, valid->n_samples);
    
    // run combinatorial gmdh
    printf("\n=== running combinatorial gmdh ===\n");
    int n_models;
    polynomial_model_t *comb_models = combinatorial_gmdh(train, valid, &n_models);
    
    printf("\ntop 3 models:\n");
    for (int i = 0; i < 3 && i < n_models; i++) {
        printf("\n%d. ", i + 1);
        print_model(&comb_models[i], train->feature_names);
    }
    
    // run multi-row gmdh
    printf("\n\n=== running multi-row gmdh ===\n");
    gmdh_layer_t *layers = multirow_gmdh(train, valid, 3, 5);
    
    printf("\nfinal best model from layer 2:\n");
    if (layers[2].n_models > 0) {
        print_model(&layers[2].models[0], train->feature_names);
    }
    
    // cleanup
    free(comb_models);
    for (int i = 0; i < 3; i++) {
        if (layers[i].n_models > 0) {
            free(layers[i].models);
        }
    }
    free(layers);
    
    ds->n_features = orig_features;
    free_dataset(ds);
    free_dataset(train);
    free_dataset(valid);
    
    printf("\n=== demo complete ===\n");
}

int main(int argc, char **argv) {
    if (argc > 1 && strcmp(argv[1], "--test") == 0) {
        // test mode handled by test.c
        printf("use 'make test' to run tests\n");
        return 0;
    }
    
    run_demo();
    return 0;
}
