#!/usr/bin/env node
'use strict';
const fs = require('fs');
const sharp = require('sharp');
const glob = require('glob');
const ncp = require('ncp').ncp;
const chalk = require('chalk');

const pkg = require('./package.json');
const DEFAULT_DEST = 'dest';

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
  let input = null;
  for (let i = 0; i < argv.length; i++) {
    // Flag.
    if (argv[i].substr(0, 2) === '--') {
      const [flag, value = true] = argv[i].substr(2).split('=');
      flags[flag] = value;
    }
    // Input.
    else if (input === null) {
      input = argv[i];
    }
    // Malformed.
    else {
      printErrorMessage();
      process.exit(0);
    }
  }
  return {input, flags};
}

function clone (source, destination) {
  return new Promise((resolve, reject) => {
    ncp(source, destination, error => error ? reject(error) : resolve());
  });
}

function deriveFilesFromPath (path) {
  // Assume this path is a directory.
  const paths = glob.sync(`${path}/**/*`);
  const files = paths.filter(path => fs.lstatSync(path).isFile());
  return files;
}

function spookifyImage (pathToImage, dest) {
  const pathToOutput = `${dest}${'/'}${pathToImage.substr(pathToImage.indexOf('/') + 1)}`;
  return new Promise((resolve, reject) => (
    sharp(pathToImage)
    .resize(100, 1000)
    .toBuffer((errorBuffer, buffer) => {
      fs.writeFile(pathToOutput, buffer, errorWrite => {
        if (errorBuffer) {
          reject(errorBuffer);
        } else if (errorWrite) {
          reject(errorBuffer);
        } else {
          console.log(` ${chalk.green('↗')} ${chalk.bold(pathToOutput)}`);
          resolve();
        }
      })
    })
  ));
}

function main (input, flags) {
  const output = flags.output || DEFAULT_DEST;

  if (flags.help) {
    printHelpMessage();
    process.exit(0);
  }

  if (flags.version) {
    printVersionMessage();
    process.exit(0);
  }

  console.log('Getting ready to scare the images');
  const images = deriveFilesFromPath(input);

  // spinner.text = 'Preparing output';
  clone(input, output)
    .then(() => {
      const jobs = images.map(image => () => spookifyImage(image, output));
      const firstJob = jobs[0];
      const otherJobs = jobs.slice(1);
      const done = otherJobs.reduce((previous, current) => previous.then(current), firstJob());
      done.then(() => {
        console.log(chalk.green`✓ Successful spookification`);
      })
    })
    .catch((error) => {
      console.log(`${chalk.red('↻ Something went wrong')}\nError message: ${error.message}`);
    });
}

const argv = process.argv.slice(2);
const {input, flags} = parseInput(argv);
main(input, flags);
