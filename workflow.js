exports.process = async function process(description, role, title, file, url, chromeless, config) {
  switch(title) {
    case "login":
      await chromeless
        .goto(url)
        .screenshot({filePath:file})
        .type(config.app.users[role]["username"], '#username')
        .type(config.app.users[role]["password"], '#password')
        .click('#login')
      break;
    default:
      await chromeless
        .goto(url)
        .screenshot({filePath:file})
  }
}
