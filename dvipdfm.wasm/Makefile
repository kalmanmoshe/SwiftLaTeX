PROJECT_NAME := swiftlatexdvipdfm.worker.js

CC  := emcc
CXX := em++

BUILD_DIR := build

CFLAGS := -O3 \
	-DHAVE_ZLIB \
	-s USE_LIBPNG=1 \
	-fno-rtti \
	-fno-exceptions \
	-Wno-pointer-sign

LDFLAGS := -O3 \
	-s USE_LIBPNG=1 \
	-s SINGLE_FILE=1 \
	-s ENVIRONMENT=web,worker \
	-s EXPORTED_FUNCTIONS='["_compilePDF", "_setMainEntry", "_main", "_malloc", "_free"]' \
	-s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
	-s NO_EXIT_RUNTIME=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	--js-library library.js \
	--pre-js pre.js \
	-fno-rtti \
	-fno-exceptions

CSOURCES := \
	core-memory.c core-bridge.c \
	md5.c dvipdfmx-wasm.c \
	dpx-agl.c dpx-dvi.c dpx-pdfdoc.c dpx-spc_color.c dpx-tt_aux.c \
	dpx-bmpimage.c dpx-dvipdfmx.c dpx-pdfdraw.c dpx-spc_dvipdfmx.c dpx-tt_cmap.c \
	dpx-cff.c dpx-epdf.c dpx-pdfencoding.c dpx-spc_dvips.c dpx-tt_glyf.c \
	dpx-cff_dict.c dpx-error.c dpx-pdfencrypt.c dpx-spc_html.c dpx-tt_gsub.c \
	dpx-cid.c dpx-fontmap.c dpx-pdffont.c dpx-spc_misc.c dpx-tt_post.c \
	dpx-cidtype0.c dpx-jp2image.c dpx-pdfnames.c dpx-spc_pdfm.c dpx-tt_table.c \
	dpx-cidtype2.c dpx-jpegimage.c dpx-pdfobj.c dpx-spc_tpic.c dpx-type0.c \
	dpx-cmap.c dpx-mem.c dpx-pdfparse.c dpx-spc_util.c dpx-type1.c \
	dpx-cmap_read.c dpx-mfileio.c dpx-pdfresource.c dpx-spc_xtx.c dpx-type1c.c \
	dpx-cmap_write.c dpx-mpost.c dpx-pdfximage.c dpx-specials.c dpx-unicode.c \
	dpx-cs_type2.c dpx-numbers.c dpx-pkfont.c dpx-subfont.c dpx-vf.c \
	dpx-dpxconf.c dpx-otl_conf.c dpx-pngimage.c dpx-t1_char.c \
	dpx-dpxcrypt.c dpx-otl_opt.c dpx-pst.c dpx-t1_load.c \
	dpx-dpxfile.c dpx-pdfcolor.c dpx-pst_obj.c dpx-tfm.c \
	dpx-dpxutil.c dpx-pdfdev.c dpx-sfnt.c dpx-truetype.c

COBJECTS := $(CSOURCES:%.c=$(BUILD_DIR)/%.o)

.DEFAULT_GOAL := all

all: $(PROJECT_NAME)

$(PROJECT_NAME): $(COBJECTS)
	@$(CXX) -o $@ $(LDFLAGS) $(COBJECTS)
	@printf "\033[32m[DONE]\033[0m $(PROJECT_NAME)\n"

$(COBJECTS): $(BUILD_DIR)/%.o: %.c
	@mkdir -p $(@D)
	@$(CC) -c $(CFLAGS) -I. $< -o $@
	@printf "\033[32m[OK]\033[0m $<\n"

clean:
	@rm -rf $(BUILD_DIR)
	@printf "\033[32m[CLEANED]\033[0m $(BUILD_DIR)\n"

fclean: clean
	@rm -f $(PROJECT_NAME)
	@printf "\033[32m[FCLEAN]\033[0m $(PROJECT_NAME)\n"

re: fclean all

.PHONY: all clean fclean re