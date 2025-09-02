export const markdownSamples = {
    simple: 'Hello world',
    withBold: '**bold text** and normal text',
    withItalic: '*italic text* and normal text',
    withCode: '`code text` and normal text',
    withLinks: '[GitHub](https://github.com) is great',
    withLists: '- Item 1\n- Item 2\n- Item 3',
    numberedLists: '1. First item\n2. Second item\n3. Third item',
    mixedLists: '- Item 1\n1. Item 2\n- Item 3',
    mixed: '# Title\n\n**Bold** text with [link](url) and:\n- List item\n- Another item',
    nestedFormatting: '**bold with *italic* inside**',
    multipleLinks: '[First](url1) and [Second](url2) links',
    emptyLines: 'Line 1\n\nLine 3',
    complexFormatting: '## Header\n\nSome **bold** and *italic* text with `code` and [links](https://example.com).\n\n- Bullet point\n- Another point\n\n1. Numbered item\n2. Another numbered item'
};

export const selectionScenarios = {
    noSelection: { start: 0, end: 0 },
    wordSelection: { start: 0, end: 5 },
    multiWordSelection: { start: 0, end: 11 },
    partialWordSelection: { start: 2, end: 8 },
    lineSelection: { start: 0, end: 15 },
    multiLineSelection: { start: 0, end: 25 }
};

export const expectedResults = {
    boldSimple: '**Hello world**',
    italicSimple: '*Hello world*',
    codeSimple: '`Hello world`',
    linkSimple: '[Hello world](url)',
    listSimple: '- Hello world'
};
