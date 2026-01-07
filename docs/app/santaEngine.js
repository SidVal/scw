export function createSantaEngine(brain, storage, safety) {
  const state = storage.get("state") ?? { flow: "onboarding", stepIndex: 0, slots: {} };

  function saveState() {
    storage.set("state", state);
  }

  function render(template) {
    return template.replaceAll("{childName}", state.slots.childName ?? "amiguito o amiguita");
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function detectIntent(text) {
    const t = text.toLowerCase();
    for (const it of brain.intents.intents) {
      if (it.keywords.some(k => t.includes(k))) return it.id;
    }
    return "unknown";
  }

  function nextSantaMessage(userText) {
    // 1) Safety gate
    const safetyResult = safety.check(userText);
    if (safetyResult.blocked) {
      return { text: safetyResult.reply, meta: { type: "safety" } };
    }

    // 2) Flow logic
    if (state.flow === "onboarding") {
      const flow = brain.flows.onboarding;
      const step = flow.steps[state.stepIndex];

      // Guardar slots segun step.expect (mínimo)
      if (step.save_as) {
        if (step.expect === "number_3_12") {
          const n = parseInt(userText, 10);
          if (!Number.isFinite(n) || n < 3 || n > 12) {
            return { text: "¿Me lo decís con un número del 3 al 12? 😊", meta: { type: "clarify" } };
          }
          state.slots[step.save_as] = n;
        } else {
          state.slots[step.save_as] = userText.trim().slice(0, 40);
        }
      }

      state.stepIndex += 1;
      if (state.stepIndex >= flow.steps.length) {
        state.flow = "chatting";
        state.stepIndex = 0;
      }

      saveState();

      const nextStep = (state.flow === "onboarding")
        ? brain.flows.onboarding.steps[state.stepIndex]
        : { santa: "¡Listo! ¿Querés hablar de tu lista de deseos, de renos o de la Navidad?" };

      return { text: render(nextStep.santa), meta: { type: "flow" } };
    }

    // 3) Chatting logic by intent
    const intent = detectIntent(userText);
    const pool = brain.replies[intent] ?? null;

    if (!pool) {
      return { text: render("Ho ho ho. No estoy seguro de haber entendido. ¿Querés contarme qué te gustaría pedir o qué te hace feliz en Navidad?"), meta: { type: "fallback" } };
    }

    return { text: render(pick(pool)), meta: { type: "intent", intent } };
  }

  // Mensaje inicial
  function boot() {
    if (state.flow === "onboarding") {
      const step = brain.flows.onboarding.steps[state.stepIndex];
      return { text: render(step.santa), meta: { type: "boot" } };
    }
    return { text: render("¡Ho ho ho! ¡Qué alegría verte! ¿En qué pensamos hoy?"), meta: { type: "boot" } };
  }

  return { boot, nextSantaMessage };
}
