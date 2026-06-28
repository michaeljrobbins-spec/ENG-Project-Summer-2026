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

  function handleInput(text) {
    if (!text.trim()) return;
    addMessage(text, "user");
    const responses = chatbot.processInput(text);
    responses.forEach((r, i) => {
      setTimeout(() => {
        addMessage(r.text, r.type, r.className);
        if (r.action === "reset") {
          setTimeout(startChat, 500);
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

  function startChat() {
    chatMessages.innerHTML = "";
    chatbot.reset();
    const welcomeMsgs = chatbot.getWelcomeMessages();
    welcomeMsgs.forEach(m => addMessage(m.text, m.type));
    showSoliloquyPicker(soliloquies);
  }

  startChat();
});
