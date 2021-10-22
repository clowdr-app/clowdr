import type { Url } from "url";
// Included because original package doesn't include types properly for some reason
// TODO: PR request to amazon-s3-uri

declare module "amazon-s3-uri" {
    export = AmazonS3URI;
    /**
     * A URI wrapper that can parse out information about an S3 URI
     *
     * @example <caption>instanciate AmazonS3URI</caption>
     * try {
     *  const uri = 'https://bucket.s3-aws-region.amazonaws.com/key'
     *  const { region, bucket, key } = new AmazonS3URI(uri)
     * } catch (err) {
     *  console.warn(`${uri} is not a valid S3 uri`) // should not happen because `uri` is valid in that example
     * }
     * @example <caption>functional interface: it automatically returns an AmazonS3URI instance</caption>
     *  const { region, bucket, key } = AmazonS3URI(uri)
     * @param {string} uri - the URI to parse
     * @param {boolean} [parseQueryString] - If true, `uri` property exposes `query` as an object instead of a string
     * @throws {TypeError|Error}
     */
    function AmazonS3URI(uri: string, parseQueryString?: boolean): AmazonS3URI;
    class AmazonS3URI {
        /**
         * A URI wrapper that can parse out information about an S3 URI
         *
         * @example <caption>instanciate AmazonS3URI</caption>
         * try {
         *  const uri = 'https://bucket.s3-aws-region.amazonaws.com/key'
         *  const { region, bucket, key } = new AmazonS3URI(uri)
         * } catch (err) {
         *  console.warn(`${uri} is not a valid S3 uri`) // should not happen because `uri` is valid in that example
         * }
         * @example <caption>functional interface: it automatically returns an AmazonS3URI instance</caption>
         *  const { region, bucket, key } = AmazonS3URI(uri)
         * @param {string} uri - the URI to parse
         * @param {boolean} [parseQueryString] - If true, `uri` property exposes `query` as an object instead of a string
         * @throws {TypeError|Error}
         */
        constructor(uri: string, parseQueryString?: boolean);
        /**
         * URL object from `url.parse`
         * @type { import('url').Url }
         * */
        uri: Url;
        /**
         * the bucket name parsed from the URI (or null if no bucket specified)
         * @type { string | null }
         * */
        bucket: string | null;
        /**
         * the region parsed from the URI (or `DEFAULT_REGION`)
         * @type { string }
         * */
        region: string;
        /**
         * the key parsed from the URI (or null if no key specified)
         * @type {string | null}
         * */
        key: string | null;
        /**
         * true if the URI contains the bucket in the path,
         * false if it contains the bucket in the authority
         * @type { boolean }
         * */
        isPathStyle: boolean;
        /**
         * @constant
         * @default 'us-east-1'
         */
        DEFAULT_REGION: string;
    }
}
