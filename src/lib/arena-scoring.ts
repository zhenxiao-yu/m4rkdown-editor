export interface ScoreInput {
  netWpm: number;
  accuracy: number;        // 0–100
  timeMs: number;
  promptEstimatedWords: number;
}

export function calculateScore(input: ScoreInput): number {
  const { netWpm, accuracy, timeMs, promptEstimatedWords } = input;
  const maxTimeMs = (promptEstimatedWords / 40) * 60_000 * 2;

  const speedBonus   = Math.min(netWpm / 100, 1) * 500;
  const accuracyMult = Math.pow(accuracy / 100, 2);
  const timeBonus    = Math.max(0, Math.min(1 - timeMs / maxTimeMs, 1)) * 200;

  return Math.round((1000 + speedBonus + timeBonus) * accuracyMult);
}

export function calculateWpm(typedChars: number, elapsedMs: number): number {
  if (elapsedMs < 500) return 0;
  return Math.round((typedChars / 5) / (elapsedMs / 60_000));
}

export function calculateAccuracy(typed: string, prompt: string): number {
  if (typed.length === 0) return 100;
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === prompt[i]) correct++;
  }
  return Math.round((correct / typed.length) * 100);
}
