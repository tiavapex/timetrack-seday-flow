import { describe, it, expect } from "vitest";
import { calcularPPOMotoristas } from "@/lib/ppo-motoristas";
describe("PPO por viagens", () => {
  it("quatro viagens não pagam", () => expect(calcularPPOMotoristas([{ viagens: 4, meias_viagens: 0, tara: true }]).valor).toBe(0));
  it("cinco viagens pagam todas desde a primeira a R$ 15", () => expect(calcularPPOMotoristas([{ viagens: 5, meias_viagens: 0, tara: true }]).valor).toBe(75));
  it("meia viagem conta metade e paga R$ 7,50", () => expect(calcularPPOMotoristas([{ viagens: 5, meias_viagens: 1, tara: true }])).toMatchObject({ validas: 5.5, valor: 82.5 }));
  it("sem tara o turno não conta para o mínimo", () => expect(calcularPPOMotoristas([{ viagens: 4, meias_viagens: 0, tara: true }, { viagens: 2, meias_viagens: 0, tara: false }])).toMatchObject({ realizadas: 6, desconsideradas: 2, validas: 4, valor: 0 }));
});