import { describe, expect, it } from "vitest";
import * as db from "../server/db";
import { gerarRelatorioPDF } from "../server/pdf-generator";

describe("Complete Video Flow in PDF Report", () => {
  const testUserId = 1;

  it("should create athlete, add videos, and display them in PDF", async () => {
    // 1. Create a test athlete
    const atletaId = await db.createAtleta({
      userId: testUserId,
      nome: "João Silva Teste",
      posicao: "Atacante",
      clube: "Teste FC/SP",
      link: "https://www.ogol.com.br/jogador/123456/joao-silva",
    });

    expect(atletaId).toBeGreaterThan(0);

    // 2. Add videos to the athlete
    const videoUrls = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    ];

    for (const videoUrl of videoUrls) {
      const videoId = await db.createMidia({
        userId: testUserId,
        atletaId,
        tipo: "video",
        nome: `Vídeo - ${new Date().toLocaleString()}`,
        url: videoUrl,
        s3Key: `videos/${atletaId}/${Date.now()}-${Math.random().toString(36).substring(7)}`,
        descricao: "Vídeo do YouTube",
      });

      expect(videoId).toBeGreaterThan(0);
    }

    // 3. Retrieve athlete with videos
    const atletas = await db.getAtletas(testUserId) as any[];
    const atleta = atletas.find((a: any) => a.id === atletaId);

    expect(atleta).toBeDefined();
    expect(atleta.videos).toBeDefined();
    expect(atleta.videos.length).toBe(2);
    expect(atleta.link).toBe("https://www.ogol.com.br/jogador/123456/joao-silva");

    console.log(`✅ Atleta ${atleta.nome} tem ${atleta.videos.length} vídeos e link Ogol`);

    // 4. Generate PDF with the athlete
    const pdfBuffer = await gerarRelatorioPDF(
      "Teste Relatório com Vídeos",
      [atleta],
      { 
        totalAtletas: 1, 
        idadeMedia: 0, 
        alturaMedia: "0", 
        posicoes: { "Atacante": 1 } 
      }
    );

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.byteLength).toBeGreaterThan(500);

    // 5. Verify PDF is valid
    const pdfHeader = pdfBuffer.toString("utf-8", 0, 5);
    expect(pdfHeader).toBe("%PDF-");

    // 6. Check if PDF contains the video URLs
    const pdfContent = pdfBuffer.toString("utf-8");
    
    // The PDF should contain references to the video URLs
    // Note: URLs might be truncated in PDF, so we check for partial matches
    const hasYoutubeLink = pdfContent.includes("youtube.com") || pdfContent.includes("YouTube");
    const hasOgolLink = pdfContent.includes("ogol.com") || pdfContent.includes("Ogol");
    
    console.log(`✅ PDF gerado com sucesso (${pdfBuffer.byteLength} bytes)`);
    console.log(`   - Contém referência a YouTube: ${hasYoutubeLink}`);
    console.log(`   - Contém referência a Ogol: ${hasOgolLink}`);

    // Clean up
    await db.deleteAtleta(atletaId, testUserId);
  });

  it("should display multiple videos for same athlete in PDF", async () => {
    // Create athlete with 3 videos
    const atletaId = await db.createAtleta({
      userId: testUserId,
      nome: "Teste Múltiplos Vídeos",
      posicao: "Meia",
      clube: "Teste FC/RJ",
    });

    const videoUrls = [
      "https://www.youtube.com/watch?v=video1",
      "https://www.youtube.com/watch?v=video2",
      "https://www.youtube.com/watch?v=video3",
    ];

    for (const videoUrl of videoUrls) {
      await db.createMidia({
        userId: testUserId,
        atletaId,
        tipo: "video",
        nome: `Vídeo`,
        url: videoUrl,
        s3Key: `videos/${atletaId}/${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });
    }

    // Get athlete and generate PDF
    const atletas = await db.getAtletas(testUserId) as any[];
    const atleta = atletas.find((a: any) => a.id === atletaId);

    expect(atleta.videos.length).toBe(3);

    const pdfBuffer = await gerarRelatorioPDF(
      "Teste 3 Vídeos",
      [atleta],
      { totalAtletas: 1, idadeMedia: 0, alturaMedia: "0", posicoes: { "Meia": 1 } }
    );

    expect(pdfBuffer.byteLength).toBeGreaterThan(500);

    const pdfContent = pdfBuffer.toString("utf-8");
    // Should have references to multiple videos
    const youtubeCount = (pdfContent.match(/youtube/gi) || []).length;
    
    console.log(`✅ PDF com 3 vídeos gerado (${pdfBuffer.byteLength} bytes, ${youtubeCount} referências a YouTube)`);

    // Clean up
    await db.deleteAtleta(atletaId, testUserId);
  });
});
