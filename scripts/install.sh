#!/bin/sh

DIRECTORY="./dev"

if  [ -d "$DIRECTORY" ]; then
    echo "Removing 'dev' directory..."
    rm -rf $DIRECTORY
fi

echo "Creating 'dev' directory..."
mkdir $DIRECTORY

MODULES=("evm-lite-core" "evm-lite-keystore" "evm-lite-datadirectory")
cd dev
for t in ${MODULES[@]}; do
    # echo $t
    git clone git@github.com:mosaicnetworks/$t.git
done
cd ..

cd dev/evm-lite-core
pwd
npm run dev

cd ../evm-lite-keystore/
pwd
npm run dev

cd ../evm-lite-datadirectory/
pwd
npm run dev

# CLI
cd ..
npm install
npm link evm-lite-core
npm link evm-lite-keystore
npm link evm-lite-datadirectory
npm run build

evmlca