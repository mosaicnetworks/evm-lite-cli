up: install tsc link

install:
	bash -c "npm install"
tsc:
	bash -c "npm install"
link:
	bash -c "npm run tsc"

.PHONY: up link install
