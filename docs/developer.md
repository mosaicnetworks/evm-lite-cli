# Developers

This document describes the process of building a developer environment. These steps should only be required if you want to enhance/compile your own client. For all other users, the prebuild `npm` or `yarn` releases should suffice.

## Dependencies and Project Build

To begin with, you will need to install Node and NPM, which are bundled together in the installation package from the [Node website](https://nodejs.org/en/).

This project has been built and tested with Node version `10.16.0`.

You will need to clone the repo:

```bash
$ svn clone https://github.com/mosaicnetworks/evm-lite-cli.git
```

Firstly you will need to install dependencies using `npm`

```bash
npm install
```

or with `yarn`

```bash
yarn install
```

This should also transpile typescript files into `dist/`.

For development, it is advised to use

```bash
npm run i
```

to test the CLI. This is a wrapper script which runs the CLI directly from the source files.

Alternatively, you can run `npm link` and access the CLI through `evmlc` however any changes made to the source files needs to be transpiled before changes are seen.
