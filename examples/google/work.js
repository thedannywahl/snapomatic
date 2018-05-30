exports.process = async function process(description, role, title, file, url, chromeless, config) {
  switch(title) {
    case "Results":
      await chromeless
        .goto(url)
        .type('iyware', 'input[name="q"]')
        .press(13)
        .wait('#resultStats')
        .screenshot(file)
      break;
    default:
      await chromeless
        .goto(url)
        .screenshot(file)
  }
}
