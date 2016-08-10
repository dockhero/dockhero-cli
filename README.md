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

Docker will be configured to work with Dockhero Swarm cluster. `docker-compose` will also receive these additional arguments:
```
  --file dockhero-compose.yml  -  to adjust the name of the stackfile
  --project-name dockhero  -  to make docker-compose project name independent from the current directory
 ```

The plugin also provides these helper commands:

```bash
  dh:install  #  generate example dockhero-compose.yml
  dh:env      #  downloads TSL certificates prints out the environment variables to work with Dockhero Swarm
  dh:sh       #  run local shell with environment configured for Dockhero Swarm
  dh:ssh      #  SSH to the Docker machine
  dh:open     #  opens your Dockhero stack in the browser
  dh:wait     #  waits while the provisioning is in progress
```

## Example usage

Generate example stackfile with `heroku dh:install`. 
You can find more stackfile examples [here](https://github.com/cloudcastle/dockhero-docs/tree/master/examples)

The commands below require that your Dockhero addon provisioning is done. If it is still in progress, you can wait for it to finish with `heroku dh:wait` or track provisioning progress in Heroku addon dashboard - `heroku addons:open dockhero`
 
First you can test the stack by running it in foreground:

```
heroku dh:compose up
```

If everything works fine, stop the stack by pressing `Ctrl-C` and run it in production by scaling up each of the services:

```
heroku dh:compose scale web=1
```

To check which processes are currently running, use either of these two commands:

```
heroku dh:compose ps
heroku dh:docker ps
```



