const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

function addMessage(text, author, extraClass = "") {
  const div = document.createElement("div");
  div.className = `msg ${author} ${extraClass}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function santaTyping() {
  return addMessage("🎅 Papá Noel está escribiendo…", "santa", "typing");
}

function fakeSantaReply(userText) {
  const replies = [
    "Ho ho ho. Qué lindo leerte 🎄",
    "Me encanta lo que me contás. ¿Querés seguir charlando?",
    "Eso suena muy especial. Contame un poquito más ✨",
    "¡Qué buena idea! Seguro a los duendes les gustaría escuchar eso 🦌"
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  addMessage(text, "child");
  inputEl.value = "";

  const typingEl = santaTyping();

  setTimeout(() => {
    typingEl.remove();
    const reply = fakeSantaReply(text);
    addMessage(reply, "santa");
  }, 800);
}

sendBtn.addEventListener("click", sendMessage);

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Mensaje inicial
setTimeout(() => {
  addMessage("¡Ho ho ho! 🎅 Hola. ¿Cómo te llamás?", "santa");
}, 400);
