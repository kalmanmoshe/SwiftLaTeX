mergeInto(LibraryManager.library, {
  kpse_find_file_js__async: "auto",
  kpse_find_file_js: async function(nameptr, format, mustexist, requestingFilePtr) {
    return await kpse_find_file_impl(nameptr, format, mustexist, requestingFilePtr);
  },
  fontconfig_search_font_js: function(nameptr, varptr) {
    return fontconfig_search_font_impl(nameptr, varptr);
  }
});

