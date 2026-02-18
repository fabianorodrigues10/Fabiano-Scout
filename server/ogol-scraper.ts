/**
 * Ogol Scraper - Extrai dados de atletas do site ogol.com.br
 * Faz fetch da página HTML e parseia os dados pessoais do jogador.
 */
import { Request, Response } from "express";

export interface OgolPlayerData {
  nome: string | null;
  posicao: string | null;
  dataNascimento: string | null; // ISO format YYYY-MM-DD
  idade: number | null;
  altura: number | null; // em metros (ex: 1.76)
  pe: string | null; // "direito" | "esquerdo" | "ambidestro"
  clube: string | null;
}

/**
 * Mapeia posição do Ogol para as categorias do app
 */
function mapPosicao(ogolPos: string | null): string | null {
  if (!ogolPos) return null;
  const pos = ogolPos.toLowerCase().trim();

  // Mapeamento direto
  const mapping: Record<string, string> = {
    goleiro: "Goleiro",
    "guarda-redes": "Goleiro",
    zagueiro: "Zagueiro",
    "defesa central": "Zagueiro",
    defensor: "Zagueiro",
    lateral: "Lateral",
    "lateral direito": "Lateral",
    "lateral esquerdo": "Lateral",
    volante: "Volante",
    "médio defensivo": "Volante",
    "meio-campista": "Meia",
    médio: "Meia",
    meia: "Meia",
    "meia-atacante": "Meia",
    "médio ofensivo": "Meia",
    extremo: "Extremo",
    ponta: "Extremo",
    "ponta direita": "Extremo",
    "ponta esquerda": "Extremo",
    atacante: "Centroavante",
    avançado: "Centroavante",
    centroavante: "Centroavante",
    "segundo avançado": "2º Atacante",
  };

  if (mapping[pos]) return mapping[pos];
  for (const [key, value] of Object.entries(mapping)) {
    if (pos.includes(key) || key.includes(pos)) return value;
  }
  return ogolPos.charAt(0).toUpperCase() + ogolPos.slice(1);
}

/**
 * Mapeia pé preferencial do Ogol para o formato do app
 */
function mapPe(ogolPe: string | null): string | null {
  if (!ogolPe) return null;
  const pe = ogolPe.toLowerCase().trim();
  if (pe === "destro" || pe === "direito") return "direito";
  if (pe === "canhoto" || pe === "esquerdo") return "esquerdo";
  if (pe === "ambidestro" || pe.includes("ambos")) return "ambidestro";
  return null;
}

/**
 * Extrai o valor de um campo do HTML do Ogol.
 */
function extractField(html: string, label: string): string | null {
  // Find the label position first
  const labelRegex = new RegExp(label, "i");
  const labelMatch = html.match(labelRegex);
  if (!labelMatch || labelMatch.index === undefined) return null;

  // Get everything after the label
  const afterLabel = html.substring(
    labelMatch.index + labelMatch[0].length
  );

  // Pattern 1: card-data__value content (most common in real Ogol HTML)
  const valueMatch = afterLabel.match(
    /card-data__value[s]?"[^>]*>(?:\s*(?:<[^>]+>\s*)*)?([^<]+)/i
  );
  if (valueMatch?.[1]?.trim()) return valueMatch[1].trim();

  // Pattern 2: direct text after closing tag
  const directMatch = afterLabel.match(/<\/span>\s*<[^>]+>\s*([^<]+)/i);
  if (directMatch?.[1]?.trim()) return directMatch[1].trim();

  // Pattern 3: plain text on same line
  const plainMatch = afterLabel.match(/^\s+([^\n<]+)/);
  if (plainMatch?.[1]?.trim()) return plainMatch[1].trim();

  return null;
}

/**
 * Parseia HTML do Ogol e extrai dados do jogador
 */
function parseOgolHtml(html: string): OgolPlayerData {
  const result: OgolPlayerData = {
    nome: null,
    posicao: null,
    dataNascimento: null,
    idade: null,
    altura: null,
    pe: null,
    clube: null,
  };

  // Nome completo
  const nomeRaw = extractField(html, "Nome");
  if (nomeRaw && nomeRaw.length > 2) {
    result.nome = nomeRaw;
  }

  // Data de nascimento e idade
  const dataRaw = extractField(html, "Data de Nascimento");
  if (dataRaw) {
    const dataMatch = dataRaw.match(
      /(\d{4}-\d{2}-\d{2})\s*\((\d+)\s*anos?\)/
    );
    if (dataMatch) {
      result.dataNascimento = dataMatch[1];
      result.idade = parseInt(dataMatch[2], 10);
    }
  }

  // Posição
  const posRaw = extractField(html, "Posi(?:ção|çao|cao|ção)");
  if (posRaw && posRaw.length < 30) {
    result.posicao = mapPosicao(posRaw);
  }

  // Pé preferencial
  const peRaw = extractField(html, "P(?:é|e) preferencial");
  if (peRaw) {
    result.pe = mapPe(peRaw);
  }

  // Altura
  const alturaRaw = extractField(html, "Altura");
  if (alturaRaw) {
    const altMatch = alturaRaw.match(/(\d{3})\s*cm/);
    if (altMatch) {
      const cm = parseInt(altMatch[1], 10);
      result.altura = parseFloat((cm / 100).toFixed(2));
    }
  }

  // Clube atual
  const clubeRaw = extractField(html, "Clube atual");
  if (clubeRaw && clubeRaw !== "Sem Clube" && clubeRaw.length > 1) {
    result.clube = clubeRaw;
  }

  return result;
}

/**
 * Registra a rota Express para scraping do Ogol
 */
export function registerOgolRoutes(app: any) {
  app.post("/api/ogol/scrape", async (req: Request, res: Response) => {
    try {
      const { url } = req.body as { url?: string };

      if (!url) {
        res.status(400).json({ error: "URL é obrigatória" });
        return;
      }

      // Validar que é uma URL do Ogol
      if (!url.includes("ogol.com")) {
        res.status(400).json({ error: "URL deve ser do site ogol.com.br" });
        return;
      }

      console.log(`[Ogol Scraper] Fetching: ${url}`);

      // Fetch da página com headers que contornam Cloudflare
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        },
      });

      if (!response.ok) {
        res.status(502).json({ error: `Erro ao acessar o Ogol: ${response.status}` });
        return;
      }

      // Decodificar HTML com tratamento de encoding
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const html = decoder.decode(buffer);

      console.log(`[Ogol Scraper] HTML length: ${html.length}`);

      // Parsear os dados
      const data = parseOgolHtml(html);
      console.log(`[Ogol Scraper] Parsed data:`, JSON.stringify(data));

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[Ogol Scraper] Error:", error);
      res.status(500).json({ error: error.message || "Erro ao extrair dados do Ogol" });
    }
  });
}
