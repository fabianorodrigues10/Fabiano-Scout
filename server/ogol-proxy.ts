/**
 * Proxy para scraping do Ogol
 * Contorna a proteção Cloudflare usando headers apropriados
 */
import { Request, Response } from "express";

interface OgolData {
  nome?: string;
  posicao?: string;
  dataNascimento?: string;
  idade?: number;
  altura?: string;
  pe?: string;
  clube?: string;
  error?: string;
}

// Headers que contornam Cloudflare
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "DNT": "1",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Cache-Control": "max-age=0",
};

function extractField(html: string, label: string): string | null {
  const regex = new RegExp(
    `${label}[^<]*</[^>]*>[^<]*<[^>]*>([^<]+)`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function mapPosicao(ogolPos: string): string {
  const posMap: Record<string, string> = {
    goleiro: "Goleiro",
    "guarda-redes": "Goleiro",
    defensor: "Zagueiro",
    zagueiro: "Zagueiro",
    lateral: "Lateral",
    "lateral-esquerdo": "Lateral",
    "lateral-direito": "Lateral",
    volante: "Volante",
    médio: "Meia",
    meia: "Meia",
    extremo: "Extremo",
    ala: "Extremo",
    atacante: "Centroavante",
    "ponta-de-lança": "Centroavante",
    centroavante: "Centroavante",
    "2º atacante": "2º Atacante",
  };

  const normalized = ogolPos.toLowerCase().trim();
  return posMap[normalized] || ogolPos;
}

function mapPe(ogolPe: string): string {
  const peMap: Record<string, string> = {
    destro: "Destro",
    direito: "Destro",
    canhoto: "Canhoto",
    esquerdo: "Canhoto",
    ambidestro: "Ambidestro",
  };

  const normalized = ogolPe.toLowerCase().trim();
  return peMap[normalized] || ogolPe;
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;

  // Tenta formato DD/MM/YYYY
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [_, day, month, year] = match;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

function calculateAge(dateStr: string | null): number | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      age--;
    }

    return age;
  } catch {
    return null;
  }
}

export async function fetchOgolData(url: string): Promise<OgolData> {
  // Usar AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: HEADERS as any,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { error: `Erro ao acessar Ogol: ${response.status}` };
    }

    const html = await response.text();

    // Extrair dados usando regex
    const nome = extractField(html, "Nome");
    const posicaoRaw = extractField(html, "Posição");
    const dataRaw = extractField(html, "Data de Nascimento");
    const alturaRaw = extractField(html, "Altura");
    const peRaw = extractField(html, "Pé");
    const clubeRaw = extractField(html, "Clube");

    const dataNascimento = parseDate(dataRaw);
    const idade = calculateAge(dataNascimento);

    return {
      nome: nome || undefined,
      posicao: posicaoRaw ? mapPosicao(posicaoRaw) : undefined,
      dataNascimento: dataNascimento || undefined,
      idade: idade || undefined,
      altura: alturaRaw ? alturaRaw.replace(/[^\d.,]/g, "") : undefined,
      pe: peRaw ? mapPe(peRaw) : undefined,
      clube: clubeRaw || undefined,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    return { error: error.message || "Erro ao processar Ogol" };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function registerOgolProxyRoutes(app: any) {
  app.post("/api/ogol/fetch", async (req: Request, res: Response) => {
    try {
      const { url } = req.body as { url?: string };

      if (!url) {
        res.status(400).json({ error: "URL do Ogol é obrigatória" });
        return;
      }

      // Validar se é URL do Ogol
      if (!url.includes("ogol.com.br") && !url.includes("zerozero.pt")) {
        res.status(400).json({ error: "URL deve ser do Ogol ou ZeroZero" });
        return;
      }

      const data = await fetchOgolData(url);
      res.json(data);
    } catch (error: any) {
      console.error("[Ogol Proxy] Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
