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

