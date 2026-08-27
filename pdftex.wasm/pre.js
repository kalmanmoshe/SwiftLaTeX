let texlive404Cache = {};
let texlive200Cache = {};

let pk404Cache = {};
let pk200Cache = {};

async function compileLaTeXRoutine() {
    try {
        prepareExecutionContext();

        const setMainEntry = cwrap(
            "setMainEntry",
            "number",
            ["string"],
        );

        setMainEntry(
            self.mainfile
        );

        let status =
            await ccall(
                "compileLaTeX",
                "number",
                [],
                [],
                {
                    async: true,
                },
            );

        if (status === 0) {
            _compileBibtex();
        }

        const outputName =
            self.mainfile.replace(
                /\.tex$/i,
                ".pdf"
            );

        sendCompilationOutput({
            status,
            outputPath:
                `${WORKROOT}/${outputName}`,
            command:
                "compilelatex",
            outputProperty:
                "pdf",
        });
    } finally {
        clearHostResolutionCaches();
    }
}

function compileFormatRoutine() {
    prepareExecutionContext();

    const status = _compileFormat();

    sendCompilationOutput({
        status,
        outputPath: `${WORKROOT}/pdflatex.fmt`,
        command: "compileformat",
        outputProperty: "pdf",
    });
}

async function kpse_find_file_impl(
    namePointer,
    format,
    mustExist,
    requestingFilePointer
) {
    const requestedPath =  UTF8ToString(namePointer);

    const requestingPath = requestingFilePointer ? UTF8ToString(requestingFilePointer) : null;

    const resolvedPath =
        await resolveFile({
            requestedPath,
            requestingPath,
            format,
            mustExist:
                Boolean(mustExist),

            remoteConfig: {
                successfulCache: texlive200Cache,
                missingCache: texlive404Cache,
                pathPrefix: "pdftex",
                responseHeader: "fileid",
            },
        });

    return resolvedPath ? allocateString(resolvedPath) : 0;
}

function kpse_find_pk_impl(namePointer, dpi) {
    const requestedPath =
        UTF8ToString(namePointer);

    if (requestedPath.includes("/")) {
        return 0;
    }

    const cacheKey =
        `${dpi}/${requestedPath}`;

    return downloadRemoteFile({
        cacheKey,
        successfulCache: pk200Cache,
        missingCache: pk404Cache,
        remotePath: `pdftex/pk/${cacheKey}`,
        responseHeader: "pkid",
    });
}

initializeWorker({
    name: "pdftex",

    commandHandlers: {
        compilelatex() {
            void compileLaTeXRoutine();
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
            font404: pk404Cache,
            font200: pk200Cache,
        };
    },

    setCacheData(data) {
        texlive404Cache = data.texlive404_cache ?? {};
        texlive200Cache = data.texlive200_cache ?? {};
        pk404Cache = data.font404_cache ?? {};
        pk200Cache = data.font200_cache ?? {};
    },

    clearCaches() {
        texlive404Cache = {};
        texlive200Cache = {};
        pk404Cache = {};
        pk200Cache = {};
    },
});