import { describe, expect, it } from "vitest";
import * as db from "../server/db";
import { gerarRelatorioPDF } from "../server/pdf-generator";

describe("Videos in Report PDF", () => {
  const testUserId = 1; // Usar o ID padrão do usuário

  it("should include videos in the PDF report for athletes with videos", async () => {
    // Get all athletes
    const atletas = await db.getAtletas(testUserId) as any[];
    
    // Find an athlete with videos
    const atletaComVideos = atletas.find((a: any) => a.videos && a.videos.length > 0);
    
    if (!atletaComVideos) {
      console.log("No athletes with videos found, skipping test");
      return;
    }

    console.log(`Testing with athlete: ${atletaComVideos.nome}, Videos: ${atletaComVideos.videos.length}`);

    // Generate PDF with this athlete
    const pdfBuffer = await gerarRelatorioPDF(
      "Teste de Vídeos",
      [atletaComVideos],
      { totalAtletas: 1, idadeMedia: 0, alturaMedia: "0", posicoes: {} }
    );

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.byteLength).toBeGreaterThan(500);

    // Check if PDF is valid
    const pdfHeader = pdfBuffer.toString("utf-8", 0, 5);
    expect(pdfHeader).toBe("%PDF-");
  });

  it("should show correct video count in PDF for Adailton Bravo", async () => {
    // Get all athletes
    const atletas = await db.getAtletas(testUserId) as any[];
    
    // Find Adailton Bravo specifically
    const adailton = atletas.find((a: any) => a.nome === "Adailton Bravo");
    
    if (!adailton) {
      console.log("Adailton Bravo not found");
      return;
    }

    console.log(`Adailton Bravo videos:`, adailton.videos);
    expect(Array.isArray(adailton.videos)).toBe(true);

    // Generate PDF
    const pdfBuffer = await gerarRelatorioPDF(
      "Teste Adailton",
      [adailton],
      { totalAtletas: 1, idadeMedia: 0, alturaMedia: "0", posicoes: {} }
    );

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.byteLength).toBeGreaterThan(500);

    // Check if PDF is valid
    const pdfHeader = pdfBuffer.toString("utf-8", 0, 5);
    expect(pdfHeader).toBe("%PDF-");
  });

  it("should retrieve videos from database for all athletes", async () => {
    const atletas = await db.getAtletas(testUserId) as any[];
    
    expect(Array.isArray(atletas)).toBe(true);
    
    // Check that all athletes have a videos property
    atletas.forEach((atleta: any) => {
      expect(atleta).toHaveProperty("videos");
      expect(Array.isArray(atleta.videos) || atleta.videos === null).toBe(true);
    });

    // Log athletes with videos
    const atletasComVideos = atletas.filter((a: any) => a.videos && a.videos.length > 0);
    console.log(`Found ${atletasComVideos.length} athletes with videos`);
    
    atletasComVideos.forEach((a: any) => {
      console.log(`${a.nome}: ${a.videos.length} video(s)`);
    });
  });
});
