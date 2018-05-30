exports.process = async function process(description, role, title, file, url, chromeless, config) {
  switch(title) {
    // Add cases here
    default:
      await chromeless
        .goto(url)
        .screenshot({filePath:file})
  }
}
