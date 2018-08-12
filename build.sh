#!/bin/sh

# defines project build logic. 

set -e  # fail when any simple command returns with non-zero code
set -x  # print trace of simple comands

GREEN='\033[0;32m'
NC='\033[0m'    # no color

# always start a fresh build
rm -rf addon
rm -rf staging

# directory to hold built bundle
mkdir -p addon
# temporary working dir
mkdir -p staging

cp -r src/* addon

# prepare project js source and their dependencies
cp -r src/js/* staging
cp ./node_modules/jquery/dist/jquery.min.js staging
cp ./node_modules/string-hash/index.js staging/string-hash.js

# bundle dependencies with browserify
browerify="node_modules/browserify/bin/cmd.js"
$browerify staging/popup.js --noparse=staging/jquery.min.js -o addon/js/popup.js

# remove temporary working dir 
rm -rf staging

# done
echo "${GREEN}BUILD SUCCESS${NC}"
