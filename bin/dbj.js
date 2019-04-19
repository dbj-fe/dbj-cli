#!/usr/bin/env node

const program = require('commander');

program.version(require('../package.json').version)
  .usage('<command> [options]')
  .command('init <project-name>', '创建一个名字是project-name的Vue项目')


program.parse(process.argv)
