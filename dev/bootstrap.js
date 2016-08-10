var fs = require('fs')
var babelOptions = JSON.parse(fs.readFileSync('./.babelrc', 'utf8'))

require('babel-core/register')(babelOptions)
require('./server')