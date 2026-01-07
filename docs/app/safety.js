export function createSafety() {
  const rules = [
    {
      re: /\b(dirección|domicilio|calle|altura)\b/i,
      reply: "Eso es información privada. Mejor no compartirla. ¿Querés contarme tu color favorito? 🎄"
    },
    {
      re: /\b(teléfono|celular|whatsapp|instagram|tiktok)\b/i,
      reply: "Los teléfonos y redes son privados. Mejor hablemos de Navidad ❄️"
    },
    {
      re: /\b(colegio|escuela)\b/i,
      reply: "Eso es algo personal. ¿Te gustan los renos o los duendes? 🦌"
    }
  ];

  function check(text) {
    for (const r of rules) {
      if (r.re.test(text)) {
        return { blocked: true, reply: r.reply };
      }
    }
    return { blocked: false };
  }

  return { check };
}
