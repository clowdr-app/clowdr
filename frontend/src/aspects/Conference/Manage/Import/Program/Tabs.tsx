import { TabList, TabPanel, TabPanels, Tabs, Text, VStack } from "@chakra-ui/react";
import type { DataWithValidation, RawRecord, ValidatedData } from "@midspace/shared-types/import/program";
import type { ProgramImportOptions } from "@midspace/shared-types/import/programImportOptions";
import React, { Fragment, useEffect, useState } from "react";
import type { ImportJobFragment } from "../../../../../generated/graphql";
import Card from "../../../../Card";
import { Markdown } from "../../../../Chakra/Markdown";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import extractActualError from "../../../../GQL/ExtractActualError";
import FixIssuesStep from "./Steps/FixIssuesStep";
import ReviewDataStep from "./Steps/ReviewDataStep";
import SelectFileStep from "./Steps/SelectFileStep";
import StartImportStep from "./Steps/StartImportStep";
import Tab from "./Tab";

export default function ImportProgramTabs({
    job,
    jobJustStarted,
    onStartImport,
}: {
    job: ImportJobFragment | undefined;
    jobJustStarted: boolean;
    onStartImport: (data: ParsedData<ValidatedData>[], options: ProgramImportOptions) => Promise<void>;
}): JSX.Element {
    const [tab, setTab] = useState<number>(0);
    const [rawData, setRawData] = useState<ParsedData<RawRecord[]>[] | undefined>();
    const [repairedData, setRepairedData] = useState<ParsedData<DataWithValidation>[] | undefined>();
    const [validatedData, setValidatedData] = useState<ParsedData<ValidatedData>[] | undefined>();

    const [step1CanProceed, setStep1CanProceed] = useState<boolean>(false);
    const [step2CanProceed, setStep2CanProceed] = useState<boolean>(false);
    const [step3CanProceed, setStep3CanProceed] = useState<boolean>(false);
    const [step4CanProceed, setStep4CanProceed] = useState<boolean>(false);
    const [step5CanProceed, setStep5CanProceed] = useState<boolean>(false);

    const isOngoingImport = jobJustStarted || Boolean(job && !job.completed_at);
    const isCompletedImport = !jobJustStarted && Boolean(job?.completed_at);
    useEffect(() => {
        if (isOngoingImport) {
            setTab(4);
        } else if (isCompletedImport) {
            setTab((old) => (old !== 0 ? 5 : old));
        }

        setStep5CanProceed(isCompletedImport);
    }, [isOngoingImport, isCompletedImport]);

    return (
        <Tabs index={tab} onChange={setTab} variant="line">
            <TabList>
                <Tab
                    colorScheme="PrimaryActionButton"
                    selectedColor="PrimaryActionButton.textColor"
                    isStart
                    isDisabled={isOngoingImport}
                >
                    Select file
                </Tab>
                <Tab
                    colorScheme="PrimaryActionButton"
                    selectedColor="PrimaryActionButton.textColor"
                    isDisabled={isOngoingImport || !step1CanProceed}
                >
                    Fix issues
                </Tab>
                <Tab
                    colorScheme="PrimaryActionButton"
                    selectedColor="PrimaryActionButton.textColor"
                    isDisabled={isOngoingImport || !step1CanProceed || !step2CanProceed}
                >
                    Review data
                </Tab>
                <Tab
                    colorScheme="PrimaryActionButton"
                    selectedColor="PrimaryActionButton.textColor"
                    isDisabled={isOngoingImport || !step1CanProceed || !step2CanProceed || !step3CanProceed}
                >
                    Start import
                </Tab>
                <Tab
                    colorScheme="PrimaryActionButton"
                    selectedColor="PrimaryActionButton.textColor"
                    isDisabled={!jobJustStarted && !isOngoingImport && !step4CanProceed}
                >
                    Wait
                </Tab>
                <Tab
                    colorScheme="PrimaryActionButton"
                    selectedColor="PrimaryActionButton.textColor"
                    isEnd
                    isDisabled={(!isOngoingImport && !job) || !step5CanProceed}
                >
                    Complete
                </Tab>
            </TabList>
            <TabPanels>
                <TabPanel>
                    <SelectFileStep
                        onNextStep={() => setTab((tab) => tab + 1)}
                        onData={setRawData}
                        onCanProceedChange={setStep1CanProceed}
                    />
                </TabPanel>
                <TabPanel>
                    <FixIssuesStep
                        onPreviousStep={() => setTab((tab) => tab - 1)}
                        onNextStep={() => setTab((tab) => tab + 1)}
                        data={rawData}
                        onRepairedData={setRepairedData}
                        isActive={tab >= 1}
                        onCanProceedChange={setStep2CanProceed}
                    />
                </TabPanel>
                <TabPanel>
                    <ReviewDataStep
                        onPreviousStep={() => setTab((tab) => tab - 1)}
                        onNextStep={() => setTab((tab) => tab + 1)}
                        data={repairedData}
                        onValidatedData={setValidatedData}
                        isActive={tab >= 2}
                        onCanProceedChange={setStep3CanProceed}
                    />
                </TabPanel>
                <TabPanel>
                    <StartImportStep
                        onPreviousStep={() => setTab((tab) => tab - 1)}
                        onNextStep={() => setTab((tab) => tab + 1)}
                        data={validatedData}
                        isActive={tab >= 3}
                        onCanProceedChange={setStep4CanProceed}
                        isOngoingImport={isOngoingImport}
                        onStartImport={(data, options) => {
                            setTab(4);
                            return onStartImport(data, options);
                        }}
                    />
                </TabPanel>
                <TabPanel>
                    <Text>Status: {job?.status ?? (jobJustStarted ? "Starting" : "Unknown")}</Text>
                    {jobJustStarted ? (
                        ""
                    ) : (
                        <>
                            <Text>
                                Progress: {job?.progress ?? "Unknown"} / {job?.progressMaximum ?? "Unknown"}
                            </Text>
                            <Text>Errors: {!job?.errors?.length ? "None" : job.errors.length}</Text>
                            {!job?.errors?.length ? "" : <ErrorList errors={job.errors} />}
                        </>
                    )}
                </TabPanel>
                <TabPanel>
                    <Text>Final status: {job?.status ?? "Unknown"}</Text>
                    <Text>
                        Recorded progress: {job?.progress ?? "Unknown"} / {job?.progressMaximum ?? "Unknown"}
                    </Text>
                    <Text>Errors: {!job?.errors?.length ? "None" : job.errors.length}</Text>
                    {!job?.errors?.length ? "" : <ErrorList errors={job.errors} />}
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}

function ErrorList({ errors }: { errors: any[] }): JSX.Element {
    return (
        <VStack spacing={4} alignItems="flex-start" mt={4}>
            {errors.map((error, idx) => {
                try {
                    const message = JSON.parse(error.message);
                    if (message.name === "TypeGuardError") {
                        const heading = "Import data does not match required format.";

                        const fileIndex = parseInt(message.path[5].substring(1, message.path[5].length - 1), 10);
                        const isSession = message.path[7] === "sessions";
                        const sessionIndex = parseInt(message.path[8].substring(1, message.path[8].length - 1), 10);
                        const subheading = `File ${fileIndex}, ${isSession ? "Session" : "Exhibition"} ${sessionIndex}`;

                        const body =
                            message.path[9] === "event" || message.path[9] === "content"
                                ? `The issue is with the following ${isSession ? "session" : "exhibition"} column: ${(
                                      message.path as string[]
                                  )
                                      .slice(10)
                                      .reduce((acc, x) => `${acc} → ${x}`, "")
                                      .substring(3)}`
                                : `The issue is with the following ${isSession ? "presentation" : "item"}: ${(
                                      message.path as string[]
                                  )
                                      .slice(10)
                                      .reduce((acc, x) => `${acc} → ${x}`, "")
                                      .substring(3)}`;

                        return (
                            <Card key={idx} heading={heading} subHeading={subheading} userSelect="text">
                                <Text>{body}</Text>
                            </Card>
                        );
                    } else {
                        const errorString =
                            (typeof message.error === "object" ? extractActualError(message.error) : undefined) ??
                            message.errorString ??
                            message.error?.toString() ??
                            "Unknown error";
                        if (errorString.includes("Unable to retrieve job output")) {
                            return <Fragment key={idx}></Fragment>;
                        }

                        return (
                            <Card
                                key={idx}
                                heading={errorString}
                                subHeading={message.data?.outputs[0]?.outputName ?? "For unknown output"}
                                userSelect="text"
                            >
                                <Markdown>{"```json\n" + JSON.stringify(message.data, null, 2) + "\n```"}</Markdown>
                            </Card>
                        );
                    }
                } catch {
                    const message: string = error.message;
                    const newlineIdx = message.indexOf("\n");
                    return (
                        <Card
                            key={idx}
                            heading={newlineIdx >= 0 ? message.substring(0, newlineIdx) : message}
                            userSelect="text"
                        >
                            <Markdown>{newlineIdx >= 0 ? message.substring(newlineIdx) : ""}</Markdown>
                        </Card>
                    );
                }
            })}
        </VStack>
    );
}
