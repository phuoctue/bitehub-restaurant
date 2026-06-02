const fs = require('fs')
const path = require('path')

const source = path.resolve(__dirname, '../assets')
const target = path.resolve(__dirname, '../dist/assets')

if (fs.existsSync(source)) {
  fs.cpSync(source, target, { recursive: true })
}
