# Bynder Archiving

Tools for downloading and archiving Bynder collections with complete metadata.

- [Bynder JS SDK](https://github.com/Bynder/bynder-js-sdk)
- [Bynder API Docs](https://api.bynder.com/docs/getting-started)

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
# Filter by name (regex)
node src/list-collections.js --name "MFA"
# Filter by media count
node src/list-collections.js --min-count 100
node src/list-collections.js --min-count 50 --max-count 200
# Filter by user
node src/list-collections.js --user "Nick"
# Filter by visibility
node src/list-collections.js --public
node src/list-collections.js --private
# Combine filters
node src/list-collections.js --limit 100 --name "FA23" --min-count 50 --public
# JSON output
node src/list-collections.js --json
# Interactive selection and download
node src/list-collections.js --interactive
```

### Download a Collection

```bash
# Download to default directory (./data)
node src/download-collection.js <collection-id>
# Custom output directory
node src/download-collection.js <collection-id> -o ./archive/2024
# Debug mode (print JSON without downloading)
node src/download-collection.js <collection-id> --debug
DEBUG=true node src/download-collection.js <collection-id>
```

## Output Structure

```sh
data/
└── collection-name/
    ├── _collection-metadata.json
    ├── asset-name.jpg
    ├── asset-name.jpg.metadata.json
    ├── another-asset.pdf
    └── another-asset.pdf.metadata.json
```

Each asset includes the original file and a `.metadata.json` file.
