export type TurnoMotorista = { viagens: number; meias_viagens: number; tara: boolean };
export function calcularPPOMotoristas(turnos: TurnoMotorista[]) {
  let realizadas = 0;
  let desconsideradas = 0;
  for (const t of turnos) {
    const viagens = Math.max(0, t.viagens) + Math.max(0, t.meias_viagens) * 0.5;
    realizadas += viagens;
    if (!t.tara) desconsideradas += viagens;
  }
  const validas = realizadas - desconsideradas;
  return { realizadas, desconsideradas, validas, elegivel: validas >= 5, valor: validas >= 5 ? validas * 15 : 0 };
}