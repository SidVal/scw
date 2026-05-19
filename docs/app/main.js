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
  const url = "./app/content/santa_brain.json";

  let res;

  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (err) {
    throw new Error(`No se pudo conectar para cargar ${url}`);
  }

  if (!res.ok) {
    throw new Error(`No se pudo cargar ${url}. HTTP ${res.status}`);
  }

  let brain;

  try {
    brain = await res.json();
  } catch (err) {
    throw new Error(`El archivo ${url} no es un JSON válido`);
  }

  validateBrain(brain);

  return brain;
}

function validateBrain(brain) {
  if (!brain || typeof brain !== "object") {
    throw new Error("El brain debe ser un objeto");
  }

  if (!Array.isArray(brain.intents)) {
    throw new Error("brain.intents debe ser un array");
  }

  if (!brain.replies || typeof brain.replies !== "object" || Array.isArray(brain.replies)) {
    throw new Error("brain.replies debe ser un objeto");
  }

  if (!brain.flows || typeof brain.flows !== "object" || Array.isArray(brain.flows)) {
    throw new Error("brain.flows debe ser un objeto");
  }

  if (!brain.flows.onboarding || !Array.isArray(brain.flows.onboarding.steps)) {
    throw new Error("brain.flows.onboarding.steps debe ser un array");
  }

  if (!brain.replies.fallback || !Array.isArray(brain.replies.fallback)) {
    throw new Error("brain.replies.fallback debe existir y ser un array");
  }
}

async function init() {
  const brain = await loadBrain();
  const storage = createStorage();
  const safety = createSafety();
  const santa = createSantaEngine(brain, storage, safety);

  // 🚀 Mensaje de bienvenida inicial (Boot dinámico del Onboarding)
  // Levanta el paso cero y lo pinta directo en la UI al arrancar.
  addMessage(santa.boot(), "santa");

    function handleDebugCommand(text) {
    const command = text.trim().toLowerCase();
  
    if (command === "/reset" || command === "/exit") {
      inputEl.disabled = true;
      sendBtn.disabled = true;
  
      storage.clear();
      inputEl.value = "";
      addMessage("🛷 Reiniciando la magia de Navidad...", "santa");
  
      setTimeout(() => {
        window.location.reload();
      }, 700);
  
      return true;
    }
  
    return false;
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // Comandos internos de depuración
    if (handleDebugCommand(text)) {
      return;
    }

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

    let reply =
      "Ups. Se me mezclaron unos regalos en el taller 🎁 ¿Me repetís eso de nuevo?";

    try {
      // 5. El motor procesa el mensaje antes de responder en la UI
      reply = santa.next(text);
    } catch (err) {
      console.error(err);
    }

    const typingTime = Math.min(
      2500,
      Math.max(1200, 800 + reply.length * 20)
    );

    setTimeout(() => {
      try {
        typingEl.remove();
        addMessage(reply, "santa");
      } catch (err) {
        console.error(err);
      } finally {
        // Pase lo que pase, la UI vuelve a estar disponible
        inputEl.disabled = false;
        sendBtn.disabled = false;
        inputEl.focus();
      }
    }, typingTime);
  }

  // Event listeners únicos
  sendBtn.addEventListener("click", sendMessage);

  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });
}

init().catch(err => {
  console.error(err);
  addMessage("Ups. Papá Noel se perdió entre los regalos 🎁", "santa");
});
