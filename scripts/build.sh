#!/bin/bash

npm run clean

mkdir -p build
mkdir -p logs

FILES=""

cd src
for FILE in *.sol; do
  FILES="$FILES $FILE"
done

node ../scripts/compile.js $FILES
cd ..

exit 0