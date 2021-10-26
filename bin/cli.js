#!/usr/bin/env node

/******************************* 
 * Create new node project
 * By Sami Maxhuni (Samushi) <samimaxhuni510@gmail.com>
********************************/

// const Starter = require('../utils/starter');
const { Command } = require('commander');
const Starter = require('../utils/starter');
const program = new Command();

program
    .version('1.0.0')
    .description('Create your NodeJS easy and fast');

program
    .command('setup')
    .description('create setup for node')
    .option('-d, --dir <source>', 'Choose name of directory or just use dot(.) for current directory', 'moder-node-starter')
    .action((options) => {
        const {dir} = options;
        new Starter(dir);
    })
    .addHelpText('after', `
Examples:
  $ setup --dir . // for default directory
  $ setup --dir MyFolder // your folder
`
  );

program.parse(process.argv);