const TEXCACHEROOT = "/tex";
const WORKROOT = "/work";

var Module = {};

self.memlog = "";
self.initmem = undefined;
self.mainfile = "main.tex";
self.texlive_endpoint = "https://texlive2.swiftlatex.com/";

self.onerror = function (message, source, lineno, colno, error) {
    console.error(
        "Worker error:",
        message,
        source,
        lineno,
        colno,
        error,
    );

    self.postMessage({
        cmd: "workererror",
        message: String(message),
        source,
        lineno,
        colno,
        stack: error?.stack ?? null,
    });
};

self.onunhandledrejection = function (event) {
    console.error("Worker unhandled rejection:", event.reason);

    self.postMessage({
        cmd: "workerrejection",
        reason: String(event.reason),
        stack: event.reason?.stack ?? null,
    });
};

Module.print = function (message) {
    self.memlog += `${message}\n`;
};

Module.printErr = function (message) {
    self.memlog += `${message}\n`;
    console.error(message);
};

Module.preRun = function () {
    ensureDirectory(TEXCACHEROOT);
    ensureDirectory(WORKROOT);
};

function ensureDirectory(path) {
    if (!FS.analyzePath(path).exists) {
        FS.mkdir(path);
    }
}

function allocateString(content) {
    const bytes = intArrayFromString(content);
    const pointer = _malloc(bytes.length);

    HEAPU8.set(bytes, pointer);

    return pointer;
}

function dumpHeapMemory() {
    const source = new Uint8Array(wasmMemory.buffer);
    const copy = new Uint8Array(source.length);

    copy.set(source);

    return copy;
}

function restoreHeapMemory() {
    if (!self.initmem) {
        throw new Error("Initial heap snapshot is unavailable");
    }

    const destination = new Uint8Array(wasmMemory.buffer);

    if (destination.length < self.initmem.length) {
        throw new Error(
            `Cannot restore heap: current=${destination.length}, ` +
            `snapshot=${self.initmem.length}`,
        );
    }

    destination.set(self.initmem);

    if (destination.length > self.initmem.length) {
        destination.fill(0, self.initmem.length);
    }
}

function closeFSStreams() {
    for (const stream of FS.streams) {
        if (!stream || stream.fd <= 2) {
            continue;
        }

        try {
            FS.close(stream);
        } catch (error) {
            console.warn(
                `Unable to close stream ${stream.fd}`,
                error,
            );
        }
    }
}

function prepareExecutionContext() {
    self.memlog = "";

    closeFSStreams();
    restoreHeapMemory();

    FS.chdir(WORKROOT);
}

Module.postRun = function () {
    self.postMessage({
        result: "ok",
        cmd: "ready",
    });

    self.initmem = dumpHeapMemory();
};

Module.onAbort = function (reason) {
    self.memlog += `Engine crashed: ${String(reason)}\n`;

    self.postMessage({
        result: "failed",
        status: -254,
        log: self.memlog,
        cmd: "compile",
    });
};

function respondOk(cmd, extra = {}) {
    self.postMessage({
        result: "ok",
        cmd,
        ...extra,
    });
}

function respondFailed(cmd, extra = {}) {
    self.postMessage({
        result: "failed",
        cmd,
        ...extra,
    });
}

function cleanDir(directory) {
    for (const name of FS.readdir(directory)) {
        if (name === "." || name === "..") {
            continue;
        }

        const path = `${directory}/${name}`;

        let stat;

        try {
            stat = FS.stat(path);
        } catch (error) {
            console.error(`Unable to stat ${path}`, error);
            continue;
        }

        if (FS.isDir(stat.mode)) {
            cleanDir(path);

            try {
                FS.rmdir(path);
            } catch (error) {
                console.error(`Unable to remove directory ${path}`, error);
            }
        } else {
            try {
                FS.unlink(path);
            } catch (error) {
                console.error(`Unable to remove file ${path}`, error);
            }
        }
    }
}

function mkdirRoutine(dirname) {
    const path = `${WORKROOT}/${dirname}`;

    try {
        ensureDirectory(path);
        respondOk("mkdir");
    } catch (error) {
        console.error(`Unable to create directory ${path}`, error);
        respondFailed("mkdir");
    }
}

function writeFileRoutine(filename, content) {
    try {
        FS.writeFile(`${WORKROOT}/${filename}`, content);
        respondOk("writefile");
    } catch (error) {
        console.error(`Unable to write work file ${filename}`, error);
        respondFailed("writefile");
    }
}

function writeTexFileRoutine(filename, content) {
    try {
        FS.writeFile(`${TEXCACHEROOT}/${filename}`, content);
        respondOk("writetexfile");
    } catch (error) {
        console.error(`Unable to write TeX file ${filename}`, error);
        respondFailed("writetexfile");
    }
}

function removeFileRoutine(filename) {
    const path = `${WORKROOT}/${filename}`;

    try {
        if (FS.analyzePath(path).exists) {
            FS.unlink(path);
        }

        respondOk("removefile");
    } catch (error) {
        console.error(`Unable to remove work file ${filename}`, error);
        respondFailed("removefile");
    }
}

