const PROMPTS = {
  welcome: `Welcome to the Macbeth Soliloquy Analysis Workshop! I'm here to help you explore one of Macbeth's soliloquies through three critical lenses and build toward a polished analytical essay.

Let's start by choosing a soliloquy to work with.`,

  soliloquyChosen: (title) =>
    `Great choice! Let's dive into the soliloquy from **${title}**. Take a moment to read through it carefully — you can always scroll up to revisit the text.

We'll work through three analytical lenses, one at a time. Each lens asks you to think about the passage from a different angle. After all three, you'll write a short essay with one paragraph per lens.`,

  lenses: {
    personal: {
      name: "Personal",
      intro: `**Lens 1: Personal**
Why is this passage important to *you* personally? Think about how Macbeth's words connect to your own experiences, feelings, or observations about human nature.`,
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
Why does this passage matter to the study of literature? Think about Shakespeare's craft — his use of language, imagery, structure — and how this soliloquy fits into broader literary traditions or conversations.`,
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
Why does this passage matter to the *world*? Think beyond the play itself — what does it say about politics, society, ethics, or the human condition that resonates across time and cultures?`,
      questions: [
        "What universal human experience or moral question does this passage address?",
        "Can you connect the ideas in this passage to a real-world event, social issue, or political situation — past or present?",
        "If someone had never read Shakespeare, how would you explain why this passage still matters today?"
      ],
      wrapUp: `Wonderful. You've now examined this soliloquy from all three angles. You have rich material to work with. Let's move on to writing.`
    }
  },

  writingIntro: `**Time to Write**

Now you'll compose three paragraphs — one for each lens (Personal, Discursive, Global). Each paragraph should:

- Make a clear claim about the soliloquy's significance through that lens
- Include at least one piece of **textual evidence** using an **evidence sandwich**:
  1. **Introduce** the quote (who says it, when, why it matters)
  2. **Provide** the quote itself
  3. **Explain** how the quote supports your claim

Take your time. When you're ready, paste all three paragraphs below.`,

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
