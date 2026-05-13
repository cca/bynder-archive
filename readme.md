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

### Bynder API Quirks

A note about collection counts: the `/api/v4/collections` API route returns a `collectionCount` field but it includes deleted assets. Furthermore, `/api/v4/collections/{id}/media` lists only the media IDs and also includes deleted assets. You only finally discover something has been deleted when you fetch it specifically with `/api/v4/media/{id}` and get a 404. One can see this behavior with the [Materials Library collection](https://medialibrary.cca.edu/collections/view/1AF65624-49D8-4FDD-A88021ACA90A0827?viewType=grid) which looks empty in the UI but has 9 deleted assets according to the API.

```sh
#!/usr/bin/env bash
ID=1AF65624-49D8-4FDD-A88021ACA90A0827
$ curl --request GET \
     --url https://medialibrary.cca.edu/api/v4/collections/$ID/media \
     --header "Authorization: Bearer $TOKEN" \
     --header 'accept: application/json' > media.json
$ cat media.json
["1B18DB45-4175-4709-8F4E8800827BC9BA","2ACE759E-B377-476C-8FCC5FF0F269C66E","74A09F5E-7D23-4719-BE61CF025F85AFD4","9287D61C-1761-449A-83BA598163414DE1","BBAFEDB8-3D58-4351-9EB9499E1A6CF80A","BFC835AE-C3E6-436F-915DC22F6421C32A","C32739E0-F9E4-4C8D-ADAF6E43B9749981","E167A041-9BE8-403A-945854D3BF7FEE5C","FB422843-BFA8-4022-82B85CFDFD8C8251"]
$ jq -r '.[]' media.json | head -n1 | xargs -I {} curl \
     --url https://medialibrary.cca.edu/api/v4/media/{} \
     --header "Authorization: Bearer $TOKEN" \
     --header 'accept: application/json' | jq
{
  "message": "Media not found",
  "statuscode": "404"
}
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
