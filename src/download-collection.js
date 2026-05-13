#!/usr/bin/env node

import Bynder from '@bynder/bynder-js-sdk'
import { program } from 'commander'
import { writeFileSync, mkdirSync, existsSync, createWriteStream, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { get } from 'https'

/**
 * Initialize Bynder client with token and domain
 */
export function createBynderClient(token, domain) {
  if (!token) {
    throw new Error('Token is required')
  }
  if (!domain) {
    throw new Error('Bynder domain is required')
  }
  return new Bynder({
    baseURL: `https://${domain}/api/`,
    permanentToken: token
  })
}

/**
 * Sanitize a filename by removing/replacing invalid characters
 */
export function sanitizeFilename(filename) {
  return filename
    .replace(/[\/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate a safe filename with extension
 */
export function getAssetFilename(assetName, extension) {
  const sanitized = sanitizeFilename(assetName)
  const ext = extension || 'bin'
  return sanitized.endsWith(`.${ext}`) ? sanitized : `${sanitized}.${ext}`
}

/**
 * Download a file from a URL to a local path
 */
async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const dir = dirname(filepath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const file = createWriteStream(filepath)
    get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      unlinkSync(filepath)
      reject(err)
    })
  })
}

/**
 * Get collection by ID
 */
export async function getCollection(bynder, collectionId) {
  try {
    const collection = await bynder.getCollection({ id: collectionId })
    return collection
  } catch (error) {
    console.error(`Error fetching collection: ${error.message}`)
    throw error
  }
}

/**
 * Get all media assets in a collection
 * The Bynder SDK doesn't expose the collections/{id}/media endpoint,
 * so we use fetch to call it directly
 */
export async function getCollectionMedia(bynder, collectionId) {
  try {
    const baseURL = process.env.BYNDER_DOMAIN
    const token = process.env.TOKEN
    const collectionUrl = `https://${baseURL}/api/v4/collections/${collectionId}/media/`

    const response = await fetch(collectionUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    // Only returns an array of media IDs, which could be deleted assets
    const mediaIds = await response.json()

    // Fetch full media info for each ID using direct API calls
    // The SDK's getMediaInfo doesn't work with these IDs, so we use fetch
    // Some media may be deleted but still in collection, so we handle 404s gracefully
    const mediaPromises = mediaIds.map(async (id) => {
      try {
        const mediaUrl = `https://${baseURL}/api/v4/media/${id}/`
        const mediaResponse = await fetch(mediaUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!mediaResponse.ok) {
          if (mediaResponse.status === 404) {
            console.warn(`Warning: Media ${id} not found (may have been deleted)`)
            return null
          }
          throw new Error(`Failed to fetch media ${id}: ${mediaResponse.status}`)
        }
        return mediaResponse.json()
      } catch (error) {
        console.warn(`Warning: Could not fetch media ${id}: ${error.message}`)
        return null
      }
    })

    const media = await Promise.all(mediaPromises)
    // Filter out null values (failed requests)
    return media.filter(m => m !== null)
  } catch (error) {
    console.error(`Error fetching collection media: ${error.message}`)
    throw error
  }
}

/**
 * Get detailed information for a specific asset
 */
export async function getMediaInfo(bynder, assetId) {
  try {
    const info = await bynder.getMediaInfo({ id: assetId })
    return info
  } catch (error) {
    console.error(`Error fetching media info for ${assetId}: ${error.message}`)
    throw error
  }
}

/**
 * Download a collection and its assets
 */
export async function downloadCollection(bynder, collectionId, outputDir = './data', debug = false) {
  console.log(`Fetching collection ${collectionId}...`)

  // Get collection details
  const collection = await getCollection(bynder, collectionId)

  if (debug) {
    console.log('\n=== COLLECTION DATA ===')
    console.log(JSON.stringify(collection, null, 2))
  }

  const collectionName = sanitizeFilename(collection.name || `collection-${collectionId}`)
  const collectionDir = join(outputDir, collectionName)

  console.log(`Collection: "${collection.name}"`)
  console.log(`Description: ${collection.description || 'N/A'}`)

  // Save collection metadata
  if (!debug) {
    mkdirSync(collectionDir, { recursive: true })
    const metadataPath = join(collectionDir, '_collection-metadata.json')
    writeFileSync(metadataPath, JSON.stringify(collection, null, 2))
    console.log(`Saved collection metadata to ${metadataPath}`)
  }

  // Get all media in collection
  console.log(`\nFetching media assets...`)
  const mediaList = await getCollectionMedia(bynder, collectionId)

  if (debug) {
    console.log('\n=== MEDIA LIST ===')
    console.log(JSON.stringify(mediaList, null, 2))
  }

  console.log(`Found ${mediaList.length} assets\n`)

  // Process each asset
  for (let i = 0; i < mediaList.length; i++) {
    const asset = mediaList[i]
    console.log(`[${i + 1}/${mediaList.length}] Processing: ${asset.name}`)

    // Get detailed asset information
    const assetInfo = await getMediaInfo(bynder, asset.id)

    if (debug) {
      console.log('\n=== ASSET DETAILS ===')
      console.log(JSON.stringify(assetInfo, null, 2))
      continue
    }

    // Determine file extension
    const extension = assetInfo.extension || assetInfo.type || 'bin'
    const baseFilename = getAssetFilename(asset.name, extension)

    const assetPath = join(collectionDir, baseFilename)
    const metadataPath = join(collectionDir, `${baseFilename}.metadata.json`)

    // Save asset metadata
    writeFileSync(metadataPath, JSON.stringify(assetInfo, null, 2))
    console.log(`  ✓ Saved metadata to ${metadataPath}`)

    // Get the download URL from the Bynder API
    try {
      const baseURL = process.env.BYNDER_DOMAIN
      const token = process.env.TOKEN
      const downloadApiUrl = `https://${baseURL}/api/v4/media/${asset.id}/download/`

      const downloadResponse = await fetch(downloadApiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!downloadResponse.ok) {
        throw new Error(`Failed to get download URL: ${downloadResponse.status}`)
      }

      const downloadData = await downloadResponse.json()
      const downloadUrl = downloadData.s3_file || downloadData.url

      if (downloadUrl) {
        console.log(`  ↓ Downloading from ${downloadUrl.substring(0, 100)}...`)
        await downloadFile(downloadUrl, assetPath)
        console.log(`  ✓ Downloaded to ${assetPath}`)
      } else {
        console.log(`  ⚠ No download URL in API response`)
      }
    } catch (error) {
      console.error(`  ✗ Error downloading: ${error.message}`)
    }

    console.log()
  }

  if (!debug) {
    console.log(`\n✓ Collection download complete: ${collectionDir}`)
  } else {
    console.log('\n✓ DEBUG mode: No files downloaded')
  }
}

// Main CLI execution
async function main() {
  program
    .name('download-collection')
    .description('Download files and metadata from a Bynder collection')
    .argument('<collection-id>', 'ID of the collection to download')
    .option('-o, --output <dir>', 'Output directory', './data')
    .option('-d, --debug', 'Debug mode: print JSON responses without downloading')
    .action(async (collectionId, options) => {
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
        await downloadCollection(bynder, collectionId, options.output, debug)
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
