#include "gmdh.h"

int tests_run = 0;
int tests_passed = 0;

#define TEST(name) \
    printf("\ntest: %s\n", #name); \
    tests_run++;

#define ASSERT(condition, message) \
    if (!(condition)) { \
        printf("  ✗ %s\n", message); \
        return 0; \
    } else { \
        printf("  ✓ %s\n", message); \
    }

#define ASSERT_NEAR(a, b, epsilon, message) \
    if (fabs((a) - (b)) > (epsilon)) { \
        printf("  ✗ %s (%.6f vs %.6f)\n", message, (double)(a), (double)(b)); \
        return 0; \
    } else { \
        printf("  ✓ %s\n", message); \
    }

int test_polynomial_fit() {
    TEST(polynomial_fit);
    
    // simple linear relationship: y = 2 + 3*x1 + 4*x2
    double x1[] = {1, 2, 3, 4, 5};
    double x2[] = {1, 1, 2, 2, 3};
    double y[] = {9, 12, 17, 20, 25};
    int n = 5;
    
    double coeffs[6];
    fit_polynomial(x1, x2, y, n, coeffs);
    
    // check predictions
    double pred = predict_polynomial(1, 1, coeffs);
    ASSERT_NEAR(pred, 9.0, 0.1, "prediction at (1,1) should be ~9");
    
    pred = predict_polynomial(3, 2, coeffs);
    ASSERT_NEAR(pred, 17.0, 0.1, "prediction at (3,2) should be ~17");
    
    tests_passed++;
    return 1;
}

int test_rmse_calculation() {
    TEST(rmse_calculation);
    
    double pred[] = {1.0, 2.0, 3.0, 4.0};
    double actual[] = {1.1, 2.1, 2.9, 4.2};
    int n = 4;
    
    double rmse = calculate_rmse(pred, actual, n);
    
    // expected rmse ≈ 0.15
    ASSERT_NEAR(rmse, 0.15, 0.05, "rmse should be ~0.15");
    ASSERT(rmse > 0, "rmse should be positive");
    
    tests_passed++;
    return 1;
}

int test_r2_calculation() {
    TEST(r2_calculation);
    
    // perfect fit
    double pred1[] = {1.0, 2.0, 3.0, 4.0};
    double actual1[] = {1.0, 2.0, 3.0, 4.0};
    double r2 = calculate_r2(pred1, actual1, 4);
    
    ASSERT_NEAR(r2, 1.0, 0.01, "r² for perfect fit should be 1.0");
    
    // bad fit
    double pred2[] = {1.0, 1.0, 1.0, 1.0};
    double actual2[] = {1.0, 2.0, 3.0, 4.0};
    r2 = calculate_r2(pred2, actual2, 4);
    
    ASSERT(r2 < 0.5, "r² for bad fit should be low");
    
    tests_passed++;
    return 1;
}

int test_csv_loading() {
    TEST(csv_loading);
    
    dataset_t *ds = load_csv("water_quality.csv", 27); // pH_output as target
    
    ASSERT(ds != NULL, "dataset should load");
    ASSERT(ds->n_samples > 0, "should have samples");
    ASSERT(ds->n_features > 0, "should have features");
    ASSERT(ds->n_features == 39, "should have 39 features");
    
    printf("  loaded %d samples, %d features\n", ds->n_samples, ds->n_features);
    
    free_dataset(ds);
    tests_passed++;
    return 1;
}

int test_dataset_split() {
    TEST(dataset_split);
    
    dataset_t *ds = load_csv("water_quality.csv", 27);
    ASSERT(ds != NULL, "dataset should load");
    
    dataset_t *train, *test;
    split_dataset(ds, &train, &test, 0.7);
    
    ASSERT(train->n_samples > 0, "train set should have samples");
    ASSERT(test->n_samples > 0, "test set should have samples");
    ASSERT(train->n_samples + test->n_samples == ds->n_samples, 
           "train + test should equal total");
    
    printf("  train: %d, test: %d\n", train->n_samples, test->n_samples);
    
    free_dataset(ds);
    free_dataset(train);
    free_dataset(test);
    tests_passed++;
    return 1;
}

int test_combinatorial_gmdh() {
    TEST(combinatorial_gmdh);
    
    dataset_t *ds = load_csv("water_quality.csv", 27);
    ASSERT(ds != NULL, "dataset should load");
    
    // use subset of features for faster testing
    int orig_features = ds->n_features;
    ds->n_features = 5; // use only first 5 features
    
    dataset_t *train, *valid;
    split_dataset(ds, &train, &valid, 0.7);
    
    int n_models;
    polynomial_model_t *models = combinatorial_gmdh(train, valid, &n_models);
    
    ASSERT(models != NULL, "should return models");
    ASSERT(n_models > 0, "should have at least one model");
    ASSERT(models[0].error < INFINITY, "best model should have finite error");
    
    printf("  found %d models, best rmse: %.4f\n", n_models, models[0].error);
    
    ds->n_features = orig_features; // restore
    free(models);
    free_dataset(ds);
    free_dataset(train);
    free_dataset(valid);
    tests_passed++;
    return 1;
}

int test_multirow_gmdh() {
    TEST(multirow_gmdh);
    
    dataset_t *ds = load_csv("water_quality.csv", 27);
    ASSERT(ds != NULL, "dataset should load");
    
    // use subset for faster testing
    ds->n_features = 6;
    
    dataset_t *train, *valid;
    split_dataset(ds, &train, &valid, 0.7);
    
    gmdh_layer_t *layers = multirow_gmdh(train, valid, 3, 5);
    
    ASSERT(layers != NULL, "should return layers");
    ASSERT(layers[0].n_models > 0, "layer 0 should have models");
    ASSERT(layers[0].models[0].error < INFINITY, "best model should have finite error");
    
    printf("  layer 0 best rmse: %.4f\n", layers[0].models[0].error);
    
    // cleanup
    for (int i = 0; i < 3; i++) {
        if (layers[i].n_models > 0) {
            free(layers[i].models);
        }
    }
    free(layers);
    free_dataset(ds);
    free_dataset(train);
    free_dataset(valid);
    tests_passed++;
    return 1;
}

int main() {
    printf("=== gmdh unit tests ===\n");
    
    test_polynomial_fit();
    test_rmse_calculation();
    test_r2_calculation();
    test_csv_loading();
    test_dataset_split();
    test_combinatorial_gmdh();
    test_multirow_gmdh();
    
    printf("\n=== results ===\n");
    printf("tests run: %d\n", tests_run);
    printf("tests passed: %d\n", tests_passed);
    printf("tests failed: %d\n", tests_run - tests_passed);
    
    return tests_passed == tests_run ? 0 : 1;
}
