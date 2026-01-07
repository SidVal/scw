export function createSantaEngine(brain, storage, safety) {
  const state =
    storage.get("state") ??
    { flow: "onboarding", stepIndex: 0, slots: {} };

  function save() {
    storage.set("state", state);
  }

  function render(text) {
    return text.replaceAll(
      "{childName}",
      state.slots.childName ?? "amiguito o amiguita"
    );
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

  function boot() {
    if (state.flow === "onboarding") {
      const step = brain.flows.onboarding.steps[state.stepIndex];
      return render(step.santa);
    }
    return "¡Ho ho ho! 🎅 ¿De qué te gustaría hablar ahora?";
  }

  function next(userText) {
    const safetyResult = safety.check(userText);
    if (safetyResult.blocked) {
      return safetyResult.reply;
    }

    if (state.flow === "onboarding") {
      const flow = brain.flows.onboarding;
      const step = flow.steps[state.stepIndex];

      if (step.save_as) {
        if (step.expect === "number_3_12") {
          const n = parseInt(userText, 10);
          if (!Number.isFinite(n) || n < 3 || n > 12) {
            return "¿Me lo decís con un número entre 3 y 12? 😊";
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
        save();
        return "¡Genial! 🎄 ¿Charlamos sobre tu lista de deseos o sobre la Navidad?";
      }

      save();
      return render(flow.steps[state.stepIndex].santa);
    }

    const intent = detectIntent(userText);
    const pool = brain.replies[intent];

    if (!pool) {
      return "Ho ho ho. No estoy seguro de haber entendido. ¿Querés contarme algo lindo de la Navidad? ✨";
    }

    return render(pick(pool));
  }

  return { boot, next };
}
