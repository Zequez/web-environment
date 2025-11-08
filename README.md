# Web Environment

![Screenshot](https://github.com/zequez/web-environment/blob/main/assets/web-env-screenshot.png?raw=true)

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

# Motivation / Neccesity

I'm holding space for a constellation of autonomous bioregional digital nodes and I needed something
that could scale horizontally with thousands of independently stewarded websites without any cost or central point of failure,
while still collaborating on the code level to share the tools.

# Steward

[Ezequiel Schwartzman](https://ezequielschwartzman.org)
