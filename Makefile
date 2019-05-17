up: install tsc link

install:
	bash -c "npm install"
tsc:
	bash -c "npm run tsc"
link:
	bash -c "npm link"

.PHONY: up link install
