# cli-template
[![license](https://img.shields.io/github/license/flowscripter/cli-framework.svg)](https://github.com/flowscripter/cli-framework/blob/master/LICENSE.md)
[![dependencies](https://img.shields.io/david/flowscripter/cli-framework.svg)](https://david-dm.org/flowscripter/cli-framework)
[![travis](https://api.travis-ci.com/flowscripter/cli-framework.svg)](https://travis-ci.com/flowscripter/cli-framework)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=flowscripter_cli-framework&metric=coverage)](https://sonarcloud.io/dashboard?id=flowscripter_cli-framework)
[![npm](https://img.shields.io/npm/v/@flowscripter/cli-framework.svg)](https://www.npmjs.com/package/@flowscripter/cli-framework)

> CLI framework using ES Modules.

## Overview

This project provides a Javascript framework for developing Command Line Interface (CLI) applications running in NodeJS.

#### Key Features 

* Dynamic plugin based import of commands using [@flowscripter/esm-dynamic-plugins](https://github.com/flowscripter/esm-dynamic-plugins)
* ES2015 module based
* Written in Typescript
* Minimal dependencies
* Support for persisted configuration
* Built in commands for help, version management and plugin management.

#### Key Concepts

The key concepts are:

* A host application extends the *CLI* interface (a default CLI implementation is provided)
* The *CLI* is responsible for loading one or more *Commands* from one or more *CommandFactories* and providing
them to the *Runner*
* The CLI provides invocation arguments to the *Runner* which parses them and determines which *Command* to run
* When a *Command* is run, it is provided with a *Context* which provides access to a number of *CommandServices*
* The *CLI* is able to pre-populate the *Context* with host application *CommandService* implementations
* The *PluginCommandFactory* is an instance of a *CommandFactory* providing the ability to dynamically
load *CommandPlugins* which consist of one or more *Command* implementations
 
The following high level class diagram illustrates these relationships:

![High Level Class Diagram](images/high_level_class_diagram.png "High Level Class Diagram")

## Example

The [Flowscripter CLI](https://github.com/flowscripter/cli) is a fully functional CLI application based on
this framework.
 
## API

[API documentation](https://flowscripter.github.io/cli-framework)

## Development

Firstly: 

```
npm install
```

then:

Build: `npm run build`

Watch: `npm run watch`

Test: `npm test`

Lint: `npm run lint`

Docs: `npm run docs`

The following diagram provides an overview of the main classes:

![Implementation Class Diagram](images/implementation_class_diagram.png "Implementation Class Diagram")

## Further Details

Further details on project configuration files and Javascript version support can be found in 
the [template for this project](https://github.com/flowscripter/ts-template/blob/master/README.md#overview).

## Alternatives

There are two well popular alternatives available. Both are well documented and feature rich. 

* [oclif](https://oclif.io) 
* [Gluegun](https://infinitered.github.io/gluegun)

The core functionality of a CLI framework boils down to:
 
1. **parsing input/printing output**: to achieve this functionality, both of the above alternatives 
rely heavily on other packages under the hood e.g. [yargs-parser](https://github.com/yargs/yargs-parser) and
[colors.js](https://github.com/Marak/colors.js) etc.) This is also the scenario for [@flowscripter/cli-framework](./).    

1. **a plugin mechanism**: Neither of the above alternatives provided a dynamic, abstracted plugin import mechanism 
based on ES2015 modules:  
* `oclif` relies on available plugins being declared in `package.json`.
* `Gluegun` supports dynamic loading of plugins based on a required folder structure.

Despite the wonders of transpilers and bundlers both also proved quite hard to get working in a native ES2015 application.

## License

MIT © Flowscripter
