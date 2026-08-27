mergeInto(LibraryManager.library, {
  kpse_find_file_js__async: "auto",
  kpse_find_file_js: async function(nameptr, format, mustexist, requestingFilePtr) {
    return await kpse_find_file_impl(nameptr, format, mustexist, requestingFilePtr);
  },
  kpse_find_pk_js: function(nameptr, dpi) {
    return kpse_find_pk_impl(nameptr, dpi);
  }
});

