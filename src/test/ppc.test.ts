import { describe, it, expect } from "vitest";
import { calcularPPC, periodoPPC, pontosSeguranca, pontosOperacao, descontoDano, PPC_SEGURANCA, PPC_OPERACAO } from "@/lib/ppc";

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
  it.each(PPC_SEGURANCA)("indicador $key desconta $pontos de Segurança", ({key,pontos}) => {
    expect(pontosSeguranca({ [key]: false })).toBe(40 - pontos);
  });
  it.each(PPC_OPERACAO)("indicador $key desconta $pontos de Operação", ({key,pontos}) => {
    expect(pontosOperacao({ [key]: false })).toBe(60 - pontos);
  });
  it.each([["baixo",2],["medio",3],["alto",5]] as const)("incidente %s desconta somente %i", (incidente, pontos) => expect(pontosSeguranca({incidente})).toBe(40-pontos));
  it("dano até R$ 500 desconta 2", () => expect(descontoDano(500)).toBe(2));
  it("dano acima de R$ 500 até R$ 1.000 desconta 3", () => { expect(descontoDano(500.01)).toBe(3); expect(descontoDano(1000)).toBe(3); });
  it("dano acima de R$ 1.000 desconta 5", () => expect(descontoDano(1000.01)).toBe(5));
  it("RH não desfaz falta apontada pela Operação", () => expect(calcularPPC({"1.1.operacional":false,"1.1.rh":true},40,60).valor).toBe(0));
  it("período de apuração vai de 26 a 25", () => {
    expect(periodoPPC(new Date(2026, 9, 29))).toEqual({ inicio: "2026-10-26", fim: "2026-11-25" });
    expect(periodoPPC(new Date(2026, 9, 10))).toEqual({ inicio: "2026-09-26", fim: "2026-10-25" });
  });
});
