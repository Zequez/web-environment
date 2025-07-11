# Web Environment

This is an environment wrapper for coding web and apps together as a team.

## Values

Values are the measuring stick for the Gameworld. Celebration is due when these are noticed.

- Sharing
- Elegance
- Open communication
- Experimenting

## Principles

Principles are the underlying energy that fuels the Gameworld.

- Collaboration
- Simplicity
- Evolution
- Transparency
- Creation

## Purpose

Empower edgeworkers to use open source collaborative digital technology to radically leverage code-sharing
in order to create an alternative global Internet collaboration system together.

## Experiment #1: Have two people to try the prototype

- Get 2 other people, one with Windows and one with Linux (I'm on OSX), and ask them to help you test
  the system.
  - Document the whole process and write down every difficulties encountered
  - Each person creates a Github account
  - You create one personal repository for each person and invite them as collaborators (one for each)
  - Each person downloads the source code for the Web Environment from a link you share with them
  - Each person initializes the Web Environment (Bun install and such)
  - Each person runs the Web Environment
  - Each person adds the links to their own repos to the Web Environment for self-updating
  - You make a modification and push the changes
  - Each person should see the environment files self-update
  - Each person makes a change to their repository and push the changes
  - You should see their repository self-update

With this we have the foundation for a collaborative system that needs no technical skills to have
shared code.

- Implementation details
  - Have the source code at https://github.com/zequez/web-environment
  - Have an Electron app running with a simple menu listing itself (the Web Environment repo) and
    the sub-repos.
    - Each item should have
      - Title
      - Repository URL (opens the web on click)
      - System path (opens the filesystem browser on click, Explorer, Finder, etc)
      - Status: Local Updated | Remote Updated | Conflict (both updated) | Synced
      - Sync button
      - Remove button (with confirmation)
    - On top there should be a toggle "auto-update" that automatically pulls changes from the
      the repositories (rather than having to click "sync")
    - There should also be an auto-push button that automatically pushes changes to the remote
      repositories.
      - If there are changed files during push, all files are added and an automatic commit
        is created with a timestamp
    - You should be able to add/remove repos
      - When adding a repo it should pull it as soon as it's added

- Have a source code that is linked to a specific Github Repository branch
- As the app is opened in development mode, it runs as a normal app in your system
- The app can self-update from a Github Repository branch, with a visual UI for handling that
- The app has a sub-directory where it can watch Github Repositories and also keep them updated
- The app has a UI for pushing changes to any of the repositories



## Experiment #2: Have two people publish a website setting up Github pages
