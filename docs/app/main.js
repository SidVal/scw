//docs/app/main.js

import { createStorage } from "./storage.js";
import { createSafety } from "./safety.js";
import { createSantaEngine } from "./santaEngine.js";

const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// ✨ NOTA: Se eliminaron las líneas globales que daban error aquí arriba.

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

  // Filtra si son solo símbolos, caracteres individuales (salvo números) o vacío
  if (/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+$/.test(t)) return false;
  if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(t)) return false;
  if (t.length < 2 && !/^\d+$/.test(t)) return false;

  return true;
}

async function loadBrain() {
  // Ajustado a la ruta estándar de la estructura del proyecto
  const res = await fetch("./app/content/santa_brain.json");
  if (!res.ok) throw new Error("No se pudo cargar santa_brain.json");
  return res.json();
}

async function init() {
  const brain = await loadBrain();
  const storage = createStorage();
  const safety = createSafety();
  const santa = createSantaEngine(brain, storage, safety);

  // 🚀 Mensaje de bienvenida inicial (Boot dinámico del Onboarding)
  // Levanta el paso cero y lo pinta directo en la UI al arrancar.
  addMessage(santa.boot(), "santa");

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // 1. Filtrado de inputs inválidos en el Front
    if (!isValidUserInput(text)) {
      addMessage(
        "😊 ¿Me lo podés decir con palabras o un número? Así te entiendo mejor.",
        "santa"
      );
      inputEl.value = "";
      return;
    }

    // 2. Pintar mensaje del niño en UI y limpiar la caja
    addMessage(text, "child");
    inputEl.value = "";

    // 3. Bloquear UI temporalmente para evitar doble envío o spam
    inputEl.disabled = true;
    sendBtn.disabled = true;

    // 4. Mostrar feedback de "escribiendo..."
    const typingEl = santaTyping();

    // 5. El motor procesa el mensaje JUSTO ANTES de responder en la UI.
    const reply = santa.next(text);

    // Calcular delay natural basado en la longitud del texto final de Papá Noel
    const typingTime = Math.min(
      2500,
      Math.max(1200, 800 + reply.length * 20)
    );

    // 6. Entregar la respuesta con delay lúdico
    setTimeout(() => {
      typingEl.remove();
      addMessage(reply, "santa");

      // Rehabilitar controles y devolver el foco a la caja de texto
      inputEl.disabled = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }, typingTime);
  }

  // Event Listeners únicos
  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
}

init().catch(err => {
  console.error(err);
  addMessage("Ups. Papá Noel se perdió entre los regalos 🎁", "santa");
});
