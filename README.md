# stubby-simply

## Install

```bash
npm install stubby-simply --save-dev
```

## Configure your `package.json`

### Api redirect conf

If you use Create-react-app
Add this in your `package.json` :

```json
"proxy": {
    "/api/": {
      "target": "http://localhost:8882",
      "ws": true,
      "autoRewrite": true,
      "hostRewrite": true
    }
},
```

All calls on /api/ will be redirect to the stubby server default config.

### Npm scripts

Add rename some scripts in the npm scripts part in `package.json`

```diff
   "scripts": {
-    "start": "react-scripts start",
+    "start-js": "react-scripts start",
+    "start": "npm-run-all -p stubby start-js",
+    "stubby": "stubby-simply --mocks mocks",
   }
```

Beware about the `-p` it is used to launch all scripts in parallel

## Contribution

Contribution documentation can be found in [contributing file](CONTRIBUTING.md).
