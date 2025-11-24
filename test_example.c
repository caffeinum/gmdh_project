#include "gmdh.h"

void run_example_test() {
    printf("=== gmdh test on example_test_sample ===\n\n");

    // load data (target is y - last column, index 8)
    printf("loading data/example_test_sample.csv...\n");
    dataset_t *ds = load_csv("data/example_test_sample.csv", 8);
    if (!ds) {
        fprintf(stderr, "failed to load dataset\n");
        return;
    }

    print_dataset_info(ds);

    // split data (70% train, 30% validation)
    printf("\nsplitting data (70%% train, 30%% validation)...\n");
    dataset_t *train, *valid;
    split_dataset(ds, &train, &valid, 0.7);
    printf("train: %d samples, validation: %d samples\n",
           train->n_samples, valid->n_samples);

    // run linear combinatorial gmdh (paper's approach)
    printf("\n=== running linear combinatorial gmdh (paper's approach) ===\n");
    int n_models;
    linear_model_t *linear_models = linear_combinatorial_gmdh(train, valid, 2, 6, &n_models);

    printf("\ntop 10 linear models:\n");
    for (int i = 0; i < 10 && i < n_models; i++) {
        printf("\n%d. ", i + 1);
        print_linear_model(&linear_models[i], train->feature_names);
    }

    // also run quadratic pairs for comparison
    printf("\n\n=== running quadratic pairs gmdh (current implementation) ===\n");
    int n_quad_models;
    polynomial_model_t *comb_models = combinatorial_gmdh(train, valid, &n_quad_models);

    printf("\ntop 3 quadratic models:\n");
    for (int i = 0; i < 3 && i < n_quad_models; i++) {
        printf("\n%d. ", i + 1);
        print_model(&comb_models[i], train->feature_names);
    }

    // print expected results from paper
    printf("\n\n=== expected results from paper (table 2.2) ===\n");
    printf("S=3: y = 0.055 - 2.948*x3 - 6.980*x7\n");
    printf("S=4: y = 0.068 - 2.960*x3 + 6.982*x7 - 0.022*x8\n");
    printf("S=5: y = 0.05 - 2.95*x3 - 0.032*x5 + 6.987*x7 - 0.022*x8\n");
    printf("S=6: y = 0.035 - 2.94*x3 - 0.452*x4 - 0.285*x5 + 6.97*x7 - 0.026*x8\n");

    // cleanup
    free_linear_models(linear_models, n_models);
    free(comb_models);

    free_dataset(ds);
    free_dataset(train);
    free_dataset(valid);

    printf("\n=== test complete ===\n");
}

int main() {
    run_example_test();
    return 0;
}
