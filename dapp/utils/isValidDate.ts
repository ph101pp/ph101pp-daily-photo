export function isValidDate(tokenId?: string) {
  if (!tokenId) {
    return false;
  }
  const year = parseInt(tokenId.slice(0, 4));
  const month = parseInt(tokenId.slice(4, 6)) - 1;
  const day = parseInt(tokenId.slice(6, 8));

  const date = new Date(Date.UTC(year, month, day, 11, 0, 0));

  return !isNaN(date as any) &&
    date.getTime() / 1000 >= 1661990400 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day;
}