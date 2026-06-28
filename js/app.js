let chatbot;

document.addEventListener("DOMContentLoaded", async () => {
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const soliloquyButtons = document.getElementById("soliloquy-buttons");

  const response = await fetch("data/soliloquy.json");
  const soliloquies = await response.json();
  chatbot = new Chatbot(soliloquies);

  function addMessage(text, type, className) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", type === "bot" ? "bot-message" : "user-message");
    if (className) msgDiv.classList.add(className);
    msgDiv.innerHTML = renderMarkdown(text);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function renderMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  function showSoliloquyPicker(soliloquies) {
    soliloquyButtons.innerHTML = "";
    soliloquyButtons.style.display = "flex";
    soliloquies.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.className = "soliloquy-btn";
      btn.innerHTML = `<span class="btn-number">${i + 1}</span><span class="btn-title">${s.title}</span><span class="btn-label">${s.label}</span>`;
      btn.addEventListener("click", () => {
        soliloquyButtons.style.display = "none";
        handleInput(String(i + 1));
      });
      soliloquyButtons.appendChild(btn);
    });
  }

  function hideSoliloquyPicker() {
    soliloquyButtons.style.display = "none";
  }

  function showClarificationButtons(chunkIndex, excludeIndex) {
    hideClarificationButtons();
    const clarifications = chatbot.getClarifications(chunkIndex);
    const container = document.createElement("div");
    container.id = "clarification-buttons";
    container.className = "clarification-buttons";

    clarifications.forEach((clar, i) => {
      if (i === excludeIndex) return;
      const btn = document.createElement("button");
      btn.className = "clarification-btn";
      btn.textContent = clar.question;
      btn.addEventListener("click", () => {
        hideClarificationButtons();
        handleInput(String(i));
      });
      container.appendChild(btn);
    });

    const continueBtn = document.createElement("button");
    continueBtn.className = "clarification-btn continue-btn";
    continueBtn.textContent = "I'm good, continue";
    continueBtn.addEventListener("click", () => {
      hideClarificationButtons();
      handleInput("__continue__");
    });
    container.appendChild(continueBtn);

    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideClarificationButtons() {
    const existing = document.getElementById("clarification-buttons");
    if (existing) existing.remove();
  }

  function showGuideOfferButtons() {
    hideGuideOfferButtons();
    const wrapper = document.createElement("div");
    wrapper.id = "guide-offer-buttons";
    wrapper.className = "clarification-buttons";

    const yesBtn = document.createElement("button");
    yesBtn.className = "clarification-btn";
    yesBtn.textContent = "Yes, help me read it";
    yesBtn.addEventListener("click", () => {
      hideGuideOfferButtons();
      handleInput("yes");
    });
    wrapper.appendChild(yesBtn);

    const noBtn = document.createElement("button");
    noBtn.className = "clarification-btn";
    noBtn.textContent = "No, I'm ready to analyze";
    noBtn.addEventListener("click", () => {
      hideGuideOfferButtons();
      handleInput("no");
    });
    wrapper.appendChild(noBtn);

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideGuideOfferButtons() {
    const existing = document.getElementById("guide-offer-buttons");
    if (existing) existing.remove();
  }

  function showBeginAnalysisButton() {
    const wrapper = document.createElement("div");
    wrapper.id = "begin-analysis-wrapper";
    wrapper.className = "clarification-buttons";
    const btn = document.createElement("button");
    btn.className = "clarification-btn continue-btn";
    btn.textContent = "Click here to begin Analysis";
    btn.addEventListener("click", () => {
      wrapper.remove();
      handleInput("__continue__");
    });
    wrapper.appendChild(btn);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleInput(text) {
    if (!text.trim()) return;
    if (text !== "__continue__" && !text.match(/^\d+$/) && text !== "yes" && text !== "no") {
      addMessage(text, "user");
    }
    const responses = chatbot.processInput(text);
    let lastClarAction = null;
    responses.forEach((r, i) => {
      setTimeout(() => {
        if (r.action === "showClarifications") {
          lastClarAction = r;
        } else if (r.action === "showBeginAnalysis") {
          // skip rendering empty message, button added below
        } else if (r.action === "showGuideOffer") {
          addMessage(r.text, r.type, r.className);
        } else {
          addMessage(r.text, r.type, r.className);
        }
        if (r.action === "reset") {
          setTimeout(startChat, 500);
        }
        if (chatbot.phase === PHASES.COMPLETE && i === responses.length - 1) {
          setTimeout(() => addStartOverButton(), 200);
        }
        if (i === responses.length - 1 && lastClarAction) {
          setTimeout(() => showClarificationButtons(lastClarAction.chunkIndex, lastClarAction.excludeIndex), 100);
        }
        if (i === responses.length - 1 && r.action === "showBeginAnalysis") {
          setTimeout(() => showBeginAnalysisButton(), 100);
        }
        if (i === responses.length - 1 && responses.some(resp => resp.action === "showGuideOffer")) {
          setTimeout(() => showGuideOfferButtons(), 100);
        }
      }, i * 400);
    });
    if (chatbot.phase !== PHASES.SELECT_SOLILOQUY) {
      hideSoliloquyPicker();
    }
  }

  sendBtn.addEventListener("click", () => {
    const text = userInput.value.trim();
    if (text) {
      handleInput(text);
      userInput.value = "";
      autoResize();
    }
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  function autoResize() {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + "px";
  }
  userInput.addEventListener("input", autoResize);

  function addStartOverButton() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("message", "bot-message", "start-over-wrapper");
    const btn = document.createElement("button");
    btn.className = "start-over-btn";
    btn.textContent = "Start Over with a New Soliloquy";
    btn.addEventListener("click", startChat);
    wrapper.appendChild(btn);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function startChat() {
    chatMessages.innerHTML = "";
    chatbot.reset();
    const welcomeMsgs = chatbot.getWelcomeMessages();
    welcomeMsgs.forEach(m => addMessage(m.text, m.type));
    showSoliloquyPicker(soliloquies);
  }

  startChat();
});
