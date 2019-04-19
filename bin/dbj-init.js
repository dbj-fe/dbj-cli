#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const download = require('download-git-repo')
const path = require('path')
const home = require('user-home')
const ora = require('ora')
const rm = require('rimraf').sync
const exists = require('fs').existsSync
const logger = require('../lib/logger')
const generate = require('../lib/generate')

/**
 * Usage.
 */

program.usage('<project-name>')


/**
 * Help.
 */

program.on('--help', () => {
  console.log()
  console.log('例子:')
  console.log(chalk.gray('    # 创建一个项目名称是bim-fe的前端项目'))
  console.log('    $ dbj init bim-fe')
  console.log()
})

/**
 * Help
 */

function help() {
  program.parse(process.argv)
  if (program.args.length < 1) {
    return program.help()
  }
}
help()

/**
 * Settings.
 */

const name = program.args[0]
const tmp = path.join(home, '.dbj-tempalates', 'vue', require('../package.json').version)
const to = path.resolve(path.join(process.cwd(), name))

run()

/**
 * Check, download and generate the project.
 */

function run() {
  downloadAndGenerate()
}

/**
 * Download and generate from template repo.
 */

function downloadAndGenerate() {
  const spinner = ora('正在下载模板')
  spinner.start()
  if (exists(tmp)) {
    rm(tmp)
  }
  download('zhaowenhao/dbj-vue-template', tmp, err => {
    spinner.stop()
    if (err) {
      logger.fatal('Failed to download repo ' + template + ': ' + err.message.trim())
    }
    console.log()
    console.log(chalk.green('模板下载完成'))
    console.log()
    generate(name, tmp, to, err => {
      if (err) {
        logger.fatal(err)
      }
      console.log()
      logger.success('项目%s创建成功！', chalk.green(name))
    })
  })
}