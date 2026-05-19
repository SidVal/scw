// docs/app/santaEngine.js

export function createSantaEngine(brain, storage, safety) {
  const state =
    storage.get("state") ??
    { flow: "onboarding", stepIndex: 0, slots: {} };

  function save() {
    storage.set("state", state);
  }

  function resetOnboarding() {
    state.flow = "onboarding";
    state.stepIndex = 0;
    state.slots = {};
    save();
  }

  function render(text) {
    if (!text) return "";

    return text.replaceAll(
      "{childName}",
      state.slots.childName ?? "amiguito o amiguita"
    );
  }

  function pick(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function detectIntent(text) {
    const t = text.toLowerCase();

    for (const intent of brain.intents) {
      const keywords = intent.keywords ?? [];

      if (keywords.some(keyword => t.includes(keyword.toLowerCase()))) {
        return intent.id;
      }
    }

    return "unknown";
  }

  function getFallbackReply() {
    const reply = pick(brain.replies?.fallback);

    return render(
      reply ??
      "Ho ho ho. Me quedé sin palabras mágicas por un momento. ¿Me lo contás de otra forma? 🎄"
    );
  }

  function boot() {
    if (state.flow === "onboarding") {
      const steps = brain.flows?.onboarding?.steps;
      const step = steps?.[state.stepIndex];

      if (!step) {
        resetOnboarding();
        return render(brain.flows.onboarding.steps[0].santa);
      }

      return render(step.santa);
    }

    return "¡Ho ho ho! 🎅 ¿De qué te gustaría hablar ahora?";
  }

  function handleNumberStep(currentStep, userText) {
    const cleanText = userText.trim();

    if (!/^\d+$/.test(cleanText)) {
      return {
        ok: false,
        reply: render(
          currentStep.on_invalid_numeric ??
          "¿Me lo decís solo con un numerito? 😊"
        )
      };
    }

    const n = Number(cleanText);

    if (n < 3) {
      return {
        ok: false,
        reply: render(
          currentStep.on_out_of_range?.under_age ??
          "¡Ho ho ho! Parece que sos muy pequeñito para escribir solo. Pedile ayuda a mamá, papá o un adulto. 🎄"
        )
      };
    }

    if (n > 12) {
      return {
        ok: false,
        reply: render(
          currentStep.on_out_of_range?.over_age ??
          "¡Ho ho ho! Parece que ya sos bastante grande. La magia de Navidad igual es para todos. 🎄"
        )
      };
    }

    if (currentStep.save_as) {
      state.slots[currentStep.save_as] = n;
    }

    return { ok: true };
  }

  function handleFreeTextStep(currentStep, userText) {
    if (currentStep.save_as) {
      state.slots[currentStep.save_as] = userText.trim().slice(0, 40);
    }

    return { ok: true };
  }

  function handleOnboarding(userText) {
    const flow = brain.flows?.onboarding;
    const steps = flow?.steps;
    const currentStep = steps?.[state.stepIndex];

    if (!currentStep) {
      resetOnboarding();
      return render(brain.flows.onboarding.steps[0].santa);
    }

    let result;
    
    if (currentStep.expect === "number_3_12") {
      result = handleNumberStep(currentStep, userText);
    } else if (currentStep.expect === "intent_choice") {
      state.flow = "chatting";
      state.stepIndex = 0;
      save();
    
      return handleChatting(userText);
    } else {
      result = handleFreeTextStep(currentStep, userText);
    }
    
    if (!result.ok) {
      return result.reply;
    }
    
    state.stepIndex += 1;

    if (state.stepIndex >= steps.length) {
      state.flow = "chatting";
      state.stepIndex = 0;
      save();

      return "¡Genial! 🎄 ¿Charlamos sobre tu lista de deseos o sobre la Navidad?";
    }

    save();

    return render(steps[state.stepIndex].santa);
  }

  function handleChatting(userText) {
    const intent = detectIntent(userText);
    const pool = brain.replies?.[intent] ?? brain.replies?.fallback;
    const reply = pick(pool);

    if (!reply) {
      return getFallbackReply();
    }

    return render(reply);
  }

  function next(userText) {
    const safetyResult = safety.check(userText);

    if (safetyResult.blocked) {
      return safetyResult.reply;
    }

    if (state.flow === "onboarding") {
      return handleOnboarding(userText);
    }

    return handleChatting(userText);
  }

  return { boot, next };
}
