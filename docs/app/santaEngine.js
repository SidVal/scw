export function createSantaEngine(brain, storage, safety) {
  const state =
    storage.get("state") ??
    { flow: "onboarding", stepIndex: 0, slots: {} };

  function save() {
    storage.set("state", state);
  }

  function render(text) {
    if (!text) return "";
    return text.replaceAll(
      "{childName}",
      state.slots.childName ?? "amiguito o amiguita"
    );
  }

  function pick(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function detectIntent(text) {
    const t = text.toLowerCase();
    for (const it of brain.intents) {
      if (it.keywords.some(k => t.includes(k))) return it.id;
    }
    return "unknown";
  }

  function boot() {
    if (state.flow === "onboarding") {
      const step = brain.flows.onboarding.steps[state.stepIndex];
      return render(step.santa);
    }
    return "¡Ho ho ho! 🎅 ¿De qué te gustaría hablar ahora?";
  }

  function next(userText) {
    // 1. Escudo de seguridad perimetral
    const safetyResult = safety.check(userText);
    if (safetyResult.blocked) {
      return safetyResult.reply;
    }

    // 2. Flujo Onboarding guiado por Pasos
    if (state.flow === "onboarding") {
      const flow = brain.flows.onboarding;
      const currentStep = flow.steps[state.stepIndex];

      // Validar inputs específicos por paso antes de avanzar
      if (currentStep.expect === "number_3_12") {
        const n = parseInt(userText, 10);
        if (!Number.isFinite(n) || n < 3 || n > 12) {
          return "¿Me lo decís con un número entre 3 y 12? 😊";
        }
        if (currentStep.save_as) state.slots[currentStep.save_as] = n;
      } else {
        if (currentStep.save_as) state.slots[currentStep.save_as] = userText.trim().slice(0, 40);
      }

      // Avanzar al siguiente paso del flujo
      state.stepIndex += 1;

      // Si terminamos los pasos del onboarding, pasamos a chat libre
      if (state.stepIndex >= flow.steps.length) {
        state.flow = "chatting";
        state.stepIndex = 0;
        save();
        // Fallback seguro si el brain no define un saludo genérico de chat libre
        return "¡Genial! 🎄 ¿Charlamos sobre tu lista de deseos o sobre la Navidad?";
      }

      save();
      // Renderiza dinámicamente el diálogo de Santa configurado en el cerebro para este paso
      return render(flow.steps[state.stepIndex].santa);
    }

    // 3. Flujo Abierto de Mensajería (Chatting) basado en Intents
    const intent = detectIntent(userText);
    const pool = brain.replies[intent];

    if (!pool) {
      return "Ho ho ho. No estoy seguro de haber entendido. ¿Querés contarme algo lindo de la Navidad? ✨";
    }

    return render(pick(pool));
  }

  return { boot, next };
}
