import { test } from 'node:test'
import assert from 'node:assert'
import { sanitizeFilename, getAssetFilename } from './download-collection.js'

test('sanitizeFilename removes invalid characters', () => {
  assert.strictEqual(
    sanitizeFilename('file/with\\invalid:chars'),
    'file-with-invalid-chars'
  )
})

test('sanitizeFilename removes multiple slashes', () => {
  assert.strictEqual(
    sanitizeFilename('file//name'),
    'file--name'
  )
})

test('sanitizeFilename replaces question marks and asterisks', () => {
  assert.strictEqual(
    sanitizeFilename('what?*is*this?'),
    'what--is-this-'
  )
})

test('sanitizeFilename replaces pipes and angle brackets', () => {
  assert.strictEqual(
    sanitizeFilename('file|<name>'),
    'file--name-'
  )
})

test('sanitizeFilename collapses multiple spaces', () => {
  assert.strictEqual(
    sanitizeFilename('file   with    spaces'),
    'file with spaces'
  )
})

test('sanitizeFilename trims whitespace', () => {
  assert.strictEqual(
    sanitizeFilename('  file name  '),
    'file name'
  )
})

test('sanitizeFilename handles empty string', () => {
  assert.strictEqual(
    sanitizeFilename(''),
    ''
  )
})

test('getAssetFilename adds extension when missing', () => {
  assert.strictEqual(
    getAssetFilename('myfile', 'jpg'),
    'myfile.jpg'
  )
})

test('getAssetFilename does not duplicate extension', () => {
  assert.strictEqual(
    getAssetFilename('myfile.jpg', 'jpg'),
    'myfile.jpg'
  )
})

test('getAssetFilename sanitizes filename', () => {
  assert.strictEqual(
    getAssetFilename('my/invalid\\file', 'pdf'),
    'my-invalid-file.pdf'
  )
})

test('getAssetFilename uses bin as default extension', () => {
  assert.strictEqual(
    getAssetFilename('myfile', null),
    'myfile.bin'
  )
})

test('getAssetFilename handles complex case', () => {
  assert.strictEqual(
    getAssetFilename('My Cool Photo (2024).jpg', 'jpg'),
    'My Cool Photo (2024).jpg'
  )
})
