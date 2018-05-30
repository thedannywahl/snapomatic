exports.process = async function process(description, role, title, file, url, chromeless, config) {
  switch(title) {
    default:
      await chromeless
        .goto(url)
        .screenshot({filePath:file})
  }
}
