#!/bin/bash

set -euxo pipefail

docker build --tag scip-wasm:latest experiments
docker run --rm -itd --name emcc scip-wasm:latest sleep infinity
rm -rfv src/compiled
docker cp emcc:/scipoptsuite-8.1.0/build/bin/ src/compiled
docker kill emcc