function transferTexFileToHost(filename) {
    try {
        const content = FS.readFile(
            `${TEXCACHEROOT}/${filename}`,
            {
                encoding: "binary",
            },
        );

        self.postMessage(
            {
                result: "ok",
                cmd: "fetchfile",
                filename,
                content,
            },
            [content.buffer],
        );
    } catch (error) {
        console.error(`Unable to fetch TeX file ${filename}`, error);
        respondFailed("fetchfile");
    }
}

function setTexliveEndpoint(url) {
    if (!url) {
        respondFailed("settexliveurl");
        return;
    }

    self.texlive_endpoint = url.endsWith("/")
        ? url
        : `${url}/`;

    respondOk("settexliveurl");
}

function sendCompilationOutput({
    status,
    outputPath,
    command,
    outputProperty = "pdf",
}) {
    if (status !== 0) {
        console.error(
            `Compilation failed with status code ${status}`,
        );

        respondFailed(command, {
            status,
            log: self.memlog,
        });

        return;
    }

    try {
        const output = FS.readFile(outputPath, {
            encoding: "binary",
        });

        self.postMessage(
            {
                result: "ok",
                status,
                log: self.memlog,
                cmd: command,
                [outputProperty]: output.buffer,
            },
            [output.buffer],
        );
    } catch (error) {
        console.error(
            `Unable to read compilation output ${outputPath}`,
            error,
        );

        respondFailed(command, {
            status: -253,
            log: self.memlog,
        });
    }
}

function downloadRemoteFile({
    cacheKey,
    successfulCache,
    missingCache,
    remotePath,
    responseHeader,
}) {
    if (cacheKey in missingCache) {
        return 0;
    }

    if (cacheKey in successfulCache) {
        return allocateString(successfulCache[cacheKey]);
    }

    const remoteUrl = self.texlive_endpoint + remotePath;

    const xhr = new XMLHttpRequest();

    xhr.open("GET", remoteUrl, false);
    xhr.timeout = 150000;
    xhr.responseType = "arraybuffer";

    console.log(`Downloading ${remoteUrl}`);

    try {
        xhr.send();
    } catch (error) {
        console.error(`Download failed: ${remoteUrl}`, error);
        return 0;
    }

    if (xhr.status === 200) {
        const fileId = xhr.getResponseHeader(responseHeader);

        if (!fileId) {
            console.error(
                `Response from ${remoteUrl} is missing ` +
                `${responseHeader} header`,
            );

            return 0;
        }

        const savePath = `${TEXCACHEROOT}/${fileId}`;

        FS.writeFile(
            savePath,
            new Uint8Array(xhr.response),
        );

        successfulCache[cacheKey] = savePath;

        return allocateString(savePath);
    }

    if (xhr.status === 301 || xhr.status === 404) {
        missingCache[cacheKey] = 1;
        return 0;
    }

    console.error(
        `Unexpected status ${xhr.status} from ${remoteUrl}`,
    );

    return 0;
}

function initializeWorker(config) {
    const {
        commandHandlers,
        unsupportedCommands = [],
        getCacheData,
        setCacheData,
        clearCaches,
    } = config;

    const unsupported = new Set(unsupportedCommands);

    self.onmessage = function (event) {
        const data = event.data;
        const cmd = data.cmd;

        const commonHandlers = {
            mkdir() {
                mkdirRoutine(data.url);
            },

            settexliveurl() {
                setTexliveEndpoint(data.url);
            },

            writefile() {
                writeFileRoutine(data.url, data.src);
            },

            writetexfile() {
                writeTexFileRoutine(data.url, data.src);
            },

            removefile() {
                removeFileRoutine(data.url);
            },

            fetchfile() {
                transferTexFileToHost(data.fileName);
            },

            setmainfile() {
                self.mainfile = data.url;
                respondOk("setmainfile");
            },

            flushworkcache() {
                cleanDir(WORKROOT);
                respondOk("flushworkcache");
            },

            flushcache() {
                cleanDir(TEXCACHEROOT);
                cleanDir(WORKROOT);

                clearCaches();

                respondOk("flushcache");
            },

            fetchcache() {
                respondOk("fetchcache", getCacheData());
            },

            writecache() {
                setCacheData(data);
                respondOk("writecache");
            },

            grace() {
                console.log("Gracefully closing worker");
                self.close();
            },
        };

        const handler =
            commandHandlers[cmd] ??
            commonHandlers[cmd];

        if (handler) {
            handler(data);
            return;
        }

        if (unsupported.has(cmd)) {
            console.error(
                `Command "${cmd}" is not supported by ${config.name}`,
            );

            respondFailed(cmd, {
                error:
                    `Command "${cmd}" is not supported ` +
                    `by ${config.name}`,
            });

            return;
        }

        console.error(`Unknown command "${cmd}"`);
    };
}