const fs = require('fs')
const path = require('path')

const source = path.resolve(__dirname, '../assets')
const target = path.resolve(__dirname, '../dist/assets')

const copyDirectory = (from, to) => {
  fs.mkdirSync(to, { recursive: true })

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name)
    const targetPath = path.join(to, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath)
      continue
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }
}

try {
  if (!fs.existsSync(source)) {
    process.exit(0)
  }

  copyDirectory(source, target)
} catch (error) {
  console.error('Failed to copy assets:', error)
  process.exit(1)
}
