/**
 * Vimeo API
 * 3.4
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "oazapfts/lib/runtime";
import * as QS from "oazapfts/lib/runtime/query";
export const defaults: Oazapfts.RequestOpts = {
    baseUrl: "https://api.vimeo.com",
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    vimeoCom: "https://api.vimeo.com"
};
export type LegacyError = {
    error: string;
};
export type Error = {
    developer_message: string;
    error: string;
    error_code: number;
    link: string;
};
export type Location = {
    city: string | null;
    country: string | null;
    country_iso_code: string;
    formatted_address: string;
    latitude: number;
    longitude: number;
    neighborhood: string | null;
    state: string | null;
    state_iso_code: string | null;
    sub_locality: string | null;
};
export type Picture = {
    active: boolean;
    default_picture: boolean;
    link?: string;
    resource_key: string;
    sizes: {
        height: number | null;
        link: string;
        link_with_play_button?: string;
        width: number;
    }[];
    "type": "caution" | "custom" | "default";
    uri: string;
};
export type Skill = {
    name: string;
    uri: string;
};
export type User = {
    account: "basic" | "business" | "live_business" | "live_premium" | "live_pro" | "plus" | "pro" | "pro_unlimited" | "producer";
    available_for_hire: boolean;
    bio: string | null;
    can_work_remotely: boolean;
    clients: string;
    content_filter?: string[];
    created_time: string;
    gender: string | null;
    link: string;
    location: string | null;
    location_details: (Location) | null;
    metadata: {
        connections: {
            albums: {
                options: string[];
                total: number;
                uri: string;
            };
            appearances: {
                options: string[];
                total: number;
                uri: string;
            };
            block: {
                options: string[];
                total: number;
                uri: string;
            };
            categories: {
                options: string[];
                total: number;
                uri: string;
            };
            channels: {
                options: string[];
                total: number;
                uri: string;
            };
            connected_apps: {
                options: string[];
                total: number;
                uri: string;
            };
            feed: {
                options: string[];
                uri: string;
            };
            folders: {
                options: string[];
                total: number;
                uri: string;
            };
            folders_root: {
                options: string[];
                uri: string;
            };
            followers: {
                options: string[];
                total: number;
                uri: string;
            };
            following: {
                options: string[];
                total: number;
                uri: string;
            };
            groups: {
                options: string[];
                total: number;
                uri: string;
            };
            likes: {
                options: string[];
                total: number;
                uri: string;
            };
            moderated_channels: {
                options: string[];
                total: number;
                uri: string;
            };
            pictures: {
                options: string[];
                total: number;
                uri: string;
            };
            portfolios: {
                options: string[];
                total: number;
                uri: string;
            };
            recommended_channels: {
                options: string[];
                total: number;
                uri: string;
            };
            recommended_users: {
                options: string[];
                total: number;
                uri: string;
            };
            shared: {
                options: string[];
                total: number;
                uri: string;
            };
            videos: {
                options: string[];
                total: number;
                uri: string;
            };
            watched_videos: {
                options: string[];
                total: number;
                uri: string;
            };
            watchlater: {
                options: string[];
                total: number;
                uri: string;
            };
        };
        interactions: {
            add_privacy_user?: {
                options?: string[];
                uri?: string;
            };
            block: {
                added: boolean;
                added_time: string | null;
                options: string[];
                uri: string;
            };
            connected_apps: {
                all_scopes: any;
                is_connected: boolean;
                needed_scopes: any;
                options: string[];
                uri: string;
            };
            follow: {
                added: boolean;
                options: string[];
                uri: string;
            };
            report: {
                options: string[];
                reason: string[];
                uri: string;
            };
        };
        public_videos: {
            total: number;
        };
    };
    name: string;
    pictures: Picture;
    preferences?: {
        videos?: {
            privacy?: {
                password?: string;
            };
        };
    };
    resource_key: string;
    short_bio: string | null;
    skills: Skill[] | null;
    upload_quota: {
        lifetime: {
            free: number | null;
            max: number | null;
            used: number | null;
        };
        periodic: {
            free: number | null;
            max: number | null;
            reset_date: string | null;
            used: number | null;
        };
        space: {
            free: number;
            max: number | null;
            showing: "lifetime" | "periodic";
            used: number;
        };
    };
    uri: string;
    websites: {
        description: string | null;
        link: string;
        name: string | null;
        "type": string;
        uri: string;
    }[];
};
export type Album = {
    allow_continuous_play: boolean;
    allow_downloads: boolean;
    allow_share: boolean;
    autoplay: boolean;
    brand_color: string | null;
    created_time: string;
    custom_logo: (Picture) | null;
    description: string | null;
    domain: string | null;
    domain_certificate_state: "null" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
    duration: number;
    embed: {
        html: string | null;
    };
    embed_brand_color: boolean | null;
    embed_custom_logo: boolean | null;
    hide_nav: boolean;
    hide_upcoming: boolean;
    hide_vimeo_logo: boolean | null;
    layout: "grid" | "player";
    link: string;
    loop: boolean;
    metadata: {
        connections: {
            available_videos: {
                options: string[];
                total: number;
                uri: string;
            };
            videos: {
                options: string[];
                total: number;
                uri: string;
            };
        };
        interactions: {
            add_custom_thumbnails: {
                options: string[];
                uri: string;
            };
            add_live_events: {
                options: string[];
                uri: string;
            };
            add_logos: {
                options: string[];
                uri: string;
            };
            add_to: {
                options: string[];
                uri: string;
            } | null;
            add_videos: {
                options: string[];
                uri: string;
            };
        } | null;
    };
    modified_time: string;
    name: string;
    pictures: Picture;
    privacy: {
        password?: string;
        view: "anybody" | "embed_only" | "nobody" | "password" | "team";
    };
    resource_key: string;
    review_mode: boolean;
    seo_allow_indexed: boolean;
    seo_description: string | null;
    seo_keywords: string[];
    seo_title: string | null;
    share_link: string;
    sort: "added_first" | "added_last" | "alphabetical" | "arranged" | "comments" | "likes" | "newest" | "oldest" | "plays";
    theme: "dark" | "standard";
    uri: string;
    url: string | null;
    use_custom_domain: boolean;
    user: User;
    web_brand_color: boolean;
    web_custom_logo: boolean;
};
export type Category = {
    icon?: Picture;
    is_deprecated: boolean;
    last_video_featured_time: string;
    link: string;
    metadata: {
        connections: {
            channels: {
                options: string[];
                total: number;
                uri: string;
            };
            groups: {
                options: string[];
                total: number;
                uri: string;
            };
            users: {
                options: string[];
                total: number;
                uri: string;
            };
            videos: {
                options: string[];
                total: number;
                uri: string;
            };
        };
        interactions: {
            follow: {
                added: boolean;
                added_time: string | null;
                uri: string;
            };
        };
    };
    name: string;
    parent: {
        link: string;
        name: string;
        uri: string;
    } | null;
    pictures: Picture;
    resource_key: string;
    subcategories?: {
        link: string;
        name: string;
        uri: string;
    }[];
    top_level: boolean;
    uri: string;
};
export type EmbedSettings = {
    buttons: {
        embed: boolean;
        fullscreen: boolean;
        hd: boolean;
        like: boolean;
        scaling: boolean;
        share: boolean;
        watchlater: boolean;
    };
    color: string;
    logos: {
        custom: {
            active: boolean;
            link: string | null;
            sticky: boolean;
            url: string | null;
        };
        vimeo: boolean;
    };
    playbar: boolean;
    speed: boolean;
    title: {
        name: "hide" | "show" | "user";
        owner: "hide" | "show" | "user";
        portrait: "hide" | "show" | "user";
    };
    uri?: string;
    volume: boolean;
};
export type Project = {
    created_time: string;
    last_user_action_event_date: string | null;
    link: string;
    metadata: {
        connections: {
            folders: {
                options: string[];
                total: number;
                uri: string;
            };
            items: {
                options: string[];
                total: number;
                uri: string;
            };
            videos: {
                options: string[];
                total: number;
                uri: string;
            };
        };
    };
    modified_time: string;
    name: string;
    privacy: {
        view: "anybody" | "nobody" | "team";
    };
    resource_key: string;
    uri: string;
    user: User;
};
export type Tag = {
    canonical: string;
    metadata: {
        connections: {
            videos: {
                options: string[];
                total: number;
                uri: string;
            };
        };
    };
    name: string;
    resource_key: string;
    uri: string;
};
export type Video = {
    categories: Category[];
    content_rating: string[];
    context: {
        action: "Added to" | "Appearance by" | "Liked by" | "Uploaded by";
        resource: any | null;
        resource_type: string;
    };
    created_time: string;
    description: string | null;
    duration: number;
    embed: EmbedSettings;
    height: number;
    is_playable: boolean;
    language: string | null;
    last_user_action_event_date?: string | null;
    license: "by" | "by-nc" | "by-nc-nd" | "by-nc-sa" | "by-nd" | "by-sa" | "cc0";
    link: string;
    metadata: {
        connections: {
            albums: {
                options: string[];
                total: number;
                uri: string;
            };
            available_albums: {
                options: string[];
                total: number;
                uri: string;
            };
            available_channels: {
                options: string[];
                total: number;
                uri: string;
            };
            comments: {
                options: string[];
                total: number;
                uri: string;
            };
            credits: {
                options?: string[];
                total?: number;
                uri?: string;
            } | null;
            likes: {
                options: string[];
                total: number;
                uri: string;
            };
            ondemand: {
                options: string[];
                resource_key: string;
                uri: string;
            };
            pictures: {
                options: string[];
                total: number;
                uri: string;
            };
            playback: {
                options: string[];
                uri: string;
            };
            publish_to_social: {
                options?: string[];
                publish_blockers: any | null;
                publish_constraints: any | null;
                uri?: string;
            } | null;
            recommendations: {
                options?: string[];
                uri?: string;
            } | null;
            related: {
                options?: string[];
                uri?: string;
            } | null;
            season: {
                name: string;
                options: string[];
                uri: string;
            };
            texttracks: {
                options: string[];
                total: number;
                uri: string;
            };
            trailer: {
                options: string[];
                resource_key: string;
                uri: string;
            };
            users_with_access: {
                options: string[];
                total: number;
                uri: string;
            };
            versions: {
                current_uri?: string;
                options: string[];
                resource_key?: string;
                total: number;
                uri: string;
            };
        };
        interactions: {
            album: {
                options: string[];
                uri: string;
            } | null;
            buy: {
                currency: string | null;
                display_price: string | null;
                download: "available" | "purchased" | "restricted" | "unavailable";
                drm: boolean;
                link: string | null;
                price: number | null;
                purchase_time: string | null;
                stream: "available" | "purchased" | "restricted" | "unavailable";
                uri: string | null;
            } | null;
            channel: {
                options: string[];
                uri: string;
            } | null;
            "delete": {
                options: string[];
                uri: string;
            } | null;
            edit: {
                options: string[];
                uri: string;
            } | null;
            like: {
                added: boolean;
                added_time: string;
                options: string[];
                uri: string;
            };
            rent: {
                currency: string | null;
                display_price: string | null;
                drm: boolean;
                expires_time: string | null;
                link: string | null;
                price: number | null;
                purchase_time: string | null;
                stream: "available" | "purchased" | "restricted" | "unavailable";
                uri: string | null;
            } | null;
            report: {
                options: string[];
                reason: string[];
                uri: string;
            };
            subscribe?: {
                drm?: boolean;
                expires_time?: string;
                purchase_time?: string;
                stream?: string;
            } | null;
            view_team_members: {
                options: string[];
                uri: string;
            } | null;
            watched: {
                added: boolean;
                added_time: string;
                options: string[];
                uri: string;
            };
            watchlater: {
                added: boolean;
                added_time: string;
                options: string[];
                uri: string;
            };
        };
    };
    modified_time: string;
    name: string;
    parent_folder?: (Project) | null;
    password?: string;
    pictures: Picture;
    privacy: {
        add: boolean;
        comments: "anybody" | "contacts" | "nobody";
        download: boolean;
        embed: "private" | "public";
        view: "anybody" | "contacts" | "disable" | "nobody" | "password" | "unlisted" | "users";
    };
    release_time: string;
    resource_key: string;
    spatial: {
        director_timeline: {
            pitch?: number;
            roll?: number;
            time_code?: number;
            yaw?: number;
        }[];
        field_of_view: number | null;
        projection: ("cubical" | "cylindrical" | "dome" | "equirectangular" | "pyramid") | null;
        stereo_format: ("left-right" | "mono" | "top-bottom") | null;
    };
    stats: {
        plays: number | null;
    };
    status: ("available" | "quota_exceeded" | "total_cap_exceeded" | "transcode_starting" | "transcoding" | "transcoding_error" | "unavailable" | "uploading" | "uploading_error") | null;
    tags: Tag[];
    transcode: {
        status?: "complete" | "error" | "in_progress";
    } | null;
    "type": "live" | "stock" | "video";
    upload: {
        approach?: "post" | "pull" | "streaming" | "tus";
        complete_uri?: string;
        form?: string;
        link?: string;
        redirect_url?: string;
        size?: number;
        status: "complete" | "error" | "in_progress";
        upload_link?: string;
    } | null;
    uri: string;
    user: (User) | null;
    vod: any | null;
    width: number;
};
export type OnDemandGenre = {
    canonical: string;
    interactions: {
        page: {
            added: boolean;
            options: string[];
            uri: string;
        };
    };
    link: string;
    metadata: {
        connections: {
            pages: {
                options: string[];
                uri: string;
            };
        };
    };
    name: string;
    uri: string;
};
export type PurchaseInteraction = {
    buy?: {
        drm?: boolean;
    } | null;
    rent?: any | null;
    subscribe?: {
        drm?: boolean;
        expires_time?: string | null;
        link?: string | null;
        purchase_time?: string | null;
        stream?: "available" | "purchased" | "restricted" | "unavailable";
        uri?: string | null;
    } | null;
};
export type OnDemandPage = {
    background: (Picture) | null;
    colors: {
        primary: string;
        secondary: string;
    };
    content_rating: string[];
    created_time?: string;
    description: string | null;
    domain_link: string | null;
    episodes: {
        buy: {
            active: boolean;
            price: number | null;
        };
        rent: {
            active: boolean;
            period: ("1 day" | "1 month" | "1 week" | "1 year" | "2 day" | "24 hour" | "3 day" | "3 month" | "30 day" | "48 hour" | "6 month" | "60 day" | "7 day" | "72 hour") | null;
            price: number | null;
        };
    };
    film?: Video;
    genres: OnDemandGenre[];
    link: string;
    metadata: {
        connections: {
            metadata: {
                connections: {
                    comments: {
                        options: string[];
                        total: number;
                        uri: string;
                    };
                    genres: {
                        options: string[];
                        total: number;
                        uri: string;
                    };
                    likes: {
                        options: string[];
                        total: number;
                        uri: string;
                    };
                    pictures: {
                        options: string[];
                        total: number;
                        uri: string;
                    };
                    seasons: {
                        options: string[];
                        total: number;
                        uri: string;
                    };
                    videos: {
                        extra_total: number;
                        main_total: number;
                        options: string[];
                        total: number;
                        uri: string;
                        viewable_total: number;
                    };
                };
            };
        };
        interactions: PurchaseInteraction;
    };
    modified_time?: string;
    name: string;
    pictures: (Picture) | null;
    preorder: {
        active: boolean;
        cancel_time: string;
        publish_time: string;
        time: string;
    };
    published: {
        enabled: boolean;
        time: string;
    };
    rating: number | null;
    resource_key: string;
    sku?: string | null;
    subscription: {
        active: boolean;
        link: string | null;
        period?: string;
        price: any;
    } | null;
    theme: string;
    thumbnail: (Picture) | null;
    trailer: (Video) | null;
    "type": "film" | "series";
    uri: string;
    user: (User) | null;
};
/**
 * Get the API specification
 */
