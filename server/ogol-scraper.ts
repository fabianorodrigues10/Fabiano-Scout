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
 * Extrai texto entre dois marcadores no HTML/texto
 */
function extractBetween(text: string, before: string, after: string): string | null {
  const startIdx = text.indexOf(before);
  if (startIdx === -1) return null;
  const contentStart = startIdx + before.length;
  const endIdx = text.indexOf(after, contentStart);
  if (endIdx === -1) return null;
  return text.substring(contentStart, endIdx).trim();
}

/**
 * Remove tags HTML de um texto
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
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
    "médio": "Meia",
    meia: "Meia",
    "meia-atacante": "Meia",
    "médio ofensivo": "Meia",
    extremo: "Extremo",
    "ponta": "Extremo",
    "ponta direita": "Extremo",
    "ponta esquerda": "Extremo",
    atacante: "Centroavante",
    avançado: "Centroavante",
    centroavante: "Centroavante",
    "segundo avançado": "2º Atacante",
  };

  // Tentar match exato
  if (mapping[pos]) return mapping[pos];

  // Tentar match parcial
  for (const [key, value] of Object.entries(mapping)) {
    if (pos.includes(key) || key.includes(pos)) return value;
  }

  // Retornar o original capitalizado se não encontrar mapeamento
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
 * Parseia os dados pessoais do HTML da página do Ogol
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

  // Nome completo - procurar na seção de dados pessoais
  // Padrão: "Nome" seguido do nome completo
  const nomePatterns = [
    /Nome\s*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/i,
    /Nome\s*([A-ZÀ-Ú][^<\n]{3,})/i,
    /nome completo[^>]*>?\s*(?:é\s+)?([A-ZÀ-Ú][^.<\n]{3,})/i,
  ];
  for (const pattern of nomePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      result.nome = match[1].trim();
      break;
    }
  }

  // Data de nascimento - formato: "1997-03-28 (28 anos)"
  const dataMatch = html.match(/Data de Nascimento[^>]*>?\s*(\d{4}-\d{2}-\d{2})\s*\((\d+)\s*anos?\)/i);
  if (dataMatch) {
    result.dataNascimento = dataMatch[1];
    result.idade = parseInt(dataMatch[2], 10);
  }

  // Posição
  const posPatterns = [
    /Posi[çc][ãa]o\s*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/i,
    /Posi[çc][ãa]o\s*([A-ZÀ-Ú][a-zà-ú\s-]+)/i,
  ];
  for (const pattern of posPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const rawPos = match[1].trim();
      if (rawPos.length < 30) { // sanity check
        result.posicao = mapPosicao(rawPos);
      }
      break;
    }
  }

  // Pé preferencial
  const pePatterns = [
    /P[ée] preferencial\s*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/i,
    /P[ée] preferencial\s*([A-ZÀ-Ú][a-zà-ú]+)/i,
  ];
  for (const pattern of pePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      result.pe = mapPe(match[1].trim());
      break;
    }
  }

  // Altura - formato: "176 cm" ou "176 cm / 74 kg"
  const alturaMatch = html.match(/Altura\s*(?:\/\s*Peso)?\s*(?:<\/[^>]+>\s*<[^>]+>\s*)?(\d{3})\s*cm/i);
  if (alturaMatch) {
    const cm = parseInt(alturaMatch[1], 10);
    result.altura = parseFloat((cm / 100).toFixed(2));
  }

  // Clube atual
  const clubePatterns = [
    /Clube atual\s*<\/[^>]+>\s*(?:<[^>]+>\s*)*([^<]+)/i,
    /Clube atual\s*([A-ZÀ-Ú][^<\n]{1,50})/i,
  ];
  for (const pattern of clubePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const clube = match[1].trim();
      if (clube !== "Sem Clube" && clube.length > 1) {
        result.clube = clube;
      }
      break;
    }
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

      // Fetch da página
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

      const html = await response.text();
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
