#!/usr/bin/env node
'use strict';
const fs = require('fs');
const sharp = require('sharp');
const glob = require('glob');
const ora = require('ora');
const chalk = require('chalk');
const spinners = require('cli-spinners');

const pkg = require('./package.json');

function printErrorMessage () {
  console.log(`💀 ${chalk.red('Boo!')} You did something wrong.`);
  console.log('   Sorry, let\'s try that again.');
  console.log('');
  console.log('   Check out `spookify --help` to see what you can try.');
  console.log('');
}

function printHelpMessage () {
  console.log(`👻 spookify v${pkg.version} — Turn all your images into spooky images.`);
  console.log('');
  console.log('🎃 Usage: spookify [IMAGES_ROOT] [OPTIONS]');
  console.log('');
  console.log('🦴  Valid values for OPTIONS:');
  console.log('     --output=dest   Specify a destination for the output.');
  console.log('     --version       Print the current version.');
  console.log('     --help          Print the help message.');
  console.log('');
}

function printVersionMessage () {
  console.log(`👻 spookify v${pkg.version} — Turn all your images into spooky images.`);
  console.log('');
}

function parseInput (argv) {
  const flags = {};
  let path = null;
  for (let i = 0; i < argv.length; i++) {
    // Flag.
    if (argv[i].substr(0, 2) === '--') {
      const [flag, value = true] = argv[i].substr(2).split('=');
      flags[flag] = value;
    }
    // Path.
    else if (path === null) {
      path = argv[i];
    }
    // Malformed.
    else {
      printErrorMessage();
      process.exit(0);
    }
  }
  return {path, flags};
}

function deriveFilesFromPath (path) {
  // Assume this path is a directory.
  const paths = glob.sync(`${path}/**/*`);
  const files = paths.filter(path => fs.lstatSync(path).isFile());
  return files;
}

function spookifyImage (pathToImage, dest = './dest') {
  return sharp(pathToImage)
    .rotate()
    .png()
    .toFile(`${dest}/${pathToImage}`)
    .then(res => console.log('success', res))
    .catch(res => console.log('fail', res));
}

function main (path, flags) {
  const spinner = ora({
    text: 'Warming up',
    color: 'white',
    spinner: {
      ...spinners.dots10,
      interval: 30
    }
  }).start();

  if (flags.help) {
    printHelpMessage();
    process.exit(0);
  }

  if (flags.version) {
    printVersionMessage();
    process.exit(0);
  }

  spinner.text = 'Grabbing images';
  const images = deriveFilesFromPath(path);
  spinner.text = 'Making things spooky';
  Promise.all(images.map(image => spookifyImage(image, flags.output)))
    .then(() => {
      spinner.stopAndPersist({
        symbol: chalk.green`✓`,
        text: `Success`
      });
    })
    .catch(() => {
      spinner.stopAndPersist({
        symbol: chalk.red`✖`,
        text: `Failed`
      });
    });
}

const argv = process.argv.slice(2);
const {path, flags} = parseInput(argv);
main(path, flags);
