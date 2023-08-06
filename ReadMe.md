# D-Day, Inc. Client-Side Only Site
Things for the client-side only ("static") site for ddayinc.com, replacing the server-side site of yore.

## Repo Layout
Some information about the layout of this repository:

| Path | Purpose |
| ---- | ------- |
[siteContents/](./siteContents/) | Where the "live" files for the site reside, including markup, markdown, scripts, data, and generated CSS
[src/](./src/) | The SASS style source (SCSS), some raw data from which to generate filtered data "views', code for such data generation. Note, this auto-generation applies to when using VS Code and Live Sass Compiler extension (`glenn2223.live-sass`) 👍
[.vscode/](./.vscode/) | Settings for the VS Code workspace for this project, of course. Includes things like settings for SASS->CSS compilation destination
