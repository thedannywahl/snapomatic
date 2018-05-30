# Snapomatic
Snapomatic is a node.js tool to automate headless chrome and chromeless to crawl a website and capture screenshots.

Snapomatic takes a csv input file to process snapshots, and is capable of processing multiple users, allowing you to capture screenshots of different roles in a single pass.

![Snapomatic in process of capturing screenshots](https://raw.githubusercontent.com/thedannywahl/snapomatic/master/example/inprogress.png)

![Snapomatic in process with verbose logging enabled](https://raw.githubusercontent.com/thedannywahl/snapomatic/master/example/logging.png)
## How to use it

`node index.js -u ~/users.json -i ~/workflow.csv -o ~/snaps -d example.com`

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

### Input file

The included `users.json` and `workflow.csv` are provided as examples.  The CSV file has the following rows:
`Title, URL, Role, Description`

Role-Title is used to name each snapshot, so for example `user-dashboard` and `admin-dashboard` would be saved based on the current role.  Description describes what the screenshot is capturing.  This is useful for debugging.

### debugging

Add the flag `--log` for robust console debugging.

## Interacting

Snapomatic loops through the CSV rows and uses [chromeless](https://github.com/prismagraphql/chromeless/) to capture snapshots.  If you need to interact with a page (e.g. `/login`) simply add a `case` to the `switch` in the workflow module (`workflow.js`) with instructions for chromeless. The cases are named after the `title` from the CSV.

```javascript
case "login":
  await chromeless
    .goto(url)
    .screenshot({filePath:file})
    .type(config.users[role]["username"], '#username')
    .type(config.users[role]["password"], '#password')
    .click('#login')
  break;
default:
    await chromeless
      .goto(url)
      .screenshot({filePath:file})
```

The switch default simply navigates to the page and captures a screenshot, it is not necessary to add a case for every page, only those which require specific interaction.
