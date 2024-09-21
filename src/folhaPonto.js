import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import docxPdf from "docx-pdf";
import { fileURLToPath } from "url";
import { dirname } from "path";
import conexao from "./banco.js"; // Certifique-se de importar a conexão com o banco de dados

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function folhaPonto(usuario, registros, res) {
  const templatePath = path.join(__dirname, "..", "folha.docx");
  const tempDocPath = path.join(__dirname, `../folha_${usuario.id}.docx`);
  const tempPdfPath = path.join(__dirname, `../folha_${usuario.id}.pdf`);

  const sqlEmpresa = "SELECT * FROM empresas WHERE id = ?";
  conexao.query(sqlEmpresa, [usuario.empresa_id], (erroEmpresa, empresaRes) => {
    if (erroEmpresa || empresaRes.length === 0) {
      console.error(
        "Erro ao buscar empresa ou empresa não encontrada:",
        erroEmpresa
      );
      return res
        .status(404)
        .json({ message: "Empresa não encontrada para o usuário." });
    }

    const empresa = empresaRes[0];

    // Verificação do caminho do template
    console.log("Caminho do template:", templatePath);
    if (!fs.existsSync(templatePath)) {
      console.error("Template não encontrado no caminho:", templatePath);
      return res.status(500).json({ message: "Template não encontrado." });
    }

    const content = fs.readFileSync(templatePath, "binary");
    console.log(
      "Conteúdo do template lido:",
      content ? "Lido com sucesso" : "Erro ao ler"
    );

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const dados = {
      Nome: usuario.nome,
      ID: usuario.id,
      Departamento: usuario.departamento || "Não informado",
      Horas: registros.totalHoras,
      Pontos: registros.totalPontos,
      DATA: new Date().toLocaleDateString(),
      RESPONSÁVEL: usuario.nome,
      "Nome da Empresa": empresa.nome,
      "Endereço da empresa": empresa.endereco,
      "Numero da empresa": empresa.telefone,
    };

    console.log("Dados enviados para o template:", dados);

    doc.setData(dados);

    try {
      doc.render();
    } catch (error) {
      console.error("Erro ao renderizar o documento:", error);
      return res
        .status(500)
        .json({ message: "Erro ao renderizar o documento." });
    }

    const buffer = doc.getZip().generate({ type: "nodebuffer" });
    fs.writeFileSync(tempDocPath, buffer);
    console.log("Documento DOCX gerado com sucesso:", tempDocPath);

    docxPdf(tempDocPath, tempPdfPath, (err) => {
      if (err) {
        console.error("Erro ao converter o documento para PDF:", err);
        return res.status(500).json({ message: "Erro ao gerar PDF." });
      }

      console.log("PDF gerado com sucesso:", tempPdfPath);

      // Verifique se o PDF realmente existe antes de tentar fazer o download
      fs.access(tempPdfPath, fs.constants.F_OK, (err) => {
        if (err) {
          console.error("Arquivo PDF não encontrado:", tempPdfPath);
          return res
            .status(404)
            .json({ message: "Arquivo PDF não encontrado." });
        }

        res.download(tempPdfPath, (err) => {
          if (err) {
            console.error("Erro ao enviar o PDF:", err);
            return res.status(500).json({ message: "Erro ao enviar PDF." });
          }

          fs.unlinkSync(tempDocPath);
          fs.unlinkSync(tempPdfPath);
          console.log("Arquivos temporários removidos com sucesso.");
        });
      });
    });
  });
}

export default folhaPonto;
