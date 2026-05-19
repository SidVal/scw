// docs/app/santaEngine.js
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

  function resetOnboarding() {
  state.flow = "onboarding";
  state.stepIndex = 0;
  state.slots = {};
  save();
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
        const cleanText = userText.trim();
      
        if (!/^\d+$/.test(cleanText)) {
          return render(
            currentStep.on_invalid_numeric ??
            "¿Me lo decís solo con un numerito? 😊"
          );
        }
      
        const n = Number(cleanText);
      
        if (n < 3) {
          return render(
            currentStep.on_out_of_range?.under_age ??
            "¡Ho ho ho! Parece que sos muy pequeñito para escribir solo. Pedile ayuda a mamá, papá o un adulto. 🎄"
          );
        }
      
        if (n > 12) {
          return render(
            currentStep.on_out_of_range?.over_age ??
            "¡Ho ho ho! Parece que ya sos bastante grande. La magia de Navidad igual es para todos. 🎄"
          );
        }
      
        if (currentStep.save_as) {
          state.slots[currentStep.save_as] = n;
        }
      } else {
        if (currentStep.save_as) {
          state.slots[currentStep.save_as] = userText.trim().slice(0, 40);
        }
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
    const pool = brain.replies[intent] ?? brain.replies.fallback;
    
    if (!pool || pool.length === 0) {
      return "Ho ho ho. Me quedé sin palabras mágicas por un momento. ¿Me lo contás de otra forma? 🎄";
    }
    
    return render(pick(pool));
  }

  return { boot, next };
}
