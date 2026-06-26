export const DISCLAIMER =
  "Lectura simbólica inspirada en la tarología de Jodorowsky y en el Tarot de Marsella. No predice el futuro, no diagnostica y no sustituye ayuda profesional.";

export function esConsultaSensitiva(texto = "") {
  const normalizado = texto.toLowerCase();
  return /\b(salud|diagnostico|diagnóstico|diagnosticar|medicina|legal|abogado|finanzas|inversion|inversión|suicidio|autolesion|autolesión)\b/.test(normalizado);
}
