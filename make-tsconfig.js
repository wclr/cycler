var dir = process.argv[2] || require('path').basename(process.cwd())
var config = require(__dirname + '/tsconfig.json')
config.include = [
  "../typings/*",
  "src/**/*"
]
require('fs').writeFileSync(
  __dirname + '/' + dir + '/tsconfig.json',
  JSON.stringify(config, null, 2)
) 