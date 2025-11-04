#include "gmdh.h"

dataset_t* load_csv(const char *filename, int target_col) {
    FILE *fp = fopen(filename, "r");
    if (!fp) {
        fprintf(stderr, "failed to open %s\n", filename);
        return NULL;
    }
    
    dataset_t *ds = malloc(sizeof(dataset_t));
    ds->data = NULL;
    ds->target = NULL;
    ds->feature_names = NULL;
    ds->n_samples = 0;
    ds->n_features = 0;
    
    char line[MAX_LINE];
    int line_num = 0;
    int total_cols = 0;
    
    // first pass: count samples and features
    while (fgets(line, MAX_LINE, fp)) {
        if (line_num == 0) {
            // count columns from header
            char *token = strtok(line, ",\n");
            while (token) {
                total_cols++;
                token = strtok(NULL, ",\n");
            }
            ds->n_features = total_cols - 1; // exclude target
        } else {
            ds->n_samples++;
        }
        line_num++;
    }
    
    // allocate memory
    ds->data = malloc(ds->n_samples * sizeof(double*));
    for (int i = 0; i < ds->n_samples; i++) {
        ds->data[i] = malloc(ds->n_features * sizeof(double));
    }
    ds->target = malloc(ds->n_samples * sizeof(double));
    ds->feature_names = malloc(ds->n_features * sizeof(char*));
    
    // second pass: read data
    rewind(fp);
    line_num = 0;
    int sample_idx = 0;
    
    while (fgets(line, MAX_LINE, fp)) {
        if (line_num == 0) {
            // read feature names
            char *token = strtok(line, ",\n");
            int col = 0, feat_idx = 0;
            while (token) {
                if (col != target_col) {
                    ds->feature_names[feat_idx] = malloc(256);
                    strncpy(ds->feature_names[feat_idx], token, 255);
                    feat_idx++;
                }
                col++;
                token = strtok(NULL, ",\n");
            }
        } else {
            // read data row
            char *token = strtok(line, ",\n");
            int col = 0, feat_idx = 0;
            
            while (token) {
                if (col == target_col) {
                    if (strcmp(token, "?") == 0) {
                        ds->target[sample_idx] = NAN;
                    } else {
                        ds->target[sample_idx] = atof(token);
                    }
                } else {
                    if (strcmp(token, "?") == 0) {
                        ds->data[sample_idx][feat_idx] = NAN;
                    } else {
                        ds->data[sample_idx][feat_idx] = atof(token);
                    }
                    feat_idx++;
                }
                col++;
                token = strtok(NULL, ",\n");
            }
            sample_idx++;
        }
        line_num++;
    }
    
    fclose(fp);
    
    // remove samples with missing target
    int valid_count = 0;
    for (int i = 0; i < ds->n_samples; i++) {
        if (!isnan(ds->target[i])) {
            if (i != valid_count) {
                memcpy(ds->data[valid_count], ds->data[i], ds->n_features * sizeof(double));
                ds->target[valid_count] = ds->target[i];
            }
            valid_count++;
        }
    }
    ds->n_samples = valid_count;
    
    return ds;
}

void free_dataset(dataset_t *ds) {
    if (!ds) return;
    
    if (ds->data) {
        for (int i = 0; i < ds->n_samples; i++) {
            free(ds->data[i]);
        }
        free(ds->data);
    }
    
    if (ds->target) free(ds->target);
    
    if (ds->feature_names) {
        for (int i = 0; i < ds->n_features; i++) {
            free(ds->feature_names[i]);
        }
        free(ds->feature_names);
    }
    
    free(ds);
}

void split_dataset(dataset_t *ds, dataset_t **train, dataset_t **test, double train_ratio) {
    int n_train = (int)(ds->n_samples * train_ratio);
    int n_test = ds->n_samples - n_train;
    
    *train = malloc(sizeof(dataset_t));
    *test = malloc(sizeof(dataset_t));
    
    (*train)->n_samples = n_train;
    (*train)->n_features = ds->n_features;
    (*test)->n_samples = n_test;
    (*test)->n_features = ds->n_features;
    
    // allocate train
    (*train)->data = malloc(n_train * sizeof(double*));
    for (int i = 0; i < n_train; i++) {
        (*train)->data[i] = malloc(ds->n_features * sizeof(double));
        memcpy((*train)->data[i], ds->data[i], ds->n_features * sizeof(double));
    }
    (*train)->target = malloc(n_train * sizeof(double));
    memcpy((*train)->target, ds->target, n_train * sizeof(double));
    
    // allocate test
    (*test)->data = malloc(n_test * sizeof(double*));
    for (int i = 0; i < n_test; i++) {
        (*test)->data[i] = malloc(ds->n_features * sizeof(double));
        memcpy((*test)->data[i], ds->data[n_train + i], ds->n_features * sizeof(double));
    }
    (*test)->target = malloc(n_test * sizeof(double));
    memcpy((*test)->target, ds->target + n_train, n_test * sizeof(double));
    
    // copy feature names
    (*train)->feature_names = malloc(ds->n_features * sizeof(char*));
    (*test)->feature_names = malloc(ds->n_features * sizeof(char*));
    for (int i = 0; i < ds->n_features; i++) {
        (*train)->feature_names[i] = malloc(256);
        (*test)->feature_names[i] = malloc(256);
        strcpy((*train)->feature_names[i], ds->feature_names[i]);
        strcpy((*test)->feature_names[i], ds->feature_names[i]);
    }
}

void print_dataset_info(dataset_t *ds) {
    printf("dataset: %d samples, %d features\n", ds->n_samples, ds->n_features);
    printf("features: ");
    for (int i = 0; i < ds->n_features && i < 5; i++) {
        printf("%s%s", ds->feature_names[i], i < 4 ? ", " : "");
    }
    if (ds->n_features > 5) printf("...");
    printf("\n");
}
