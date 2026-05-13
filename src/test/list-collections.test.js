import { test } from 'node:test'
import assert from 'node:assert'
import { validateCollectionSelection, formatCollection, filterCollections } from '../list-collections.js'

// filterCollections tests
test('filterCollections returns all when no filters', () => {
  const collections = [
    { name: 'Test 1', collectionCount: 10 },
    { name: 'Test 2', collectionCount: 20 }
  ]
  const filtered = filterCollections(collections, {})
  assert.strictEqual(filtered.length, 2)
})

test('filterCollections filters by name (case-insensitive)', () => {
  const collections = [
    { name: 'MFA Fine Art', collectionCount: 10 },
    { name: 'BFA Design', collectionCount: 20 },
    { name: 'mfa film', collectionCount: 30 }
  ]
  const filtered = filterCollections(collections, { name: 'MFA' })
  assert.strictEqual(filtered.length, 2)
  assert.ok(filtered.every(c => /MFA/i.test(c.name)))
})

test('filterCollections filters by minimum count', () => {
  const collections = [
    { name: 'Small', collectionCount: 5 },
    { name: 'Medium', collectionCount: 50 },
    { name: 'Large', collectionCount: 100 }
  ]
  const filtered = filterCollections(collections, { minCount: 50 })
  assert.strictEqual(filtered.length, 2)
  assert.ok(filtered.every(c => c.collectionCount >= 50))
})

test('filterCollections filters by maximum count', () => {
  const collections = [
    { name: 'Small', collectionCount: 5 },
    { name: 'Medium', collectionCount: 50 },
    { name: 'Large', collectionCount: 100 }
  ]
  const filtered = filterCollections(collections, { maxCount: 50 })
  assert.strictEqual(filtered.length, 2)
  assert.ok(filtered.every(c => c.collectionCount <= 50))
})

test('filterCollections filters by min and max count', () => {
  const collections = [
    { name: 'Small', collectionCount: 5 },
    { name: 'Medium', collectionCount: 50 },
    { name: 'Large', collectionCount: 100 }
  ]
  const filtered = filterCollections(collections, { minCount: 20, maxCount: 80 })
  assert.strictEqual(filtered.length, 1)
  assert.strictEqual(filtered[0].name, 'Medium')
})

test('filterCollections filters by user name', () => {
  const collections = [
    { name: 'Col 1', user: { name: 'Nick Bruno' } },
    { name: 'Col 2', user: { name: 'Lauren Brooks' } },
    { name: 'Col 3', user: { name: 'Nick Smith' } }
  ]
  const filtered = filterCollections(collections, { user: 'nick' })
  assert.strictEqual(filtered.length, 2)
})

test('filterCollections filters public collections', () => {
  const collections = [
    { name: 'Public 1', IsPublic: 1 },
    { name: 'Private 1', IsPublic: 0 },
    { name: 'Public 2', IsPublic: 1 }
  ]
  const filtered = filterCollections(collections, { public: true })
  assert.strictEqual(filtered.length, 2)
  assert.ok(filtered.every(c => c.IsPublic === 1))
})

test('filterCollections filters private collections', () => {
  const collections = [
    { name: 'Public 1', IsPublic: 1 },
    { name: 'Private 1', IsPublic: 0 },
    { name: 'Public 2', IsPublic: 1 }
  ]
  const filtered = filterCollections(collections, { private: true })
  assert.strictEqual(filtered.length, 1)
  assert.strictEqual(filtered[0].IsPublic, 0)
})

test('filterCollections combines multiple filters', () => {
  const collections = [
    { name: 'MFA Public', collectionCount: 100, IsPublic: 1, user: { name: 'Nick' } },
    { name: 'MFA Private', collectionCount: 50, IsPublic: 0, user: { name: 'Nick' } },
    { name: 'BFA Public', collectionCount: 100, IsPublic: 1, user: { name: 'Lauren' } }
  ]
  const filtered = filterCollections(collections, {
    name: 'MFA',
    minCount: 75,
    public: true
  })
  assert.strictEqual(filtered.length, 1)
  assert.strictEqual(filtered[0].name, 'MFA Public')
})

test('filterCollections handles missing collectionCount', () => {
  const collections = [
    { name: 'No count' },
    { name: 'Has count', collectionCount: 50 }
  ]
  const filtered = filterCollections(collections, { minCount: 10 })
  assert.strictEqual(filtered.length, 1)
  assert.strictEqual(filtered[0].name, 'Has count')
})

test('filterCollections handles missing user', () => {
  const collections = [
    { name: 'No user' },
    { name: 'Has user', user: { name: 'Nick' } }
  ]
  const filtered = filterCollections(collections, { user: 'nick' })
  assert.strictEqual(filtered.length, 1)
})

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
