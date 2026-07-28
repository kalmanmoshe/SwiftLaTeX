let texlive404Cache = {};
let texlive200Cache = {};

function compilePDFRoutine() {
    prepareExecutionContext();

    const setMainEntry = cwrap(
        "setMainEntry",
        "number",
        ["string"],
    );

    setMainEntry(self.mainfile);

    const status = _compilePDF();

    const outputName = self.mainfile.replace(
        /\.[^.]+$/i,
        ".pdf",
    );

    sendCompilationOutput({
        status,
        outputPath: `${WORKROOT}/${outputName}`,
        command: "compilepdf",
        outputProperty: "pdf",
    });
}

function kpse_find_file_impl(
    namePointer,
    format,
    _mustExist,
) {
    let requestedName = UTF8ToString(namePointer);

    /*
     * The DVIPDFMx engine can request paths beginning with /tex/.
     * Files are already stored under TEXCACHEROOT, so remove this
     * prefix before creating the remote cache key.
     */
    if (requestedName.startsWith("/tex/")) {
        requestedName = requestedName.slice(5);
    }

    if (requestedName.includes("/")) {
        return 0;
    }

    const cacheKey = `${format}/${requestedName}`;

    return downloadRemoteFile({
        cacheKey,
        successfulCache: texlive200Cache,
        missingCache: texlive404Cache,
        remotePath: `xetex/${cacheKey}`,
        responseHeader: "fileid",
    });
}

initializeWorker({
    name: "dvipdfm",

    commandHandlers: {
        compilepdf() {
            compilePDFRoutine();
        },
    },

    unsupportedCommands: [
        "compilelatex",
        "compileformat",
        "fetchWorkFiles",
    ],

    getCacheData() {
        return {
            texlive404: texlive404Cache,
            texlive200: texlive200Cache,

            // DVIPDFMx has no separate font cache.
            font404: {},
            font200: {},
        };
    },

    setCacheData(data) {
        texlive404Cache =
            data.texlive404_cache ?? {};

        texlive200Cache =
            data.texlive200_cache ?? {};
    },

    clearCaches() {
        texlive404Cache = {};
        texlive200Cache = {};
    },
});