# agent instructions for gmdh project

## build/test commands
- `make` - compile all binaries (main + tests)
- `make test` - run all unit tests
- `./bin/test_gmdh` - run single test binary directly
- `make run` - run demo on water quality dataset
- `make clean` - remove build artifacts

## code style
- **language**: c99 standard
- **compiler flags**: -Wall -Wextra -O2 -std=c99
- **includes**: all headers in gmdh.h, single include per file
- **types**: use typedefs with _t suffix (dataset_t, polynomial_model_t, gmdh_layer_t)
- **naming**: snake_case for functions/variables, UPPER_CASE for macros/constants
- **error handling**: return NULL for allocation failures, check isnan() for missing data, return INFINITY for invalid metrics
- **memory**: always free dynamically allocated arrays, use malloc/free (no calloc/realloc)
- **formatting**: 4 spaces indent, no tabs, K&R brace style
- **comments**: minimal, only for complex algorithms (gaussian elimination, normal equations)
- **constants**: MAX_FEATURES=64, MAX_SAMPLES=2048, MAX_LINE=8192

## testing
- tests use simple macros: TEST(), ASSERT(), ASSERT_NEAR()
- all tests in test.c, manually called from main()
- each test returns 1 on success, 0 on failure
- tests run against water_quality.csv dataset
