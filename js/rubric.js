function evaluateWriting(paragraphs, soliloquyText) {
  const results = [];
  const lowerText = soliloquyText.toLowerCase();
  const lines = soliloquyText.split("\n").map(l => l.trim().toLowerCase()).filter(Boolean);

  const lensKeywords = {
    personal: {
      strong: ["personally", "my own", "i feel", "i felt", "my experience", "my life", "reminds me", "i relate", "i connect", "i identify", "i recognize", "strikes me", "moves me", "resonates with me", "in my own"],
      weak: ["i ", "my ", "me "]
    },
    discursive: {
      strong: ["metaphor", "imagery", "literary", "shakespeare", "device", "symbol", "theme", "motif", "soliloquy", "dramatic", "irony", "alliteration", "repetition", "structure", "craft", "diction", "tone", "literature", "tragic", "character development", "literary technique", "poetic"],
      weak: ["language", "character"]
    },
    global: {
      strong: ["society", "universal", "politic", "history", "culture", "modern", "global", "ethic", "justice", "humanity", "nation", "govern", "leader", "the world", "across time", "relevant today", "human condition", "social", "collective"],
      weak: ["world", "human", "power", "moral", "today", "relevant"]
    }
  };

  const lensNames = ["personal", "discursive", "global"];
  const lensDetected = [false, false, false];

  for (let i = 0; i < 3; i++) {
    if (i < paragraphs.length) {
      const p = paragraphs[i].toLowerCase();
      const lens = lensKeywords[lensNames[i]];
      const strongMatches = lens.strong.filter(k => p.includes(k)).length;
      const weakMatches = lens.weak.filter(k => p.includes(k)).length;
      lensDetected[i] = strongMatches >= 1 || (strongMatches + weakMatches >= 3);
    }
  }

  const allLenses = lensDetected.every(Boolean);
  results.push({
    id: "lenses",
    score: allLenses ? "Satisfactory" : "Needs Revision",
    feedback: allLenses
      ? "Each paragraph addresses its designated lens with a clear analytical perspective."
      : buildLensFeedback(lensDetected)
  });

  let evidenceCount = 0;

  const paragraphEvidenceResults = paragraphs.map((p, idx) => {
    const directQuotes = extractDirectQuotes(p);
    const hasDirectQuote = directQuotes.some(q => isFromSoliloquy(q, lines));
    const hasParaphrase = detectsParaphrase(p, lines, lowerText);
    const hasEvidence = hasDirectQuote || hasParaphrase;
    const hasIntro = hasEvidence && hasIntroduction(p, directQuotes, hasParaphrase);
    const hasExplanation = hasEvidence && hasExplanationAfterEvidence(p, directQuotes, hasParaphrase);

    if (hasEvidence && hasIntro && hasExplanation) evidenceCount++;

    return { hasEvidence, hasIntro, hasExplanation, lens: lensNames[idx] };
  });

  const evidenceSatisfactory = evidenceCount >= 3;
  results.push({
    id: “evidence”,
    score: evidenceSatisfactory ? “Satisfactory” : “Needs Revision”,
    feedback: evidenceSatisfactory
      ? “Each paragraph integrates textual evidence — whether quoted or paraphrased — introduced and explained in connection to the claim.”
      : buildEvidenceFeedback(paragraphEvidenceResults)
  });

  const readabilityIssues = checkReadability(paragraphs);
  const readabilitySatisfactory = readabilityIssues.length === 0;
  results.push({
    id: "readability",
    score: readabilitySatisfactory ? "Satisfactory" : "Needs Revision",
    feedback: readabilitySatisfactory
      ? "Writing is clear, well-organized, and free of major errors."
      : "Some readability issues: " + readabilityIssues.join("; ") + "."
  });

  return results;
}

function extractDirectQuotes(paragraph) {
  const quotes = [];
  const regex = /[“”””]([^””””]{8,}?)[“”””]/g;
  let match;
  while ((match = regex.exec(paragraph)) !== null) {
    quotes.push(match[1]);
  }
  return quotes;
}

function isFromSoliloquy(quote, soliloquyLines) {
  const q = quote.toLowerCase().trim();
  if (q.length < 8) return false;
  const words = q.split(/\s+/).slice(0, 6).join(“ “);
  return soliloquyLines.some(line => line.includes(words) || words.includes(line));
}

