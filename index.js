const { spawn } = require('child_process'),
      { Chromeless } = require('chromeless'),
      untildify = require('untildify'),
      path = require('path'),
      program = require('commander'),
      fs = require('fs'),
      chromeLauncher = require('chrome-launcher'),
      ora = require('ora')
      colors = require('colors'),
      spinner = ora(),
      csv = require('csvtojson'),
      workflow = require('./workflow')
let div = colors.magenta("============================================================"),
    config = {
      "app": {
          "domain":   null,
          "users":    null
      },
      "size": {
        "height":     800,
        "width":      1280,
        "scale":      1
      },
      "input":        null,
      "output":       null,
      "screenshots":  [],
      "log":        false
    }

program
  .version('0.0.1')
  .allowUnknownOption()
  .option('-l, --log', 'Enable console logging')
  .option('-i, --input <file>','required user input')
  .option('-o, --output <path>', 'output path')
  .option('-d, --domain <url>', 'domain')
  .option('-u, --users [users]', 'users')
  .parse(process.argv);

if(typeof program.users !== 'undefined') {
  if(program.users.charAt(0) == "{") {
    config.app.users = JSON.parse(program.users)
  } else {
    config.app.users = JSON.parse(fs.readFileSync(program.users, 'utf8'));
  }
}
if(typeof program.input === 'undefined') {
  console.log(colors.red("No input CSV file provided. Specify input file with `-i <file>`"))
  process.exit(1);
} else {
  config.input = untildify(program.input)
}
if(typeof program.output === 'undefined') {
  console.log(colors.red("No output path provided. Specify output path with `-i <file>`"))
  process.exit(1);
} else {
  config.output = untildify(program.output)
  if (!fs.existsSync(config.output)){
    fs.mkdirSync(config.output);
  }
}
if(typeof program.domain === 'undefined') {
  console.log(colors.red("No URL provided. Specify output file with `-d <url>`"))
  process.exit(1);
} else {
  config.app.domain = 'https://' + program.domain
}
if(program.log) {
  config.log = true
} else {
  spinner.start(colors.yellow('Loading ' + config.app.domain))
}

csv()
  .fromFile(config.input)
  .then(jsonObj=>{
    config.screenshots = jsonObj;
  }).then(jsonObj=>{
    chromeLauncher.launch({
      port:        9222,
      chromeFlags: ['--disable-gpu', '--crash-dumps-dir=/tmp', '--hide-scrollbars', '--headless']
    }).then(chrome => {
      if(config.log) {
        console.log('\n' + colors.magenta("Command")+ '\n' + div)
        console.log(colors.blue("Node path:   ") + process.argv[0])
        console.log(colors.blue("Script path: ") + process.argv[1])
        console.log(colors.blue("Arguments:   ") + process.argv.slice(2,process.argv.length).toString() + '\n\n')
        console.log(colors.magenta("Configuration") + '\n' +  div)
        console.log("config: " + JSON.stringify(config, null, 2))
        console.log('\n' + colors.magenta("Chrome")+ '\n' + div)
        console.log(chrome)
      }
      if(!config.log) spinner.succeed(colors.green("Loaded " + config.app.domain))
      run(chrome).catch(console.error.bind(colors.red(console)))
    })
  })

async function run(chrome) {
  const chromeless = new Chromeless({
    launchChrome: false,
    "debug":        config.log,
    "implicitWait": true,
    "waitTimeout": 30000,
    "viewport": {
      "width":    config.size.width,
      "height":   config.size.height,
      "scale":    config.size.scale
    },
    "cdp": {
      "host":     "127.0.0.1",
      "port":     chrome.port,
      "secure":   false,
      "closeTab": true
    }
  })

  for(let i = 0; i < config.screenshots.length; i++) {

    let url = config.app.domain + config.screenshots[i]["URL"],
        description = config.screenshots[i]["Description"],
        role = config.screenshots[i]["Role"],
        title = config.screenshots[i]["Title"],
        file = (role !== '') ? path.join(config.output, role + "-" + title + ".png") : path.join(config.output, title + ".png"),
        indicator = (role == '') ? '' : " [" + role + "]"

    if(!config.log) spinner.start(colors.yellow("Creating screenshot " + (i+1) + ": " + title + indicator))

    if(config.log) {
      console.log('\n\n' + colors.magenta(title) + '\n' + colors.magenta(description) + '\n' + div)
      console.log(colors.blue("Current role: ") + role)
      console.log(colors.blue("Current URL:  ") + url)
      console.log(colors.blue("Output file:  ") + file + '\n')
    }

    workflow.process(description, role, title, file, url, chromeless, config)

  }

  await chromeless.end()
  chrome.kill()

  if(config.log) console.log('\n')
  spinner.succeed(colors.green(config.screenshots.length + " screenshots created"))
  if(!config.log) spinner.stop()

}
