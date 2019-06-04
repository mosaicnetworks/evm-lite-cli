up: install link-lib tsc link link-lib

install:
	bash -c "npm install"
tsc:
	bash -c "npm run tsc"
link:
	bash -c "npm link"
link-lib:
	bash -c "npm link evm-lite-lib"

clean: 
	bash -c "rm -rf node_modules/ && rm -rf package-lock.json && rm -rf dist/ && npm unlink"

.PHONY: up link install
