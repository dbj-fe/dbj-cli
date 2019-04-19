const Metalsmith = require('metalsmith')
const inquirer = require('inquirer')
const minimatch = require('minimatch')
const async = require('async')
const Handlebars = require('handlebars')
const delimiters = require('handlebars-delimiters')
const render = require('consolidate').handlebars.render

const DELIMITER_LEFT = '<%'
const DELIMITER_RIGHT = '%>'

// 修改handlebars的分隔符
delimiters(Handlebars, [DELIMITER_LEFT, DELIMITER_RIGHT])

module.exports = function generate(name, src, dest, done) {
  const metalsmith = Metalsmith(src)

  let metalsmithMetadata = metalsmith.metadata()
  metalsmithMetadata.name = name

  metalsmith.use(askQuestions)
    .use(filterFiles)
    .use(renderTemplateFiles)

  metalsmith.clean(true)
    .source('.')
    .destination(dest)
    .build((err, files) => {
      done(err)
    })

}

function askQuestions(files, metalsmith, done) {
  inquirer.prompt([
    {
      type: 'confirm',
      name: 'isMultiPage',
      message: '该项目是否是多页面？'
    },
    {
      type: 'confirm',
      name: 'withLogin',
      message: '是否加入登录页？'
    },
    {
      type: 'input',
      name: 'systemCode',
      message: '请填写项目的systemCode:',
      validate: function (val) {
        if (!val) {
          return '请填写systemCode'
        }
        if (!/^\w+(-\w+)*$/.test(val)) {
          return '请填写正确的systemCode'
        }
        return true
      },
      when: function (answers) {
        return answers.withLogin
      }
    },
    {
      type: 'confirm',
      name: 'withDemo',
      message: '是否加入样例代码？'
    },
    {
      type: 'confirm',
      name: 'withRichEditor',
      message: '是否包含富文本编辑器？',
      default: false
    }
  ]).then(answers => {
    let metalsmithMetadata = metalsmith.metadata()
    Object.keys(answers).forEach(key => {
      metalsmithMetadata[key] = answers[key]
    })
    done()
  })
}

function filterFiles(files, metalsmith, done) {
  let { isMultiPage, withRichEditor, withLogin, withDemo } = metalsmith.metadata()
  if (!isMultiPage) {
    delete files['config/multipages.js']
  }
  if (!withRichEditor) {
    delete files['src/views/demo/Editor.vue']
  }
  if (!withLogin) {
    delete files['src/Login.vue']
  }
  if (!withDemo) {
    Object.keys(files).forEach(file => {
      if (minimatch(file, 'src/views/demo/*')
        || minimatch(file, 'src/components/demo/*')) {
        delete files[file]
      }
    })
  }

  done()
}

function renderTemplateFiles(files, metalsmith, done) {
  let keys = Object.keys(files)
  let metalsmithMetadata = metalsmith.metadata()

  async.each(keys, (file, next) => {
    const str = files[file].contents.toString()
    // do not attempt to render files that do not have mustaches
    const regexp = new RegExp(DELIMITER_LEFT + '([^{}]+)' + DELIMITER_RIGHT, 'g');
    if (!regexp.test(str)) {
      return next()
    }
    render(str, metalsmithMetadata, (err, res) => {
      if (err) {
        err.message = `[${file}] ${err.message}`
        return next(err)
      }
      files[file].contents = new Buffer(res)
      next()
    })
  }, done)
}