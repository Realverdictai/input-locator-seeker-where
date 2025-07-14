export async function analyzeDamageMedia(files: File[]): Promise<number> {
  if (files.length === 0) return 0;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const avgSize = totalSize / files.length;
  // Very naive heuristic: scale average file size to 0-10 score
  const score = Math.min(10, Math.round(avgSize / 500000));
  return score;
}
