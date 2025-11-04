CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c99
LDFLAGS = -lm

# directories
BUILD_DIR = build
BIN_DIR = bin

SRCS = data.c polynomial.c gmdh_combinatorial.c gmdh_multirow.c
OBJS = $(SRCS:%.c=$(BUILD_DIR)/%.o)
TEST_OBJS = $(BUILD_DIR)/test.o $(OBJS)
MAIN_OBJS = $(BUILD_DIR)/main.o $(OBJS)

# targets
GMDH_BIN = $(BIN_DIR)/gmdh
TEST_BIN = $(BIN_DIR)/test_gmdh

all: $(GMDH_BIN) $(TEST_BIN)

$(GMDH_BIN): $(MAIN_OBJS) | $(BIN_DIR)
	@echo "linking $@"
	@$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

$(TEST_BIN): $(TEST_OBJS) | $(BIN_DIR)
	@echo "linking $@"
	@$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

$(BUILD_DIR)/%.o: %.c gmdh.h | $(BUILD_DIR)
	@echo "compiling $<"
	@$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

$(BIN_DIR):
	@mkdir -p $(BIN_DIR)

test: $(TEST_BIN)
	@echo "running tests..."
	@$(TEST_BIN)

run: $(GMDH_BIN)
	@echo "running demo..."
	@$(GMDH_BIN)

clean:
	@echo "cleaning build artifacts..."
	@rm -rf $(BUILD_DIR) $(BIN_DIR)

.PHONY: all test run clean
