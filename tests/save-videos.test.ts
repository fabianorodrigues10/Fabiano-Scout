import { describe, expect, it } from "vitest";
import * as db from "../server/db";

describe("Save Videos for Athletes", () => {
  const testUserId = 1;

  it("should save videos when creating a new athlete", async () => {
    // Create a test athlete
    const atletaId = await db.createAtleta({
      userId: testUserId,
      nome: "Teste Vídeos Atleta",
      posicao: "Atacante",
      clube: "Teste FC",
    });

    expect(atletaId).toBeGreaterThan(0);

    // Create videos for the athlete
    const videoUrl1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const videoUrl2 = "https://www.youtube.com/watch?v=jNQXAC9IVRw";

    const videoId1 = await db.createMidia({
      userId: testUserId,
      atletaId,
      tipo: "video",
      nome: "Vídeo 1",
      url: videoUrl1,
      s3Key: `videos/${atletaId}/video1`,
      mimeType: "video/youtube",
      descricao: "Teste vídeo 1",
    });

    const videoId2 = await db.createMidia({
      userId: testUserId,
      atletaId,
      tipo: "video",
      nome: "Vídeo 2",
      url: videoUrl2,
      s3Key: `videos/${atletaId}/video2`,
      mimeType: "video/youtube",
      descricao: "Teste vídeo 2",
    });

    expect(videoId1).toBeGreaterThan(0);
    expect(videoId2).toBeGreaterThan(0);

    // Retrieve athlete with videos
    const atletas = await db.getAtletas(testUserId) as any[];
    const atletaComVideos = atletas.find((a: any) => a.id === atletaId);

    expect(atletaComVideos).toBeDefined();
    expect(atletaComVideos.videos).toBeDefined();
    expect(Array.isArray(atletaComVideos.videos)).toBe(true);
    expect(atletaComVideos.videos.length).toBe(2);
    expect(atletaComVideos.videos).toContain(videoUrl1);
    expect(atletaComVideos.videos).toContain(videoUrl2);

    console.log(`✅ Atleta ${atletaComVideos.nome} tem ${atletaComVideos.videos.length} vídeos`);

    // Clean up
    await db.deleteAtleta(atletaId, testUserId);
  });

  it("should retrieve videos in PDF generation", async () => {
    const { gerarRelatorioPDF } = await import("../server/pdf-generator");

    // Create a test athlete with videos
    const atletaId = await db.createAtleta({
      userId: testUserId,
      nome: "Teste PDF Vídeos",
      posicao: "Meia",
      clube: "Teste FC",
    });

    // Create videos
    const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    await db.createMidia({
      userId: testUserId,
      atletaId,
      tipo: "video",
      nome: "Vídeo Teste",
      url: videoUrl,
      s3Key: `videos/${atletaId}/test`,
      mimeType: "video/youtube",
      descricao: "Vídeo de teste",
    });

    // Get athlete with videos
    const atletas = await db.getAtletas(testUserId) as any[];
    const atleta = atletas.find((a: any) => a.id === atletaId);

    expect(atleta.videos).toBeDefined();
    expect(atleta.videos.length).toBe(1);

    // Generate PDF
    const pdfBuffer = await gerarRelatorioPDF(
      "Teste PDF com Vídeos",
      [atleta],
      { totalAtletas: 1, idadeMedia: 0, alturaMedia: "0", posicoes: {} }
    );

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.byteLength).toBeGreaterThan(500);

    // Verify PDF is valid
    const pdfHeader = pdfBuffer.toString("utf-8", 0, 5);
    expect(pdfHeader).toBe("%PDF-");

    console.log(`✅ PDF gerado com sucesso para atleta com vídeos (${pdfBuffer.byteLength} bytes)`);

    // Clean up
    await db.deleteAtleta(atletaId, testUserId);
  });
});
