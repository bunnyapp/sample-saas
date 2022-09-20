HIDE ?= @

build:
	$(HIDE)docker build -t sample-saas . --no-cache

start:
	$(HIDE)docker run -it -p 127.0.0.1:3030:3000 --rm --name sample-saas sample-saas

shell:
	$(HIDE)docker run -it --rm --name sample-saas_shell sample-saas /bin/sh


