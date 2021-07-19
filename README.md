# ghcr-delete-image

Delete image from [Github Container Registry](https://github.com/features/packages) by tag. 
Useful for cleanup of pull request scoped images. 


## Usage 

Example of workflow, that delete image when PR was closed.

```yaml
name: '[RM] Preview'

on:
  pull_request:
    types: [closed]

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