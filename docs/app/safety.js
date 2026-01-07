export function createSafety() {
  const patterns = [
    { re: /\b(dirección|domicilio|calle|altura)\b/i, reply: "Eso es información privada. Mejor no la compartas. ¿Querés contarme tu color favorito? 🎄" },
    { re: /\b(teléfono|celular|whatsapp|instagram|tiktok)\b/i, reply: "Las redes y teléfonos son privados. Contame mejor. ¿Qué te gustaría hacer en vacaciones? ❄️" },
    { re: /\b(colegio|escuela)\b/i, reply: "Eso es personal. Mejor hablemos de cosas navideñas. ¿Te gustan los renos o los duendes? 🦌" }
  ];

  function check(text) {
    for (const p of patterns) {
      if (p.re.test(text)) return { blocked: true, reply: p.reply };
    }
    return { blocked: false };
  }

  return { check };
}
