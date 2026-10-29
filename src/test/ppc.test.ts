import { describe, it, expect } from "vitest";
import { calcularPPC, periodoPPC } from "@/lib/ppc";

describe("PPC Motoristas", () => {
  it("pontuação integral paga R$ 600", () => {
    expect(calcularPPC({}, 40, 60)).toEqual({ admOk: true, pontos: 100, valor: 600 });
  });
  it("descumprir item administrativo zera o prêmio", () => {
    expect(calcularPPC({ "1.3": false }, 40, 60).valor).toBe(0);
  });
  it("desconto proporcional nos pilares", () => {
    expect(calcularPPC({}, 30, 50).valor).toBe(480);
  });
  it("período de apuração vai de 26 a 25", () => {
    expect(periodoPPC(new Date(2026, 9, 29))).toEqual({ inicio: "2026-10-26", fim: "2026-11-25" });
    expect(periodoPPC(new Date(2026, 9, 10))).toEqual({ inicio: "2026-09-26", fim: "2026-10-25" });
  });
});
