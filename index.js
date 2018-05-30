const { spawn } = require('child_process'),
      { Chromeless } = require('chromeless'),
      untildify = require('untildify'),
      program = require('commander'),
      path = require('path'),
      fs = require('fs'),
      chromeLauncher = require('chrome-launcher'),
      ora = require('ora')
      colors = require('colors'),
      spinner = ora(),
      csv = require('csvtojson'),
      snapomatic = require('./package.json')

let workflow,
    div = colors.magenta("============================================================"),
    config = {
      "size": {
        "height":     800,
        "width":      1280,
        "scale":      1
      },
      "users":        {},
      "domain":       null,
      "input":        null,
      "output":       null,
      "screenshots":  [],
      "log":          false
    }

program
  .version(snapomatic.version)
  .allowUnknownOption()
  .option('-l, --log', 'enable console logging')
  .option('-i, --input <file>','path to CSV input file')
  .option('-o, --output <path>', 'path to output folder')
  .option('-d, --domain <url>', 'domain to use with input file')
  .option('-u, --users <users>', 'JSON users object')
  .option('-w, --workflow <workflow>', 'path to external workflow file')
  .parse(process.argv);

if(typeof program.users !== 'undefined') {
  if(program.users.charAt(0) == "{") {
    config.users = JSON.parse(program.users)
  } else {
    config.users = JSON.parse(fs.readFileSync(program.users, 'utf8'));
  }
}
if(typeof program.workflow === 'undefined') {
  workflow = require('./workflow.js')
} else {
  workflow = require(program.workflow)
}
if(typeof program.input === 'undefined') {
  console.error(colors.red("✖ Error: No input CSV file provided. Specify input file with `-i <file>`"))
  process.exit(1);
} else {
  config.input = untildify(program.input)
}
if(typeof program.output === 'undefined') {
  console.error(colors.red("✖ Error: No output folder provided. Specify output folder with `-i <file>`"))
  process.exit(1);
} else {
  config.output = untildify(program.output)
  if (!fs.existsSync(config.output)){
    fs.mkdirSync(config.output);
  }
}
if(typeof program.domain === 'undefined') {
  console.error(colors.red("✖ Error: No URL provided. Specify domain with `-d <url>`"))
  process.exit(1);
} else {
  if(program.domain.startsWith('http://')) {
    if(typeof program.users === 'undefined') {
      console.warn(colors.yellow("⚠ Warning: Running over http\n"))
      config.domain = program.domain
    } else {
      console.error(colors.red("✖ Error: Cannot process users over http.\n  Please specify https or remove users object."))
      process.exit(1);
    }
  } else if(program.domain.startsWith('https://')){
    config.domain = program.domain
  } else {
    config.domain = 'https://' + program.domain
  }
}
if(program.log) {
  config.log = true
} else {
  spinner.start(colors.yellow('Loading ' + config.domain))
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
      if(!config.log) spinner.succeed(colors.green("Loaded " + config.domain))
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

    let url = config.domain + config.screenshots[i]["URL"],
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

    await workflow.process(description, role, title, file, url, chromeless, config)

  }

  await chromeless.end()
  chrome.kill()

  if(config.log) console.log('\n')
  spinner.succeed(colors.green(config.screenshots.length + " screenshots created"))
  if(!config.log) spinner.stop()

}