function detectsParaphrase(paragraph, soliloquyLines, soliloquyFullLower) {
  const p = paragraph.toLowerCase();

  const keyPhrases = soliloquyFullLower
    .split(/[,;:.!?\n]+/)
    .map(s => s.trim().split(/\s+/))
    .filter(words => words.length >= 3);

  for (const phraseWords of keyPhrases) {
    let matched = 0;
    for (const w of phraseWords) {
      if (w.length >= 4 && p.includes(w)) matched++;
    }
    if (matched >= 3 && matched >= phraseWords.length * 0.5) return true;
  }

  const referenceSignals = [
    “macbeth describes”, “macbeth compares”, “macbeth refers”,
    “macbeth suggests”, “macbeth laments”, “macbeth acknowledges”,
    “macbeth recognizes”, “macbeth imagines”, “macbeth questions”,
    “macbeth expresses”, “macbeth contemplates”, “macbeth realizes”,
    “shakespeare describes”, “shakespeare compares”, “shakespeare uses”,
    “shakespeare portrays”, “shakespeare suggests”,
    “the soliloquy”, “the passage”, “the speech”,
    “in this moment”, “in the text”, “in these lines”,
    “he describes”, “he compares”, “he refers to”,
    “he suggests”, “he laments”, “he envisions”
  ];
  if (referenceSignals.some(s => p.includes(s))) {
    const soliloquyWords = soliloquyFullLower.split(/\s+/).filter(w => w.length >= 5);
    const uniqueWords = [...new Set(soliloquyWords)];
    const matchCount = uniqueWords.filter(w => p.includes(w)).length;
    if (matchCount >= 3) return true;
  }

  return false;
}

function hasIntroduction(paragraph, directQuotes, hasParaphrase) {
  const lower = paragraph.toLowerCase();
  const introSignals = [
    “macbeth”, “he says”, “he states”, “shakespeare”, “writes”,
    “declares”, “proclaims”, “reflects”, “reveals”, “when macbeth”,
    “in the”, “at this point”, “here,”, “the line”, “passage”,
    “describes”, “compares”, “suggests”, “laments”, “acknowledges”,
    “expresses”, “contemplates”, “soliloquy”, “in this moment”,
    “in these lines”, “the speech”, “the text”
  ];

  if (directQuotes.length > 0) {
    const firstQuoteChar = paragraph.search(/[“”””]/);
    const textBefore = lower.substring(0, Math.max(0, firstQuoteChar));
    return introSignals.some(s => textBefore.includes(s)) || textBefore.length > 30;
  }

  if (hasParaphrase) {
    return introSignals.some(s => lower.includes(s));
  }

  return false;
}

function hasExplanationAfterEvidence(paragraph, directQuotes, hasParaphrase) {
  if (directQuotes.length > 0) {
    const lastQuoteEnd = Math.max(...directQuotes.map(q => {
      const idx = paragraph.indexOf(q);
      return idx >= 0 ? idx + q.length : 0;
    }));
    const textAfter = paragraph.substring(lastQuoteEnd).trim();
    if (textAfter.length > 40) return true;
  }

  if (hasParaphrase) {
    const explanationSignals = [
      “this shows”, “this demonstrates”, “this reveals”, “this suggests”,
      “this illustrates”, “this highlights”, “this reflects”,
      “this means”, “this implies”, “which shows”, “which demonstrates”,
      “which reveals”, “which suggests”, “which means”,
      “indicating”, “suggesting”, “demonstrating”, “revealing”,
      “showing”, “illustrating”, “highlighting”,
      “in other words”, “essentially”, “therefore”, “thus”,
      “because of this”, “as a result”, “consequently”
    ];
    const lower = paragraph.toLowerCase();
    if (explanationSignals.some(s => lower.includes(s))) return true;
    if (paragraph.length > 200) return true;
  }

  return false;
}

function buildLensFeedback(detected) {
  const names = ["Personal", "Discursive", "Global"];
  const missing = names.filter((_, i) => !detected[i]);
  if (missing.length === 0) return "";
  return `The following lens paragraph(s) need strengthening: ${missing.join(", ")}. Make sure each paragraph clearly engages with its specific analytical perspective.`;
}

function buildEvidenceFeedback(results) {
  const issues = [];
  results.forEach(r => {
    const name = r.lens.charAt(0).toUpperCase() + r.lens.slice(1);
    if (!r.hasEvidence) {
      issues.push(`${name} paragraph: no textual evidence found — include a direct quote or clear paraphrase from the soliloquy`);
    } else {
      if (!r.hasIntro) issues.push(`${name} paragraph: introduce your evidence before presenting it`);
      if (!r.hasExplanation) issues.push(`${name} paragraph: explain how the evidence supports your claim`);
    }
  });
  return issues.length > 0 ? issues.join(". ") + "." : "Review your evidence sandwiches in each paragraph.";
}

function checkReadability(paragraphs) {
  const issues = [];
  const combined = paragraphs.join(" ");

  if (paragraphs.some(p => p.trim().length < 80)) {
    issues.push("one or more paragraphs appear too short to develop a full argument");
  }

  const sentences = combined.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWords = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / Math.max(sentences.length, 1);
  if (avgWords > 45) {
    issues.push("some sentences are very long — consider breaking them up for clarity");
  }

  if (paragraphs.some(p => {
    const first = p.trim().charAt(0);
    return first && first === first.toLowerCase() && /[a-z]/.test(first);
  })) {
    issues.push("paragraphs should begin with a capital letter");
  }

  return issues;
}
