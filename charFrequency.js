export function letterFrequency(str) {
  const freq = {};
  const cleaned = str.toLowerCase();

  for (const char of cleaned) {
    if (/[a-z]/.test(char)) { // only count letters
      freq[char] = (freq[char] || 0) + 1;
    }
  }

  return freq;
}
