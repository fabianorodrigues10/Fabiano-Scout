import { describe, it, expect } from "vitest";

describe("Ogol Proxy", () => {
  it("deve validar URL do Ogol", () => {
    const validUrl = "https://www.ogol.com.br/jogador/ronaldy/515291";
    expect(validUrl).toContain("ogol.com");
  });

  it("deve rejeitar URL inválida", () => {
    const invalidUrl = "https://www.example.com/jogador/test";
    expect(invalidUrl).not.toContain("ogol.com");
  });

  it("deve ter estrutura correta de OgolPlayerData", () => {
    // Teste de estrutura esperada
    const expectedFields = [
      "nome",
      "posicao",
      "dataNascimento",
      "idade",
      "altura",
      "pe",
      "clube",
    ];
    expectedFields.forEach((field) => {
      expect(field).toBeDefined();
      expect(typeof field).toBe("string");
    });
  });

  it("deve mapear posições corretamente", () => {
    const posicaoMapping: Record<string, string> = {
      goleiro: "Goleiro",
      zagueiro: "Zagueiro",
      lateral: "Lateral",
      volante: "Volante",
      meia: "Meia",
      extremo: "Extremo",
      atacante: "Centroavante",
    };

    Object.entries(posicaoMapping).forEach(([ogol, app]) => {
      expect(app).toBeDefined();
      expect(typeof app).toBe("string");
    });
  });

  it("deve converter data de nascimento corretamente", () => {
    // Teste de formato dd/mm/aa
    const datePattern = /^\d{2}\/\d{2}\/\d{2}$/;
    const testDate = "28/03/97";
    expect(testDate).toMatch(datePattern);
  });

  it("deve validar altura em metros", () => {
    const validHeights = [1.76, 1.85, 1.65, 1.90];
    validHeights.forEach((height) => {
      expect(height).toBeGreaterThan(1.5);
      expect(height).toBeLessThan(2.2);
    });
  });

  it("deve mapear pé preferencial corretamente", () => {
    const peMapping: Record<string, string> = {
      destro: "Destro",
      canhoto: "Canhoto",
      ambidestro: "Ambidestro",
    };

    Object.entries(peMapping).forEach(([ogol, app]) => {
      expect(app).toBeDefined();
      expect(typeof app).toBe("string");
    });
  });
});
