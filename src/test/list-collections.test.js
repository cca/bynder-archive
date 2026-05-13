import { test } from 'node:test'
import assert from 'node:assert'
import { validateCollectionSelection, formatCollection } from '../list-collections.js'

// validateCollectionSelection tests
test('validateCollectionSelection returns null for "q"', () => {
  assert.strictEqual(validateCollectionSelection('q', 5), null)
})

test('validateCollectionSelection returns null for "quit"', () => {
  assert.strictEqual(validateCollectionSelection('quit', 5), null)
})

test('validateCollectionSelection returns null for "Q" (case insensitive)', () => {
  assert.strictEqual(validateCollectionSelection('Q', 5), null)
})

test('validateCollectionSelection returns null for "QUIT" (case insensitive)', () => {
  assert.strictEqual(validateCollectionSelection('QUIT', 5), null)
})

test('validateCollectionSelection returns correct index for valid input', () => {
  assert.strictEqual(validateCollectionSelection('1', 5), 0)
  assert.strictEqual(validateCollectionSelection('3', 5), 2)
  assert.strictEqual(validateCollectionSelection('5', 5), 4)
})

test('validateCollectionSelection handles whitespace', () => {
  assert.strictEqual(validateCollectionSelection('  3  ', 5), 2)
  assert.strictEqual(validateCollectionSelection(' q ', 5), null)
})

test('validateCollectionSelection throws for empty input', () => {
  assert.throws(
    () => validateCollectionSelection('', 5),
    { message: 'No selection provided' }
  )
})

test('validateCollectionSelection throws for non-numeric input', () => {
  assert.throws(
    () => validateCollectionSelection('abc', 5),
    { message: 'Invalid input: "abc" is not a number' }
  )
})

test('validateCollectionSelection throws for zero', () => {
  assert.throws(
    () => validateCollectionSelection('0', 5),
    { message: 'Invalid selection: must be between 1 and 5' }
  )
})

test('validateCollectionSelection throws for negative numbers', () => {
  assert.throws(
    () => validateCollectionSelection('-1', 5),
    { message: 'Invalid selection: must be between 1 and 5' }
  )
})

test('validateCollectionSelection throws for number too large', () => {
  assert.throws(
    () => validateCollectionSelection('10', 5),
    { message: 'Invalid selection: must be between 1 and 5' }
  )
})

test('validateCollectionSelection throws for number exactly one too large', () => {
  assert.throws(
    () => validateCollectionSelection('6', 5),
    { message: 'Invalid selection: must be between 1 and 5' }
  )
})

// formatCollection tests
test('formatCollection formats basic collection without description', () => {
  const collection = {
    name: 'Test Collection',
    id: 'ABC123',
    collectionCount: 42
  }
  const formatted = formatCollection(collection, 0)
  assert.strictEqual(formatted, '1. Test Collection\n   ID: ABC123\n   Media count: 42\n')
})

test('formatCollection formats collection with description', () => {
  const collection = {
    name: 'Test Collection',
    id: 'ABC123',
    description: 'A test collection',
    collectionCount: 10
  }
  const formatted = formatCollection(collection, 0)
  assert.strictEqual(
    formatted,
    '1. Test Collection\n   ID: ABC123\n   Description: A test collection\n   Media count: 10\n'
  )
})

test('formatCollection handles missing collectionCount', () => {
  const collection = {
    name: 'Empty Collection',
    id: 'XYZ789'
  }
  const formatted = formatCollection(collection, 5)
  assert.strictEqual(formatted, '6. Empty Collection\n   ID: XYZ789\n   Media count: 0\n')
})

test('formatCollection handles zero index', () => {
  const collection = {
    name: 'First',
    id: 'ID1',
    collectionCount: 1
  }
  const formatted = formatCollection(collection, 0)
  assert.ok(formatted.startsWith('1. First'))
})

test('formatCollection handles non-zero index', () => {
  const collection = {
    name: 'Third',
    id: 'ID3',
    collectionCount: 3
  }
  const formatted = formatCollection(collection, 2)
  assert.ok(formatted.startsWith('3. Third'))
})

test('formatCollection handles empty description', () => {
  const collection = {
    name: 'Test',
    id: 'TEST',
    description: '',
    collectionCount: 5
  }
  const formatted = formatCollection(collection, 0)
  // Empty description should be treated as no description
  assert.ok(!formatted.includes('Description:'))
})
