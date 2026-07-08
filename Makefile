PROJECT_NAME := SwiftLaTeX

SUBDIRS := \
	pdftex.wasm \
	xetex.wasm \
	dvipdfm.wasm

.DEFAULT_GOAL := all

all:
	@printf "\033[33m[BUILDING]\033[0m $(PROJECT_NAME)\n"
	@for dir in $(SUBDIRS); do \
		$(MAKE) -C $$dir --no-print-directory || exit $$?; \
		printf "\033[32m[OK]\033[0m $$dir\n"; \
	done

clean:
	@for dir in $(SUBDIRS); do \
		$(MAKE) -C $$dir clean --no-print-directory || exit $$?; \
	done

fclean:
	@for dir in $(SUBDIRS); do \
		$(MAKE) -C $$dir fclean --no-print-directory || exit $$?; \
	done

re: fclean all

.PHONY: all clean fclean re