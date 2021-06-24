/**
 * A drop-in replacement for Promise.all, except you can specify a chunk size.
 * This way, you can chunk your requests so that you don't overwhelm the API.
 *
 * @METEORCITY_CANDIDATE
 * - maybe make "options" instead of passing the chunksize as a full parameter
 */
export async function PromiseAllSettledChunk<T>(
  ps: Promise<T>[],
  chunkSize: number = 25
): Promise<PromiseSettledResult<T>[]> {
  // split the array into chunks
  const pchunks: Promise<T>[][] = [];
  let cur = 0;
  while (cur < ps.length) {
    const chunk = ps.slice(cur, cur + chunkSize);
    pchunks.push(chunk);
    cur += chunkSize;
  }

  // asynchronously iterate through each chunk and add the results
  let allRes: PromiseSettledResult<T>[] = [];
  for (const chunk of pchunks) {
    const res = await Promise.allSettled(chunk);
    allRes = allRes.concat(res);
  }

  return allRes;
}
