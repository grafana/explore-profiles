import { FieldType, MutableDataFrame } from '@grafana/data';

export class RangeAnnotation extends MutableDataFrame {
  constructor() {
    super();
    [
      {
        name: 'time',
        type: FieldType.time,
      },
      {
        name: 'timeEnd',
        type: FieldType.time,
      },
      {
        name: 'isRegion',
        type: FieldType.boolean,
      },
      {
        name: 'color',
        type: FieldType.other,
      },
      {
        name: 'text',
        type: FieldType.string,
      },
    ].forEach((field) => this.addField(field));
  }

  addRange(entry: { time: number; timeEnd: number; color?: string; text: string }) {
    this.add({ ...entry, isRegion: true });
  }
}
