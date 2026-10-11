import { describe, expect, test } from "bun:test";
import { formatarTempoLimite, proximoReinicioDiario } from "../src/lib/trilha-limite";

describe("Contador do limite diário", () => {
  test("usa meia-noite de Brasília mesmo quando a data UTC já virou", () => {
    const agora = new Date("2026-10-11T01:00:00Z");
    const reinicio = proximoReinicioDiario(agora);
    expect(new Date(reinicio).toISOString()).toBe("2026-10-11T03:00:00.000Z");
    expect(formatarTempoLimite(reinicio, agora.getTime())).toBe("02:00");
  });
  test("reinicia após a meia-noite e trata a virada do mês", () => {
    expect(new Date(proximoReinicioDiario(new Date("2026-11-01T03:00:00Z"))).toISOString())
      .toBe("2026-11-02T03:00:00.000Z");
    expect(new Date(proximoReinicioDiario(new Date("2026-11-01T02:59:59.999Z"))).toISOString())
      .toBe("2026-11-01T03:00:00.000Z");
  });
  test("exibe horas e minutos sem antecipar o fim nem ficar negativo", () => {
    expect(formatarTempoLimite(120_001, 0)).toBe("00:03");
    expect(formatarTempoLimite(1, 0)).toBe("00:01");
    expect(formatarTempoLimite(0, 1)).toBe("00:00");
  });
});
