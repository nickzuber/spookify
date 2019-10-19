#!/usr/bin/env node
'use strict';
const fs = require('fs');
const sharp = require('sharp');
const glob = require('glob');
const ncp = require('ncp').ncp;
const chalk = require('chalk');
const {performance} = require('perf_hooks');

const pkg = require('./package.json');
const DEFAULT_DEST = 'dest';

const _startingTimeOfRoutine = performance.now();

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

function shuffle (a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

function deriveFilesFromPath (path) {
  // Assume this path is a directory.
  const paths = glob.sync(`${path}/**/*`);
  const files = paths.filter(path => fs.lstatSync(path).isFile());
  return files;
}

function generateAndSaveSpookyImage (pathToOutput, image, buffers, [resolve, reject]) {
  const [pumpkin, spiderWeb, skeleton, ghost] = buffers;
  const locations = shuffle(['southeast', 'southwest', 'northeast']);
  return image.composite([
    {
      input: pumpkin,
      gravity: locations[0]
    }, {
      input: spiderWeb,
      gravity: 'northwest'
    }, {
      input: skeleton,
      gravity: locations[1]
    }, {
      input: ghost,
      gravity: locations[2]
    }
  ]).toBuffer((errorBuffer, buffer) => {
    fs.writeFile(pathToOutput, buffer, errorWrite => {
      if (errorBuffer) {
        reject(errorBuffer);
      } else if (errorWrite) {
        reject(errorBuffer);
      } else {

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        const scaryWords = ['Boo!', 'Ah! ', 'Ew! '];
        const scare = scaryWords[Math.floor(Math.random() * scaryWords.length)];
        process.stdout.write(` ${chalk.green('∗')} ${chalk.bold(scare)} ${chalk.gray(pathToOutput)}\n`);
        resolve();
      }
    })
  });
}

_scale: {
  const mf = Math.floor;
  const oe = Object.entries;
  var scale = (opts, delta) => (
    oe(opts).reduce((m, [k, v]) => (m[k] = mf(v / delta), m), {})
  );
}

function spookifyImage (pathToImage, dest) {
  const pathToOutput = `${dest}${'/'}${pathToImage.substr(pathToImage.indexOf('/') + 1)}`;
  process.stdout.write(` ${chalk.gray('∗')} ${chalk.gray(pathToOutput)}`);

  return new Promise((resolve, reject) => {
    const image = sharp(pathToImage);
    return image.metadata()
      .then(({width, height}) => {
        Promise.all([
          sharp('images/pumpkin.png').resize(scale({height}, 4)).toBuffer(),
          sharp('images/spider-web.png').resize(scale({height}, 2)).toBuffer(),
          sharp('images/skeleton.png').resize(scale({height}, 2)).toBuffer(),
          sharp('images/ghost.png').resize(scale({height}, 2)).toBuffer(),
        ])
          .then(buffers => (
            generateAndSaveSpookyImage(
              pathToOutput,
              image,
              buffers,
              [resolve, reject]
            )
          ));
      });
  });
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

  process.stdout.write('\n');
  const images = deriveFilesFromPath(input);

  clone(input, output)
    .then(() => {
      const jobs = images.map(image => () => spookifyImage(image, output));
      const firstJob = jobs[0];
      const otherJobs = jobs.slice(1);
      const done = otherJobs.reduce((previous, current) => previous.then(current), firstJob());
      done.then(() => {
        const t_ms = performance.now() - _startingTimeOfRoutine;
        console.log(chalk.green('\n✓ Images successfully spooked 👻'));
        console.log(chalk.gray(`  Took ${(t_ms / 1000).toFixed(3)}s\n`));
      })
    })
    .catch((error) => {
      console.log(`${chalk.red('↻ Something went wrong')}\nError message: ${error.message}`);
    });
}

const argv = process.argv.slice(2);
const {input, flags} = parseInput(argv);
main(input, flags);
