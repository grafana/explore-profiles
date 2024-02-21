import { Field, Message } from 'protobufjs/light';

export class PprofRequest extends Message<PprofRequest> {
    constructor(
        profile_typeID: string,
        label_selector: string,
        start: number,
        end: number
    ) {
        super();
        this.profile_typeID = profile_typeID;
        this.label_selector = label_selector;
        this.start = start;
        this.end = end;
    }

    @Field.d(1, 'string')
    profile_typeID: string;

    @Field.d(2, 'string')
    label_selector: string;

    @Field.d(3, 'int64')
    start: number;

    @Field.d(4, 'int64')
    end: number;
}
