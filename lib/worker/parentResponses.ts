/// Functions that the parent allows the child to query

export function plus1(query: { num: number }): { num: number } {
    return { num: query.num + 1 };
}