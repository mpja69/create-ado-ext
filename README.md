# Build system for setting up a ADO browser extension with Elm

Run the generator to start a new project for

- browser extension
- injects a button in ADO
- have functionality to make REST API calls to ADO
- opens an overlay as an iFrame
- write the app using Elm
- has a build pipeline
- has a deploy pipeline

## Example placeholders

-	`__EXT_NAME__` – extension display name
-	`__PKG_NAME__` – npm package name
-	`__DESCRIPTION__` – manifest description
-	`__VERSION__` – startversion, ex. 0.1.0

## Install the new command
```
cd create-ado-ext
npm link
```

## Usage
```
create-ado-ext test-ext
cd test-ext
npm install
npm run dev
```

