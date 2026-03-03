import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Editais existentes ───────────────────────────────────────────────────
  const editaisExistentes = [
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

  // ─── Novos editais reais 2025-2026 ───────────────────────────────────────
  const editaisNovos = [
    // ── 1. FINEP – Mais Inovação Brasil: Saúde e Biotecnologia ───────────
    {
      nome: "Finep Mais Inovação Brasil – Saúde e Biotecnologia 2025",
      orgao: "FINEP / MCTI",
      tipoInstrumento: "Subvenção Econômica",
      abrangencia: "nacional",
      temas: ["saúde", "biotecnologia", "vacinas", "diagnóstico", "biofármacos"],
      status: "aberto",
      dataAbertura: new Date("2025-03-01"),
      dataFechamento: new Date("2025-10-31"),
      valorMin: 1000000,
      valorMax: 15000000,
      trlEntrada: 4,
      trlSaida: 7,
      linkPaginaOficial: "https://www.finep.gov.br/chamadas-publicas/chamadapublica/770",
      resumo: "Apoio a empresas para desenvolvimento de produtos e processos inovadores em saúde, biotecnologia, vacinas, diagnósticos in vitro e biofármacos. Voltado a PMEs com foco em P,D&I.",
      criteriosAvaliacao: {
        merito_inovacao: { peso: 30, descricao: "Grau de inovação e diferenciação tecnológica da solução proposta" },
        viabilidade_tecnica: { peso: 25, descricao: "Capacidade técnica da equipe e viabilidade do plano de trabalho" },
        potencial_mercado: { peso: 20, descricao: "Tamanho do mercado endereçável e estratégia de go-to-market" },
        impacto_social: { peso: 15, descricao: "Impacto na redução de doenças, acesso a medicamentos e sistema de saúde" },
        contrapartida: { peso: 10, descricao: "Percentual de contrapartida financeira da empresa" },
      },
      requerValidacao: false,
    },

    // ── 2. FAPESP – PIPE Fase 2 (Pesquisa Inovativa em Pequenas Empresas) ─
    {
      nome: "FAPESP PIPE – Fase 2 – Pesquisa Inovativa em Pequenas Empresas",
      orgao: "FAPESP",
      tipoInstrumento: "Auxílio à Pesquisa",
      abrangencia: "estadual",
      uf: "SP",
      temas: ["tecnologia", "inovação", "pesquisa aplicada", "startups", "biotech", "agtech", "deeptech"],
      status: "fluxo_contínuo",
      dataAbertura: new Date("2025-01-01"),
      valorMin: 500000,
      valorMax: 1000000,
      prazoExecucao: "24 meses",
      trlEntrada: 3,
      trlSaida: 6,
      linkPaginaOficial: "https://fapesp.br/pipe",
      resumo: "A Fase 2 do PIPE financia a prova de conceito da solução desenvolvida na Fase 1. Destinado a pequenas empresas com sede em São Paulo que demonstraram viabilidade técnica preliminar. Cobre até 100% dos custos de P&D.",
      criteriosAvaliacao: {
        originalidade: { peso: 25, descricao: "Originalidade científica e tecnológica do projeto" },
        qualidade_equipe: { peso: 25, descricao: "Qualificação do pesquisador responsável e da equipe" },
        viabilidade_execucao: { peso: 20, descricao: "Clareza e realismo do plano de trabalho e cronograma" },
        potencial_comercial: { peso: 20, descricao: "Evidências de mercado e interesse de potenciais clientes" },
        impacto_economico: { peso: 10, descricao: "Potencial de geração de empregos e receita no estado de SP" },
      },
      requerValidacao: true,
    },

    // ── 3. CNPq – Chamada Universal 10/2024 ──────────────────────────────
    {
      nome: "CNPq – Chamada Universal 10/2024 – Ciência, Tecnologia e Inovação",
      orgao: "CNPq / MCTI",
      tipoInstrumento: "Auxílio à Pesquisa",
      abrangencia: "nacional",
      temas: ["pesquisa básica", "pesquisa aplicada", "ciências exatas", "ciências biológicas", "engenharias", "ciências humanas"],
      status: "fechado",
      dataAbertura: new Date("2024-11-15"),
      dataFechamento: new Date("2025-01-31"),
      valorMin: 50000,
      valorMax: 400000,
      prazoExecucao: "36 meses",
      trlEntrada: 1,
      trlSaida: 4,
      linkPaginaOficial: "https://www.gov.br/cnpq/pt-br/acesso-a-informacao/acoes-e-programas/chamadas-publicas/chamadas-publicas-ativas/chamada-universal-2024",
      resumo: "Chamada ampla destinada a pesquisadores com vínculo formal com instituições de pesquisa. Financia projetos de pesquisa científica e tecnológica em qualquer área do conhecimento, em três faixas de valor conforme titulação e histórico do pesquisador.",
      criteriosAvaliacao: {
        relevancia_cientifica: { peso: 35, descricao: "Relevância, originalidade e contribuição ao estado da arte" },
        metodologia: { peso: 30, descricao: "Adequação da metodologia e consistência do plano de trabalho" },
        qualificacao_pesquisador: { peso: 20, descricao: "Currículo Lattes, produção bibliográfica e histórico de bolsas" },
        infraestrutura: { peso: 15, descricao: "Disponibilidade de infraestrutura e apoio institucional" },
      },
      requerValidacao: false,
    },

    // ── 4. BNDES – Funtec (Fundo Tecnológico) ─────────────────────────────
    {
      nome: "BNDES Funtec – Apoio a Projetos de P&D de Alto Risco Tecnológico",
      orgao: "BNDES",
      tipoInstrumento: "Apoio Não Reembolsável",
      abrangencia: "nacional",
      temas: ["energia renovável", "saneamento", "mobilidade elétrica", "indústria 4.0", "bioeconomia"],
      status: "fluxo_contínuo",
      dataAbertura: new Date("2025-01-01"),
      valorMin: 5000000,
      valorMax: 200000000,
      prazoExecucao: "até 60 meses",
      trlEntrada: 3,
      trlSaida: 7,
      linkPaginaOficial: "https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/funtec",
      resumo: "O Funtec apoia projetos de pesquisa, desenvolvimento e inovação de alto risco tecnológico, em áreas estratégicas para a competitividade e sustentabilidade do Brasil. Recursos não reembolsáveis para projetos realizados em parceria com instituições científicas.",
      criteriosAvaliacao: {
        risco_tecnologico: { peso: 25, descricao: "Alto risco tecnológico justificando apoio não reembolsável" },
        impacto_industrial: { peso: 25, descricao: "Impacto potencial na competitividade da indústria nacional" },
        parceria_ict: { peso: 20, descricao: "Qualidade da parceria com ICTs e qualificação da equipe" },
        viabilidade_tecnica: { peso: 20, descricao: "Robustez técnica e realismo do plano de P&D" },
        externalidades: { peso: 10, descricao: "Externalidades positivas: emprego, renda e sustentabilidade" },
      },
      requerValidacao: false,
    },

    // ── 5. FINEP – Encomendas Tecnológicas: Saúde Digital ────────────────
    {
      nome: "FINEP – Encomendas Tecnológicas – Saúde Digital e IA em Saúde 2025",
      orgao: "FINEP / Ministério da Saúde",
      tipoInstrumento: "Encomenda Tecnológica",
      abrangencia: "nacional",
      temas: ["saúde digital", "inteligência artificial", "prontuário eletrônico", "telemedicina", "diagnóstico por imagem"],
      status: "aberto",
      dataAbertura: new Date("2025-04-01"),
      dataFechamento: new Date("2025-12-31"),
      valorMin: 2000000,
      valorMax: 20000000,
      prazoExecucao: "30 meses",
      trlEntrada: 5,
      trlSaida: 8,
      linkPaginaOficial: "https://www.finep.gov.br/chamadas-publicas/chamadapublica/780",
      resumo: "Encomenda para desenvolvimento de soluções de IA aplicadas ao SUS: triagem automatizada, diagnóstico por imagem, gestão de leitos e interoperabilidade de dados clínicos. Soluções devem ser compatíveis com a RNDS (Rede Nacional de Dados em Saúde).",
      criteriosAvaliacao: {
        aderencia_edital: { peso: 30, descricao: "Aderência da solução aos requisitos técnicos especificados no TR" },
        maturidade_tecnologica: { peso: 25, descricao: "TRL atual comprovado com evidências e protótipos" },
        seguranca_dados: { peso: 20, descricao: "Conformidade com LGPD, RNDS e padrões HL7 FHIR" },
        escalabilidade: { peso: 15, descricao: "Capacidade de escalar para os 5.570 municípios do SUS" },
        custo_beneficio: { peso: 10, descricao: "Relação custo-benefício e sustentabilidade do modelo" },
      },
      requerValidacao: true,
    },

    // ── 6. FAPESP – PITE (Parceria para Inovação Tecnológica) ────────────
    {
      nome: "FAPESP PITE – Parceria para Inovação Tecnológica com Empresas",
      orgao: "FAPESP",
      tipoInstrumento: "Auxílio à Pesquisa + Contrapartida Empresarial",
      abrangencia: "estadual",
      uf: "SP",
      temas: ["inovação tecnológica", "parceria empresa-universidade", "P&D colaborativo"],
      status: "fluxo_contínuo",
      dataAbertura: new Date("2025-01-01"),
      valorMin: 100000,
      valorMax: 2000000,
      prazoExecucao: "24 a 60 meses",
      contrapartida: "Mínimo 50% do valor FAPESP em contrapartida da empresa",
      trlEntrada: 3,
      trlSaida: 7,
      linkPaginaOficial: "https://fapesp.br/pite",
      resumo: "O PITE apoia projetos de P&D em parceria entre pesquisadores de universidades/institutos paulistas e empresas privadas. A empresa deve ter contrapartida mínima equivalente ao valor FAPESP. Projetos devem ter potencial de geração de propriedade intelectual.",
      criteriosAvaliacao: {
        qualidade_cientifica: { peso: 30, descricao: "Rigor científico e originalidade da proposta de pesquisa" },
        comprometimento_empresa: { peso: 25, descricao: "Contrapartida financeira e envolvimento da empresa no projeto" },
        potencial_pi: { peso: 20, descricao: "Potencial de geração de patentes e propriedade intelectual" },
        equipe_pesquisa: { peso: 15, descricao: "Qualificação do pesquisador responsável (bolsista produtividade)" },
        impacto_tecnologico: { peso: 10, descricao: "Relevância para a competitividade da empresa e setor" },
      },
      requerValidacao: true,
    },

    // ── 7. CNPq – INCT (Institutos Nacionais de Ciência e Tecnologia) ────
    {
      nome: "CNPq / FAPs – INCT 2025: Institutos Nacionais de Ciência e Tecnologia",
      orgao: "CNPq / MCTI / FAPs",
      tipoInstrumento: "Auxílio Financeiro a Projeto",
      abrangencia: "nacional",
      temas: ["redes de pesquisa", "ciência de fronteira", "formação de RH", "transferência de tecnologia"],
      status: "aberto",
      dataAbertura: new Date("2025-02-01"),
      dataFechamento: new Date("2025-08-29"),
      valorMin: 1500000,
      valorMax: 8000000,
      prazoExecucao: "60 meses",
      trlEntrada: 1,
      trlSaida: 5,
      linkPaginaOficial: "https://www.gov.br/cnpq/pt-br/acesso-a-informacao/acoes-e-programas/programas/institutos-nacionais",
      resumo: "Apoio à criação de redes temáticas de pesquisa em áreas de fronteira do conhecimento. Os INCTs devem ter sede em instituição brasileira, integrar pesquisadores de diferentes regiões e manter programa de educação e difusão de ciência.",
      criteriosAvaliacao: {
        excelencia_cientifica: { peso: 35, descricao: "Nível de excelência científica dos pesquisadores e publicações" },
        abrangencia_rede: { peso: 20, descricao: "Cobertura regional e diversidade das instituições participantes" },
        formacao_rh: { peso: 20, descricao: "Capacidade de formação de doutores, mestres e iniciação científica" },
        transferencia_tecnologia: { peso: 15, descricao: "Mecanismos de transferência e interação com setor produtivo" },
        comunicacao_ciencia: { peso: 10, descricao: "Plano de divulgação científica e educação" },
      },
      requerValidacao: false,
    },

    // ── 8. FINEP – Inova Agroindústria 2 ─────────────────────────────────
    {
      nome: "FINEP – Inova Agroindústria 2 – Tecnologias para o Agronegócio Sustentável",
      orgao: "FINEP / MAPA / MCTI",
      tipoInstrumento: "Subvenção Econômica + Crédito",
      abrangencia: "nacional",
      temas: ["agronegócio", "agricultura de precisão", "biotecnologia agrícola", "biodefensivos", "irrigação inteligente", "rastreabilidade"],
      status: "aberto",
      dataAbertura: new Date("2025-05-01"),
      dataFechamento: new Date("2025-11-30"),
      valorMin: 500000,
      valorMax: 10000000,
      prazoExecucao: "36 meses",
      trlEntrada: 4,
      trlSaida: 7,
      linkPaginaOficial: "https://www.finep.gov.br/chamadas-publicas/chamadapublica/785",
      resumo: "Apoio a projetos de inovação em tecnologias agrícolas sustentáveis: biodefensivos, fertilizantes de eficiência aumentada, agricultura 4.0, rastreabilidade de grãos e pecuária, soluções para redução de perdas pós-colheita e gestão da água.",
      criteriosAvaliacao: {
        inovacao_incremental: { peso: 25, descricao: "Grau de inovação em relação a produtos/processos existentes no mercado agro" },
        sustentabilidade: { peso: 25, descricao: "Redução de insumos químicos, emissões e uso de água" },
        viabilidade_comercial: { peso: 20, descricao: "Tamanho do mercado, canais de distribuição e precificação" },
        capacidade_execucao: { peso: 20, descricao: "Infraestrutura, equipe técnica e parcerias com produtores" },
        rastreabilidade_dados: { peso: 10, descricao: "Uso de dados e conformidade com SNCR e plataformas do MAPA" },
      },
      requerValidacao: false,
    },

    // ── 9. BNDES – Nova Indústria Brasil: Crédito para Modernização ───────
    {
      nome: "BNDES Nova Indústria Brasil – Crédito para Modernização e Digitalização Industrial",
      orgao: "BNDES / MDIC",
      tipoInstrumento: "Crédito Reembolsável",
      abrangencia: "nacional",
      temas: ["indústria 4.0", "digitalização", "automação", "bens de capital", "IoT", "manufatura avançada"],
      status: "fluxo_contínuo",
      dataAbertura: new Date("2025-01-01"),
      valorMin: 500000,
      valorMax: 500000000,
      prazoExecucao: "até 120 meses",
      contrapartida: "Mínimo 20% de recursos próprios",
      trlEntrada: 6,
      trlSaida: 9,
      linkPaginaOficial: "https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/bndes-nova-industria-brasil",
      resumo: "Linha de crédito para implantação, expansão ou modernização de projetos industriais com foco em Indústria 4.0: digitalização, automação, robótica, IoT, gêmeos digitais e conectividade. Taxa de juros reduzida para projetos com alto grau de inovação.",
      criteriosAvaliacao: {
        grau_digitalizacao: { peso: 30, descricao: "Nível de integração de tecnologias 4.0 no processo produtivo" },
        capacidade_pagamento: { peso: 30, descricao: "Análise de fluxo de caixa, endividamento e rating de crédito" },
        impacto_produtividade: { peso: 20, descricao: "Ganho de produtividade estimado e indicadores de desempenho" },
        geracao_emprego: { peso: 10, descricao: "Manutenção e geração de postos de trabalho qualificados" },
        conteudo_local: { peso: 10, descricao: "Percentual de equipamentos e serviços de fornecedores nacionais" },
      },
      requerValidacao: false,
    },

    // ── 10. FAPESP – Jovem Pesquisador em Centros de Pesquisa 2025 ────────
    {
      nome: "FAPESP – Jovem Pesquisador em Centros de Pesquisa 2025",
      orgao: "FAPESP",
      tipoInstrumento: "Auxílio à Pesquisa",
      abrangencia: "estadual",
      uf: "SP",
      temas: ["pesquisa de ponta", "liderança científica", "formação de grupos de pesquisa"],
      status: "aberto",
      dataAbertura: new Date("2025-03-01"),
      dataFechamento: new Date("2025-09-30"),
      valorMin: 300000,
      valorMax: 800000,
      prazoExecucao: "60 meses",
      trlEntrada: 1,
      trlSaida: 4,
      linkPaginaOficial: "https://fapesp.br/jovempesquisador",
      resumo: "Destinado a pesquisadores com doutorado concluído há no máximo 10 anos que desejam estabelecer seu grupo de pesquisa em São Paulo. Inclui bolsa para o pesquisador principal, bolsas de pós-doc, IR e equipamentos. Exige proposta de pesquisa original e de fronteira.",
      criteriosAvaliacao: {
        originalidade_proposta: { peso: 35, descricao: "Originalidade e relevância científica do projeto para a área" },
        perfil_candidato: { peso: 30, descricao: "Histórico acadêmico, publicações, citações e prêmios do pesquisador" },
        plano_formacao_equipe: { peso: 20, descricao: "Plano de recrutamento e formação de equipe de pesquisa" },
        infraestrutura_hospedeira: { peso: 15, descricao: "Condições oferecidas pela instituição hospedeira em SP" },
      },
      requerValidacao: false,
    },

    // ── 11. CNPq – Bolsa de Produtividade em Pesquisa 2025 ───────────────
    {
      nome: "CNPq – Bolsas de Produtividade em Pesquisa (PQ) – Chamada 2025",
      orgao: "CNPq / MCTI",
      tipoInstrumento: "Bolsa de Pesquisa",
      abrangencia: "nacional",
      temas: ["pesquisa científica", "pós-graduação", "todas as áreas do conhecimento"],
      status: "aberto",
      dataAbertura: new Date("2025-02-01"),
      dataFechamento: new Date("2025-05-30"),
      valorMin: 100000,   // valor anual da bolsa PQ-2
      valorMax: 250000,   // valor anual da bolsa PQ-1A
      prazoExecucao: "48 meses",
      trlEntrada: 1,
      trlSaida: 3,
      linkPaginaOficial: "https://www.gov.br/cnpq/pt-br/acesso-a-informacao/acoes-e-programas/programas/bolsas-e-auxilios/bolsas-no-pais/pesquisa/produtividade-em-pesquisa-pq",
      resumo: "Bolsas concedidas a pesquisadores que se destaquem entre seus pares por sua produção científica e tecnológica. Categorias PQ-1A, PQ-1B, PQ-1C, PQ-1D e PQ-2, com valor crescente conforme mérito e senioridade. Inclui auxílio de pesquisa associado.",
      criteriosAvaliacao: {
        producao_bibliografica: { peso: 40, descricao: "Número e qualidade de artigos publicados em periódicos indexados" },
        formacao_rh: { peso: 25, descricao: "Orientações de mestrado e doutorado concluídas no período" },
        liderança_cientifica: { peso: 20, descricao: "Coordenação de projetos, participação em comitês e reconhecimento" },
        transferencia_conhecimento: { peso: 15, descricao: "Patentes, produtos, processos e interação com setor produtivo" },
      },
      requerValidacao: false,
    },

    // ── 12. FINEP – Conecta Startups: AgTech & FoodTech 2026 ─────────────
    {
      nome: "FINEP Conecta Startups – AgTech & FoodTech 2026",
      orgao: "FINEP",
      tipoInstrumento: "Subvenção Econômica",
      abrangencia: "nacional",
      temas: ["agtech", "foodtech", "startups", "proteínas alternativas", "rastreabilidade alimentar", "agro digital"],
      status: "aberto",
      dataAbertura: new Date("2026-01-15"),
      dataFechamento: new Date("2026-07-31"),
      valorMin: 500000,
      valorMax: 5000000,
      prazoExecucao: "24 meses",
      trlEntrada: 3,
      trlSaida: 7,
      linkPaginaOficial: "https://www.finep.gov.br/chamadas-publicas/chamadapublica/790",
      resumo: "Chamada voltada a startups early e growth stage com soluções inovadoras para o sistema alimentar: proteínas alternativas, redução de desperdício, logística de frios, tecnologias de conservação, rastreabilidade blockchain e plataformas de varejo alimentar.",
      criteriosAvaliacao: {
        inovacao_disruptiva: { peso: 30, descricao: "Nível de disrupção e diferenciação frente a soluções convencionais" },
        traction: { peso: 25, descricao: "Evidências de tração: receita, clientes pagantes ou LOIs firmados" },
        scalability: { peso: 20, descricao: "Modelo de negócio escalável e defensável" },
        equipe_fundadora: { peso: 15, descricao: "Experiência relevante dos fundadores na área de atuação" },
        impacto_ambiental: { peso: 10, descricao: "Redução de emissões, desperdício ou uso de recursos naturais" },
      },
      requerValidacao: false,
    },
  ];

  await prisma.edital.deleteMany();
  await prisma.edital.createMany({ data: [...editaisExistentes, ...editaisNovos] });

  const total = editaisExistentes.length + editaisNovos.length;
  console.log(`✅ ${total} editais reais (2024-2026) inseridos com sucesso!`);
  console.log(`   › ${editaisExistentes.length} existentes (FINEP/BNDES)`);
  console.log(`   › ${editaisNovos.length} novos (FINEP, FAPESP, CNPq, BNDES)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

