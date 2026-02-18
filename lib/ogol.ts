/**
 * Ogol Scraper - Extrai dados de atletas do site ogol.com.br
 * 
 * Estratégia:
 * - Web: usa endpoint proxy no servidor que contorna Cloudflare
 * - Celular: usa WebView oculta que passa como navegador real
 */

import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

export interface OgolPlayerData {
  nome: string | null;
  posicao: string | null;
  dataNascimento: string | null; // formato dd/mm/aa
  idade: number | null;
  altura: number | null; // em metros (ex: 1.76)
  pe: string | null; // "direito" | "esquerdo" | "ambidestro"
  clube: string | null;
}

/**
 * Mapeia posição do Ogol para as categorias do app
 */
export function mapPosicao(ogolPos: string): string {
  const pos = ogolPos.toLowerCase().trim();
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
    "ponta de lança": "Centroavante",
    "2º atacante": "2º Atacante",
  };
  return mapping[pos] || ogolPos;
}

/**
 * Mapeia pé preferencial
 */
export function mapPe(ogolPe: string): string {
  const pe = ogolPe.toLowerCase().trim();
  const mapping: Record<string, string> = {
    destro: "Destro",
    direito: "Destro",
    canhoto: "Canhoto",
    esquerdo: "Canhoto",
    ambidestro: "Ambidestro",
  };
  return mapping[pe] || ogolPe;
}

/**
 * Converte data ISO para dd/mm/aa
 */
export function formatDateToDDMMYY(isoDate: string | null): string | null {
  if (!isoDate) return null;
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return null;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  } catch {
    return null;
  }
}

/**
 * Fetch via proxy server (para web)
 */
async function fetchViaProxy(url: string): Promise<OgolPlayerData> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/ogol/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    const data = await response.json();

    // Converter data ISO para dd/mm/aa
    const dataNascimento = data.dataNascimento
      ? formatDateToDDMMYY(data.dataNascimento)
      : null;

    return {
      nome: data.nome || null,
      posicao: data.posicao ? mapPosicao(data.posicao) : null,
      dataNascimento,
      idade: data.idade || null,
      altura: data.altura ? parseFloat(data.altura) : null,
      pe: data.pe ? mapPe(data.pe) : null,
      clube: data.clube || null,
    };
  } catch (error: any) {
    throw new Error(error.message || "Erro ao buscar dados do Ogol");
  }
}

/**
 * Função principal que escolhe entre proxy (web) ou WebView (celular)
 */
export async function fetchOgolData(url: string): Promise<OgolPlayerData> {
  // Na web, usar proxy server
  if (Platform.OS === "web") {
    return fetchViaProxy(url);
  }

  // No celular, a WebView é chamada no componente
  // Esta função não é usada no celular
  throw new Error("Use WebView para celular");
}
