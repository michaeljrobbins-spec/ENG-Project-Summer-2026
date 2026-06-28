const PHASES = {
  SELECT_SOLILOQUY: "select_soliloquy",
  LENS_INTRO: "lens_intro",
  LENS_QUESTION: "lens_question",
  LENS_WRAPUP: "lens_wrapup",
  WRITING_INTRO: "writing_intro",
  WRITING: "writing",
  EVALUATION: "evaluation",
  REVISION: "revision",
  COMPLETE: "complete"
};

const LENS_ORDER = ["personal", "discursive", "global"];

class Chatbot {
  constructor(soliloquies) {
    this.soliloquies = soliloquies;
    this.reset();
  }

  reset() {
    this.phase = PHASES.SELECT_SOLILOQUY;
    this.selectedSoliloquy = null;
    this.currentLensIndex = 0;
    this.currentQuestionIndex = 0;
    this.studentResponses = { personal: [], discursive: [], global: [] };
    this.submittedParagraphs = [];
    this.evaluationResults = [];
  }

  getWelcomeMessages() {
    const messages = [{ text: PROMPTS.welcome, type: "bot" }];
    return messages;
  }

  processInput(input) {
    const responses = [];

    switch (this.phase) {
      case PHASES.SELECT_SOLILOQUY:
        return this.handleSoliloquySelection(input);
      case PHASES.LENS_QUESTION:
        return this.handleLensResponse(input);
      case PHASES.WRITING:
      case PHASES.REVISION:
        return this.handleWritingSubmission(input);
      case PHASES.COMPLETE:
        return this.handleRestart(input);
      default:
        return [{ text: "Something went wrong. Let's start over.", type: "bot", action: "reset" }];
    }
  }

  handleSoliloquySelection(input) {
    const num = parseInt(input);
    if (num >= 1 && num <= this.soliloquies.length) {
      this.selectedSoliloquy = this.soliloquies[num - 1];
    } else {
      const lower = input.toLowerCase();
      this.selectedSoliloquy = this.soliloquies.find(s =>
        s.title.toLowerCase().includes(lower) ||
        s.label.toLowerCase().includes(lower) ||
        s.text.toLowerCase().substring(0, 40).includes(lower)
      );
    }

    if (!this.selectedSoliloquy) {
      return [{ text: "I didn't catch that. Please choose a soliloquy by number (1-4) or by name.", type: "bot" }];
    }

    const responses = [];
    responses.push({
      text: PROMPTS.soliloquyChosen(this.selectedSoliloquy.title),
      type: "bot"
    });
    responses.push({
      text: this.formatSoliloquy(),
      type: "bot",
      className: "soliloquy-display"
    });

    this.phase = PHASES.LENS_QUESTION;
    this.currentLensIndex = 0;
    this.currentQuestionIndex = 0;

    const lens = LENS_ORDER[0];
    responses.push({ text: PROMPTS.lenses[lens].intro, type: "bot" });
    responses.push({ text: PROMPTS.lenses[lens].questions[0], type: "bot", className: "question" });

    return responses;
  }

  handleLensResponse(input) {
    if (input.trim().length < 10) {
      return [{ text: "Could you expand on that a bit more? Try to write at least a couple of sentences.", type: "bot" }];
    }

    const responses = [];
    const lens = LENS_ORDER[this.currentLensIndex];
    this.studentResponses[lens].push(input);
    this.currentQuestionIndex++;

    const lensData = PROMPTS.lenses[lens];

    if (this.currentQuestionIndex < lensData.questions.length) {
      responses.push({ text: "Thanks for sharing that. Here's the next question:", type: "bot" });
      responses.push({ text: lensData.questions[this.currentQuestionIndex], type: "bot", className: "question" });
    } else {
      responses.push({ text: lensData.wrapUp, type: "bot" });
      responses.push({ text: this.buildWritingTransition(lens), type: "bot", className: "transition" });
      this.currentLensIndex++;
      this.currentQuestionIndex = 0;

      if (this.currentLensIndex < LENS_ORDER.length) {
        const nextLens = LENS_ORDER[this.currentLensIndex];
        responses.push({ text: PROMPTS.lenses[nextLens].intro, type: "bot" });
        responses.push({ text: PROMPTS.lenses[nextLens].questions[0], type: "bot", className: "question" });
      } else {
        this.phase = PHASES.WRITING;
        responses.push({ text: PROMPTS.writingIntro, type: "bot" });
      }
    }

    return responses;
  }

  handleWritingSubmission(input) {
    const paragraphs = this.parseParagraphs(input);

    if (paragraphs.length < 3) {
      return [{
        text: `I found ${paragraphs.length} paragraph(s), but I need three — one for each lens. Please separate your paragraphs with a blank line and resubmit.`,
        type: "bot"
      }];
    }

    this.submittedParagraphs = paragraphs.slice(0, 3);
    this.phase = PHASES.EVALUATION;

    const results = evaluateWriting(this.submittedParagraphs, this.selectedSoliloquy.text);
    this.evaluationResults = results;

    const responses = [];
    responses.push({ text: PROMPTS.evaluationIntro, type: "bot" });
    responses.push({ text: this.formatEvaluation(results), type: "bot", className: "evaluation" });

    const allSatisfactory = results.every(r => r.score === "Satisfactory");

    if (allSatisfactory) {
      this.phase = PHASES.COMPLETE;
      responses.push({ text: PROMPTS.completionMessage, type: "bot", className: "completion" });
    } else {
      this.phase = PHASES.REVISION;
      responses.push({ text: PROMPTS.revisionPrompt, type: "bot" });
    }

    return responses;
  }

