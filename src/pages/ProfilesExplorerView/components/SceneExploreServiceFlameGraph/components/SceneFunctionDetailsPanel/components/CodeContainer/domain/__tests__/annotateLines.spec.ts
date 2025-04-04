import { annotateLines, annotatePlaceholderLines } from '../annotateLines';

describe('buildPlaceholderLineProfiles(callSitesMap)', () => {
  describe('if callSitesMap is empty', () => {
    it('returns an empty snippet and empty allLines array', () => {
      const result = annotatePlaceholderLines(new Map());
      expect(result).toEqual({
        snippetLines: [],
        allLines: [],
      });
    });
  });

  describe('if callSitesMap is not empty', () => {
    it('returns a snippet of annotated code lines', () => {
      const { snippetLines, allLines } = annotatePlaceholderLines(
        new Map([
          [12, { line: 12, flat: 0, cum: 40000000 }],
          [15, { line: 15, flat: 0, cum: 710000000 }],
          [11, { line: 11, flat: 0, cum: 30000000 }],
        ])
      );

      expect(snippetLines).toEqual([
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 6,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 7,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 8,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 9,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 10,
        },
        {
          cum: 30000000,
          flat: 0,
          line: undefined,
          number: 11,
        },
        {
          cum: 40000000,
          flat: 0,
          line: undefined,
          number: 12,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 13,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 14,
        },
        {
          cum: 710000000,
          flat: 0,
          line: undefined,
          number: 15,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 16,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 17,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 18,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 19,
        },
        {
          cum: 0,
          flat: 0,
          line: undefined,
          number: 20,
        },
      ]);

      expect(allLines).toEqual([]);
    });

    describe('when the lines contained in callSitesMap are smaller than the number of padded lines', () => {
      it('returns an array cropped properly', () => {
        const { snippetLines, allLines } = annotatePlaceholderLines(
          new Map([
            [2, { line: 2, flat: 0, cum: 40000000 }],
            [4, { line: 4, flat: 0, cum: 710000000 }],
            [1, { line: 1, flat: 0, cum: 30000000 }],
          ])
        );

        expect(snippetLines).toEqual([
          {
            cum: 30000000,
            flat: 0,
            line: undefined,
            number: 1,
          },
          {
            cum: 40000000,
            flat: 0,
            line: undefined,
            number: 2,
          },
          {
            cum: 0,
            flat: 0,
            line: undefined,
            number: 3,
          },
          {
            cum: 710000000,
            flat: 0,
            line: undefined,
            number: 4,
          },
          {
            cum: 0,
            flat: 0,
            line: undefined,
            number: 5,
          },
          {
            cum: 0,
            flat: 0,
            line: undefined,
            number: 6,
          },
          {
            cum: 0,
            flat: 0,
            line: undefined,
            number: 7,
          },
          {
            cum: 0,
            flat: 0,
            line: undefined,
            number: 8,
          },
          {
            cum: 0,
            flat: 0,
            line: undefined,
            number: 9,
          },
        ]);

        expect(allLines).toEqual([]);
      });
    });
  });
});

