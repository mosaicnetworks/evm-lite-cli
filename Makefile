up: install tsc link 

install:
	bash -c "npm install"
tsc:
	bash -c "npm run compile"
tsc:
	bash -c "npm link"
clean: 
	bash -c "rm -rf node_modules/ && rm -rf package-lock.json && rm -rf dist/ && npm unlink"

.PHONY: up clean tsc install
