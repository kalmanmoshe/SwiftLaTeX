let texlive404Cache = {};
let texlive200Cache = {};

let font404Cache = {};
let font200Cache = {};

function compileLaTeXRoutine() {
    prepareExecutionContext();

    const setMainEntry = cwrap(
        "setMainEntry",
        "number",
        ["string"],
    );

    setMainEntry(self.mainfile);

    let status = _compileLaTeX();

    if (status === 0) {
        _compileBibtex();
    }

    const outputName =
        self.mainfile.replace(/\.tex$/i, ".xdv");

    sendCompilationOutput({
        status,
        outputPath: `${WORKROOT}/${outputName}`,
        command: "compilelatex",

        // Keeping the existing host protocol for now.
        outputProperty: "pdf",
    });
}

function compileFormatRoutine() {
    prepareExecutionContext();

    const status = _compileFormat();

    sendCompilationOutput({
        status,
        outputPath: `${WORKROOT}/xelatex.fmt`,
        command: "compileformat",
        outputProperty: "pdf",
    });
}

function kpse_find_file_impl(
    namePointer,
    format,
    _mustExist,
) {
    const requestedName = UTF8ToString(namePointer);

    if (requestedName.includes("/")) {
        return 0;
    }

    const cacheKey =
        `${format}/${requestedName}`;

    return downloadRemoteFile({
        cacheKey,
        successfulCache: texlive200Cache,
        missingCache: texlive404Cache,
        remotePath: `xetex/${cacheKey}`,
        responseHeader: "fileid",
    });
}

function fontconfig_search_font_impl(
    fontNamePointer,
    variantPointer,
) {
    const fontName =
        UTF8ToString(fontNamePointer);

    let variant =
        UTF8ToString(variantPointer);

    if (!variant) {
        variant = "OT";
    }

    variant = variant.replace(/\//g, "_");

    const cacheKey =
        `${variant}/${fontName}`;

    return downloadRemoteFile({
        cacheKey,
        successfulCache: font200Cache,
        missingCache: font404Cache,
        remotePath: `fontconfig/${cacheKey}`,
        responseHeader: "fontid",
    });
}

initializeWorker({
    name: "xetex",

    commandHandlers: {
        compilelatex() {
            compileLaTeXRoutine();
        },

        compileformat() {
            compileFormatRoutine();
        },
    },

    unsupportedCommands: [
        "compilepdf",
        "fetchWorkFiles",
    ],

    getCacheData() {
        return {
            texlive404: texlive404Cache,
            texlive200: texlive200Cache,
            font404: font404Cache,
            font200: font200Cache,
        };
    },

    setCacheData(data) {
        texlive404Cache = data.texlive404_cache ?? {};
        texlive200Cache = data.texlive200_cache ?? {};
        font404Cache = data.font404_cache ?? {};
        font200Cache = data.font200_cache ?? {};
    },

    clearCaches() {
        texlive404Cache = {};
        texlive200Cache = {};
        font404Cache = {};
        font200Cache = {};
    },
});