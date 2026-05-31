export function formatRupees(v: number): string {
  const [int, dec] = v.toFixed(2).split('.');
  let result = '';
  const len = int.length;
  for (let i = 0; i < len; i++) {
    if (i > 0) {
      const fromRight = len - i;
      if (fromRight === 3 || (fromRight > 3 && (fromRight - 3) % 2 === 0)) result += ',';
    }
    result += int[i];
  }
  return `₹${result}.${dec}`;
}

export function formatDate(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export async function shareText(text: string): Promise<void> {
  if (navigator.share) {
    await navigator.share({ text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}
