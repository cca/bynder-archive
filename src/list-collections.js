#!/usr/bin/env node

import { program } from 'commander'
import { createBynderClient, downloadCollection } from './download-collection.js'

/**
 * Get all collections from Bynder
 */
async function getCollections(bynder, limit = 1000) {
  try {
    const collections = await bynder.getCollections({
      limit: limit
    })
    return collections
  } catch (error) {
    console.error(`Error fetching collections: ${error.message}`)
    throw error
  }
}

/**
 * List all collections
 */
async function listCollections(bynder, options = {}) {
  console.log('Fetching collections...\n')
  
  const collections = await getCollections(bynder, options.limit)
  
  if (options.json) {
    console.log(JSON.stringify(collections, null, 2))
    return collections
  }
  
  if (collections.length === 0) {
    console.log('No collections found.')
    return collections
  }
  
  console.log(`Found ${collections.length} collection(s):\n`)
  
  collections.forEach((collection, index) => {
    console.log(formatCollection(collection, index))
  })
  
  return collections
}

/**
 * Validate user input for collection selection
 * Returns the collection index (0-based) or null if cancelled
 * Throws an error if invalid
 */
export function validateCollectionSelection(answer, collectionCount) {
  if (!answer || answer.trim() === '') {
    throw new Error('No selection provided')
  }
  
  const trimmed = answer.trim().toLowerCase()
  
  if (trimmed === 'q' || trimmed === 'quit') {
    return null
  }
  
  const collectionNumber = parseInt(answer, 10)
  
  if (isNaN(collectionNumber)) {
    throw new Error(`Invalid input: "${answer}" is not a number`)
  }
  
  const collectionIndex = collectionNumber - 1
  
  if (collectionIndex < 0 || collectionIndex >= collectionCount) {
    throw new Error(`Invalid selection: must be between 1 and ${collectionCount}`)
  }
  
  return collectionIndex
}

/**
 * Format a single collection for display
 */
export function formatCollection(collection, index) {
  let output = `${index + 1}. ${collection.name}\n`
  output += `   ID: ${collection.id}\n`
  if (collection.description) {
    output += `   Description: ${collection.description}\n`
  }
  output += `   Media count: ${collection.collectionCount || 0}\n`
  return output
}

/**
 * Interactive collection selection and download
 */
async function selectAndDownload(bynder, outputDir, debug, limit) {
  const collections = await listCollections(bynder, { limit })
  
  if (collections.length === 0) {
    return
  }
  
  // Import readline for interactive selection
  const readline = await import('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const question = (query) => new Promise((resolve) => {
    rl.question(query, resolve)
  })
  
  const answer = await question('Enter collection number to download (or "q" to quit): ')
  
  rl.close()
  
  let collectionIndex
  try {
    collectionIndex = validateCollectionSelection(answer, collections.length)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
  
  if (collectionIndex === null) {
    console.log('Cancelled.')
    return
  }
  
  const selectedCollection = collections[collectionIndex]
  console.log(`\nDownloading: ${selectedCollection.name}\n`)
  
  await downloadCollection(bynder, selectedCollection.id, outputDir, debug)
}

// Main CLI execution
async function main() {
  program
    .name('list-collections')
    .description('List Bynder collections and optionally download one')
    .option('-j, --json', 'Output as JSON')
    .option('-i, --interactive', 'Interactive mode: select and download a collection')
    .option('-l, --limit <number>', 'Maximum number of collections to retrieve (default: 50)', (value) => parseInt(value, 10), 50)
    .option('-o, --output <dir>', 'Output directory for downloads', './downloads')
    .option('-d, --debug', 'Debug mode: print JSON responses without downloading')
    .action(async (options) => {
      const TOKEN = process.env.TOKEN
      const BYNDER_DOMAIN = process.env.BYNDER_DOMAIN
      const DEBUG = process.env.DEBUG === 'true' || process.env.DEBUG === '1'

      if (!TOKEN) {
        console.error('Error: TOKEN environment variable not set')
        process.exit(1)
      }

      if (!BYNDER_DOMAIN) {
        console.error('Error: BYNDER_DOMAIN environment variable not set')
        process.exit(1)
      }

      const bynder = createBynderClient(TOKEN, BYNDER_DOMAIN)
      const debug = options.debug || DEBUG
      
      try {
        if (options.interactive) {
          await selectAndDownload(bynder, options.output, debug, options.limit)
        } else {
          await listCollections(bynder, options)
        }
      } catch (error) {
        console.error(`\nError: ${error.message}`)
        process.exit(1)
      }
    })

  program.parse()
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
