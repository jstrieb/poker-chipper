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

