# Dockhero CLI plugin

Companion CLI plugin to work with [Dockhero Heroku addon](https://elements.heroku.com/addons/dockhero)

## Installation

```bash
heroku plugins:install dockhero
```

## Usage

The plugin provides wrappers around `docker` and `docker-compose` commands.

```bash
 heroku dh:docker  <command> #  wrapper around docker command
 heroku dh:compose <command> #  wrapper around docker-compose command
```

Please see official Docker guide to find out the full list of available commands

The plugin also provides these helper commands:

```bash
  dh:env      #  downloads TSL certificates and prints out the environment variables to work with Dockhero
  dh:sh       #  run local shell with environment configured for Dockhero 
  dh:ssh      #  interactive shell in the Docker machine (e.g. to reboot it)
  dh:open     #  opens your Dockhero stack web UI in the browser (https://)
  dh:wait     #  waits for the provisioning to finish
  dh:generate #  installs the pre-defined stack - try "helloworld" as an example
```

## Example usage

Generate example stackfile with `heroku dh:install`.
You can find more stackfile examples [here](https://github.com/cloudcastle/dockhero-docs/tree/master/examples)

The commands below require that your Dockhero addon provisioning is done. If it is still in progress, you can wait for it to finish with `heroku dh:wait` or track provisioning progress in Heroku addon dashboard - `heroku addons:open dockhero`

First you can test the stack by running it in foreground:

```
heroku dh:compose up
```

If everything works fine, stop the stack by pressing `Ctrl-C` and run it in the background:

```
heroku dh:compose start
```

To check which processes are currently running, use either of these two commands:

```
heroku dh:compose ps
heroku dh:docker ps
```

## Variables Substitution

`docker-compose` supports [Envrironment Variables Substitution](https://docs.docker.com/compose/environment-variables/) like this:

```
web:
  environment:
    - FOO="${FOO}"
```

Dockhero CLI plugin changes the rules of variable resolution to the following:

1. Your shell ENV has top priority, e.g. `env FOO=bar heroku dh:compose up`
2. Your Heroku app's variables have the next priority, e.g. `heroku config:set FOO=bar; heroku dh:compose up`
3. The variables from your `.env` file have the least priority

Dockhero CLI plugin makes the following environment variables available to the app:

* DOCKHERO_HOST
* HEROKU_APP_NAME

## Using with Review Apps

In order to provision Docker-based microservice automatically, you'll need to add docker-compose to your Heroku app using a buildpack:

```
heroku buildpacks:add https://github.com/dockhero/heroku-buildpack-docker-compose.git
heroku buildpacks:add heroku/nodejs
```

Now you can use Dockhero CLI within your `postdeploy` script in `package.json` (notice how `dh-docker` and `dh-compose` binaries are used instead of `heroku dh:docker` and `heroku dh:compose` commands):

```
// package.json
...
  "dependencies": {
    "dockhero": "^1.0.24"
  },
  "scripts": {
    "postdeploy": "dh-compose up -d"
  }
...
```
