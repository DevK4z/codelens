// The tutor's own language understanding: a multinomial Naive Bayes classifier trained in the
// browser on the example questions in intents.ts. No external model or service is involved.

// Lowercase, strip Vietnamese diacritics (so "vi sao" and "vì sao" are the same) and punctuation.
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
    .replace(/[^a-z0-9_\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Words plus adjacent word pairs: "vi sao" carries meaning that "vi" and "sao" alone do not.
export function features(text: string): string[] {
  const words = normalize(text).split(' ').filter(Boolean);
  return [...words, ...words.slice(1).map((w, i) => `${words[i]}_${w}`)];
}

export interface Prediction<L extends string> { label: L; confidence: number; ranking: { label: L; p: number }[] }

export class NaiveBayes<L extends string> {
  private counts = new Map<L, Map<string, number>>();
  private totals = new Map<L, number>();
  private docs = new Map<L, number>();
  private vocabulary = new Set<string>();
  private documents = 0;

  train(examples: Record<L, string[]>): this {
    for (const [label, texts] of Object.entries(examples) as [L, string[]][]) {
      for (const text of texts) {
        const counts = this.counts.get(label) ?? new Map<string, number>();
        for (const f of features(text)) {
          counts.set(f, (counts.get(f) ?? 0) + 1);
          this.totals.set(label, (this.totals.get(label) ?? 0) + 1);
          this.vocabulary.add(f);
        }
        this.counts.set(label, counts);
        this.docs.set(label, (this.docs.get(label) ?? 0) + 1);
        this.documents++;
      }
    }
    return this;
  }

  predict(text: string): Prediction<L> {
    // Unknown words carry no evidence; a question made only of them gets a flat, low-confidence result.
    const known = features(text).filter(f => this.vocabulary.has(f));
    const v = this.vocabulary.size;
    const logs = [...this.counts.keys()].map(label => {
      const counts = this.counts.get(label)!, total = this.totals.get(label)!;
      let score = Math.log(this.docs.get(label)! / this.documents);
      for (const f of known) score += Math.log(((counts.get(f) ?? 0) + 1) / (total + v));
      return { label, score };
    });
    const max = Math.max(...logs.map(l => l.score));
    const sum = logs.reduce((s, l) => s + Math.exp(l.score - max), 0);
    const ranking = logs.map(l => ({ label: l.label, p: Math.exp(l.score - max) / sum })).sort((a, b) => b.p - a.p);
    return { label: ranking[0].label, confidence: known.length ? ranking[0].p : 0, ranking };
  }
}
