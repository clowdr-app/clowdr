import type { ButtonProps} from "@chakra-ui/react";
import { Button, Tooltip } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../Icons/FAIcon";
import { useChatConfiguration } from "../Configuration";
import { useChatSubscribedQuery } from "./SubscribedQuery";
import { useIntl } from "react-intl";

export function SubscribedButton(props: ButtonProps): JSX.Element {
    const intl = useIntl();
    const config = useChatConfiguration();
    const subscribedQ = useChatSubscribedQuery();
    const isLoading = subscribedQ.loading;
    const isSubscribed = !!subscribedQ.data?.isSubscribed;
    const label = isLoading
        ? intl.formatMessage({ id: 'chat.subscribe.subscribedbutton.loading', defaultMessage: "Loading subscribed status" })
        : isSubscribed
        ? intl.formatMessage({ id: 'chat.subscribe.subscribedbutton.unsubscribe', defaultMessage: "Unsubscribe from notifications for this chat" })
        : intl.formatMessage({ id: 'chat.subscribe.subscribedbutton.subscribe', defaultMessage: "Subscribe to notifications for this chat" });

    return subscribedQ.data?.allowedToUnsubscribe &&
        ((config.permissions.canSubscribe && !isSubscribed) || (config.permissions.canUnsubscribe && isSubscribed)) ? (
        <Tooltip label={label} fontSize={config.fontSizeRange.value}>
            <Button
                {...props}
                aria-label={label}
                onClick={() => {
                    subscribedQ.mutate?.(!isSubscribed);
                }}
                isLoading={isLoading}
                _disabled={{
                    opacity: 0.4,
                    cursor: "progress",
                }}
            >
                <FAIcon iconStyle={isSubscribed ? "s" : "r"} icon="bell" />
            </Button>
        </Tooltip>
    ) : (
        <></>
    );
}
