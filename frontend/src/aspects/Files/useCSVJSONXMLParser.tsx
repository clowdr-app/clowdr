import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import Xml2JS from "xml-js";
import type { ImportOptions } from "./useCSVJSONXMLImportOptions";

export type ParsedData<T> =
    | {
          fileName: string;
          data: T;
      }
    | {
          fileName: string;
          error: string;
      };

export type ParserResult<T> =
    | {
          ok: true;
          data: T;
      }
    | { ok: false; error: string };

export type Parser<T> = (data: any) => ParserResult<T>;

async function parseFile<T>(options: ImportOptions, parser: Parser<T>): Promise<ParsedData<T>> {
    try {
        const buf = await options.file.arrayBuffer();
        const decoder = new TextDecoder(options.encoding, { fatal: true });
        const str = decoder.decode(buf);

        let data: any;
        switch (options.type) {
            case "CSV":
                {
                    const csvParsed = Papa.parse(str, {
                        delimiter: options.delimiter,
                        encoding: options.encoding,
                        escapeChar: options.escapeChar,
                        quoteChar: options.quoteChar,
                        header: options.hasHeaders,
                        skipEmptyLines: true,
                        trimHeaders: true,
                    });
                    if (csvParsed.errors.length) {
                        return {
                            fileName: options.file.name,
                            error: csvParsed.errors.reduce((acc, err) => `${acc}; ${err}`, ""),
                        };
                    } else {
                        data = csvParsed.data;
                    }
                }
                break;
            case "JSON":
                data = JSON.parse(str);
                break;
            case "XML":
                {
                    const xmlParsed: Xml2JS.ElementCompact = Xml2JS.xml2js(str, {
                        compact: true,
                        ignoreComment: true,
                        ignoreCdata: true,
                        ignoreDeclaration: true,
                        ignoreDoctype: true,
                        trim: true,
                        nativeType: true,
                        addParent: false,
                    });
                    const ignoreKeys = [
                        "_declaration",
                        "_instruction",
                        "_attributes",
                        "_cdata",
                        "_doctype",
                        "_comment",
                        "_text",
                    ];
                    data = [];
                    for (const key in xmlParsed) {
                        if (!ignoreKeys.includes(key)) {
                            data.push(xmlParsed[key]);
                        }
                    }
                    if (data.length === 1) {
                        data = data[0];
                    } else if (data.length === 0) {
                        return {
                            fileName: options.file.name,
                            error: "Failed to parse data.",
                        };
                    }
                }
                break;
        }

        const parsed = parser(data);
        if (parsed.ok) {
            return {
                fileName: options.file.name,
                data: parsed.data,
            };
        } else {
            return {
                fileName: options.file.name,
                error: parsed.error,
            };
        }
    } catch (e) {
        return {
            fileName: options.file.name,
            error: e.message,
        };
    }
}

export default function useCSVJSONXMLParse<T>(
    options: ImportOptions[],
    parser: Parser<T>
): {
    data: ParsedData<T>[] | undefined;
} {
    const [data, setData] = useState<ParsedData<T>[]>();

    useEffect(() => {
        (async () => {
            const result = await Promise.all(options.map((x) => parseFile(x, parser)));
            setData(result);
        })();
    }, [options, parser]);

    return useMemo(
        () => ({
            data,
        }),
        [data]
    );
}
