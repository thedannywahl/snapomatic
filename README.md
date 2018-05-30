# Snapomatic
Snapomatic is an automated screenshot utility which leverages headless chrome.

![Snapomatic in process of capturing screenshots](https://raw.githubusercontent.com/thedannywahl/snapomatic/master/example/inprogress.png "Snapomatic in process of capturing screenshots")

Snapomatic takes a CSV input file to process snapshots, and is capable of processing multiple users, allowing you to capture screenshots of different roles in a single pass.

## Installing
Download the [compiled binary](https://github.com/thedannywahl/snapomatic/releases/) or install via NPM with
`npm i -g snapomatic`

## Instructions
To run snapomatic you must provide an input CSV, and output folder, and a domain.  Optional parameters include logging, custom workflow files, and user roles.  `--help` and `--version` are also built-in.

```bash
snapomatic [--log] [-u users.json] [-w workflow.js] -i workflow.csv -o screenshots/ -d example.com
```

### Examples

The included `/examples` folder provides a couple of examples for usage.

```bash
snapomatic -i ./examples/wikipedia/wiki.csv -o ~/Desktop/snapomatic/wiki/ -d en.wikipedia.org
````

```bash
snapomatic --log -w ./examples/google/work.js -i examples/google/google.csv -o ~/Desktop/snapomatic/google/ -d google.com
```

Examples of custom workflows `custom-workflow.js` and user objects `users.json` are provided for evaluation in the example folder as well.

### Users Object
The users object can be a string passed directly to `-u` or an external json file.  The format for users is role, containing username and password.  Any number of roles can be passed.  Roles **must** match the role value passed in the CSV.

An example of passing the role Object inline is provided below.

```bash
-u '{"admin":{"username":"pparker","password":"hunter2"}}'
```

An example of referencing an external json object is provided below

```bash
-u ~/path/to/users.json
```

With the JSON file containing the following information:

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

For a login without a role, simply leave it as an empty string in both the JSON and the CSV. An example of a single user with no role would look like:

```bash
-u '{"":{"username":"foo","password":"bar"}}'
```

An empty string is necessary to match an empty field in the CSV.

### Input File
The included `users.json` and `workflow.csv` are provided as examples.  The CSV file has the following rows:
`Title, URL, Role, Description`

Role-Title is used to name each snapshot, so for example `user-dashboard` and `admin-dashboard` would be saved based on the current role.  Description describes what the screenshot is capturing.  This is useful for debugging.

### Output Path
Specify the path where the output snapshots should be stored.  If the folder doesn't exist, it will be created.  Snapomatic will overwrite any images in the output folder with the same name.  Output will be saved as `role-title.png` if a role was provided or `title.png` if a role was not provided.

### Workflow
Snapomatic allows you to pass a custom workflow javascript file as a node module.  If a custom workflow is not passed, snapomatic will will use the builtin `workflow.js` module which simply saves a snapshot of the requested page.

A custom workflow can use the methods provided by [chromeless](https://github.com/prismagraphql/chromeless/) to capture snapshots.  If you need to interact with a page (e.g. `/login`) simply add a `case` to the `switch` in your custom workflow with instructions for chromeless. The cases are named after the `title` from the CSV.  URLs are not used because chromeless will follow redirects and you might end up on a different page than the one provided in the CSV.

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

Logging will output the current configuration, program args, executable paths, as well as information for each screenshot created when parsing the input CSV file.

## Security
snapomatic will **NOT** allow you to pass a roles object over http.  I don't care if the remote website allows it.  It will also warn when explicitly calling http, but will still run.  If no transit method is provided, it will default to https.

## Modules
* [Chrome Launcher](https://github.com/GoogleChrome/chrome-launcher) automates launching headless Chrome in a streamlined way.
* [Chromeless](https://github.com/prismagraphql/chromeless/) provides methods for automating Chrome.
* [Colors](https://github.com/Marak/colors.js) for colorful console output.
* [Commander](https://github.com/tj/commander.js) provides option parsing for CLI.
* [csvtojson](https://github.com/Keyang/node-csvtojson) provides CSV parsing for workflows.
* [ora](https://github.com/sindresorhus/ora) renders spinner when `--log` is omitted.
* [untildify](https://github.com/sindresorhus/untildify) allows `~` in params.
