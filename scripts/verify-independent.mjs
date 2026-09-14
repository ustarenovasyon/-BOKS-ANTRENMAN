import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const scanRoots = ['src', 'package.json', 'package-lock.json', 'vite.config.js', 'index.html']
const forbidden = [/base44/i, /@base44\//i, /VITE_BASE44_/i, /BASE44_/i]
const skip = new Set(['node_modules', 'dist', '.git', 'docs'])
const findings = []

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  lines.forEach((line, index) => {
    for (const pattern of forbidden) {
      if (pattern.test(line)) {
        findings.push(`${path.relative(ROOT, file)}:${index + 1}: ${line.trim()}`)
        break
      }
    }
  })
}

function walk(target) {
  const abs = path.resolve(ROOT, target)
  if (!fs.existsSync(abs)) return
  const stat = fs.statSync(abs)
  if (stat.isFile()) return scanFile(abs)
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const p = path.join(abs, entry.name)
    if (entry.isDirectory()) walk(path.relative(ROOT, p))
    else if (entry.isFile()) scanFile(p)
  }
}

scanRoots.forEach(walk)

if (findings.length) {
  console.error('Harici builder bağımlılığı/kalıntısı bulundu:')
  findings.forEach((f) => console.error(`- ${f}`))
  process.exit(1)
}

console.log('OK: runtime/package/config tarafında Base44 bağımlılığı veya bootstrap kalıntısı bulunmadı.')
