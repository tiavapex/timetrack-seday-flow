import { describe, expect, it } from "vitest";
import { MODULOS, podeAcessar, podeSolicitar, moduloDaRota } from "@/lib/permissoes";
describe("Acessos por usuário", () => {
  it("DP acessa todos os módulos de trabalho exceto vagas", () => {
    for (const m of MODULOS.filter(m => m.key !== "usuarios")) expect(podeAcessar(["dp"], {}, m.key)).toBe(m.key !== "vagas");
    expect(podeAcessar(["dp"], { vagas:true }, "vagas")).toBe(false);
  });
  it("RH acessa abertura de vagas", () => expect(podeAcessar(["rh"], {}, "vagas")).toBe(true));
  it("supervisor solicita; DP e RH não aprovam ou solicitam por seu perfil", () => {
    expect(podeSolicitar(["supervisor"])).toBe(true);
    expect(podeSolicitar(["dp"])).toBe(false);
    expect(podeSolicitar(["rh"])).toBe(false);
  });
  it("administrador pode desabilitar um módulo por usuário", () => expect(podeAcessar(["supervisor"], { ferias:false }, "ferias")).toBe(false));
  it("habilitar módulos nunca concede gestão de usuários", () => expect(podeAcessar(["supervisor"], { usuarios:true }, "usuarios")).toBe(false));
  it("protege detalhes e formulários com a mesma permissão do módulo", () => {
    expect(moduloDaRota("/vagas/nova")).toBe("vagas"); expect(moduloDaRota("/ppo/ppc-motoristas")).toBe("ppo");
  });
});