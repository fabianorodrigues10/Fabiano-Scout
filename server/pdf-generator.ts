import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface AtletaParaPDF {
  nome: string;
  posicao?: string | null;
  segundaPosicao?: string | null;
  idade?: number | null;
  altura?: string | null;
  clube?: string | null;
  valencia?: string | null;
  link?: string | null;
  videos?: string[] | null;
}

interface EstatisticasPDF {
  totalAtletas: number;
  idadeMedia: number;
  alturaMedia: string;
  posicoes: Record<string, number>;
}

export async function gerarRelatorioPDF(
  titulo: string,
  atletas: AtletaParaPDF[],
  stats: EstatisticasPDF
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      // Título
      doc.fontSize(24).font("Helvetica-Bold").text(titulo, { align: "center" });
      doc.moveDown(0.5);

      // Data
      doc.fontSize(10).font("Helvetica").text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, {
        align: "center",
      });
      doc.moveDown(1);

      // Estatísticas
      doc.fontSize(12).font("Helvetica-Bold").text("Estatísticas Gerais");
      doc.moveDown(0.3);
      doc.fontSize(9).font("Helvetica");
      doc.text(`Total de Atletas: ${stats.totalAtletas}`);
      doc.text(`Idade Média: ${stats.idadeMedia.toFixed(1)} anos`);
      doc.text(`Altura Média: ${stats.alturaMedia}`);
      doc.moveDown(1);

      // Seção de Posições
      doc.fontSize(12).font("Helvetica-Bold").text("Distribuição de Posições");
      doc.moveDown(0.3);

      doc.fontSize(9).font("Helvetica");
      Object.entries(stats.posicoes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([posicao, count]) => {
          const percentual = ((count / stats.totalAtletas) * 100).toFixed(1);
          doc.text(`${posicao}: ${count} (${percentual}%)`);
        });

      doc.moveDown(1);

      // Tabela de Atletas
      doc.fontSize(12).font("Helvetica-Bold").text("Atletas");
      doc.moveDown(0.3);

      // Cabeçalho da tabela
      const tableTop = doc.y;
      const col1 = 40;
      const col2 = 150;
      const col3 = 200;
      const col4 = 250;
      const col5 = 300;
      const col6 = 350;
      const col7 = 420;
      const col8 = 500;
      const rowHeight = 20;

      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Nome", col1, tableTop);
      doc.text("Posição", col2, tableTop);
      doc.text("Idade", col3, tableTop);
      doc.text("Altura", col4, tableTop);
      doc.text("2ª Posição", col5, tableTop);
      doc.text("Clube", col6, tableTop);
      doc.text("Valência", col7, tableTop);
      doc.text("Vídeos", col8, tableTop);

      // Linha separadora
      doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Dados dos atletas
      let currentY = tableTop + 25;
      doc.fontSize(8).font("Helvetica");

      atletas.forEach((atleta) => {
        // Verificar se precisa de nova página
        if (currentY > 680) {
          doc.addPage();
          currentY = 40;
        }

        doc.text(atleta.nome.substring(0, 20), col1, currentY);
        doc.text(atleta.posicao || "-", col2, currentY);
        doc.text(atleta.idade?.toString() || "-", col3, currentY);
        doc.text(atleta.altura || "-", col4, currentY);
        doc.text(atleta.segundaPosicao || "-", col5, currentY);
        doc.text(atleta.clube?.substring(0, 15) || "-", col6, currentY);
        doc.text(atleta.valencia?.substring(0, 30) || "-", col7, currentY);
        const videosText = atleta.videos && atleta.videos.length > 0 ? atleta.videos.length.toString() : "-";
        doc.text(videosText, col8, currentY);

        currentY += rowHeight;
        
        // Linha de links (Ogol e YouTube)
        if (atleta.link || (atleta.videos && atleta.videos.length > 0)) {
          doc.fontSize(7).font("Helvetica");
          
          // Link Ogol
          if (atleta.link) {
            const ogolDisplay = atleta.link.length > 50 ? atleta.link.substring(0, 47) + "..." : atleta.link;
            doc.text(`Ogol: ${ogolDisplay}`, col1, currentY);
            currentY += 10;
          }
          
          // Links de Vídeos
          if (atleta.videos && atleta.videos.length > 0) {
            atleta.videos.forEach((videoUrl, index) => {
              const videoDisplay = videoUrl.length > 50 ? videoUrl.substring(0, 47) + "..." : videoUrl;
              doc.text(`YouTube ${index + 1}: ${videoDisplay}`, col1, currentY);
              currentY += 10;
            });
          }
          
          currentY += 3;
          doc.fontSize(8);
        }
      });

      // Rodapé
      doc.fontSize(8).font("Helvetica").text("Relatório gerado automaticamente pelo Fabiano Scout", 40, 750, {
        align: "center",
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