  handleRestart(input) {
    if (input.toLowerCase().includes("yes") || input.toLowerCase().includes("start over") || input.toLowerCase().includes("another")) {
      this.reset();
      return this.getWelcomeMessages();
    }
    return [{ text: "Would you like to analyze another soliloquy? Type \"yes\" to start over.", type: "bot" }];
  }

  buildWritingTransition(lens) {
    const responses = this.studentResponses[lens];
    const themes = this.synthesizeThemes(responses);

    const lensFraming = {
      personal: {
        label: "Personal",
        claimGuide: `why this passage matters to you personally. You explored ideas around ${themes} — distill that into one clear statement of personal significance.`,
        evidenceGuide: "the specific moment in the text that sparked that personal response",
        connectionGuide: "how those words connect to the personal experience or feeling you described"
      },
      discursive: {
        label: "Discursive",
        claimGuide: `what makes this passage significant as a work of literature. You noticed ${themes} — turn that observation into a clear argument about Shakespeare's craft.`,
        evidenceGuide: "the specific language, device, or structural choice that demonstrates your point",
        connectionGuide: "how that technique creates meaning — what it does to the reader's understanding or experience"
      },
      global: {
        label: "Global",
        claimGuide: `why this passage matters beyond the play. You drew connections to ${themes} — sharpen that into a claim about the passage's wider relevance.`,
        evidenceGuide: "the moment in the text that carries that universal or real-world weight",
        connectionGuide: "why those words resonate outside Shakespeare's world and speak to the broader issue you identified"
      }
    };

    const f = lensFraming[lens];

    return `Here's your blueprint for the **${f.label}** paragraph. Three moves, in order:

**1. Open with your claim.** State ${f.claimGuide}

**2. Present your evidence.** Introduce ${f.evidenceGuide}. Set it up for the reader — who's speaking, what's happening — then quote or paraphrase the passage.

**3. Explain the connection.** This is the most important move. Tell the reader ${f.connectionGuide}. Don't let the evidence speak for itself — that's your job.`;
  }

  synthesizeThemes(responses) {
    const combined = responses.join(" ").toLowerCase();

    const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "it", "this", "that", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "as", "by", "from", "i", "my", "me", "you", "he", "she", "they", "we", "his", "her", "its", "our", "their", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "can", "may", "might", "not", "so", "if", "when", "how", "what", "which", "who", "whom", "there", "here", "very", "just", "about", "also", "than", "then", "more", "most", "some", "such", "like", "think", "really", "because", "through", "feel", "make", "much", "many", "even", "still", "well", "back", "into", "over", "after", "before", "between", "each", "only", "other", "been", "same", "made", "way", "them", "these", "those", "said", "passage", "soliloquy", "macbeth", "quote", "line", "text", "shakespeare"]);

    const phrases = this.extractPhrases(combined, stopWords);
    const words = this.extractTopWords(combined, stopWords);

    const themes = phrases.length > 0 ? phrases : words;

    if (themes.length === 0) return "some important ideas";
    if (themes.length === 1) return themes[0];
    if (themes.length === 2) return `${themes[0]} and ${themes[1]}`;
    return `${themes.slice(0, -1).join(", ")}, and ${themes[themes.length - 1]}`;
  }

  extractPhrases(text, stopWords) {
    const bigrams = [];
    const words = text.split(/\s+/).map(w => w.replace(/[^a-z]/g, "")).filter(Boolean);

    const bigramCounts = {};
    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i], b = words[i + 1];
      if (a.length > 3 && b.length > 3 && !stopWords.has(a) && !stopWords.has(b)) {
        const pair = `${a} ${b}`;
        bigramCounts[pair] = (bigramCounts[pair] || 0) + 1;
      }
    }

    return Object.entries(bigramCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([phrase]) => phrase);
  }

  extractTopWords(text, stopWords) {
    const wordCounts = {};
    text.split(/\s+/).forEach(w => {
      const clean = w.replace(/[^a-z]/g, "");
      if (clean.length > 4 && !stopWords.has(clean)) {
        wordCounts[clean] = (wordCounts[clean] || 0) + 1;
      }
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w);
  }

  parseParagraphs(text) {
    return text.split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  formatSoliloquy() {
    const s = this.selectedSoliloquy;
    return `---\n**${s.title}: ${s.label}**\n*${s.context}*\n\n${s.text}\n---`;
  }

  formatEvaluation(results) {
    return results.map(r => {
      const icon = r.score === "Satisfactory" ? "✅" : "✏️";
      const criterion = PROMPTS.rubricCriteria.find(c => c.id === r.id);
      return `${icon} **${criterion.name}**: ${r.score}\n${r.feedback}`;
    }).join("\n\n");
  }
}
