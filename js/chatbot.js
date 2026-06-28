const PHASES = {
  SELECT_SOLILOQUY: "select_soliloquy",
  OFFER_GUIDE: "offer_guide",
  GUIDE_CHUNK: "guide_chunk",
  SHOW_GUIDE: "show_guide",
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
    this.guideChunkIndex = 0;
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
      case PHASES.OFFER_GUIDE:
        return this.handleGuideOffer(input);
      case PHASES.GUIDE_CHUNK:
        return this.handleGuideChunk(input);
      case PHASES.SHOW_GUIDE:
        return this.handleGuideReady(input);
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

    this.phase = PHASES.OFFER_GUIDE;
    responses.push({ text: PROMPTS.guideOffer, type: "bot" });

    return responses;
  }

  handleGuideOffer(input) {
    const lower = input.toLowerCase();
    const yes = ["yes", "yeah", "sure", "ok", "okay", "please", "yep", "yea", "y"];
    const no = ["no", "nah", "nope", "skip", "n", "i'm good", "im good", "no thanks", "ready"];

    if (yes.some(w => lower.includes(w))) {
      const responses = [];
      responses.push({ text: PROMPTS.guideIntro, type: "bot" });

      this.guideChunkIndex = 0;
      this.phase = PHASES.GUIDE_CHUNK;
      responses.push(this.buildChunkMessage(0));
      responses.push({ text: "Does anything need clarification?", type: "bot", action: "showClarifications", chunkIndex: 0 });
      return responses;
    }

    if (no.some(w => lower.includes(w))) {
      return this.beginLensQuestions();
    }

    return [{ text: "Just type **yes** if you'd like help understanding the passage, or **no** to jump straight into the analysis.", type: "bot" }];
  }

  buildChunkMessage(index) {
    const chunks = this.selectedSoliloquy.guide.chunks;
    const chunk = chunks[index];
    const header = `**Part ${index + 1} of ${chunks.length}:**`;
    const paraphrase = `*In plain language:* ${chunk.paraphrase}`;
    const notice = `*What to notice:* ${chunk.notice}`;
    return {
      text: `${header}\n\n${chunk.lines}\n\n${paraphrase}\n\n${notice}`,
      type: "bot",
      className: "guide-chunk"
    };
  }

  getClarifications(chunkIndex) {
    const chunk = this.selectedSoliloquy.guide.chunks[chunkIndex];
    return chunk.clarifications || [];
  }

  handleGuideChunk(input) {
    const chunks = this.selectedSoliloquy.guide.chunks;
    const clarifications = this.getClarifications(this.guideChunkIndex);

    const clarIdx = parseInt(input);
    if (!isNaN(clarIdx) && clarIdx >= 0 && clarIdx < clarifications.length) {
      const clar = clarifications[clarIdx];
      const responses = [{ text: `**${clar.question}**\n\n${clar.answer}`, type: "bot", className: "guide-chunk" }];
      responses.push({ text: "Anything else about this section?", type: "bot", action: "showClarifications", chunkIndex: this.guideChunkIndex, excludeIndex: clarIdx });
      return responses;
    }

    if (input === "__continue__" || input.toLowerCase().includes("continue") || input.toLowerCase().includes("good") || input.toLowerCase().includes("next") || input.toLowerCase().includes("no")) {
      this.guideChunkIndex++;
      if (this.guideChunkIndex < chunks.length) {
        const responses = [this.buildChunkMessage(this.guideChunkIndex)];
        responses.push({ text: "Does anything need clarification?", type: "bot", action: "showClarifications", chunkIndex: this.guideChunkIndex });
        return responses;
      } else {
        this.phase = PHASES.SHOW_GUIDE;
        return [{ text: PROMPTS.guideReady, type: "bot" }];
      }
    }

    return [{ text: "Use the buttons below to ask a question or continue to the next section.", type: "bot", action: "showClarifications", chunkIndex: this.guideChunkIndex }];
  }

  handleGuideReady(input) {
    return this.beginLensQuestions();
  }

  beginLensQuestions() {
    this.phase = PHASES.LENS_QUESTION;
    this.currentLensIndex = 0;
    this.currentQuestionIndex = 0;

    const responses = [];
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
        responses.push({ text: PROMPTS.evidenceTip, type: "bot", className: "evidence-tip" });
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
    const detectedThemes = this.detectThemes(responses);
    const exampleClaim = this.generateExampleClaim(lens, detectedThemes, this.selectedSoliloquy);

    const lensLabels = { personal: "Personal", discursive: "Discursive", global: "Global" };

    return `Here's your blueprint for the **${lensLabels[lens]}** paragraph.

Your claim might be something like: *"${exampleClaim}"* — refine that in your own words.

Three moves, in order:

**1. Open with your claim.** State that idea clearly in one sentence. This is the argument your paragraph will prove.

**2. Introduce and present your evidence.** Set up the moment from the text — tell the reader who is speaking and what is happening, then quote or paraphrase the specific passage that supports your claim.

**3. Explain the connection.** This is the most important move. Tell the reader exactly *how* and *why* that evidence supports your claim. Don't let the quote speak for itself — that's your job.`;
  }

  detectThemes(responses) {
    const combined = responses.join(" ").toLowerCase();
    const themes = [];

    const themePatterns = [
      { theme: "ambition", patterns: ["ambiti", "driven", "desire", "want", "goal", "striv", "power-hungry", "aspir"] },
      { theme: "guilt", patterns: ["guilt", "conscience", "regret", "remorse", "haunted", "torment", "shame", "wrong"] },
      { theme: "fear", patterns: ["fear", "afraid", "dread", "anxi", "terror", "paranoi", "scared", "fright"] },
      { theme: "mortality", patterns: ["death", "mortal", "dying", "die", "life and death", "fleeting", "brief", "end of life", "finite"] },
      { theme: "meaninglessness", patterns: ["meaning", "nothing", "pointless", "purpose", "futile", "absurd", "empty", "void", "nihil"] },
      { theme: "moral conflict", patterns: ["moral", "right and wrong", "conscience", "ethical", "dilemma", "torn", "conflict", "struggle between"] },
      { theme: "madness", patterns: ["mad", "sane", "insanity", "hallucin", "vision", "imagin", "unravel", "losing.*mind", "mental"] },
      { theme: "isolation", patterns: ["alone", "isolat", "lonely", "solitary", "abandoned", "cut off", "no one"] },
      { theme: "violence", patterns: ["violen", "blood", "murder", "kill", "destroy", "brutal", "savage", "cruel"] },
      { theme: "despair", patterns: ["despair", "hopeless", "bleakness", "dark", "sorrow", "grief", "misery", "suffer"] },
      { theme: "deception", patterns: ["decei", "false", "illusion", "pretend", "mask", "hide", "appear", "seeming"] },
      { theme: "power", patterns: ["power", "control", "dominat", "authority", "ruling", "tyran", "command", "reign"] },
      { theme: "fate", patterns: ["fate", "destin", "inevit", "prophec", "foretold", "predetermin", "doom"] },
      { theme: "time", patterns: ["time", "tomorrow", "yesterday", "moment", "passing", "tempo", "forever", "transien"] },
      { theme: "imagery", patterns: ["imag", "visual", "picture", "scene", "vivid", "paint", "symbol"] },
      { theme: "metaphor", patterns: ["metaphor", "compar", "like a", "as a", "represents", "figurativ", "analogy"] },
      { theme: "repetition", patterns: ["repeti", "repeat", "again and again", "echoes", "recurring", "pattern"] },
      { theme: "dramatic irony", patterns: ["irony", "ironic", "audience knows", "dramatic", "tragic irony"] },
      { theme: "soliloquy as revelation", patterns: ["inner", "thought", "reveal", "private", "interior", "true feeling", "honest"] },
      { theme: "loss", patterns: ["loss", "lost", "losing", "grief", "mourn", "gone", "taken away"] },
      { theme: "leadership", patterns: ["leader", "king", "ruler", "govern", "politic", "regime", "dictator", "authoritarian"] },
      { theme: "justice", patterns: ["justice", "punish", "consequence", "accountab", "judgment", "deserv", "karmic"] },
      { theme: "human nature", patterns: ["human nature", "universal", "everyone", "all of us", "people", "mankind", "humanity", "condition"] },
      { theme: "relevance today", patterns: ["today", "modern", "current", "contemporary", "still", "now", "our time", "21st", "present"] }
    ];

    for (const { theme, patterns } of themePatterns) {
      const matchCount = patterns.filter(p => {
        if (p.includes("*")) {
          const regex = new RegExp(p.replace(".*", ".*"));
          return regex.test(combined);
        }
        return combined.includes(p);
      }).length;
      if (matchCount >= 2) {
        themes.push({ theme, strength: matchCount });
      }
    }

    themes.sort((a, b) => b.strength - a.strength);
    return themes.slice(0, 3).map(t => t.theme);
  }

  generateExampleClaim(lens, detectedThemes, soliloquy) {
    const title = soliloquy.title;
    const primary = detectedThemes[0] || null;
    const secondary = detectedThemes[1] || null;

    const claimTemplates = {
      personal: {
        ambition: "This soliloquy captures the destructive pull of ambition, a force that resonates with anyone who has sacrificed what matters for what glitters.",
        guilt: "Macbeth's words give voice to the weight of guilt, a burden familiar to anyone who has acted against their own conscience.",
        fear: "This passage lays bare a primal fear of consequences that speaks to the anxiety of irreversible choices.",
        mortality: "The soliloquy confronts the brevity of life in a way that forces the reader to reckon with their own sense of impermanence.",
        meaninglessness: "Macbeth's nihilism in this passage mirrors moments of personal despair when life seems drained of purpose.",
        "moral conflict": "This soliloquy dramatizes the agony of choosing between desire and duty, a tension that defines many personal crossroads.",
        madness: "Macbeth's unraveling mind in this passage evokes the disorienting experience of losing one's grip on reality.",
        isolation: "The profound loneliness in these lines resonates with anyone who has felt cut off from the people and values that once anchored them.",
        violence: "The raw brutality of Macbeth's resolve forces the reader to confront their own relationship with anger and aggression.",
        despair: "This soliloquy articulates a depth of despair that connects to universal experiences of loss and hopelessness.",
        deception: "Macbeth's struggle between appearance and truth mirrors the personal cost of living behind a mask.",
        power: "The intoxication of power in this passage speaks to anyone who has felt the pull of control over others.",
        fate: "This passage raises unsettling questions about free will that resonate with anyone who has wondered whether their choices truly matter.",
        time: "Macbeth's meditation on time captures a deeply personal anxiety about how quickly life slips away.",
        loss: "The grief woven through this passage connects to the universal ache of losing something that cannot be recovered.",
        _default: "This soliloquy gives voice to an emotional truth that resonates beyond the world of the play and speaks to deeply personal experience."
      },
      discursive: {
        ambition: "Shakespeare uses this soliloquy to anatomize ambition through layered imagery, revealing how poetic form can make an abstract drive feel visceral.",
        guilt: "Through dense figurative language, Shakespeare transforms guilt from an abstract concept into a palpable, physical presence in the text.",
        fear: "Shakespeare's imagery in this passage externalizes Macbeth's inner terror, demonstrating how literary craft can make psychological states visible.",
        mortality: "The soliloquy's compressed metaphors distill the enormity of mortality into language that is both intimate and cosmic in scale.",
        meaninglessness: "Shakespeare's use of accumulated metaphor in this passage builds a literary argument for meaninglessness that gains force through sheer rhetorical momentum.",
        "moral conflict": "This soliloquy showcases Shakespeare's ability to dramatize moral reasoning through the structure and rhythm of verse itself.",
        madness: "Shakespeare blurs the boundary between perception and hallucination, using the soliloquy form to stage a crisis of consciousness in real time.",
        isolation: "The soliloquy form itself becomes a literary device here, enacting Macbeth's isolation by trapping the audience inside his solitary mind.",
        violence: "Shakespeare transforms violent intent into poetic spectacle, using imagery and diction to make the reader feel the gravity of what is about to happen.",
        despair: "The literary power of this passage lies in how Shakespeare uses rhythm, repetition, and imagery to make despair feel both inevitable and infinite.",
        deception: "Shakespeare layers irony and ambiguity throughout this soliloquy, using literary technique to mirror the instability of truth in Macbeth's world.",
        power: "This passage demonstrates how Shakespeare uses the soliloquy to expose the gap between public authority and private doubt.",
        imagery: "The density of imagery in this passage reveals Shakespeare's craft at its most concentrated, layering visual and sensory language to build meaning.",
        metaphor: "Shakespeare's extended metaphor in this soliloquy is a masterclass in how figurative language can carry an argument the speaker cannot state directly.",
        repetition: "The deliberate repetition in this passage creates a rhythmic insistence that mirrors the obsessive quality of Macbeth's thought.",
        "dramatic irony": "Shakespeare deploys dramatic irony to create a gap between what Macbeth believes and what the audience knows, deepening the tragedy.",
        "soliloquy as revelation": "The soliloquy form allows Shakespeare to reveal Macbeth's true psychology, giving the audience access to truths the character hides from everyone else.",
        _default: "This soliloquy demonstrates Shakespeare's ability to use poetic language and dramatic structure to reveal psychological complexity."
      },
      global: {
        ambition: "This soliloquy exposes the human cost of unchecked ambition, a theme that echoes through political history from ancient Rome to the present day.",
        guilt: "Macbeth's guilt speaks to a universal moral architecture: the idea that wrongdoing carries an internal cost no amount of power can erase.",
        fear: "The fear Macbeth voices here reflects a broader truth about how anticipation of consequences shapes human behavior across all societies.",
        mortality: "This passage distills a confrontation with mortality that transcends its historical moment and speaks to every culture's reckoning with death.",
        meaninglessness: "Macbeth's nihilistic vision anticipates modern existential philosophy and remains startlingly relevant in an era of widespread disillusionment.",
        "moral conflict": "The moral crisis at the heart of this soliloquy mirrors the ethical dilemmas that define leadership, governance, and personal responsibility in any era.",
        madness: "Macbeth's psychological disintegration raises enduring questions about the mental toll of power, relevant from Tudor politics to modern authoritarianism.",
        isolation: "The isolation Macbeth expresses speaks to a global pattern: the loneliness that accompanies power, transgression, or the collapse of social bonds.",
        violence: "This passage forces a reckoning with political violence and its justifications, a conversation as urgent now as it was in Shakespeare's England.",
        despair: "Macbeth's despair articulates a crisis of meaning that resonates across cultures, from ancient tragedy to contemporary discourse on mental health.",
        power: "This soliloquy interrogates the relationship between power and moral corruption, a dynamic that plays out in political systems across the globe.",
        fate: "The tension between fate and free will in this passage speaks to philosophical and religious debates that span every major world tradition.",
        "human nature": "This passage holds up a mirror to human nature itself, capturing truths about desire, consequence, and self-knowledge that cross every cultural boundary.",
        "relevance today": "The concerns voiced in this soliloquy remain strikingly contemporary, connecting Shakespeare's world to present-day struggles with power, meaning, and moral clarity.",
        justice: "Macbeth's awareness of justice and consequence reflects an enduring human belief that moral order ultimately reasserts itself, a conviction tested throughout history.",
        leadership: "This soliloquy reveals the psychology of a leader in moral freefall, a portrait that resonates with political crises across centuries and continents.",
        _default: "This soliloquy captures a dimension of the human condition that transcends its historical moment and speaks to enduring questions about how we live."
      }
    };

    const templates = claimTemplates[lens];
    if (primary && templates[primary]) return templates[primary];
    if (secondary && templates[secondary]) return templates[secondary];
    return templates._default;
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
