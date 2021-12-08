import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Checkbox,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    HStack,
    Link,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import type { FieldProps } from "formik";
import { Field } from "formik";
import React from "react";
import FAIcon from "../../Chakra/FAIcon";

export default function UploadAgreementField({
    uploadAgreementText,
    uploadAgreementUrl,
}: {
    uploadAgreementText?: string;
    uploadAgreementUrl?: string;
}): JSX.Element {
    const color = useColorModeValue("black", "white");

    return uploadAgreementText || uploadAgreementUrl ? (
        <Field
            name="agree"
            validate={(inValue: string | null | undefined) => {
                let error;
                if (!inValue) {
                    error = "Please agree to the upload conditions.";
                }
                return error;
            }}
        >
            {({ form, field }: FieldProps<string>) => (
                <FormControl isInvalid={!!form.errors.agree && !!form.touched.agree} isRequired mb={4}>
                    <FormLabel htmlFor="agree" fontWeight="bold">
                        Submission agreement
                    </FormLabel>
                    {uploadAgreementUrl ? (
                        <Text mb={1}>
                            <FAIcon iconStyle="s" icon="link" fontSize="sm" mr={2} mb={1} verticalAlign="middle" />
                            Read the agreement at:{" "}
                            <Link isExternal href={uploadAgreementUrl}>
                                {uploadAgreementUrl}
                                <ExternalLinkIcon />
                            </Link>
                        </Text>
                    ) : undefined}
                    {uploadAgreementText ? <Text>{uploadAgreementText}</Text> : undefined}
                    <HStack mt={4}>
                        <Checkbox {...field} id="agree" />
                        <FormHelperText color={color}>I agree to the upload conditions.</FormHelperText>
                    </HStack>

                    <FormErrorMessage>{form.errors.agree}</FormErrorMessage>
                </FormControl>
            )}
        </Field>
    ) : (
        <></>
    );
}
