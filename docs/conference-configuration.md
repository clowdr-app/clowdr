# Conference Configuration

The `ConferenceConfiguration` table is a key-value store for conference configuration variables. The keys are strings and the values are arbitrary JSON blobs.

## Title background video

A list of videos to be used as the background for title/sponsor slides.

### Key

`BACKGROUND_VIDEOS`

### Value

List of S3 URLs.

### Example

```json
["s3://my-content-bucket/background-video.mp4"]
```

## Filler videos

A list of videos to be used to fill in the gaps between broadcast content.

Note: Currently only the first item in the list is used. This is expected to change in future.

### Key

`FILLER_VIDEOS`

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

## Input loss slate

An image to be displayed if AWS MediaLive loses input.

### Key

`INPUT_LOSS_SLATE`

### Value

A string that is a URL to a PNG image.

### Example

```json
"http://www.example.org/example.png"
```

## Force User Refresh

A string representing the app version. Changing this causes the user's browsers to refresh.

### Key

`CLOWDR_APP_VERSION`

### Value

A string.

### Example

```json
"1.0.0"
```

## Email and contact addresses

### Key

`SUPPORT_ADDRESS`

### Value

A string representing a valid email address for contacting the conference organisers.

### Example

```json
"conf2021@conference.com"
```

### Key

`TECH_SUPPORT_ADDRESS`

### Value

A string representing a valid email address for contacting the service hosting company for technical support related to the conference.

### Example

```json
"conf2021-support@host.org"
```

## Conference customisation

### Key

`REGISTRATION_URL`

### Value

A string representing a valid URL for users to register for the conference.

### Example

```json
"https://www.example.org/register"
```
