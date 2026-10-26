/** Last user-perceived character, including skin tone and ZWJ sequences. */
export function lastGrapheme(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  let last = '';
  for (const { segment } of segmenter.segment(trimmed)) last = segment;
  return last;
}
