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
