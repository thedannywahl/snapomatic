const { spawn } = require('child_process'),
      { Chromeless } = require('chromeless'),
      untildify = require('untildify'),
      path = require('path'),
      program = require('commander'),
      fs = require('fs'),
      chromeLauncher = require('chrome-launcher')

let div = "============================================================",
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
  .option('-l, --log', 'Enable console logging')
  .option('-i, --input <file>','required user input')
  .option('-o, --output <path>', 'output path')
  .option('-d, --domain <url>', 'domain')
  .option('-u, --users <users>', 'users')
  .parse(process.argv);

if(typeof program.users === 'undefined') {
  console.log("No users provided. Specify users with `-u <users>`")
  process.exit(1);
} else {
  if(program.users.charAt(0) == "{") {
    config.app.users = JSON.parse(program.users)
  } else {
    config.app.users = JSON.parse(fs.readFileSync(program.users, 'utf8'));
  }
}
if(typeof program.input === 'undefined') {
  console.log("No input CSV file provided. Specify input file with `-i <file>`")
  process.exit(1);
} else {
  config.input = untildify(program.input)
}
if(typeof program.output === 'undefined') {
  console.log("No output path provided. Specify output path with `-i <file>`")
  process.exit(1);
} else {
  config.output = untildify(program.output)
  if (!fs.existsSync(config.output)){
    fs.mkdirSync(config.output);
  }
}
if(typeof program.domain === 'undefined') {
  console.log("No URL provided. Specify output file with `-d <url>`")
  process.exit(1);
} else {
  config.app.domain = 'https://' + program.domain
}
if(program.log) config.log = true

const csv = require('csvtojson')
csv()
  .fromFile(config.input)
  .then((jsonObj)=>{
    config.screenshots = jsonObj;
  }).then((jsonObj)=>{
    chromeLauncher.launch({
      port: 9222,
      chromeFlags: ['--headless', '--disable-gpu', '--hide=scrollbars', '--crash-dumps-dir=' + config.path + '/tmp']
    }).then(chrome => {
      if(config.log) {
        console.log("Command" + '\n' + div + '\n' + "Node path: " + process.argv[0] + '\n' + "Script path: " + process.argv[1])
        console.log("Arguments: " + process.argv.slice(2,process.argv.length) + '\n\n')
        console.log("Configuration" + '\n' + div + '\n' + "config: " + JSON.stringify(config, null, 2))
      }
      run().catch(console.error.bind(console))
      chrome.kill()
    })
  })

async function run() {
  const chromeless = new Chromeless({
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
      "port":     9222,
      "secure":   false,
      "closeTab": true
    }
  })

  for(let i = 0; i < config.screenshots.length; i++) {
    let url = config.app.domain + config.screenshots[i]["URL"],
        description = config.screenshots[i]["Description"],
        role = config.screenshots[i]["Role"],
        title = config.screenshots[i]["Title"],
        file = path.join(config.output, role + "-" + title + ".png")

    if(config.log) {
      console.log('\n\n' + title + '\n' + description + '\n' + div)
      console.log("Current Role: " + role + '\n' + "Current URL: " + url + '\n' + "Current output file: " + file + '\n')
    }

    switch(title) {
      case "login":
        await chromeless
          .goto(url)
          .screenshot({filePath:file})
          .type(config.app.users[role]["username"], '#pseudonym_session_unique_id')
          .type(config.app.users[role]["password"], '#pseudonym_session_password')
          .click('.Button--login')
        break;
      case "dashboard-card":
        await chromeless
          .goto(url)
          .click('#DashboardOptionsMenu_Container button')
          .click('#application + span ul[role="menu"] li:first-child ul[role="group"] li:nth-child(1) span:nth-child(2)')
          .wait('.ic-DashboardCard__header_hero')
          .screenshot({filePath:file})
        break;
      case "dashboard-list":
        await chromeless
          .goto(url)
          .click('#DashboardOptionsMenu_Container button')
          .click('#application + span ul[role="menu"] li:first-child ul[role="group"] li:nth-child(2) span:nth-child(2)')
          .wait('.PlannerApp h2')
          .screenshot({filePath:file})
        break;
      case "logout":
        await chromeless
          .goto(url)
          .click('#Button--logout-confirm')
        break;
      default:
        await chromeless
          .goto(url)
          .screenshot({filePath:file})
    }
  }
  await chromeless.end()
}
