import { exec } from 'child_process';
import { promisify } from 'util';
import { createInterface } from 'readline';
import packageJson from '../package.json' assert { type: 'json' };
import fs from 'fs';

const _fs = fs.promises;
const _exec = promisify(exec);
const stdIO = createInterface({
  input: process.stdin,
  output: process.stdout
});

const args = process.argv;
let version = null;

if (Array.isArray(args)) {
  args.forEach((arg) => {
    const [key, value] = arg.split('=');
    if (key === 'version') {
      version = value;
    }
  });
}

// Generating new semantic version based on the version argument passed
const currentVersion = packageJson.version;
let newVersion = currentVersion;

switch (version) {
  case 'patch': {
    const patchVersion = parseInt(currentVersion.split('.')[2]) + 1;
    newVersion = `${currentVersion.split('.')[0]}.${currentVersion.split('.')[1]}.${patchVersion}`;
    break;
  }
  case 'minor': {
    const minorVersion = parseInt(currentVersion.split('.')[1]) + 1;
    newVersion = `${currentVersion.split('.')[0]}.${minorVersion}.0`;
    break;
  }
  case 'major': {
    const majorVersion = parseInt(currentVersion.split('.')[0]) + 1;
    newVersion = `${majorVersion}.0.0`;
    break;
  }
  case null:
    logWarning('No version specified. Skipping version update.');
    break;
  default:
    logError('version not supported');
    logWarning('version must be one of: patch, minor, major, skip');
    process.exit(1);
}

logWarning(`version set to ${newVersion}`);

// writing the version to package.json
packageJson.version = newVersion;
await _fs.writeFile(
  'package.json',
  Buffer.from(JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
);

// Tagging the latest commit with the new version tag
const prePublishCommands = [`git add package.json`, `rm -rf dist`, `npm run build`];

const postPublishCommands = [
  (otp) => {
    return `npm publish --otp ${otp} --access public`;
  },
  `git push -f`,
  `git push --tags`
];

for (const command of prePublishCommands) {
  const { stdout, stderr } = await _exec(command);
  console.log(command);
  console.log(stdout);
  console.log(stderr);
}

stdIO.question('\n\nPublish? (y/n) ', async (answer) => {
  if (answer === 'y') {
    stdIO.question('Enter OTP to publish: ', async (otp) => {
      for (const command of postPublishCommands) {
        await _exec(typeof command === 'function' ? command(otp) : command);
      }
      logSuccess('Published!');
      process.exit(0);
    });
  } else {
    logWarning('Publish Skipped!');
    process.exit(0);
  }
});

// Ending the publish script

// Utils functions

function logError(message) {
  console.log(`\x1b[31m${message}\x1b[0m`);
}

function logSuccess(message) {
  console.log(`\x1b[32m${message}\x1b[0m`);
}

function logWarning(message) {
  console.log(`\x1b[33m${message}\x1b[0m`);
}
