# Web Environment

![Screenshot](https://github.com/zequez/web-environment/blob/main/changelog/latest-screenshot.png?raw=true)

Evergreen coding environment with:

- Integrated UI for managing multiple repositories in a dashboard
- Curated libraries and development tools
- Booting button for each repo, with auto-port-assignment
- Building and publishing buttons (only Github Pages for now)
- Visually simplified version control for non-technical people
- Visual self-updater from sourced Git repository
- The whole collection of all my personal utility tools available on every repo

# Architectural Paradigm Shifts

## Subrepos

There is a /repos folder where repositories are stored.

All the repositories use the same package.json and all the other configuration files from the parent repository.

Cross-referencing repositories is OK, as long as there is an agreement on names.

On VSCode you work on a single project with the root repository, and everything type-checks, and refactoring works well.

## Always on deveploment and no central authority

There is no production version, it is meant to be run on development mode and self-update from whichever repo you pull it from.

## Curated Library, not dependencies

Rather than exposing people to the whole array of libraries from NPM, the package.json list has a
collection of packages that are useful. You may find things like the TLDraw SDK and Box2D, chalk, svelte tools and libraries,
some other frameworks such as React, Preact, UnoCSS, Vite, Sharp, Lodash, Cheerio, Chokidar, Iconify with Font Awesome, Yaml, D3.

These things are not neccesarily needed by a single project, but are useful for many. And these are not bundled when projects are
projected into the web, or loaded into memory unnecesarily; they are loaded and bundled on demand if the project imports them.

As new experiments are crafted on the Coding Field, the Curated Library gets expanded.

Additionally, the Curated Library may include, why not, code for Rust, using Cargo for example; or Python. There is nothing about the project that neccesitates that everything should be made with JavaScript.

# Setup

The setup is not fully non-technical yet, it requires some manual work.

Make sure you've got [GIT](https://git-scm.com/install/) and [Bun](https://bun.com/docs/installation) installed. (Would you value an automatic installer for both GIT and Bun? PM me to let me know.)

Anso make sure you've got an Internet connection. It's neccesary for the initial setup.

Then, using GIT, you clone the repository using the [command-line interface](https://en.wikipedia.org/wiki/Command-line_interface) (CLI):

```
git clone https://github.com/Zequez/web-environment
```

or without GIT, you [download it as a zip](https://github.com/Zequez/web-environment/archive/refs/heads/main.zip) from the Github repo.

Then you've gotta run an extra command to fill the Curated Library from code pulled from the Internet. In programming lingo this is called installing the dependencies.

```
bun install
```

Then if and when that command finishes without any fatal errors, you should be ready to start the Mainframe.

```
bun start
```


That's it. Every time you want to start the Mainframe you've gotta run that `bun start` command.

Then you can copy the example repositories or input the URL from the ones available on Github. Here is some:

- https://github.com/Zequez/ezequielschwartzman.org
- https://github.com/Zequez/webenv-web
- https://github.com/Zequez/mogotes
- https://github.com/Zequez/agroeco
- https://github.com/Zequez/nodos.lat
- https://github.com/Zequez/web-casa-experimental

A repo can be as simple as a single `App.svelte` file.


# Motivation / Neccesity

I'm holding space for a constellation of autonomous bioregional digital nodes and I needed something
that could scale horizontally with thousands of independently stewarded websites without any cost or central point of failure,
while still collaborating on the code level to share the tools.

# Steward

[Ezequiel Schwartzman](https://ezequielschwartzman.org)
