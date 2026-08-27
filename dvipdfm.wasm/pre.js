let texlive404Cache = {};
let texlive200Cache = {};

async function compilePDFRoutine() {
    try {
        prepareExecutionContext();

        const setMainEntry = cwrap(
            "setMainEntry",
            "number",
            ["string"],
        );

        setMainEntry(self.mainfile);

        const status = await ccall(
            "compilePDF",
            "number",
            [],
            [],
            {
                async: true,
            },
        );

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
    } finally {
        clearHostResolutionCaches();
    }
}

async function kpse_find_file_impl(
    namePointer,
    format
) {
    let requestedPath =
        UTF8ToString(namePointer);

    if (requestedPath.startsWith("/tex/")) {
        requestedPath =
            requestedPath.slice(5);
    }

    console.log("DVI FILE REQUEST", {
        requestedPath,
        format,
    });

    const resolvedPath = await resolveFile({
        requestedPath,
        requestingPath: null,
        format,
        mustExist: false,

        remoteConfig: {
            successfulCache: texlive200Cache,
            missingCache: texlive404Cache,
            pathPrefix: "xetex",
            responseHeader: "fileid",
        },
    });

    return resolvedPath
        ? allocateString(resolvedPath)
        : 0;
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
        texlive404Cache = data.texlive404_cache ?? {};
        texlive200Cache = data.texlive200_cache ?? {};
    },

    clearCaches() {
        texlive404Cache = {};
        texlive200Cache = {};
    },
});