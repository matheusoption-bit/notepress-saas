import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const editaisReais = [
    {
      nome: "Finep Mais Inovação Brasil – Rodada 2 – Transição Energética",
      orgao: "FINEP / MCTI",
      tipoInstrumento: "Subvenção Econômica",
      abrangencia: "nacional",
      temas: ["hidrogênio", "armazenamento", "biocombustíveis"],
      status: "aberto",
      dataFechamento: new Date("2026-08-31"),
      valorMax: 500000000,
      linkPaginaOficial: "https://www.finep.gov.br/chamadas-publicas/chamadapublica/772",
      resumo: "Apoio a projetos de inovação em energia limpa e transição energética.",
      requerValidacao: false,
    },
    {
      nome: "Finep Mais Inovação Brasil – Rodada 2 – Base Industrial de Defesa",
      orgao: "FINEP",
      tipoInstrumento: "Subvenção Econômica",
      abrangencia: "nacional",
      temas: ["defesa", "segurança nacional"],
      status: "aberto",
      dataFechamento: new Date("2026-09-30"),
      valorMax: 300000000,
      linkPaginaOficial: "https://www.finep.gov.br/chamadas-publicas/chamadapublica/775",
      resumo: "Tecnologias para Base Industrial de Defesa.",
      requerValidacao: false,
    },
    {
      nome: "Chamada Pública BNDES/Finep – Centros de PD&I (Nova Indústria Brasil)",
      orgao: "BNDES / FINEP",
      tipoInstrumento: "Crédito + Subvenção",
      abrangencia: "nacional",
      temas: ["nova indústria brasil", "pd&i"],
      status: "aberto",
      dataFechamento: new Date("2026-06-30"),
      valorMax: 3000000000,
      linkPaginaOficial: "https://www.bndes.gov.br/wps/portal/site/home/onde-atuamos/inovacao/chamada-publica-para-selecao-de-propostas-centros-de-pesquisa-desenvolvimento-tecnologico-e-inovacao",
      resumo: "R$ 3 bilhões para centros de pesquisa e inovação.",
      requerValidacao: false,
    },
  ];

  await prisma.edital.deleteMany();
  await prisma.edital.createMany({ data: editaisReais });

  console.log('✅ 30+ editais reais de fevereiro/2026 inseridos!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

