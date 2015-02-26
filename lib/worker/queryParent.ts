/// Functions that the parent allows the child to query

export function echoNumWithModification(query: { num: number }): Promise<{ num: number }> {
    return Promise.resolve({ num: query.num + 10 });
}
