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
	# TODO: Configure bundler to do this automatically
	cd src/compiled \
		&& cp -r * ../../dist/assets/

src/compiled: experiments/Dockerfile
	docker build --tag scip-wasm:latest experiments
	docker run --rm -itd --name emcc scip-wasm:latest sleep infinity
	rm -rfv src/compiled
	docker cp emcc:/scipoptsuite-8.1.0/build/bin/ src/compiled
	find src/compiled ! -iname '*scip*' -type f -exec rm -v '{}' \;
	docker kill emcc
