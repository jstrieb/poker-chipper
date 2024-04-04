SHELL := bash

.PHONY: lint dev cloc build

lint: 
	npm run lint

dev:
	npm run dev

cloc:
	cloc \
		--exclude-dir node_modules,dist,public \
		--exclude-ext json \
		.

build: lint
	npm run build
	# TODO: The bundler should be able to resolve these directories
	mv dist/solve.js dist/assets/
	mv dist/compiled dist/assets/

public/compiled: experiments/Dockerfile
	docker build --tag scip-wasm:latest experiments
	docker run --rm -itd --name emcc scip-wasm:latest sleep infinity
	rm -rfv public/compiled
	docker cp emcc:/scipoptsuite-8.1.0/build/bin/ public/compiled
	find public/compiled ! -iname '*scip*' -type f -exec rm -v '{}' \;
	docker kill emcc
