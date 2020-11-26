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
import { useHistory } from "react-router-dom";
import FAIcon from "../../Icons/FAIcon";
import { setCachedInviteCode } from "./InviteCodeLocalStorage";

export default function InviteCodeInput(props: any): JSX.Element {
    const [inviteCode, setInviteCode] = useState<string>("");
    const inviteCodeButtonRef = useRef<HTMLButtonElement>(null);
    const isInviteCodeValid = !!inviteCode.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    const history = useHistory();

    useEffect(() => {
        if (isInviteCodeValid) {
            inviteCodeButtonRef.current?.focus();
        }
    }, [isInviteCodeValid]);

    return (
        <form
            onSubmit={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();

                if (isInviteCodeValid) {
                    setCachedInviteCode(inviteCode);
                    history.push("/invitation/accept");
                }
            }}
        >
            <FormControl width="auto" {...props}>
                <FormLabel
                    fontSize="100%"
                    fontWeight="normal"
                    htmlFor="invite-code"
                    textAlign="center"
                    marginRight={0}
                >
                    Enter an invite code to begin.
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
                                isInvalid={
                                    inviteCode.length > 0 && !isInviteCodeValid
                                }
                                focusBorderColor={
                                    inviteCode.length > 0 && isInviteCodeValid
                                        ? "green.200"
                                        : undefined
                                }
                                borderColor={
                                    inviteCode.length > 0 && isInviteCodeValid
                                        ? "green.200"
                                        : undefined
                                }
                                value={inviteCode}
                                onChange={(ev) =>
                                    setInviteCode(ev.target.value)
                                }
                                _placeholder={{
                                    color: "red",
                                }}
                            />
                            <InputRightElement>
                                {inviteCode.length > 0 ? (
                                    <FAIcon
                                        iconStyle="s"
                                        icon={
                                            isInviteCodeValid
                                                ? "check"
                                                : "times"
                                        }
                                        color={
                                            isInviteCodeValid
                                                ? "green.200"
                                                : "red.300"
                                        }
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
                                colorScheme="green"
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
