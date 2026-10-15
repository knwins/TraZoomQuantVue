import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = process.cwd()

function read (relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('public crawler files exist and unknown HTTP paths do not fall back to the app shell', () => {
  assert.match(read('public/robots.txt'), /Sitemap:\s*https:\/\/ai\.quantdinger\.com\/sitemap\.xml/)
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/ai\.quantdinger\.com\/<\/loc>/)

  for (const configPath of [
    'deploy/nginx-docker.conf',
    'deploy/nginx-docker.conf.template',
    'deploy/nginx.conf'
  ]) {
    const config = read(configPath)
    assert.match(config, /location = \/\s*\{[\s\S]*?try_files \/index\.html =404;/)
    assert.doesNotMatch(config, /try_files \$uri \$uri\/ \/index\.html;/)
  }
})
