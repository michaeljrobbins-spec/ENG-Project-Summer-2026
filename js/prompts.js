const PROMPTS = {
  welcome: `Welcome to this Macbeth Soliloquy Analysis Workshop! I'm here to help you explore one of Macbeth's soliloquies. We will look at it through the following lenses:
1. Your own personal interpretation of the importance of the text

2. Your thoughts on the literary importance of the text

3. Your thoughts on the global importance of the text
Your goal is to walk through the different lenses and then develop a three paragraph analysis of the work. By doing this, you'll accomplish the following goals:
1. Interpret the meaning and significance of a Shakespearean soliloquy by examining it through multiple analytical lenses

2. Synthesize evidence to support an analysis of a literary text

3. Articulate the personal, literary, and global relevance of a literary text to a range of readers and contexts`,

  soliloquyChosen: (title) =>
    `Great choice! Let's dive into the soliloquy from **${title}**. Take a moment to read through it carefully — you can always scroll up to revisit the text.

We'll work through three analytical lenses, one at a time. Each lens asks you to think about the passage from a different angle. After all three, you'll write a short essay with one paragraph per lens.`,

  guideOffer: `Before we start analyzing, would you like a brief guide to help you understand this passage? I can walk you through it section by section with plain-language explanations.

Type **yes** for the reading guide, or **no** to jump straight into the analysis.`,

  guideIntro: `Here's a section-by-section breakdown of the soliloquy. Take your time reading through each part.`,

  guideReady: `That's the full passage broken down. Take a moment to scroll back through if you need to — the original text is also above for reference.

When you're ready, type anything to begin the analysis.`,

  lenses: {
    personal: {
      name: "Personal",
      intro: `**Lens 1: Personal**

This lens asks you to connect the passage to your own life, experiences, or emotions. What does this make you think or feel, and why?

There are no wrong answers here — what matters is that you engage honestly with the text and reflect on why it resonates (or doesn't) with your own experience.`,
      questions: [
        "What emotions did you feel while reading this passage? Why do you think it provoked that response?",
        "Can you think of a moment in your own life — or someone you know — where similar feelings or pressures were at play?",
        "What line or image stands out to you most on a personal level, and why?"
      ],
      wrapUp: `Good reflections. You've started to build a personal connection to the text — that's the foundation of strong literary analysis. Let's move to the next lens.`
    },
    discursive: {
      name: "Discursive",
      intro: `**Lens 2: Discursive**

This lens asks why this passage matters to the study of literature. Think about Shakespeare's craft, the themes he's exploring, or why scholars and students still read this play today.

Focus on *how* the writing works — the language, the structure, the literary techniques — not just *what* it says.`,
      questions: [
        "What literary devices (metaphor, imagery, repetition, etc.) do you notice in this passage? Pick one and explain how it contributes to meaning.",
        "How does this soliloquy reveal something about Macbeth's character development at this point in the play?",
        "How does this passage connect to larger themes in the play — or in literature more broadly (ambition, fate, morality, power)?"
      ],
      wrapUp: `Excellent work. You're building a literary argument grounded in the text. One more lens to go.`
    },
    global: {
      name: "Global",
      intro: `**Lens 3: Global**

This lens asks why this passage matters beyond the classroom — to people of different backgrounds, cultures, or time periods. What universal human experience does it speak to?

Think big: politics, ethics, social issues, the human condition. How do Macbeth's words connect to the world outside the play?`,
      questions: [
        "What universal human experience or moral question does this passage address?",
        "Can you connect the ideas in this passage to a real-world event, social issue, or political situation — past or present?",
        "If someone had never read Shakespeare, how would you explain why this passage still matters today?"
      ],
      wrapUp: `Wonderful. You've now examined this soliloquy from all three angles. You have rich material to work with. Let's move on to writing.`
    }
  },

  evidenceTip: `**A Quick Tip on Using Textual Evidence**

You can support your points with evidence in two ways:

- **Direct quote**: Use the exact words from the soliloquy in quotation marks, and note the act and scene. For example: In Act 5, Scene 5, Macbeth calls life "a tale / Told by an idiot, full of sound and fury, / Signifying nothing."
- **Paraphrase**: Restate the idea from the passage in your own words. For example: Macbeth suggests that life is ultimately meaningless, comparing it to a story told by a fool.

Either way, always do three things: *introduce* the evidence (tell the reader what to look for), *present* it (quote or paraphrase), and *explain* how it connects to your point. This is called an **evidence sandwich**.`,

  writingIntro: `**Time to Write**

Now you'll compose three paragraphs — one for each lens (Personal, Discursive, Global). Each paragraph should:

- Make a clear claim about the soliloquy's significance through that lens
- Include at least one piece of textual evidence using the evidence sandwich described above
- Explain how the evidence supports your claim

You already have your blueprints from earlier — use them as a guide. Take your time, and when you're ready, paste all three paragraphs below. Separate each paragraph with a blank line.`,

  writingReminder: `Remember: each paragraph needs a clear claim, at least one quote from the soliloquy, and an explanation of how that evidence supports your point. You can scroll up to review the soliloquy text and your earlier responses for ideas.`,

  evaluationIntro: `Let me review your writing against our rubric...`,

  rubricCriteria: [
    {
      id: "lenses",
      name: "Three-Lens Analysis",
      description: "Analyzes significance through all three lenses (personal, discursive, global)",
      satisfactory: "Each paragraph clearly addresses its designated lens with a distinct analytical claim.",
      needsRevision: "One or more lenses is missing, unclear, or the paragraphs don't distinguish between lenses."
    },
    {
      id: "evidence",
      name: "Evidence Sandwich",
      description: "Synthesizes source material using an evidence sandwich (introduce, quote, explain) with evidence that clearly supports the claim",
      satisfactory: "Each paragraph introduces a quote, includes the quoted text, and explains how it supports the claim.",
      needsRevision: "Quotes are dropped in without introduction or explanation, evidence doesn't connect to the claim, or textual evidence is missing."
    },
    {
      id: "readability",
      name: "Readability",
      description: "Edited and revised for readability",
      satisfactory: "Writing is clear, organized, and largely free of distracting errors.",
      needsRevision: "Writing has significant issues with clarity, organization, or surface-level errors that impede understanding."
    }
  ],

  revisionPrompt: `Some areas could use revision. Review the feedback above and resubmit your three paragraphs when you're ready. You've got this!`,

  completionMessage: `Congratulations! Your analysis meets all three rubric criteria. You've successfully:

- Connected the soliloquy to your personal experience
- Analyzed Shakespeare's craft and literary significance
- Explored the passage's relevance to the wider world
- Supported each claim with well-integrated textual evidence

Great work! You can start over with a different soliloquy if you'd like.`
};