export function getEndpoints({ openapi }: {
    openapi?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/${QS.query(QS.form({
        openapi
    }))}`, {
        ...opts
    });
}
/**
 * Get all the user's videos that can be added to or removed from a showcase
 */
export function getAvailableShowcaseVideos(albumId: number, { direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "comments" | "date" | "default" | "duration" | "last_user_action_event_date" | "likes" | "modified_time" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/albums/${albumId}/available_videos${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all categories
 */
export function getCategories({ direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "last_video_featured_time" | "name";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/categories${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific category
 */
export function getCategory(category: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/categories/${category}`, {
        ...opts
    });
}
/**
 * Get all the channels in a category
 */
export function getCategoryChannels(category: string, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "followers" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/categories/${category}/channels${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the groups in a category
 */
export function getCategoryGroups(category: string, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "members" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/categories/${category}/groups${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the videos in a category
 */
export function getCategoryVideos(category: string, { direction, filter, filterEmbeddable, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "conditional_featured" | "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "featured" | "likes" | "plays" | "relevant";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/categories/${category}/videos${QS.query(QS.form({
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific video in a category
 */
export function checkCategoryForVideo(category: string, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/categories/${category}/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Get all channels
 */
export function getChannels({ direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "featured";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "default" | "followers" | "relevant" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create a channel
 */
export function createChannel(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/channels", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a channel
 */
export function deleteChannel(channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/channels/${channelId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific channel
 */
export function getChannel(channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}`, {
        ...opts
    });
}
/**
 * Edit a channel
 */
export function editChannel(channelId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the categories to which a channel belongs
 */
export function getChannelCategories(channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/categories`, {
        ...opts
    });
}
/**
 * Add a channel to a list of categories
 */
export function addChannelCategories(channelId: number, body: {
    channels: string[];
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/channels/${channelId}/categories`, oazapfts.json({
        ...opts,
        method: "PUT",
        body
    }));
}
/**
 * Remove a channel from a category
 */
export function deleteChannelCategory(category: string, channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/categories/${category}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add a channel to a specific category
 */
export function categorizeChannel(category: string, channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/categories/${category}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Remove a list of moderators from a channel
 */
export function removeChannelModerators(channelId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/moderators`, {
        ...opts,
        method: "DELETE",
        body
    });
}
/**
 * Get all the moderators of a channel
 */
export function getChannelModerators(channelId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/moderators${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Replace the moderators of a channel
 */
export function replaceChannelModerators(channelId: number, body: {
    user_uri: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: User[];
    } | {
        status: 400;
        data: Error;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/channels/${channelId}/moderators`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body
    }));
}
/**
 * Add a list of moderators to a channel
 */
export function addChannelModerators(channelId: number, body: {
    user_uri: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/channels/${channelId}/moderators`, oazapfts.json({
        ...opts,
        method: "PUT",
        body
    }));
}
/**
 * Get a specific moderator of a channel
 */
export function getChannelModerator(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/moderators/${userId}`, {
        ...opts
    });
}
/**
 * Remove a specific moderator from a channel
 */
export function removeChannelModerator(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/moderators/${userId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add a specific moderator to a channel
 */
export function addChannelModerator(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/moderators/${userId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the users who can access a private channel
 */
export function getChannelPrivacyUsers(channelId: number, { direction, page, perPage }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/privacy/users${QS.query(QS.form({
        direction,
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Permit a list of users to access a private channel
 */
export function setChannelPrivacyUsers(channelId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/privacy/users`, {
        ...opts,
        method: "PUT",
        body
    });
}
/**
 * Restrict a user from accessing a private channel
 */
export function deleteChannelPrivacyUser(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    }>(`/channels/${channelId}/privacy/users/${userId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Permit a specific user to access a private channel
 */
export function setChannelPrivacyUser(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    }>(`/channels/${channelId}/privacy/users/${userId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the tags that have been added to a channel
 */
export function getChannelTags(channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/tags`, {
        ...opts
    });
}
/**
 * Add a list of tags to a channel
 */
export function addTagsToChannel(channelId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/tags`, {
        ...opts,
        method: "PUT",
        body
    });
}
/**
 * Remove a tag from a channel
 */
export function deleteTagFromChannel(channelId: number, word: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/tags/${word}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if a tag has been added to a channel
 */
export function checkIfChannelHasTag(channelId: number, word: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/tags/${word}`, {
        ...opts
    });
}
/**
 * Add a specific tag to a channel
 */
export function addChannelTag(channelId: number, word: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/tags/${word}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the followers of a channel
 */
export function getChannelSubscribers(channelId: number, filter: "moderators", { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/users${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove a list of videos from a channel
 */
export function removeVideosFromChannel(channelId: number, body: {
    video_uri: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/channels/${channelId}/videos`, oazapfts.json({
        ...opts,
        method: "DELETE",
        body
    }));
}
/**
 * Get all the videos in a channel
 */
export function getChannelVideos(channelId: number, { containingUri, direction, filter, filterEmbeddable, page, perPage, query, sort }: {
    containingUri?: string;
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "added" | "alphabetical" | "comments" | "date" | "default" | "duration" | "likes" | "manual" | "modified_time" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos${QS.query(QS.form({
        containing_uri: containingUri,
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Add a list of videos to a channel
 */
export function addVideosToChannel(channelId: number, body: {
    video_uri: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/channels/${channelId}/videos`, oazapfts.json({
        ...opts,
        method: "PUT",
        body
    }));
}
/**
 * Remove a specific video from a channel
 */
export function deleteVideoFromChannel(channelId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/channels/${channelId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video in a channel
 */
export function getChannelVideo(channelId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Add a specific video to a channel
 */
export function addVideoToChannel(channelId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/channels/${channelId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the video comments on a video
 */
export function getCommentsAlt1(channelId: number, videoId: number, { direction, page, perPage }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/comments${QS.query(QS.form({
        direction,
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a video comment to a video
 */
export function createCommentAlt1(channelId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/comments`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Get all the credited users in a video
 */
export function getVideoCreditsAlt1(channelId: number, videoId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/credits${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Credit a user in a video
 */
export function addVideoCreditAlt1(channelId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/credits`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Get all the users who have liked a video
 */
export function getVideoLikesAlt1(channelId: number, videoId: number, { direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/likes${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the thumbnails of a video
 */
export function getVideoThumbnailsAlt1(channelId: number, videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/pictures${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a video thumbnail
 */
export function createVideoThumbnailAlt1(channelId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/pictures`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Get all the users who can view a private video
 */
export function getVideoPrivacyUsersAlt1(channelId: number, videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/privacy/users${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Permit a list of users to access a private video
 */
export function addVideoPrivacyUsersAlt1(channelId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/privacy/users`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the text tracks of a video
 */
export function getTextTracksAlt1(channelId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/texttracks`, {
        ...opts
    });
}
/**
 * Add a text track to a video
 */
export function createTextTrackAlt1(channelId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/texttracks`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Get all the versions of a video
 */
export function getVideoVersionsAlt1(channelId: number, videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/channels/${channelId}/videos/${videoId}/versions${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Get all content ratings
 */
export function getContentRatings(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/contentratings", {
        ...opts
    });
}
/**
 * Get all Creative Commons licenses
 */
export function getCcLicenses(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/creativecommons", {
        ...opts
    });
}
/**
 * Delete the destination by destination id
 */
export function deleteLiveEventDestination(destinationId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/destination/${destinationId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get the destination by destination id
 */
export function getLiveEventDestination(destinationId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/destination/${destinationId}`, {
        ...opts
    });
}
/**
 * Update the destination by destination id
 */
export function updateLiveEventDestination(destinationId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/destination/${destinationId}`, {
        ...opts,
        method: "PATCH"
    });
}
/**
 * Get all groups
 */
export function getGroups({ direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "featured";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "followers" | "relevant" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/groups${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create a group
 */
export function createGroup(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/groups", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a group
 */
export function deleteGroup(groupId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/groups/${groupId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific group
 */
export function getGroup(groupId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/groups/${groupId}`, {
        ...opts
    });
}
/**
 * Get all the members of a group
 */
export function getGroupMembers(groupId: number, { direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "moderators";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/groups/${groupId}/users${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the videos in a group
 */
export function getGroupVideos(groupId: number, { direction, filter, filterEmbeddable, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/groups/${groupId}/videos${QS.query(QS.form({
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove a video from a group
 */
export function deleteVideoFromGroup(groupId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/groups/${groupId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video in a group
 */
export function getGroupVideo(groupId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/groups/${groupId}/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Add a video to a group
 */
export function addVideoToGroup(groupId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/groups/${groupId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all languages
 */
export function getLanguages({ filter }: {
    filter?: "texttracks";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/languages${QS.query(QS.form({
        filter
    }))}`, {
        ...opts
    });
}
/**
 * Get the user
 */
export function getUserAlt1(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me", {
        ...opts
    });
}
/**
 * Edit the user
 */
export function editUserAlt1(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me", {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the showcases that belong to the user
 */
export function getShowcasesAlt1({ direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "duration" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Album[];
    } | {
        status: 400;
        data: LegacyError;
    }>(`/me/albums${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create a showcase
 */
export function createShowcaseAlt1(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me/albums", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a showcase
 */
export function deleteShowcaseAlt1(albumId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/albums/${albumId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific showcase
 */
export function getShowcaseAlt1(albumId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/albums/${albumId}`, {
        ...opts
    });
}
/**
 * Edit a showcase
 */
export function editShowcaseAlt1(albumId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/albums/${albumId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the videos in a showcase
 */
export function getShowcaseVideosAlt1(albumId: number, { containingUri, direction, filter, filterEmbeddable, page, password, perPage, query, sort, weakSearch }: {
    containingUri?: string;
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    password?: string;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "default" | "duration" | "likes" | "manual" | "modified_time" | "plays";
    weakSearch?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/albums/${albumId}/videos${QS.query(QS.form({
        containing_uri: containingUri,
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        password,
        per_page: perPage,
        query,
        sort,
        weak_search: weakSearch
    }))}`, {
        ...opts
    });
}
/**
 * Replace all the videos in a showcase
 */
export function replaceVideosInShowcaseAlt1(albumId: number, body: {
    videos: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/albums/${albumId}/videos`, oazapfts.json({
        ...opts,
        method: "PUT",
        body
    }));
}
/**
 * Remove a video from a showcase
 */
export function removeVideoFromShowcaseAlt1(albumId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/albums/${albumId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video in a showcase
 */
export function getShowcaseVideoAlt1(albumId: number, videoId: number, { password }: {
    password?: string;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/albums/${albumId}/videos/${videoId}${QS.query(QS.form({
        password
    }))}`, {
        ...opts
    });
}
/**
 * Add a specific video to a showcase
 */
export function addVideoToShowcaseAlt1(albumId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/albums/${albumId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Create a thumbnail for a showcase from a showcase video
 */
export function setVideoAsShowcaseThumbnailAlt1(albumId: number, videoId: number, body: {
    time_code?: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Album;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    } | {
        status: 500;
        data: Error;
    }>(`/me/albums/${albumId}/videos/${videoId}/set_album_thumbnail`, oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Set the featured video of a showcase
 */
export function setVideoAsShowcaseFeaturedAlt1(albumId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Album;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/albums/${albumId}/videos/${videoId}/set_featured_video`, {
        ...opts,
        method: "PATCH"
    });
}
/**
 * Get all the videos in which the user appears
 */
export function getAppearancesAlt1({ direction, filter, filterEmbeddable, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/appearances${QS.query(QS.form({
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the categories that the user follows
 */
export function getCategorySubscriptionsAlt1({ direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "date" | "name";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/categories${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Cause the user to stop following a category
 */
export function unsubscribeFromCategoryAlt1(category: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/categories/${category}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user follows a category
 */
export function checkIfUserSubscribedToCategoryAlt1(category: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/categories/${category}`, {
        ...opts
    });
}
/**
 * Cause the user to follow a specific category
 */
export function subscribeToCategoryAlt1(category: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/categories/${category}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the channels to which a user subscribes
 */
export function getChannelSubscriptionsAlt1({ direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "moderated";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "followers" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/channels${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Unsubscribe the user from a specific channel
 */
export function unsubscribeFromChannelAlt1(channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/channels/${channelId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if a user follows a channel
 */
export function checkIfUserSubscribedToChannelAlt1(channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/channels/${channelId}`, {
        ...opts
    });
}
/**
 * Subscribe the user to a specific channel
 */
export function subscribeToChannelAlt1(channelId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/channels/${channelId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the custom logos that belong to the user
 */
export function getCustomLogosAlt1(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me/customlogos", {
        ...opts
    });
}
/**
 * Add a custom logo for the user
 */
export function createCustomLogoAlt1(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me/customlogos", {
        ...opts,
        method: "POST"
    });
}
/**
 * delete a specific custom logo for the user
 */
export function deleteCustomLogoAlt1(logoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/customlogos/${logoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific custom logo for the user
 */
export function getCustomLogoAlt1(logoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/customlogos/${logoId}`, {
        ...opts
    });
}
/**
 * Get available destinations for user to stream to
 */
export function getAvailableDestinationsAlt1(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me/destinations", {
        ...opts
    });
}
/**
 * Get all the videos in the user's feed
 */
export function getFeedAlt1({ offset, page, perPage, type }: {
    offset?: string;
    page?: number;
    perPage?: number;
    "type"?: "appears" | "category_featured" | "channel" | "facebook_feed" | "following" | "group" | "likes" | "ondemand_publish" | "share" | "tagged_with" | "twitter_timeline" | "uploads";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/feed${QS.query(QS.form({
        offset,
        page,
        per_page: perPage,
        type
    }))}`, {
        ...opts
    });
}
/**
 * Get all the followers of the user
 */
export function getFollowersAlt1({ direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/followers${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the users that the user is following
 */
export function getUserFollowingAlt1({ direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "online";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/following${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Follow a list of users
 */
export function followUsersAlt1(body: {
    users: string[];
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 429;
        data: Error;
    } | {
        status: 500;
        data: Error;
    }>("/me/following", oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Unfollow a user
 */
export function unfollowUserAlt1(followUserId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/following/${followUserId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user is following another user
 */
export function checkIfUserIsFollowingAlt1(followUserId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/following/${followUserId}`, {
        ...opts
    });
}
/**
 * Follow a specific user
 */
export function followUserAlt1(followUserId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/me/following/${followUserId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the groups that the user has joined
 */
export function getUserGroupsAlt1({ direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "moderated";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "members" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/groups${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove the user from a group
 */
export function leaveGroupAlt1(groupId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/me/groups/${groupId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add the user to a group
 */
export function joinGroupAlt1(groupId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/me/groups/${groupId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Check if a user has joined a group
 */
export function checkIfUserJoinedGroupAlt1(groupId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/groups/${groupId}`, {
        ...opts
    });
}
/**
 * Get all the videos that a user has liked
 */
export function getLikesAlt1({ filter, filterEmbeddable, page, perPage, query, sort }: {
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/likes${QS.query(QS.form({
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Cause a user to unlike a video
 */
export function unlikeVideoAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/me/likes/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user has liked a video
 */
export function checkIfUserLikedVideoAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/likes/${videoId}`, {
        ...opts
    });
}
/**
 * Cause the user to like a video
 */
export function likeVideoAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: LegacyError;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/me/likes/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the On Demand pages of the user
 */
export function getUserVodsAlt1({ direction, filter, page, perPage, sort }: {
    direction?: "asc" | "desc";
    filter?: "film" | "series";
    page?: number;
    perPage?: number;
    sort?: "added" | "alphabetical" | "date" | "modified_time" | "name" | "publish.time" | "rating";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/ondemand/pages${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create an On Demand page
 */
export function createVodAlt1(body: {
    accepted_currencies?: "AUD" | "CAD" | "CHF" | "DKK" | "EUR" | "GBP" | "JPY" | "KRW" | "NOK" | "PLN" | "SEK" | "USD";
    buy?: {
        active?: boolean;
        download?: boolean;
        price?: {
            AUD?: number;
            CAD?: number;
            CHF?: number;
            DKK?: number;
            EUR?: number;
            GBP?: number;
            JPY?: number;
            KRW?: number;
            NOK?: number;
            PLN?: number;
            SEK?: number;
            USD?: number;
        };
    };
    content_rating: "drugs" | "language" | "nudity" | "safe" | "unrated" | "violence";
    description: string;
    domain_link?: string;
    episodes?: {
        buy?: {
            active?: boolean;
            download?: boolean;
            price?: {
                USD?: number;
            };
        };
        rent?: {
            active?: boolean;
            period?: "1 week" | "1 year" | "24 hour" | "3 month" | "30 day" | "48 hour" | "6 month" | "72 hour";
            price?: {
                USD?: number;
            };
        };
    };
    link?: string;
    name: string;
    rent?: {
        active?: boolean;
        period?: "1 week" | "1 year" | "24 hour" | "3 month" | "30 day" | "48 hour" | "6 month" | "72 hour";
        price?: {
            AUD?: number;
            CAD?: number;
            CHF?: number;
            DKK?: number;
            EUR?: number;
            GBP?: number;
            JPY?: number;
            KRW?: number;
            NOK?: number;
            PLN?: number;
            SEK?: number;
            USD?: number;
        };
    };
    subscription?: {
        monthly?: {
            active?: boolean;
            price?: {
                USD?: number;
            };
        };
    };
    "type": "film" | "series";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
        data: OnDemandPage;
    }>("/me/ondemand/pages", oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Get all the On Demand purchases and rentals that the user has made
 */
export function getVodPurchasesAlt1({ direction, filter, page, perPage, sort }: {
    direction?: "asc" | "desc";
    filter?: "all" | "expiring_soon" | "film" | "important" | "purchased" | "rented" | "series" | "subscription" | "unwatched" | "watched";
    page?: number;
    perPage?: number;
    sort?: "added" | "alphabetical" | "date" | "name" | "purchase_time" | "rating" | "release_date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/ondemand/purchases${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Check if a user has made a purchase or rental from an On Demand page
 */
export function checkIfVodWasPurchasedAlt1(ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/ondemand/purchases/${ondemandId}`, {
        ...opts
    });
}
/**
 * Get all the pictures that belong to the user
 */
export function getPicturesAlt1({ page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/pictures${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a picture to the user's account
 */
export function createPictureAlt1(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me/pictures", {
        ...opts,
        method: "POST"
    });
}
/**
 * Delete a picture from the user's account
 */
export function deletePictureAlt1(portraitsetId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/pictures/${portraitsetId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific picture that belongs to the user
 */
export function getPictureAlt1(portraitsetId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/pictures/${portraitsetId}`, {
        ...opts
    });
}
/**
 * Edit a picture in the user's account
 */
export function editPictureAlt1(portraitsetId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/pictures/${portraitsetId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the portfolios that belong to the user
 */
export function getPortfoliosAlt1({ direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/portfolios${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific portfolio
 */
export function getPortfolioAlt1(portfolioId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/portfolios/${portfolioId}`, {
        ...opts
    });
}
/**
 * Get all the videos in a portfolio
 */
export function getPortfolioVideosAlt1(portfolioId: number, { containingUri, filter, filterEmbeddable, page, perPage, sort }: {
    containingUri?: string;
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "comments" | "date" | "default" | "likes" | "manual" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/portfolios/${portfolioId}/videos${QS.query(QS.form({
        containing_uri: containingUri,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove a video from a portfolio
 */
export function deleteVideoFromPortfolioAlt1(portfolioId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/portfolios/${portfolioId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video in a portfolio
 */
export function getPortfolioVideoAlt1(portfolioId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/portfolios/${portfolioId}/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Add a video to a portfolio
 */
export function addVideoToPortfolioAlt1(portfolioId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/me/portfolios/${portfolioId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the embed presets that a user has created
 */
export function getEmbedPresetsAlt1({ page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/presets${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific embed preset
 */
export function getEmbedPresetAlt1(presetId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/presets/${presetId}`, {
        ...opts
    });
}
/**
 * Edit an embed preset
 */
export function editEmbedPresetAlt1(presetId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/presets/${presetId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the videos that have a specific embed preset
 */
export function getEmbedPresetVideosAlt1(presetId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/presets/${presetId}/videos${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Get all the folders that belong to the user
 */
export function getProjectsAlt1({ direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "date" | "default" | "modified_time" | "name";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Project[];
    } | {
        status: 401;
        data: Error;
    }>(`/me/projects${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create a folder
 */
export function createProjectAlt1(body: {
    name: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
        data: Project;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    }>("/me/projects", oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete a folder
 */
export function deleteProjectAlt1(projectId: number, { shouldDeleteClips }: {
    shouldDeleteClips?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}${QS.query(QS.form({
        should_delete_clips: shouldDeleteClips
    }))}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific folder
 */
export function getProjectAlt1(projectId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Project;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}`, {
        ...opts
    });
}
/**
 * Edit a folder
 */
export function editProjectAlt1(projectId: number, body: {
    name: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Project;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body
    }));
}
/**
 * Remove a list of videos from a folder
 */
export function removeVideosFromProjectAlt1(projectId: number, uris: string, { shouldDeleteClips }: {
    shouldDeleteClips?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}/videos${QS.query(QS.form({
        should_delete_clips: shouldDeleteClips,
        uris
    }))}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get all the videos in a folder
 */
export function getProjectVideosAlt1(projectId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "default" | "duration" | "last_user_action_event_date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Video[];
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}/videos${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Add a list of videos to a folder
 */
export function addVideosToProjectAlt1(projectId: number, uris: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}/videos${QS.query(QS.form({
        uris
    }))}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Remove a specific video from a folder
 */
export function removeVideoFromProjectAlt1(projectId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add a specific video to a folder
 */
export function addVideoToProjectAlt1(projectId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: Error;
    }>(`/me/projects/${projectId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the videos that the user has uploaded
 */
export function getVideosAlt1({ containingUri, direction, filter, filterEmbeddable, filterPlayable, includeTeamContent, page, perPage, query, sort }: {
    containingUri?: string;
    direction?: "asc" | "desc";
    filter?: "app_only" | "embeddable" | "featured" | "playable";
    filterEmbeddable?: boolean;
    filterPlayable?: boolean;
    includeTeamContent?: string;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "default" | "duration" | "last_user_action_event_date" | "likes" | "modified_time" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/videos${QS.query(QS.form({
        containing_uri: containingUri,
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        filter_playable: filterPlayable,
        include_team_content: includeTeamContent,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Upload a video
 */
export function uploadVideoAlt1(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me/videos", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Check if the user owns a video
 */
export function checkIfUserOwnsVideoAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Get all the destinations of a one time event
 */
export function getOneTimeEventDestinationsAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/videos/${videoId}/destinations`, {
        ...opts
    });
}
/**
 * Create destination for live event
 */
export function createOneTimeEventDestinationAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/videos/${videoId}/destinations`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Get an M3U8 playback URL for a one-time live event
 */
export function getOneTimeEventM3U8PlaybackAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/me/videos/${videoId}/m3u8_playback`, {
        ...opts
    });
}
/**
 * Delete the user's watch history
 */
export function deleteWatchHistory(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/me/watched/videos", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get all the videos that a user has watched
 */
export function getWatchHistory({ page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/watched/videos${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Delete a specific video from the user's watch history
 */
export function deleteFromWatchHistory(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/watched/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get all the videos in the user's Watch Later queue
 */
export function getWatchLaterQueueAlt1({ direction, filter, filterEmbeddable, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/watchlater${QS.query(QS.form({
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove a video from the user's Watch Later queue
 */
export function deleteVideoFromWatchLaterAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/watchlater/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user has added a video to their Watch Later queue
 */
export function checkWatchLaterQueueAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/watchlater/${videoId}`, {
        ...opts
    });
}
/**
 * Add a video to the user's Watch Later queue
 */
export function addVideoToWatchLaterAlt1(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/me/watchlater/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Exchange an authorization code for an access token
 */
export function exchangeAuthCode(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/oauth/access_token", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Authorize on a user's behalf for an access token or authorization code
 */
export function authorize(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/oauth/authorize/allow", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Authorize a client with OAuth
 */
export function clientAuth(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/oauth/authorize/client", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Convert an OAuth 1 access token to an OAuth 2 access token
 */
export function convertAccessToken(body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/oauth/authorize/vimeo_oauth1", {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Verify an OAuth 2 access token
 */
export function verifyToken(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/oauth/verify", {
        ...opts
    });
}
/**
 * Get all On Demand genres
 */
export function getVodGenres(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/ondemand/genres", {
        ...opts
    });
}
/**
 * Get a specific On Demand genre
 */
export function getVodGenre(genreId: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/genres/${genreId}`, {
        ...opts
    });
}
/**
 * Get all the On Demand pages in a genre
 */
export function getGenreVods(genreId: string, { direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "country" | "my_region";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "name" | "publish.time" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/genres/${genreId}/pages${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific On Demand page in a genre
 */
export function getGenreVod(genreId: string, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/genres/${genreId}/pages/${ondemandId}`, {
        ...opts
    });
}
/**
 * Delete an On Demand page
 */
export function deleteVodDraft(ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific On Demand page
 */
export function getVod(ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}`, {
        ...opts
    });
}
/**
 * Edit an On Demand page
 */
export function editVod(ondemandId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the backgrounds on an On Demand page
 */
export function getVodBackgrounds(ondemandId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/backgrounds${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a background to an On Demand page
 */
export function createVodBackground(ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/backgrounds`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Delete a background on an On Demand page
 */
export function deleteVodBackground(backgroundId: number, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/backgrounds/${backgroundId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific background on an On Demand page
 */
export function getVodBackground(backgroundId: number, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/backgrounds/${backgroundId}`, {
        ...opts
    });
}
/**
 * Edit a background on an On Demand page
 */
export function editVodBackground(backgroundId: number, ondemandId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/backgrounds/${backgroundId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the genres of an On Demand page
 */
export function getVodGenresByOndemandId(ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/genres`, {
        ...opts
    });
}
/**
 * Remove a genre from an On Demand page
 */
export function deleteVodGenre(genreId: string, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/genres/${genreId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check whether an On Demand page belongs to a specific genre
 */
export function getVodGenreByOndemandId(genreId: string, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/genres/${genreId}`, {
        ...opts
    });
}
/**
 * Add a genre to an On Demand page
 */
export function addVodGenre(genreId: string, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/genres/${genreId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the users who have liked a video on an On Demand page
 */
export function getVodLikes(ondemandId: number, { direction, filter, page, perPage, sort }: {
    direction?: "asc" | "desc";
    filter?: "extra" | "main" | "trailer";
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/likes${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the posters on an On Demand page
 */
export function getVodPosters(ondemandId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/pictures${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a poster to an On Demand page
 */
export function addVodPoster(ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/pictures`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Get a specific poster on an On Demand page
 */
export function getVodPoster(ondemandId: number, posterId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/pictures/${posterId}`, {
        ...opts
    });
}
/**
 * Edit a poster on an On Demand page
 */
export function editVodPoster(ondemandId: number, posterId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/pictures/${posterId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the promotions on an On Demand page
 */
export function getVodPromotions(ondemandId: number, filter: "batch" | "default" | "single" | "vip", { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/promotions${QS.query(QS.form({
        filter,
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a promotion to an On Demand page
 */
export function createVodPromotion(ondemandId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/promotions`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a promotion on an On Demand page
 */
export function deleteVodPromotion(ondemandId: number, promotionId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/ondemand/pages/${ondemandId}/promotions/${promotionId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific promotion on an On Demand page
 */
export function getVodPromotion(ondemandId: number, promotionId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/promotions/${promotionId}`, {
        ...opts
    });
}
/**
 * Get all the codes of a promotion on an On Demand page
 */
export function getVodPromotionCodes(ondemandId: number, promotionId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/promotions/${promotionId}/codes${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Remove a list of regions from an On Demand page
 */
export function deleteVodRegions(ondemandId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/regions`, {
        ...opts,
        method: "DELETE",
        body
    });
}
/**
 * Get all the regions on an On Demand page
 */
export function getVodRegions(ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/regions`, {
        ...opts
    });
}
/**
 * Add a list of regions to an On Demand page
 */
export function setVodRegions(ondemandId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/regions`, {
        ...opts,
        method: "PUT",
        body
    });
}
/**
 * Remove a specific region from an On Demand page
 */
export function deleteVodRegion(country: string, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/regions/${country}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific region on an On Demand page
 */
export function getVodRegion(country: string, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/regions/${country}`, {
        ...opts
    });
}
/**
 * Add a specific region to an On Demand page
 */
export function addVodRegion(country: string, ondemandId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/regions/${country}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the seasons on an On Demand page
 */
export function getVodSeasons(ondemandId: number, { direction, filter, page, perPage, sort }: {
    direction?: "asc" | "desc";
    filter?: "viewable";
    page?: number;
    perPage?: number;
    sort?: "date" | "manual";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/seasons${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific season on an On Demand page
 */
export function getVodSeason(ondemandId: number, seasonId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/seasons/${seasonId}`, {
        ...opts
    });
}
/**
 * Get all the videos in a season on an On Demand page
 */
export function getVodSeasonVideos(ondemandId: number, seasonId: number, { filter, page, perPage, sort }: {
    filter?: "viewable";
    page?: number;
    perPage?: number;
    sort?: "date" | "default" | "manual" | "name" | "purchase_time" | "release_date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/seasons/${seasonId}/videos${QS.query(QS.form({
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the videos on an On Demand page
 */
export function getVodVideos(ondemandId: number, { direction, filter, page, perPage, sort }: {
    direction?: "asc" | "desc";
    filter?: "all" | "buy" | "expiring_soon" | "extra" | "main" | "main.viewable" | "rent" | "trailer" | "unwatched" | "viewable" | "watched";
    page?: number;
    perPage?: number;
    sort?: "date" | "default" | "episode" | "manual" | "name" | "purchase_time" | "release_date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/videos${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove a video from an On Demand page
 */
export function deleteVideoFromVod(ondemandId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video on an On Demand page
 */
export function getVodVideo(ondemandId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Add a video to an On Demand page
 */
export function addVideoToVod(ondemandId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/pages/${ondemandId}/videos/${videoId}`, {
        ...opts,
        method: "PUT",
        body
    });
}
/**
 * Get all the On Demand regions
 */
export function getRegions(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/ondemand/regions", {
        ...opts
    });
}
/**
 * Get a specific On Demand region
 */
export function getRegion(country: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/ondemand/regions/${country}`, {
        ...opts
    });
}
/**
 * Get a tag
 */
export function getTag(word: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/tags/${word}`, {
        ...opts
    });
}
/**
 * Get all the videos with a specific tag
 */
export function getVideosWithTag(word: string, { direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "created_time" | "duration" | "name";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/tags/${word}/videos${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get membership information about a team
 */
export function getTeamInformation(code: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/teammembers/${code}`, {
        ...opts
    });
}
/**
 * Revoke the current access token
 */
export function deleteToken(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/tokens", {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get started with the Vimeo API
 */
export function developerTutorial(opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText("/tutorial", {
        ...opts
    });
}
/**
 * Search for users
 */
export function searchUsers({ direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "followers" | "relevant" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get the user
 */
export function getUser(userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}`, {
        ...opts
    });
}
/**
 * Edit the user
 */
export function editUser(userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the showcases that belong to the user
 */
export function getShowcases(userId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "duration" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Album[];
    } | {
        status: 400;
        data: LegacyError;
    }>(`/users/${userId}/albums${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create a showcase
 */
export function createShowcase(userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a showcase
 */
export function deleteShowcase(albumId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/albums/${albumId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific showcase
 */
export function getShowcase(albumId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}`, {
        ...opts
    });
}
/**
 * Edit a showcase
 */
export function editShowcase(albumId: number, userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the custom thumbnails of a showcase
 */
export function getShowcaseCustomThumbs(albumId: number, userId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/custom_thumbnails${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a custom thumbnail to a showcase
 */
export function createShowcaseCustomThumb(albumId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/custom_thumbnails`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Delete a custom showcase thumbnail
 */
export function deleteShowcaseCustomThumbnail(albumId: number, thumbnailId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/custom_thumbnails/${thumbnailId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific custom showcase thumbnail
 */
export function getShowcaseCustomThumbnail(albumId: number, thumbnailId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/custom_thumbnails/${thumbnailId}`, {
        ...opts
    });
}
/**
 * Replace a custom showcase thumbnail
 */
export function replaceShowcaseCustomThumb(albumId: number, thumbnailId: number, userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/custom_thumbnails/${thumbnailId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the custom logos of a showcase
 */
export function getShowcaseLogos(albumId: number, userId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/logos${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a custom logo to a showcase
 */
export function createShowcaseLogo(albumId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/logos`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Delete a custom showcase logo
 */
export function deleteShowcaseLogo(albumId: number, logoId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/logos/${logoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific custom showcase logo
 */
export function getShowcaseLogo(albumId: number, logoId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/logos/${logoId}`, {
        ...opts
    });
}
/**
 * Replace a custom showcase logo
 */
export function replaceShowcaseLogo(albumId: number, logoId: number, userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/logos/${logoId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the videos in a showcase
 */
export function getShowcaseVideos(albumId: number, userId: number, { containingUri, direction, filter, filterEmbeddable, page, password, perPage, query, sort, weakSearch }: {
    containingUri?: string;
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    password?: string;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "default" | "duration" | "likes" | "manual" | "modified_time" | "plays";
    weakSearch?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/videos${QS.query(QS.form({
        containing_uri: containingUri,
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        password,
        per_page: perPage,
        query,
        sort,
        weak_search: weakSearch
    }))}`, {
        ...opts
    });
}
/**
 * Replace all the videos in a showcase
 */
export function replaceVideosInShowcase(albumId: number, userId: number, body: {
    videos: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/albums/${albumId}/videos`, oazapfts.json({
        ...opts,
        method: "PUT",
        body
    }));
}
/**
 * Remove a video from a showcase
 */
export function removeVideoFromShowcase(albumId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/albums/${albumId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video in a showcase
 */
export function getShowcaseVideo(albumId: number, userId: number, videoId: number, { password }: {
    password?: string;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/albums/${albumId}/videos/${videoId}${QS.query(QS.form({
        password
    }))}`, {
        ...opts
    });
}
/**
 * Add a specific video to a showcase
 */
export function addVideoToShowcase(albumId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/albums/${albumId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Create a thumbnail for a showcase from a showcase video
 */
export function setVideoAsShowcaseThumbnail(albumId: number, userId: number, videoId: number, body: {
    time_code?: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Album;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    } | {
        status: 500;
        data: Error;
    }>(`/users/${userId}/albums/${albumId}/videos/${videoId}/set_album_thumbnail`, oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Set the featured video of a showcase
 */
export function setVideoAsShowcaseFeatured(albumId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Album;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/albums/${albumId}/videos/${videoId}/set_featured_video`, {
        ...opts,
        method: "PATCH"
    });
}
/**
 * Get all the videos in which the user appears
 */
export function getAppearances(userId: number, { direction, filter, filterEmbeddable, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/appearances${QS.query(QS.form({
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the categories that the user follows
 */
export function getCategorySubscriptions(userId: number, { direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "date" | "name";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/categories${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Cause the user to stop following a category
 */
export function unsubscribeFromCategory(category: string, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/categories/${category}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user follows a category
 */
export function checkIfUserSubscribedToCategory(category: string, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/categories/${category}`, {
        ...opts
    });
}
/**
 * Cause the user to follow a specific category
 */
export function subscribeToCategory(category: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/categories/${category}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the channels to which a user subscribes
 */
export function getChannelSubscriptions(userId: number, { direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "moderated";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "followers" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/channels${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Unsubscribe the user from a specific channel
 */
export function unsubscribeFromChannel(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/channels/${channelId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if a user follows a channel
 */
export function checkIfUserSubscribedToChannel(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/channels/${channelId}`, {
        ...opts
    });
}
/**
 * Subscribe the user to a specific channel
 */
export function subscribeToChannel(channelId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/channels/${channelId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the custom logos that belong to the user
 */
export function getCustomLogos(userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/customlogos`, {
        ...opts
    });
}
/**
 * Add a custom logo for the user
 */
export function createCustomLogo(userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/customlogos`, {
        ...opts,
        method: "POST"
    });
}
/**
 * delete a specific custom logo for the user
 */
export function deleteCustomLogo(logoId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/customlogos/${logoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific custom logo for the user
 */
export function getCustomLogo(logoId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/customlogos/${logoId}`, {
        ...opts
    });
}
/**
 * Get available destinations for user to stream to
 */
export function getAvailableDestinations(userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/destinations`, {
        ...opts
    });
}
/**
 * Get all the videos in the user's feed
 */
export function getFeed(userId: number, { offset, page, perPage, type }: {
    offset?: string;
    page?: number;
    perPage?: number;
    "type"?: "appears" | "category_featured" | "channel" | "facebook_feed" | "following" | "group" | "likes" | "ondemand_publish" | "share" | "tagged_with" | "twitter_timeline" | "uploads";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/feed${QS.query(QS.form({
        offset,
        page,
        per_page: perPage,
        type
    }))}`, {
        ...opts
    });
}
/**
 * Get all the followers of the user
 */
export function getFollowers(userId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/followers${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the users that the user is following
 */
export function getUserFollowing(userId: number, { direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "online";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/following${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Follow a list of users
 */
export function followUsers(userId: number, body: {
    users: string[];
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 429;
        data: Error;
    } | {
        status: 500;
        data: Error;
    }>(`/users/${userId}/following`, oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Unfollow a user
 */
export function unfollowUser(followUserId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/following/${followUserId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user is following another user
 */
export function checkIfUserIsFollowing(followUserId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/following/${followUserId}`, {
        ...opts
    });
}
/**
 * Follow a specific user
 */
export function followUser(followUserId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/users/${userId}/following/${followUserId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the groups that the user has joined
 */
export function getUserGroups(userId: number, { direction, filter, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "moderated";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "members" | "videos";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/groups${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove the user from a group
 */
export function leaveGroup(groupId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/users/${userId}/groups/${groupId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add the user to a group
 */
export function joinGroup(groupId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/users/${userId}/groups/${groupId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Check if a user has joined a group
 */
export function checkIfUserJoinedGroup(groupId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/groups/${groupId}`, {
        ...opts
    });
}
/**
 * Get all the videos that a user has liked
 */
export function getLikes(userId: number, { filter, filterEmbeddable, page, perPage, query, sort }: {
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/likes${QS.query(QS.form({
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Cause a user to unlike a video
 */
export function unlikeVideo(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/users/${userId}/likes/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user has liked a video
 */
export function checkIfUserLikedVideo(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/likes/${videoId}`, {
        ...opts
    });
}
/**
 * Cause the user to like a video
 */
export function likeVideo(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: LegacyError;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/users/${userId}/likes/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the On Demand pages of the user
 */
export function getUserVods(userId: number, { direction, filter, page, perPage, sort }: {
    direction?: "asc" | "desc";
    filter?: "film" | "series";
    page?: number;
    perPage?: number;
    sort?: "added" | "alphabetical" | "date" | "modified_time" | "name" | "publish.time" | "rating";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/ondemand/pages${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create an On Demand page
 */
export function createVod(userId: number, body: {
    accepted_currencies?: "AUD" | "CAD" | "CHF" | "DKK" | "EUR" | "GBP" | "JPY" | "KRW" | "NOK" | "PLN" | "SEK" | "USD";
    buy?: {
        active?: boolean;
        download?: boolean;
        price?: {
            AUD?: number;
            CAD?: number;
            CHF?: number;
            DKK?: number;
            EUR?: number;
            GBP?: number;
            JPY?: number;
            KRW?: number;
            NOK?: number;
            PLN?: number;
            SEK?: number;
            USD?: number;
        };
    };
    content_rating: "drugs" | "language" | "nudity" | "safe" | "unrated" | "violence";
    description: string;
    domain_link?: string;
    episodes?: {
        buy?: {
            active?: boolean;
            download?: boolean;
            price?: {
                USD?: number;
            };
        };
        rent?: {
            active?: boolean;
            period?: "1 week" | "1 year" | "24 hour" | "3 month" | "30 day" | "48 hour" | "6 month" | "72 hour";
            price?: {
                USD?: number;
            };
        };
    };
    link?: string;
    name: string;
    rent?: {
        active?: boolean;
        period?: "1 week" | "1 year" | "24 hour" | "3 month" | "30 day" | "48 hour" | "6 month" | "72 hour";
        price?: {
            AUD?: number;
            CAD?: number;
            CHF?: number;
            DKK?: number;
            EUR?: number;
            GBP?: number;
            JPY?: number;
            KRW?: number;
            NOK?: number;
            PLN?: number;
            SEK?: number;
            USD?: number;
        };
    };
    subscription?: {
        monthly?: {
            active?: boolean;
            price?: {
                USD?: number;
            };
        };
    };
    "type": "film" | "series";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
        data: OnDemandPage;
    }>(`/users/${userId}/ondemand/pages`, oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Get all the On Demand purchases and rentals that the user has made
 */
export function getVodPurchases(userId: number, { direction, filter, page, perPage, sort }: {
    direction?: "asc" | "desc";
    filter?: "all" | "expiring_soon" | "film" | "important" | "purchased" | "rented" | "series" | "subscription" | "unwatched" | "watched";
    page?: number;
    perPage?: number;
    sort?: "added" | "alphabetical" | "date" | "name" | "purchase_time" | "rating" | "release_date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/ondemand/purchases${QS.query(QS.form({
        direction,
        filter,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the pictures that belong to the user
 */
export function getPictures(userId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/pictures${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a picture to the user's account
 */
export function createPicture(userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/pictures`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Delete a picture from the user's account
 */
export function deletePicture(portraitsetId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/pictures/${portraitsetId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific picture that belongs to the user
 */
export function getPicture(portraitsetId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/pictures/${portraitsetId}`, {
        ...opts
    });
}
/**
 * Edit a picture in the user's account
 */
export function editPicture(portraitsetId: number, userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/pictures/${portraitsetId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the portfolios that belong to the user
 */
export function getPortfolios(userId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/portfolios${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific portfolio
 */
export function getPortfolio(portfolioId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/portfolios/${portfolioId}`, {
        ...opts
    });
}
/**
 * Get all the videos in a portfolio
 */
export function getPortfolioVideos(portfolioId: number, userId: number, { containingUri, filter, filterEmbeddable, page, perPage, sort }: {
    containingUri?: string;
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "comments" | "date" | "default" | "likes" | "manual" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/portfolios/${portfolioId}/videos${QS.query(QS.form({
        containing_uri: containingUri,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove a video from a portfolio
 */
export function deleteVideoFromPortfolio(portfolioId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/portfolios/${portfolioId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video in a portfolio
 */
export function getPortfolioVideo(portfolioId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/portfolios/${portfolioId}/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Add a video to a portfolio
 */
export function addVideoToPortfolio(portfolioId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/users/${userId}/portfolios/${portfolioId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the embed presets that a user has created
 */
export function getEmbedPresets(userId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/presets${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Get a specific embed preset
 */
export function getEmbedPreset(presetId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/presets/${presetId}`, {
        ...opts
    });
}
/**
 * Edit an embed preset
 */
export function editEmbedPreset(presetId: number, userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/presets/${presetId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the videos that have a specific embed preset
 */
export function getEmbedPresetVideos(presetId: number, userId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/presets/${presetId}/videos${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Get all the folders that belong to the user
 */
export function getProjects(userId: number, { direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "date" | "default" | "modified_time" | "name";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Project[];
    } | {
        status: 401;
        data: Error;
    }>(`/users/${userId}/projects${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Create a folder
 */
export function createProject(userId: number, body: {
    name: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
        data: Project;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    }>(`/users/${userId}/projects`, oazapfts.json({
        ...opts,
        method: "POST",
        body
    }));
}
/**
 * Delete a folder
 */
export function deleteProject(projectId: number, userId: number, { shouldDeleteClips }: {
    shouldDeleteClips?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}${QS.query(QS.form({
        should_delete_clips: shouldDeleteClips
    }))}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific folder
 */
export function getProject(projectId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Project;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}`, {
        ...opts
    });
}
/**
 * Edit a folder
 */
export function editProject(projectId: number, userId: number, body: {
    name: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Project;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body
    }));
}
/**
 * Remove a list of videos from a folder
 */
export function removeVideosFromProject(projectId: number, userId: number, uris: string, { shouldDeleteClips }: {
    shouldDeleteClips?: boolean;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}/videos${QS.query(QS.form({
        should_delete_clips: shouldDeleteClips,
        uris
    }))}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get all the videos in a folder
 */
export function getProjectVideos(projectId: number, userId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "default" | "duration" | "last_user_action_event_date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
        data: Video[];
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}/videos${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Add a list of videos to a folder
 */
export function addVideosToProject(projectId: number, userId: number, uris: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}/videos${QS.query(QS.form({
        uris
    }))}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Remove a specific video from a folder
 */
export function removeVideoFromProject(projectId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add a specific video to a folder
 */
export function addVideoToProject(projectId: number, userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/projects/${projectId}/videos/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Complete a streaming upload
 */
export function completeStreamingUpload(uploadId: number, userId: number, signature: string, videoFileId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 201;
    } | {
        status: 400;
        data: Error;
    } | {
        status: 404;
        data: Error;
    } | {
        status: 500;
        data: Error;
    }>(`/users/${userId}/uploads/${uploadId}${QS.query(QS.form({
        signature,
        video_file_id: videoFileId
    }))}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get an upload attempt
 */
export function getUploadAttempt(uploadId: number, userId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/uploads/${uploadId}`, {
        ...opts
    });
}
/**
 * Get all the videos that the user has uploaded
 */
export function getVideos(userId: number, { containingUri, direction, filter, filterEmbeddable, filterPlayable, includeTeamContent, page, perPage, query, sort }: {
    containingUri?: string;
    direction?: "asc" | "desc";
    filter?: "app_only" | "embeddable" | "featured" | "playable";
    filterEmbeddable?: boolean;
    filterPlayable?: boolean;
    includeTeamContent?: string;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date" | "default" | "duration" | "last_user_action_event_date" | "likes" | "modified_time" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/videos${QS.query(QS.form({
        containing_uri: containingUri,
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        filter_playable: filterPlayable,
        include_team_content: includeTeamContent,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Upload a video
 */
export function uploadVideo(userId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/videos`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Check if the user owns a video
 */
export function checkIfUserOwnsVideo(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Get all the destinations of a one time event
 */
export function getOneTimeEventDestinations(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/videos/${videoId}/destinations`, {
        ...opts
    });
}
/**
 * Create destination for live event
 */
export function createOneTimeEventDestination(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/videos/${videoId}/destinations`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Get an M3U8 playback URL for a one-time live event
 */
export function getOneTimeEventM3U8Playback(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 401;
        data: Error;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: Error;
    }>(`/users/${userId}/videos/${videoId}/m3u8_playback`, {
        ...opts
    });
}
/**
 * Get all the videos in the user's Watch Later queue
 */
export function getWatchLaterQueue(userId: number, { direction, filter, filterEmbeddable, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    filter?: "embeddable";
    filterEmbeddable?: boolean;
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/watchlater${QS.query(QS.form({
        direction,
        filter,
        filter_embeddable: filterEmbeddable,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Remove a video from the user's Watch Later queue
 */
export function deleteVideoFromWatchLater(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/watchlater/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if the user has added a video to their Watch Later queue
 */
export function checkWatchLaterQueue(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/watchlater/${videoId}`, {
        ...opts
    });
}
/**
 * Add a video to the user's Watch Later queue
 */
export function addVideoToWatchLater(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/users/${userId}/watchlater/${videoId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Search for videos
 */
export function searchVideos(query: string, { direction, filter, links, page, perPage, sort, uris }: {
    direction?: "asc" | "desc";
    filter?: "CC" | "CC-BY" | "CC-BY-NC" | "CC-BY-NC-ND" | "CC-BY-NC-SA" | "CC-BY-ND" | "CC-BY-SA" | "CC0" | "categories" | "duration" | "in-progress" | "minimum_likes" | "trending" | "upload_date";
    links?: string;
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "comments" | "date" | "duration" | "likes" | "plays" | "relevant";
    uris?: string;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos${QS.query(QS.form({
        direction,
        filter,
        links,
        page,
        per_page: perPage,
        query,
        sort,
        uris
    }))}`, {
        ...opts
    });
}
/**
 * Delete a video
 */
export function deleteVideo(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/videos/${videoId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video
 */
export function getVideo(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}`, {
        ...opts
    });
}
/**
 * Edit a video
 */
export function editVideo(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the albums that contain a video
 */
export function getVideoAlbums(videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/albums${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add or remove a video from a list of showcases
 */
export function addOrRemoveMultipleAlbums(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/albums`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the showcases to which the user can add or remove a specific video
 */
export function getAvailableVideoShowcases(videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/available_albums${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Get all the channels to which the user can add or remove a specific video
 */
export function getAvailableVideoChannels(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/available_channels`, {
        ...opts
    });
}
/**
 * Get all the categories to which a video belongs
 */
export function getVideoCategories(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/categories`, {
        ...opts
    });
}
/**
 * Suggest categories for a video
 */
export function suggestVideoCategory(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/categories`, {
        ...opts,
        method: "PUT",
        body
    });
}
/**
 * Get all the video comments on a video
 */
export function getComments(videoId: number, { direction, page, perPage }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/comments${QS.query(QS.form({
        direction,
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a video comment to a video
 */
export function createComment(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/comments`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a video comment
 */
export function deleteComment(commentId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: Error;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/videos/${videoId}/comments/${commentId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video comment
 */
export function getComment(commentId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/comments/${commentId}`, {
        ...opts
    });
}
/**
 * Edit a video comment
 */
export function editComment(commentId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/comments/${commentId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the replies to a video comment
 */
export function getCommentReplies(commentId: number, videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/comments/${commentId}/replies${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a reply to a video comment
 */
export function createCommentReply(commentId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/comments/${commentId}/replies`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Get all the credited users in a video
 */
export function getVideoCredits(videoId: number, { direction, page, perPage, query, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    query?: string;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/credits${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        query,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Credit a user in a video
 */
export function addVideoCredit(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/credits`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete the credit for a user in a video
 */
export function deleteVideoCredit(creditId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 400;
        data: LegacyError;
    }>(`/videos/${videoId}/credits/${creditId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific credited user in a video
 */
export function getVideoCredit(creditId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/credits/${creditId}`, {
        ...opts
    });
}
/**
 * Edit the credit for a user in a video
 */
export function editVideoCredit(creditId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/credits/${creditId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the users who have liked a video
 */
export function getVideoLikes(videoId: number, { direction, page, perPage, sort }: {
    direction?: "asc" | "desc";
    page?: number;
    perPage?: number;
    sort?: "alphabetical" | "date";
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/likes${QS.query(QS.form({
        direction,
        page,
        per_page: perPage,
        sort
    }))}`, {
        ...opts
    });
}
/**
 * Get all the thumbnails of a video
 */
export function getVideoThumbnails(videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/pictures${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a video thumbnail
 */
export function createVideoThumbnail(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/pictures`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a video thumbnail
 */
export function deleteVideoThumbnail(pictureId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/pictures/${pictureId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video thumbnail
 */
export function getVideoThumbnail(pictureId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/pictures/${pictureId}`, {
        ...opts
    });
}
/**
 * Edit a video thumbnail
 */
export function editVideoThumbnail(pictureId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/pictures/${pictureId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Remove an embed preset from a video
 */
export function deleteVideoEmbedPreset(presetId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/videos/${videoId}/presets/${presetId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if an embed preset has been added to a video
 */
export function getVideoEmbedPreset(presetId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/videos/${videoId}/presets/${presetId}`, {
        ...opts
    });
}
/**
 * Add an embed preset to a video
 */
export function addVideoEmbedPreset(presetId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/presets/${presetId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the domains on a video's whitelist
 */
export function getVideoPrivacyDomains(videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/privacy/domains${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Remove a domain from a video's whitelist
 */
export function deleteVideoPrivacyDomain(domain: string, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/videos/${videoId}/privacy/domains/${domain}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Add a domain to a video's whitelist
 */
export function addVideoPrivacyDomain(domain: string, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    }>(`/videos/${videoId}/privacy/domains/${domain}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the users who can view a private video
 */
export function getVideoPrivacyUsers(videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/privacy/users${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Permit a list of users to access a private video
 */
export function addVideoPrivacyUsers(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/privacy/users`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Restrict a user from viewing a private video
 */
export function deleteVideoPrivacyUser(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: LegacyError;
    } | {
        status: 404;
        data: LegacyError;
    }>(`/videos/${videoId}/privacy/users/${userId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Permit a specific user to access a private video
 */
export function addVideoPrivacyUser(userId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/privacy/users/${userId}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the tags of a video
 */
export function getVideoTags(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/tags`, {
        ...opts
    });
}
/**
 * Add a list of tags to a video
 */
export function addVideoTags(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/tags`, {
        ...opts,
        method: "PUT",
        body
    });
}
/**
 * Remove a tag from a video
 */
export function deleteVideoTag(videoId: number, word: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/tags/${word}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Check if a tag has been added to a video
 */
export function checkVideoForTag(videoId: number, word: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/tags/${word}`, {
        ...opts
    });
}
/**
 * Add a specific tag to a video
 */
export function addVideoTag(videoId: number, word: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/tags/${word}`, {
        ...opts,
        method: "PUT"
    });
}
/**
 * Get all the text tracks of a video
 */
export function getTextTracks(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/texttracks`, {
        ...opts
    });
}
/**
 * Add a text track to a video
 */
export function createTextTrack(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/texttracks`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a text track
 */
export function deleteTextTrack(texttrackId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/texttracks/${texttrackId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific text track
 */
export function getTextTrack(texttrackId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/texttracks/${texttrackId}`, {
        ...opts
    });
}
/**
 * Edit a text track
 */
export function editTextTrack(texttrackId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/texttracks/${texttrackId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Add a timeline event thumbnail to a video
 */
export function createVideoCustomLogo(videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/timelinethumbnails`, {
        ...opts,
        method: "POST"
    });
}
/**
 * Get a timeline event thumbnail
 */
export function getVideoCustomLogo(thumbnailId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/timelinethumbnails/${thumbnailId}`, {
        ...opts
    });
}
/**
 * Get all the versions of a video
 */
export function getVideoVersions(videoId: number, { page, perPage }: {
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/versions${QS.query(QS.form({
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
/**
 * Add a version to a video
 */
export function createVideoVersion(videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/versions`, {
        ...opts,
        method: "POST",
        body
    });
}
/**
 * Delete a video version
 */
export function deleteVideoVersion(versionId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/versions/${versionId}`, {
        ...opts,
        method: "DELETE"
    });
}
/**
 * Get a specific video version
 */
export function getVideoVersion(versionId: number, videoId: number, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/versions/${versionId}`, {
        ...opts
    });
}
/**
 * Edit a video version
 */
export function editVideoVersion(versionId: number, videoId: number, body: string, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/versions/${versionId}`, {
        ...opts,
        method: "PATCH",
        body
    });
}
/**
 * Get all the related videos of a video
 */
export function getRelatedVideos(videoId: number, { filter, page, perPage }: {
    filter?: "related";
    page?: number;
    perPage?: number;
} = {}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.fetchText(`/videos/${videoId}/videos${QS.query(QS.form({
        filter,
        page,
        per_page: perPage
    }))}`, {
        ...opts
    });
}
