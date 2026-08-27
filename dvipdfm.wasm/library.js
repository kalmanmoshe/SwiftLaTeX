mergeInto(LibraryManager.library, {
  kpse_find_file_js__async: "auto",
  kpse_find_file_js: async function(nameptr, format) {
    return await kpse_find_file_impl(nameptr, format);
  }
});