describe('buildLineProfiles(fileContent, callSitesMap', () => {
  describe('if callSitesMap is empty', () => {
    it('returns an empty snippet array', () => {
      const { snippetLines, allLines } = annotateLines('// this file is empty', new Map());
      expect(snippetLines).toEqual([]);
      expect(allLines).toEqual([
        {
          cum: 0,
          flat: 0,
          line: '// this file is empty',
          number: 1,
        },
      ]);
    });
  });

  describe('if callSitesMap is not empty', () => {
    const fileContent = `import { buildLineProfiles, buildPlaceholderLineProfiles } from '../buildLineProfiles';

describe('buildPlaceholderLineProfiles(callSitesMap)', () => {
    describe('if callSitesMap is empty', () => {
        it('returns an empty array', () => {
            const result = buildPlaceholderLineProfiles(new Map());
            expect(result).toEqual([]);
        });
    });

    describe('if callSitesMap is not empty', () => {
        it('returns an array containing samples/line info, sorted by line number and padded with extra lines', () => {
            const result = buildPlaceholderLineProfiles(
                new Map([
                [12, { line: 12, flat: 0, cum: 40000000 }],
                [15, { line: 15, flat: 0, cum: 710000000 }],
                [11, { line: 11, flat: 0, cum: 30000000 }],
                ])
            );

            expect(result).toMatchInlineSnapshot();
        });
    });
});`;

    it('returns an array containing samples/line info, sorted by line number and padded with extra lines', () => {
      const { snippetLines, allLines } = annotateLines(
        fileContent,
        new Map([
          [12, { line: 12, flat: 0, cum: 40000000 }],
          [15, { line: 15, flat: 0, cum: 710000000 }],
          [11, { line: 11, flat: 0, cum: 30000000 }],
        ])
      );

      expect(snippetLines).toEqual([
        {
          cum: 0,
          flat: 0,
          line: '            const result = buildPlaceholderLineProfiles(new Map());',
          number: 6,
        },
        {
          cum: 0,
          flat: 0,
          line: '            expect(result).toEqual([]);',
          number: 7,
        },
        {
          cum: 0,
          flat: 0,
          line: '        });',
          number: 8,
        },
        {
          cum: 0,
          flat: 0,
          line: '    });',
          number: 9,
        },
        {
          cum: 0,
          flat: 0,
          line: '',
          number: 10,
        },
        {
          cum: 30000000,
          flat: 0,
          line: "    describe('if callSitesMap is not empty', () => {",
          number: 11,
        },
        {
          cum: 40000000,
          flat: 0,
          line: "        it('returns an array containing samples/line info, sorted by line number and padded with extra lines', () => {",
          number: 12,
        },
        {
          cum: 0,
          flat: 0,
          line: '            const result = buildPlaceholderLineProfiles(',
          number: 13,
        },
        {
          cum: 0,
          flat: 0,
          line: '                new Map([',
          number: 14,
        },
        {
          cum: 710000000,
          flat: 0,
          line: '                [12, { line: 12, flat: 0, cum: 40000000 }],',
          number: 15,
        },
        {
          cum: 0,
          flat: 0,
          line: '                [15, { line: 15, flat: 0, cum: 710000000 }],',
          number: 16,
        },
        {
          cum: 0,
          flat: 0,
          line: '                [11, { line: 11, flat: 0, cum: 30000000 }],',
          number: 17,
        },
        {
          cum: 0,
          flat: 0,
          line: '                ])',
          number: 18,
        },
        {
          cum: 0,
          flat: 0,
          line: '            );',
          number: 19,
        },
        {
          cum: 0,
          flat: 0,
          line: '',
          number: 20,
        },
      ]);

      expect(allLines).toEqual([
        {
          cum: 0,
          flat: 0,
          line: "import { buildLineProfiles, buildPlaceholderLineProfiles } from '../buildLineProfiles';",
          number: 1,
        },
        {
          cum: 0,
          flat: 0,
          line: '',
          number: 2,
        },
        {
          cum: 0,
          flat: 0,
          line: "describe('buildPlaceholderLineProfiles(callSitesMap)', () => {",
          number: 3,
        },
        {
          cum: 0,
          flat: 0,
          line: "    describe('if callSitesMap is empty', () => {",
          number: 4,
        },
        {
          cum: 0,
          flat: 0,
          line: "        it('returns an empty array', () => {",
          number: 5,
        },
        {
          cum: 0,
          flat: 0,
          line: '            const result = buildPlaceholderLineProfiles(new Map());',
          number: 6,
        },
        {
          cum: 0,
          flat: 0,
          line: '            expect(result).toEqual([]);',
          number: 7,
        },
        {
          cum: 0,
          flat: 0,
          line: '        });',
          number: 8,
        },
        {
          cum: 0,
          flat: 0,
          line: '    });',
          number: 9,
        },
        {
          cum: 0,
          flat: 0,
          line: '',
          number: 10,
        },
        {
          cum: 30000000,
          flat: 0,
          line: "    describe('if callSitesMap is not empty', () => {",
          number: 11,
        },
        {
          cum: 40000000,
          flat: 0,
          line: "        it('returns an array containing samples/line info, sorted by line number and padded with extra lines', () => {",
          number: 12,
        },
        {
          cum: 0,
          flat: 0,
          line: '            const result = buildPlaceholderLineProfiles(',
          number: 13,
        },
        {
          cum: 0,
          flat: 0,
          line: '                new Map([',
          number: 14,
        },
        {
          cum: 710000000,
          flat: 0,
          line: '                [12, { line: 12, flat: 0, cum: 40000000 }],',
          number: 15,
        },
        {
          cum: 0,
          flat: 0,
          line: '                [15, { line: 15, flat: 0, cum: 710000000 }],',
          number: 16,
        },
        {
          cum: 0,
          flat: 0,
          line: '                [11, { line: 11, flat: 0, cum: 30000000 }],',
          number: 17,
        },
        {
          cum: 0,
          flat: 0,
          line: '                ])',
          number: 18,
        },
        {
          cum: 0,
          flat: 0,
          line: '            );',
          number: 19,
        },
        {
          cum: 0,
          flat: 0,
          line: '',
          number: 20,
        },
        {
          cum: 0,
          flat: 0,
          line: '            expect(result).toMatchInlineSnapshot();',
          number: 21,
        },
        {
          cum: 0,
          flat: 0,
          line: '        });',
          number: 22,
        },
        {
          cum: 0,
          flat: 0,
          line: '    });',
          number: 23,
        },
        {
          cum: 0,
          flat: 0,
          line: '});',
          number: 24,
        },
      ]);
    });

    describe('when the lines contained in callSitesMap are smaller than the number of padded lines', () => {
      it('returns an array cropped properly', () => {
        const { snippetLines, allLines } = annotateLines(
          fileContent,
          new Map([
            [2, { line: 2, flat: 0, cum: 40000000 }],
            [4, { line: 4, flat: 0, cum: 710000000 }],
            [1, { line: 1, flat: 0, cum: 30000000 }],
          ])
        );

        expect(snippetLines).toEqual([
          {
            cum: 30000000,
            flat: 0,
            line: "import { buildLineProfiles, buildPlaceholderLineProfiles } from '../buildLineProfiles';",
            number: 1,
          },
          {
            cum: 40000000,
            flat: 0,
            line: '',
            number: 2,
          },
          {
            cum: 0,
            flat: 0,
            line: "describe('buildPlaceholderLineProfiles(callSitesMap)', () => {",
            number: 3,
          },
          {
            cum: 710000000,
            flat: 0,
            line: "    describe('if callSitesMap is empty', () => {",
            number: 4,
          },
          {
            cum: 0,
            flat: 0,
            line: "        it('returns an empty array', () => {",
            number: 5,
          },
          {
            cum: 0,
            flat: 0,
            line: '            const result = buildPlaceholderLineProfiles(new Map());',
            number: 6,
          },
          {
            cum: 0,
            flat: 0,
            line: '            expect(result).toEqual([]);',
            number: 7,
          },
          {
            cum: 0,
            flat: 0,
            line: '        });',
            number: 8,
          },
          {
            cum: 0,
            flat: 0,
            line: '    });',
            number: 9,
          },
        ]);

        expect(allLines).toEqual([
          {
            cum: 30000000,
            flat: 0,
            line: "import { buildLineProfiles, buildPlaceholderLineProfiles } from '../buildLineProfiles';",
            number: 1,
          },
          {
            cum: 40000000,
            flat: 0,
            line: '',
            number: 2,
          },
          {
            cum: 0,
            flat: 0,
            line: "describe('buildPlaceholderLineProfiles(callSitesMap)', () => {",
            number: 3,
          },
          {
            cum: 710000000,
            flat: 0,
            line: "    describe('if callSitesMap is empty', () => {",
            number: 4,
          },
          {
            cum: 0,
            flat: 0,
            line: "        it('returns an empty array', () => {",
            number: 5,
          },
          {
            cum: 0,
            flat: 0,
            line: '            const result = buildPlaceholderLineProfiles(new Map());',
            number: 6,
          },
          {
            cum: 0,
            flat: 0,
            line: '            expect(result).toEqual([]);',
            number: 7,
          },
          {
            cum: 0,
            flat: 0,
            line: '        });',
            number: 8,
          },
          {
            cum: 0,
            flat: 0,
            line: '    });',
            number: 9,
          },
          {
            cum: 0,
            flat: 0,
            line: '',
            number: 10,
          },
          {
            cum: 0,
            flat: 0,
            line: "    describe('if callSitesMap is not empty', () => {",
            number: 11,
          },
          {
            cum: 0,
            flat: 0,
            line: "        it('returns an array containing samples/line info, sorted by line number and padded with extra lines', () => {",
            number: 12,
          },
          {
            cum: 0,
            flat: 0,
            line: '            const result = buildPlaceholderLineProfiles(',
            number: 13,
          },
          {
            cum: 0,
            flat: 0,
            line: '                new Map([',
            number: 14,
          },
          {
            cum: 0,
            flat: 0,
            line: '                [12, { line: 12, flat: 0, cum: 40000000 }],',
            number: 15,
          },
          {
            cum: 0,
            flat: 0,
            line: '                [15, { line: 15, flat: 0, cum: 710000000 }],',
            number: 16,
          },
          {
            cum: 0,
            flat: 0,
            line: '                [11, { line: 11, flat: 0, cum: 30000000 }],',
            number: 17,
          },
          {
            cum: 0,
            flat: 0,
            line: '                ])',
            number: 18,
          },
          {
            cum: 0,
            flat: 0,
            line: '            );',
            number: 19,
          },
          {
            cum: 0,
            flat: 0,
            line: '',
            number: 20,
          },
          {
            cum: 0,
            flat: 0,
            line: '            expect(result).toMatchInlineSnapshot();',
            number: 21,
          },
          {
            cum: 0,
            flat: 0,
            line: '        });',
            number: 22,
          },
          {
            cum: 0,
            flat: 0,
            line: '    });',
            number: 23,
          },
          {
            cum: 0,
            flat: 0,
            line: '});',
            number: 24,
          },
        ]);
      });
    });
  });
});
