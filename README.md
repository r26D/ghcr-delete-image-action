# ghcr-delete-image

Delete older images from [Github Container Registry](https://github.com/features/packages) by tag regex. 
Useful for keeping your package total size low. This action will delete all tagged packages that match the regex except the latest N packages `tagged-keep-latest`. This will delete the package if ANY of the tags on the image match the regex.

This action will also clean up all untagged packaged except the latest N packages `untagged-keep-latest`.

## Usage 

Example of workflow, that delete image on branch push.

```yaml
name: '[RM] Preview'

on:
  push:
    branches:
      - main
jobs:
  purge-image:
    name: Delete image from ghcr.io
    runs-on: ubuntu-latest
    steps:
      - name: Delete image
        uses: ./
        with:
          owner: ${{ github.repository_owner }}
          name: ghcr-delete-image-dummy
          token: ${{ secrets.GHCR_TOKEN }}
          tagged-keep-latest: 1
          untagged-keep-latest: 1
          tag-regex: testtag-.
```


This is based on original work from:

https://github.com/machship/ghcr-delete-image-action 
https://github.com/dmcconnell-m/ghcr-delete-image-action
https://github.com/bots-house/ghcr-delete-image-action
