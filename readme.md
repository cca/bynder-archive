# Bynder Archiving

Tools for downloading and archiving Bynder collections with complete metadata.

SDK: https://github.com/Bynder/bynder-js-sdk
API: https://api.bynder.com/docs/getting-started

## Setup

```bash
cp example.env .env
# Edit .env and set TOKEN and BYNDER_DOMAIN
pnpm install
pnpm test
```

## Usage

Use `--help` or `-h` on either script for detailed options.

### List Collections

```bash
# List collections (default: 50)
node src/list-collections.js
# List more collections
node src/list-collections.js --limit 100
# JSON output
node src/list-collections.js --json
# Interactive selection and download
node src/list-collections.js --interactive
```

### Download a Collection

```bash
# Download to default directory (./downloads)
node src/download-collection.js <collection-id>
# Custom output directory
node src/download-collection.js <collection-id> -o ./archive/2024
# Debug mode (print JSON without downloading)
node src/download-collection.js <collection-id> --debug
DEBUG=true node src/download-collection.js <collection-id>
```

## Output Structure

```
downloads/
└── collection-name/
    ├── _collection-metadata.json
    ├── asset-name.jpg
    ├── asset-name.jpg.metadata.json
    ├── another-asset.pdf
    └── another-asset.pdf.metadata.json
```

Each asset includes the original file and a `.metadata.json` file.
