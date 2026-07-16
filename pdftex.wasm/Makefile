PROJECT_NAME := swiftlatexpdftex.worker.js

CC  := emcc
CXX := em++

BUILD_DIR := build

CFLAGS := -O3 \
	-s USE_ZLIB=1 \
	-s USE_LIBPNG=1 \
	-Wno-parentheses-equality \
	-Wno-pointer-sign \
	-fno-rtti \
	-fno-exceptions \
	-DWEBASSEMBLY_BUILD

LDFLAGS := -O3 \
    -s SINGLE_FILE=1 \
    -s ENVIRONMENT=web,worker \
    -s EXPORTED_FUNCTIONS='["_compileBibtex", "_compileLaTeX", "_compileFormat", "_main", "_setMainEntry", "_malloc", "_free"]' \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
    -s NO_EXIT_RUNTIME=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s GROWABLE_ARRAYBUFFERS=0 \
    -s TEXTDECODER=1 \
    --js-library library.js \
    --pre-js pre.js
	
TEXSOURCES := \
	tex/pdftex0.c \
	tex/pdftexini.c \
	tex/pdftex-pool.c \
	main.c \
	md5.c \
	xmemory.c \
	texfile.c \
	kpseemu.c \
	bibtex.c

PDFSOURCES := \
	pdftexdir/avl.c \
	pdftexdir/utils.c \
	pdftexdir/writejbig2.c \
	pdftexdir/writettf.c \
	pdftexdir/avlstuff.c \
	pdftexdir/pkin.c \
	pdftexdir/vfpacket.c \
	pdftexdir/writejpg.c \
	pdftexdir/writezip.c \
	pdftexdir/epdf.c \
	pdftexdir/subfont.c \
	pdftexdir/writeenc.c \
	pdftexdir/writepng.c \
	pdftexdir/tounicode.c \
	pdftexdir/writefont.c \
	pdftexdir/writet1.c \
	pdftexdir/mapfile.c \
	pdftexdir/writeimg.c \
	pdftexdir/writet3.c

EPDFSOURCES := \
	pdftexdir/pdftoepdf.cc

TEXOBJECTS  := $(TEXSOURCES:%.c=$(BUILD_DIR)/%.o)
PDFOBJECTS  := $(PDFSOURCES:%.c=$(BUILD_DIR)/%.o)
EPDFOBJECTS := $(EPDFSOURCES:%.cc=$(BUILD_DIR)/%.o)

.DEFAULT_GOAL := all

all: $(PROJECT_NAME)

$(PROJECT_NAME): $(TEXOBJECTS) $(PDFOBJECTS) $(EPDFOBJECTS)
	@$(CXX) -o $@ $(CFLAGS) $(LDFLAGS) \
		$(TEXOBJECTS) $(PDFOBJECTS) $(EPDFOBJECTS) \
		xpdf/xpdf.a
	@printf "\033[32m[DONE]\033[0m $(PROJECT_NAME)\n"

$(TEXOBJECTS): $(BUILD_DIR)/%.o: %.c
	@mkdir -p $(@D)
	@$(CC) -c $(CFLAGS) -I. -Itex $< -o $@
	@printf "\033[32m[OK]\033[0m $@\n"

$(PDFOBJECTS): $(BUILD_DIR)/%.o: %.c
	@mkdir -p $(@D)
	@$(CC) -c $(CFLAGS) -I. -Itex -Ipdftexdir -Ixpdf/xpdf -Ixpdf $< -o $@
	@printf "\033[32m[OK]\033[0m $@\n"

$(EPDFOBJECTS): $(BUILD_DIR)/%.o: %.cc
	@mkdir -p $(@D)
	@$(CXX) -c $(CFLAGS) -I. -Itex -Ipdftexdir -Ixpdf/xpdf -Ixpdf/goo -Ixpdf $< -o $@
	@printf "\033[32m[OK]\033[0m $@\n"

clean:
	@rm -rf $(BUILD_DIR)
	@printf "\033[32m[CLEANED]\033[0m $(BUILD_DIR)\n"

fclean: clean
	@rm -f $(PROJECT_NAME)
	@printf "\033[32m[FCLEAN]\033[0m $(PROJECT_NAME)\n"

re: fclean all

.PHONY: all clean fclean re