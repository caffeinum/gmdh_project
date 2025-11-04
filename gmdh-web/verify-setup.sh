#!/bin/bash

echo "🔍 verifying gmdh web app setup..."
echo ""

# check node/npm
if ! command -v node &> /dev/null; then
    echo "❌ node.js not found - install from https://nodejs.org"
    exit 1
fi
echo "✅ node $(node --version)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm --version)"

# check dependencies
if [ ! -d "node_modules" ]; then
    echo "⚠️  dependencies not installed - run: npm install"
    exit 1
fi
echo "✅ dependencies installed"

# check required files
files=(
    "src/app/page.tsx"
    "src/components/DataPreview.tsx"
    "src/components/GMDHRunner.tsx"
    "src/components/ModelResults.tsx"
    "src/lib/gmdh.ts"
    "public/water_quality.csv"
    "package.json"
    "tsconfig.json"
)

for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ missing file: $file"
        exit 1
    fi
done
echo "✅ all required files present"

# count lines of code
loc=$(find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}')
echo "✅ $loc lines of code"

echo ""
echo "🎉 setup verified! ready to run:"
echo "   npm run dev"
echo ""
echo "then open http://localhost:3000"
