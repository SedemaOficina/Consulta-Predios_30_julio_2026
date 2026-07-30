export const processGroupedData = (items) => {
    if (!items || !items.length) return [];
    // Sort by General Activity to ensure adjacency
    const sorted = [...items].sort((a, b) => (a.general || '').localeCompare(b.general || ''));

    const resultRows = [];

    for (let i = 0; i < sorted.length; i++) {
        const gen = sorted[i].general || '';
        const spec = sorted[i].specific || '';

        // Look ahead to count identicals
        if (i === 0 || gen !== (sorted[i - 1].general || '')) {
            // New Group
            let count = 1;
            for (let j = i + 1; j < sorted.length; j++) {
                if ((sorted[j].general || '') === gen) count++;
                else break;
            }
            // Push First Row of Group
            resultRows.push([
                { content: gen, rowSpan: count, styles: { valign: 'middle', fontStyle: 'bold' } },
                spec
            ]);
        } else {
            // Subsequent row of same group
            resultRows.push([spec]);
        }
    }
    return resultRows;
};
