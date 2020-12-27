# Conference Configuration

The `ConferenceConfiguration` table is a key-value store for conference configuration variables. The keys are strings and the values are arbitrary JSON blobs.

## Filler video

A list of videos to be used as the background for title/sponsor slides.

### Key

`BACKGROUND_VIDEOS`

### Value

List of S3 URLs.

### Example

```json
["s3://my-content-bucket/filler-video.mp4"]
```

## Upload cutoff timestamp

A timestamp after which new items can no longer be uploaded to the conference.

### Key

`UPLOAD_CUTOFF_TIMESTAMP`

### Value

The time in milliseconds since the UNIX epoch, as a string.

### Example

```json
"1608824397404`
```
