function evaluateWriting(paragraphs, soliloquyText) {
  const results = [];
  const lowerText = soliloquyText.toLowerCase();
  const lines = soliloquyText.split("\n").map(l => l.trim().toLowerCase()).filter(Boolean);

  const lensKeywords = {
    personal: ["i ", "my ", "me ", "personally", "my own", "i feel", "i felt", "my experience", "my life", "reminds me", "i relate", "i connect"],
    discursive: ["metaphor", "imagery", "literary", "shakespeare", "device", "symbol", "theme", "motif", "soliloquy", "dramatic", "irony", "alliteration", "repetition", "structure", "craft", "language", "diction", "tone", "literature", "tragic", "character"],
    global: ["world", "society", "universal", "human", "politic", "history", "culture", "today", "modern", "relevant", "global", "moral", "ethic", "power", "justice", "humanity", "nation", "govern", "leader"]
  };

  const lensNames = ["personal", "discursive", "global"];
  const lensDetected = [false, false, false];

  for (let i = 0; i < 3; i++) {
    if (i < paragraphs.length) {
      const p = paragraphs[i].toLowerCase();
      const keywords = lensKeywords[lensNames[i]];
      const matches = keywords.filter(k => p.includes(k));
      lensDetected[i] = matches.length >= 2;
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
  const quotePattern = /[""“”]([^""“”]{8,}?)[""“”]/g;

  const paragraphEvidenceResults = paragraphs.map((p, idx) => {
    const quotes = [];
    let match;
    const regex = new RegExp(quotePattern.source, quotePattern.flags);
    while ((match = regex.exec(p)) !== null) {
      quotes.push(match[1]);
    }

    const hasQuote = quotes.some(q => isFromSoliloquy(q, lines));
    const hasIntro = hasQuote && hasIntroduction(p, quotes);
    const hasExplanation = hasQuote && hasExplanationAfterQuote(p, quotes);

    if (hasQuote && hasIntro && hasExplanation) evidenceCount++;

    return { hasQuote, hasIntro, hasExplanation, lens: lensNames[idx] };
  });

  const evidenceSatisfactory = evidenceCount >= 3;
  results.push({
    id: "evidence",
    score: evidenceSatisfactory ? "Satisfactory" : "Needs Revision",
    feedback: evidenceSatisfactory
      ? "Each paragraph uses an evidence sandwich: quotes are introduced, cited, and explained in connection to the claim."
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

function isFromSoliloquy(quote, soliloquyLines) {
  const q = quote.toLowerCase().trim();
  if (q.length < 8) return false;

  const words = q.split(/\s+/).slice(0, 6).join(" ");
  return soliloquyLines.some(line => line.includes(words) || words.includes(line));
}

function hasIntroduction(paragraph, quotes) {
  if (quotes.length === 0) return false;
  const firstQuoteIdx = paragraph.indexOf(quotes[0].charAt(0) === "“" ? quotes[0] : quotes[0]);
  const textBefore = paragraph.substring(0, Math.max(0, paragraph.indexOf('"'))).toLowerCase();
  const introSignals = ["macbeth", "he says", "he states", "shakespeare", "writes", "declares", "proclaims", "reflects", "reveals", "when macbeth", "in the", "at this point", "here,", "the line", "passage"];
  return introSignals.some(s => textBefore.includes(s)) || textBefore.length > 30;
}

function hasExplanationAfterQuote(paragraph, quotes) {
  if (quotes.length === 0) return false;
  const lastQuoteEnd = Math.max(...quotes.map(q => {
    const idx = paragraph.indexOf(q);
    return idx >= 0 ? idx + q.length : 0;
  }));
  const textAfter = paragraph.substring(lastQuoteEnd).trim();
  return textAfter.length > 40;
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
    if (!r.hasQuote) {
      issues.push(`${name} paragraph: no textual evidence found — include a direct quote from the soliloquy`);
    } else {
      if (!r.hasIntro) issues.push(`${name} paragraph: introduce your quote before presenting it`);
      if (!r.hasExplanation) issues.push(`${name} paragraph: explain how the quote supports your claim after presenting it`);
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
