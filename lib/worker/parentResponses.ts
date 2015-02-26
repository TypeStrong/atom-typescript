/// Functions that the parent allows the child to query

export function plus1(query: { num: number }): Promise<{ num: number }> {
    return Promise.resolve({ num: query.num + 1 });
}
