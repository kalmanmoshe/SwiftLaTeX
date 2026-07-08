PROJECT_NAME := swiftlatexxetex.worker.js

CC  := emcc
CXX := em++

BUILD_DIR := build

CFLAGS := -O3 \
	-Wno-parentheses-equality \
	-Wno-pointer-sign \
	-DWEBASSEMBLY_BUILD \
	-s USE_FREETYPE=1 \
	-s USE_ICU=1 \
	-s USE_LIBPNG=1 \
	-fno-rtti \
	-fno-exceptions

LDFLAGS := -O3 \
	-s USE_FREETYPE=1 \
	-s USE_ICU=1 \
	-s USE_LIBPNG=1 \
	-s SINGLE_FILE=1 \
	-s ENVIRONMENT=web,worker \
	-s EXPORTED_FUNCTIONS='["_compileBibtex", "_compileLaTeX", "_compileFormat", "_main", "_setMainEntry", "_malloc", "_free"]' \
	-s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
	-s NO_EXIT_RUNTIME=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	--js-library library.js \
	--pre-js pre.js

TEXSOURCES := \
	tex/xetex0.c \
	tex/xetexini.c \
	tex/xetex-pool.c \
	md5.c \
	xmemory.c \
	texfile.c \
	kpseemu.c \
	texmfmp.c \
	main.c \
	bibtex.c \
	xetexdir/XeTeX_ext.c \
	xetexdir/XeTeX_pic.c \
	xetexdir/image/bmpimage.c \
	xetexdir/image/jpegimage.c \
	xetexdir/image/pngimage.c \
	xetexdir/trans.c

XETEXSOURCES := \
	xetexdir/XeTeXOTMath.cpp \
	xetexdir/XeTeXLayoutInterface.cpp \
	xetexdir/XeTeXFontMgr.cpp \
	xetexdir/XeTeXFontInst.cpp \
	xetexdir/XeTeXFontMgr_FC.cpp \
	xetexdir/hz.cpp \
	xetexdir/pdfimage.cpp

TECKITSOURCES := \
	teckit/teckit-Engine.cpp

TEXOBJECTS    := $(TEXSOURCES:%.c=$(BUILD_DIR)/%.o)
XETEXOBJECTS  := $(XETEXSOURCES:%.cpp=$(BUILD_DIR)/%.o)
TECKITOBJECTS := $(TECKITSOURCES:%.cpp=$(BUILD_DIR)/%.o)

.DEFAULT_GOAL := all

all: $(PROJECT_NAME)

$(PROJECT_NAME): $(TEXOBJECTS) $(XETEXOBJECTS) $(TECKITOBJECTS)
	@$(CXX) -o $@ $(LDFLAGS) \
		$(TEXOBJECTS) $(XETEXOBJECTS) $(TECKITOBJECTS) \
		xpdf/xpdf.a graphite2/libgraphite2.a harfbuzz/libharfbuzz.a
	@printf "\033[32m[DONE]\033[0m $(PROJECT_NAME)\n"

$(TEXOBJECTS): $(BUILD_DIR)/%.o: %.c
	@mkdir -p $(@D)
	@$(CC) -c $(CFLAGS) -I. -Itex -Iharfbuzz $< -o $@
	@printf "\033[32m[OK]\033[0m $<\n"

$(XETEXOBJECTS): $(BUILD_DIR)/%.o: %.cpp
	@mkdir -p $(@D)
	@$(CXX) -c $(CFLAGS) -I. -Itex -Ixetexdir -Iharfbuzz -Ixpdf -Ixpdf/goo -Ixpdf/xpdf $< -o $@
	@printf "\033[32m[OK]\033[0m $<\n"

$(TECKITOBJECTS): $(BUILD_DIR)/%.o: %.cpp
	@mkdir -p $(@D)
	@$(CXX) -c $(CFLAGS) -I. -Iteckit $< -o $@
	@printf "\033[32m[OK]\033[0m $<\n"

clean:
	@rm -rf $(BUILD_DIR)
	@printf "\033[32m[CLEANED]\033[0m $(BUILD_DIR)\n"

fclean: clean
	@rm -f $(PROJECT_NAME)
	@printf "\033[32m[FCLEAN]\033[0m $(PROJECT_NAME)\n"

re: fclean all

.PHONY: all clean fclean re