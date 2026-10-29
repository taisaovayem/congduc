export function addMerit(current: string, delta: number | bigint): string {
  const next = BigInt(current) + BigInt(delta);
  if (next < 0n) {
    throw new Error('Merit balance cannot be negative');
  }
  return next.toString();
}

export function subtractMerit(current: string, amount: string): string {
  const next = BigInt(current) - BigInt(amount);
  if (next < 0n) {
    throw new Error('Merit balance cannot be negative');
  }
  return next.toString();
}

export function parseMerit(value: string): bigint {
  return BigInt(value);
}
