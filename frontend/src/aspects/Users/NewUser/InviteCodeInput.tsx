import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    InputGroup,
    InputRightAddon,
    InputRightElement,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import FAIcon from "../../Icons/FAIcon";
import isValidUUID from "../../Utils/isValidUUID";
import { getCachedInviteCode, setCachedInviteCode } from "./InviteCodeLocalStorage";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function InviteCodeInput({
    message = "Enter an invite code to join a conference.",
    marginBottom,
}: {
    message?: string;
    marginBottom?: string;
}): JSX.Element {
    const [inviteCode, setInviteCode] = useState<string>("");
    const inviteCodeButtonRef = useRef<HTMLButtonElement>(null);
    const isInviteCodeValid = isValidUUID(inviteCode);
    const history = useHistory();

    useEffect(() => {
        if (isInviteCodeValid) {
            inviteCodeButtonRef.current?.focus();
        }
    }, [isInviteCodeValid]);

    const cachedInviteCode = getCachedInviteCode();
    if (cachedInviteCode) {
        setCachedInviteCode(null);
        return <Redirect to={`/invitation/accept/${cachedInviteCode}`} />;
    }

    return (
        <form
            onSubmit={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();

                if (isInviteCodeValid) {
                    history.push(`/invitation/accept/${inviteCode}`);
                }
            }}
        >
            <FormControl width="auto" marginBottom={marginBottom}>
                <FormLabel fontSize="100%" fontWeight="normal" htmlFor="invite-code" textAlign="center" marginRight={0}>
                    {message}
                </FormLabel>
                <Box>
                    <InputGroup>
                        <InputGroup>
                            <Input
                                id="invite-code"
                                type="text"
                                placeholder="00000000-..."
                                borderTopRightRadius={0}
                                borderBottomRightRadius={0}
                                aria-label="Enter your invite code"
                                isInvalid={inviteCode.length > 0 && !isInviteCodeValid}
                                focusBorderColor={inviteCode.length > 0 && isInviteCodeValid ? "purple.200" : undefined}
                                borderColor={inviteCode.length > 0 && isInviteCodeValid ? "purple.200" : undefined}
                                value={inviteCode}
                                onChange={(ev) => setInviteCode(ev.target.value)}
                                _placeholder={{
                                    color: "red",
                                }}
                            />
                            <InputRightElement>
                                {inviteCode.length > 0 ? (
                                    <FAIcon
                                        iconStyle="s"
                                        icon={isInviteCodeValid ? "check" : "times"}
                                        color={isInviteCodeValid ? "purple.200" : "red.300"}
                                    />
                                ) : undefined}
                            </InputRightElement>
                        </InputGroup>
                        <InputRightAddon padding={0}>
                            <Button
                                type="submit"
                                margin={0}
                                borderTopLeftRadius={0}
                                borderBottomLeftRadius={0}
                                aria-label="Use invite code"
                                isDisabled={!isInviteCodeValid}
                                colorScheme="purple"
                                ref={inviteCodeButtonRef}
                            >
                                Use invite code
                            </Button>
                        </InputRightAddon>
                    </InputGroup>
                </Box>
            </FormControl>
        </form>
    );
}
