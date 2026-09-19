const PAGE_SIZE = 1000

export async function fetchAllRows<T>(
  buildPage: (rangeFrom: number, rangeTo: number) => any
): Promise<T[]> {
  const all: T[] = []
  let from = 0

  for (;;) {
    const { data, error } = await buildPage(from, from + PAGE_SIZE - 1)
    if (error) throw error
    all.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return all
}