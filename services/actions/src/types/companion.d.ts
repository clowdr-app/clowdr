declare module "@uppy/companion" {
    import { Request } from "express";
    namespace Uppy {
        namespace Companion {
            export interface DriveOptions {
                key: string;
                secret: string;
            }

            export interface DropboxOptions {
                key: string;
                secret: string;
            }

            export interface InstagramOptions {
                key: string;
                secret: string;
            }

            export interface FacebookOptions {
                key: string;
                secret: string;
            }

            export interface OneDriveOptions {
                key: string;
                secret: string;
            }

            export interface S3Options {
                getKey(
                    req: Request | undefined,
                    filename: string,
                    metadata: Record<string, any>
                ): string;
                key: string;
                secret: string;
                bucket: string;
                region: string;
                useAccelerateEndpoint?: boolean = false;
                expires?: number = 3600;
                acl?: string = "public-read";
                awsClientOptions: Record<string, any>;
            }

            export interface ProviderOptions {
                drive?: DriveOptions;
                dropbox?: DropboxOptions;
                instagram?: InstagramOptions;
                facebook?: FacebookOptions;
                onedrive?: OneDriveOptions;
                s3?: S3Options;
            }

            export interface ServerOptions {
                host: string;
                protocol?: "http" | "https";
                path?: string;
                oauthDomain?: string;
                validHosts?: Array<string>;
                implicitPath?: string;
            }

            export interface Options {
                providerOptions?: ProviderOptions;
                server: ServerOptions;
                filePath: string;
                sendSelfEndpoint?: string;
                secret: string;
                uploadUrls?: Array<string>;
                debug?: boolean;
            }
        }
    }

    export function app(options: Uppy.Companion.Options): Express;
}
