.PHONY: all clean setup

all: clean setup
	npm test

clean:
	rm -rf node_modules

setup:
	npm install

release-%: clean setup
	./node_modules/.bin/npub publish $(subst release-,,$@)
