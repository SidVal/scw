import { createStorage } from "./storage.js";
import { createSafety } from "./safety.js";
import { createSantaEngine } from "./santaEngine.js";

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

function isValidUserInput(text) {
  const t = text.trim();

  if (/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+$/.test(t)) return false;
  if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(t)) return false;
  if (t.length < 2 && !/^\d+$/.test(t)) return false;

  return true;
}

async function loadBrain() {
  const res = await fetch("./app/content/santa_brain.json");
  if (!res.ok) throw new Error("No se pudo cargar santa_brain.json");
  return res.json();
}

async function init() {
  const brain = await loadBrain();
  const storage = createStorage();
  const safety = createSafety();
  const santa = createSantaEngine(brain, storage, safety);

  addMessage(santa.boot(), "santa");

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    if (!isValidUserInput(text)) {
      addMessage(
        "😊 ¿Me lo podés decir con palabras o un número? Así te entiendo mejor.",
        "santa"
      );
      inputEl.value = "";
      return;
    }

    addMessage(text, "child");
    inputEl.value = "";

    const typingEl = santaTyping();
    const reply = santa.next(text);
    const typingTime = Math.min(
      2500,
      Math.max(1200, 800 + reply.length * 20)
    );

    setTimeout(() => {
      typingEl.remove();
      addMessage(reply, "santa");
    }, typingTime);
  }

  // ✅ EVENT LISTENERS SE REGISTRAN UNA SOLA VEZ
  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
}

init().catch(err => {
  console.error(err);
  addMessage("Ups. Papá Noel se perdió entre los regalos 🎁", "santa");
});
