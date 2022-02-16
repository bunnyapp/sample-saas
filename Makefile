HIDE ?= @
VOLUME ?=-v $(PWD):/app -v $(PWD)/node_modules:/app/node_modules

build:
	$(HIDE)docker build -t sample-saas . --no-cache

start:
	$(HIDE)docker run $(VOLUME) -it -p 127.0.0.1:3030:3000 --rm --name sample-saas sample-saas

dev:
	$(HIDE)docker run $(VOLUME) -it -p 127.0.0.1:3030:3000 --rm --name sample-saas sample-saas npm run dev

build-css:
	$(HIDE)docker run $(VOLUME) -it --rm --name sample-saas-css sample-saas npm run build-css

shell:
	$(HIDE)docker run $(VOLUME) -it --rm --name sample-saas_shell sample-saas /bin/sh


