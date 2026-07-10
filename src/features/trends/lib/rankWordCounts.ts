export function rankWordCounts(
    wordCounts: Record<string, number>,
    limit = 10
): { ranked: [string, number][]; maxCount: number } {
    const ranked = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    return { ranked, maxCount: ranked[0]?.[1] ?? 1 };
}
