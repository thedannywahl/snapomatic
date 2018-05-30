# Snapomatic
Snapomatic is a node.js tool to automate headless chrome and chromeless to crawl a website and capture screenshots.

![Snapomatic in process of capturing screenshots](https://raw.githubusercontent.com/thedannywahl/snapomatic/master/example/inprogress.png "Snapomatic in process of capturing screenshots")

Snapomatic takes a csv input file to process snapshots, and is capable of processing multiple users, allowing you to capture screenshots of different roles in a single pass.

## Instructions
`./index.js [-u ~/users.json] [-w ~/workflow.js] -i ~/workflow.csv -o ~/snaps -d example.com`

### Users Object
Simply pass an input CSV, an output folder, a domain, and a users Object. The users object can simply be a string passed directly to `-u` or an external json file.  the format for users is role, containing username and password.  Any number of roles can be passed.  Roles **must** match the role value passed in the CSV.

`-u '{"admin":{"username":"pparker","password":"hunter2"}}'`

```javascript
{
  "admin": {
    "username": "pparker",
    "password": "hunter2"
  },
  //guest, superadmin, moderator, etc.
  "user": {
    "username": "mmorales",
    "password": "dolphins"
  }
}
```

For a login without a role, simply leave it as an empty string in both the JSON and the CSV.

### Input File
The included `users.json` and `workflow.csv` are provided as examples.  The CSV file has the following rows:
`Title, URL, Role, Description`

Role-Title is used to name each snapshot, so for example `user-dashboard` and `admin-dashboard` would be saved based on the current role.  Description describes what the screenshot is capturing.  This is useful for debugging.

### Output Path
Specify the path where the output snapshots should be stored.  If the folder doesn't exist, it will be created.  Snapomatic will overwrite any images in the output folder with the same name.  Output will be saved as `role-title.png` if a role was provided or `title.png` if a role was not provided.

### Workflow

Snapomatic allows you to pass a custom workflow javascript file as a node module.  If a custom workflow is not passed, snapomatic will will use the builtin `workflow.js` module which simply saves a snapshot of the requested page.

A custom workflow can use the methods provided by [chromeless](https://github.com/prismagraphql/chromeless/) to capture snapshots.  If you need to interact with a page (e.g. `/login`) simply add a `case` to the `switch` in your custom workflow with instructions for chromeless. The cases are named after the `title` from the CSV.

The example workflow below shows how to navigate a login page using chromeless, then continue taking screenshots.

```javascript
exports.process = async function process(description, role, title, file, url, chromeless, config) {
  case "login":
    await chromeless
      // Go to Login Page
      .goto(url)
      // Save screenshot
      .screenshot({filePath:file})
      // Enter username in username field
      .type(config.users[role]["username"], '#username')
      // Enter password in password field
      .type(config.users[role]["password"], '#password')
      // Click login button
      .click('#login')
    break;
  default:
    await chromeless
      .goto(url)
      .screenshot({filePath:file})
}
```

### Debugging
Add the flag `--log` for robust console debugging.

## Modules

### chrome-launcher
[Chrome Launcher](https://github.com/GoogleChrome/chrome-launcher) automates launching headless Chrome in a streamlined way.

### chromeless
[Chromeless](https://github.com/prismagraphql/chromeless/) provides methods for automating Chrome.

### colors
[Colors](https://github.com/Marak/colors.js) for colorful console output.

### commander
[Commander](https://github.com/tj/commander.js) provides option parsing for CLI.

### csvtojson
[csvtojson](https://github.com/Keyang/node-csvtojson) provides CSV parsing for workflows.

### ora
[ora](https://github.com/sindresorhus/ora) renders spinner when `--log` is omitted.

### untildify
[untildify](https://github.com/sindresorhus/untildify) allows `~` in params.
