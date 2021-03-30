import { Injectable } from "@nestjs/common";
import * as R from "ramda";

@Injectable()
export class CloudFormationService {
    public parseCloudFormationEvent(message: string): { [key: string]: string } {
        const rawPairs = message.replace(/\r/g, "").split(/\n/);
        const pairs = rawPairs.map<[key: string, value: string]>((pair) => {
            const idxEquals = pair.indexOf("=");
            const key = pair.substring(0, idxEquals);
            const value = pair.slice(idxEquals + 2, -1);
            return [key, value];
        });
        return R.fromPairs(pairs);
    }
}
