import assert from "assert";
import axios from "axios";

async function getBearerToken(): Promise<string> {
    assert(process.env.VIMEO_CLIENT_ID, "VIMEO_CLIENT_ID environment variable must be specified");
    assert(process.env.VIMEO_CLIENT_SECRET, "VIMEO_CLIENT_SECRET environment variable must be specified");

    const result = await axios.post(
        "https://api.vimeo.com/oauth/authorize/client",
        {
            grant_type: "client_credentials",
            scope: "public",
        },
        {
            auth: {
                username: process.env.VIMEO_CLIENT_ID,
                password: process.env.VIMEO_CLIENT_SECRET,
            },
            headers: {
                "Content-Type": "application/json",
                Accept: "application/vnd.vimeo.*+json;version=3.4",
            },
        }
    );

    return result.data.access_token;
}

async function getOpenApiSpec(accessToken: string): Promise<string> {
    const result = await axios.get("https://api.vimeo.com?openapi=1", {
        headers: {
            Accept: "application/json;version=3.4",
            Authorization: `bearer ${accessToken}`,
        },
    });

    return result.data;
}

getBearerToken().then((token) =>
    getOpenApiSpec(token).then((spec) => {
        console.log(JSON.stringify(spec));
    })
);
