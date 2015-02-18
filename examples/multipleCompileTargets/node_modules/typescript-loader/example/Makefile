BIN = ./node_modules/.bin

build: install typings
	$(BIN)/webpack

watch: install typings
	$(BIN)/webpack --watch

install:
	@npm install

typings: tsd.json
	@$(BIN)/tsd install

clean:
	rm -f bundle.js bundle.js.map
