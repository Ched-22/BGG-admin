// =========================================================
// BGG Admin — mock data
// All names are generic ("Cliente 1, Técnico 2…") as requested
// =========================================================

export const BGG_DATA = (() => {
  const serviceTypes = [
    "Detalhamento Exterior",
    "Detalhamento Interior",
    "Proteção Cerâmica",
    "Polimento e Vitrificação",
    "Higienização Premium",
    "PPF — Película Protetora",
    "Detalhamento Motos",
    "Tratamento de Couro",
  ];

  const estados = ["SP", "RJ", "MG", "RS", "PR", "SC", "BA", "DF"];

  const techNames = Array.from({ length: 8 }, (_, i) => `Técnico ${i + 1}`);

  // ---------- Quotes (carregados via API) ----------

  // ---------- Tasks ----------
  const today = "2026-05-21";
  const tasks = [
    {
      id: "TR-2841",
      projeto: "Vitrificação Carbon Pro — Sedan",
      cliente: "Cliente 18",
      clienteEmail: "cliente18@exemplo.com",
      clienteTel: "+55 11 9 9821-4422",
      servico: "Proteção Cerâmica",
      status: "Agendado",
      descricao: "Aplicação de proteção cerâmica completa. Veículo previamente polido, sem necessidade de correção de pintura. Cliente solicitou cobertura também em rodas e vidros.",
      endereco: { unidade: "Apto 1402, Torre B", logradouro: "Rua Itaim, 220", cidade: "São Paulo", estado: "SP", cep: "04535-080" },
      dataAgendada: today, horario: "09:30", baia: 1, duracaoHoras: 1.5,
      dataCriacao: "2026-05-14 11:22",
      ultimaAtualizacao: "2026-05-20 16:45",
      tecnico: "Técnico 3",
      tecnicoStatus: "Confirmado",
      tecnicoNotas: "Cliente preferiu chegada antes das 10h. Garagem subterrânea, vaga 42.",
      orcamento: { valor: 1116, status: "Aprovado", fatura: "FAT-00829", metodo: "Cartão de Crédito", deposito: 334.8, saldo: 781.2, currency: "EUR" },
      anexos: [
        { name: "fotos-veículo-1.jpg", type: "image" },
        { name: "fotos-veículo-2.jpg", type: "image" },
        { name: "termo-de-servico.pdf", type: "pdf" },
      ],
      qa: { status: "Pendente", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "Manhãs, segunda a sexta",
      log: [
        { t: "Tarefa criada", w: "Cliente · App", when: "14 mai · 11:22" },
        { t: "Orçamento aprovado", w: "Admin · Você", when: "16 mai · 09:14" },
        { t: "Tarefa agendada para 21/05 às 09:30", w: "Admin · Você", when: "18 mai · 14:02" },
        { t: "Técnico 3 designado", w: "Admin · Você", when: "20 mai · 16:45" },
      ],
    },
    {
      id: "TR-2840",
      projeto: "Restauração completa — Coupé",
      cliente: "Cliente 12",
      clienteEmail: "cliente12@exemplo.com",
      clienteTel: "+55 11 9 9774-2231",
      servico: "Polimento e Vitrificação",
      status: "Aguardando orçamento",
      descricao: "Coupé clássico com pintura original. Solicitação de polimento minucioso e vitrificação. Cliente pediu inspeção prévia antes da aprovação do orçamento.",
      endereco: { unidade: "Casa", logradouro: "Rua das Camélias, 482", cidade: "São Paulo", estado: "SP", cep: "01415-002" },
      dataAgendada: "", horario: "",
      dataCriacao: "2026-05-18 09:10",
      ultimaAtualizacao: "2026-05-18 14:22",
      tecnico: "",
      tecnicoStatus: "—",
      tecnicoNotas: "",
      orcamento: { valor: 770.4, status: "Pendente", fatura: "—", metodo: "—", deposito: 0, saldo: 770.4, currency: "EUR" },
      anexos: [{ name: "estado-pintura.jpg", type: "image" }],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "Quinta a sábado, manhãs",
      log: [
        { t: "Tarefa criada", w: "Cliente · App", when: "18 mai · 09:10" },
        { t: "Inspeção interna concluída", w: "Admin · Você", when: "18 mai · 14:22" },
      ],
    },
    {
      id: "TR-2839",
      projeto: "Higienização interior — SUV",
      cliente: "Cliente 21",
      clienteEmail: "cliente21@exemplo.com",
      clienteTel: "+55 11 9 9112-5587",
      servico: "Detalhamento Interior",
      status: "Não agendado",
      descricao: "Higienização completa de bancos em couro, painel, carpetes e teto. Cliente relatou manchas em banco traseiro.",
      endereco: { unidade: "Sala 2104", logradouro: "Av. Faria Lima, 4500", cidade: "São Paulo", estado: "SP", cep: "04538-132" },
      dataAgendada: "", horario: "",
      dataCriacao: "2026-05-17 17:00",
      ultimaAtualizacao: "2026-05-19 10:15",
      tecnico: "",
      tecnicoStatus: "—",
      tecnicoNotas: "",
      orcamento: { valor: 302.4, status: "Aprovado", fatura: "FAT-00828", metodo: "Pix", deposito: 90.72, saldo: 211.68, currency: "EUR" },
      anexos: [],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "Tardes, terça e quinta",
      log: [
        { t: "Tarefa criada", w: "Cliente · App", when: "17 mai · 17:00" },
        { t: "Orçamento aprovado", w: "Cliente · App", when: "19 mai · 10:15" },
      ],
    },
    {
      id: "TR-2838",
      projeto: "Proteção cerâmica integral",
      cliente: "Cliente 07",
      clienteEmail: "cliente07@exemplo.com",
      clienteTel: "+55 11 9 9302-8821",
      servico: "Proteção Cerâmica",
      status: "Sem técnico",
      descricao: "Proteção cerâmica completa após correção de pintura. Veículo deve permanecer 48h em ambiente controlado.",
      endereco: { unidade: "Garagem 12", logradouro: "Av. Oscar Freire, 1203", cidade: "São Paulo", estado: "SP", cep: "01426-001" },
      dataAgendada: "2026-05-23", horario: "08:00", baia: 1, duracaoHoras: 8,
      dataCriacao: "2026-05-12 13:45",
      ultimaAtualizacao: "2026-05-19 09:00",
      tecnico: "",
      tecnicoStatus: "—",
      tecnicoNotas: "",
      orcamento: { valor: 1431, status: "Aprovado", fatura: "FAT-00824", metodo: "Cartão de Crédito", deposito: 429.3, saldo: 1001.7, currency: "EUR" },
      anexos: [{ name: "veículo-frente.jpg", type: "image" }, { name: "veículo-lateral.jpg", type: "image" }],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "Sábados pela manhã",
      log: [
        { t: "Tarefa criada", w: "Cliente · Site", when: "12 mai · 13:45" },
        { t: "Orçamento aprovado", w: "Admin · Você", when: "15 mai · 11:20" },
        { t: "Tarefa agendada para 23/05 às 08:00", w: "Admin · Você", when: "19 mai · 09:00" },
      ],
    },
    {
      id: "TR-2837",
      projeto: "PPF frontal completo",
      cliente: "Cliente 09",
      clienteEmail: "cliente09@exemplo.com",
      clienteTel: "+55 11 9 9882-0014",
      servico: "PPF — Película Protetora",
      status: "Pronto para QA",
      descricao: "Aplicação de película protetora em capô, paralamas dianteiros, faróis e retrovisores.",
      endereco: { unidade: "Box 14", logradouro: "Alameda Lorena, 401", cidade: "São Paulo", estado: "SP", cep: "01424-001" },
      dataAgendada: "2026-05-19", horario: "08:30", baia: 2, duracaoHoras: 8,
      dataCriacao: "2026-05-08 10:05",
      ultimaAtualizacao: "2026-05-20 17:30",
      tecnico: "Técnico 1",
      tecnicoStatus: "Concluído",
      tecnicoNotas: "Trabalho finalizado às 17h20. Cliente conferiu acabamento e aprovou visualmente.",
      orcamento: { valor: 2232, status: "Aprovado", fatura: "FAT-00811", metodo: "Cartão de Crédito", deposito: 669.6, saldo: 1562.4, currency: "EUR" },
      anexos: [{ name: "PPF-antes-1.jpg", type: "image" }, { name: "PPF-antes-2.jpg", type: "image" }],
      qa: { status: "Pronto para Revisão", notas: "", fotos: ["PPF-depois-1.jpg", "PPF-depois-2.jpg", "PPF-detalhe-faróis.jpg"], concluidoEm: "2026-05-20 17:20" },
      agendaPreferencial: "Manhãs",
      log: [
        { t: "Tarefa criada", w: "Cliente · Site", when: "08 mai · 10:05" },
        { t: "Orçamento aprovado", w: "Cliente · App", when: "10 mai · 14:22" },
        { t: "Tarefa agendada para 19/05 às 08:30", w: "Admin · Você", when: "12 mai · 09:30" },
        { t: "Técnico 1 designado", w: "Admin · Você", when: "12 mai · 09:32" },
        { t: "Tarefa concluída pelo técnico", w: "Técnico 1", when: "20 mai · 17:20" },
      ],
    },
    {
      id: "TR-2836",
      projeto: "Tratamento de couro completo",
      cliente: "Cliente 14",
      clienteEmail: "cliente14@exemplo.com",
      clienteTel: "+55 11 9 9220-6611",
      servico: "Tratamento de Couro",
      status: "Agendado",
      descricao: "Hidratação, limpeza profunda e proteção UV para bancos, painel e volante em couro natural.",
      endereco: { unidade: "Casa", logradouro: "Av. Brasil, 1500", cidade: "São Paulo", estado: "SP", cep: "01430-001" },
      dataAgendada: today, horario: "14:00", baia: 2, duracaoHoras: 2,
      dataCriacao: "2026-05-15 16:20",
      ultimaAtualizacao: "2026-05-19 11:00",
      tecnico: "Técnico 5",
      tecnicoStatus: "A caminho",
      tecnicoNotas: "",
      orcamento: { valor: 356.4, status: "Aprovado", fatura: "FAT-00821", metodo: "Pix", deposito: 106.92, saldo: 249.48, currency: "EUR" },
      anexos: [],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "Tardes",
      log: [],
    },
    {
      id: "TR-2835",
      projeto: "Detalhamento exterior — Sedan executivo",
      cliente: "Cliente 03",
      clienteEmail: "cliente03@exemplo.com",
      clienteTel: "+55 21 9 9821-7700",
      servico: "Detalhamento Exterior",
      status: "Nova solicitação",
      descricao: "Detalhamento exterior completo, polimento leve e selamento. Cliente novo, primeira tarefa pela plataforma.",
      endereco: { unidade: "Cobertura", logradouro: "Av. Atlântica, 88", cidade: "Rio de Janeiro", estado: "RJ", cep: "22070-001" },
      dataAgendada: "", horario: "",
      dataCriacao: "2026-05-20 22:14",
      ultimaAtualizacao: "2026-05-20 22:14",
      tecnico: "",
      tecnicoStatus: "—",
      tecnicoNotas: "",
      orcamento: { valor: 428.4, status: "Pendente", fatura: "—", metodo: "—", deposito: 0, saldo: 428.4, currency: "EUR" },
      anexos: [],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "Próxima semana, manhã",
      log: [{ t: "Tarefa criada", w: "Cliente · Site", when: "20 mai · 22:14" }],
    },
    {
      id: "TR-2834",
      projeto: "Detalhamento motos — Ducati",
      cliente: "Cliente 25",
      clienteEmail: "cliente25@exemplo.com",
      clienteTel: "+55 11 9 9445-0091",
      servico: "Detalhamento Motos",
      status: "Agendado",
      descricao: "Detalhamento completo Ducati Panigale. Atenção a quadro de carbono e detalhes anodizados.",
      endereco: { unidade: "Garagem 3", logradouro: "Rua Joaquim Floriano, 72", cidade: "São Paulo", estado: "SP", cep: "04534-000" },
      dataAgendada: today, horario: "16:30", baia: 1, duracaoHoras: 1.5,
      dataCriacao: "2026-05-13 10:00",
      ultimaAtualizacao: "2026-05-19 18:22",
      tecnico: "Técnico 2",
      tecnicoStatus: "Confirmado",
      tecnicoNotas: "",
      orcamento: { valor: 261, status: "Aprovado", fatura: "FAT-00815", metodo: "Cartão de Crédito", deposito: 78.3, saldo: 182.7, currency: "EUR" },
      anexos: [],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "Tardes",
      log: [],
    },
    {
      id: "TR-2833",
      projeto: "Higienização premium SUV",
      cliente: "Cliente 06",
      clienteEmail: "cliente06@exemplo.com",
      clienteTel: "+55 11 9 9123-8800",
      servico: "Higienização Premium",
      status: "Cancelado",
      descricao: "Higienização completa com ozônio. Cliente cancelou após reagendar duas vezes.",
      endereco: { unidade: "Casa", logradouro: "Rua da Consolação, 3088", cidade: "São Paulo", estado: "SP", cep: "01416-000" },
      dataAgendada: "2026-05-18", horario: "10:00",
      dataCriacao: "2026-05-09 14:00",
      ultimaAtualizacao: "2026-05-17 19:00",
      tecnico: "",
      tecnicoStatus: "—",
      tecnicoNotas: "",
      orcamento: { valor: 511.2, status: "Cancelado", fatura: "—", metodo: "—", deposito: 0, saldo: 0, currency: "EUR" },
      anexos: [],
      qa: { status: "—", notas: "", fotos: [], concluidoEm: "" },
      agendaPreferencial: "—",
      log: [
        { t: "Tarefa criada", w: "Cliente · App", when: "09 mai · 14:00" },
        { t: "Tarefa cancelada pelo cliente", w: "Cliente · App", when: "17 mai · 19:00" },
      ],
    },
  ];

  // ---------- Technicians ----------
  const techs = [
    { name: "Técnico 1", skills: ["PPF", "Vitrificação", "Polimento"], disponivel: true, conflito: false, agenda: "Seg–Sáb · 08:00–18:00", carga: 4 },
    { name: "Técnico 2", skills: ["Motos", "Detalhamento Exterior", "Polimento"], disponivel: true, conflito: false, agenda: "Seg–Sex · 09:00–19:00", carga: 3 },
    { name: "Técnico 3", skills: ["Proteção Cerâmica", "Polimento", "Vitrificação"], disponivel: true, conflito: false, agenda: "Seg–Sáb · 08:00–17:00", carga: 5 },
    { name: "Técnico 4", skills: ["Couro", "Detalhamento Interior"], disponivel: false, conflito: false, agenda: "Seg–Sex · 08:00–17:00", carga: 6 },
    { name: "Técnico 5", skills: ["Couro", "Higienização", "Detalhamento Interior"], disponivel: true, conflito: false, agenda: "Seg–Sex · 08:00–18:00", carga: 4 },
    { name: "Técnico 6", skills: ["Higienização", "Ozônio"], disponivel: true, conflito: true, agenda: "Ter–Sáb · 09:00–18:00", carga: 7 },
    { name: "Técnico 7", skills: ["PPF", "Detalhamento Exterior"], disponivel: true, conflito: false, agenda: "Seg–Sex · 08:00–18:00", carga: 2 },
    { name: "Técnico 8", skills: ["Motos", "Polimento"], disponivel: true, conflito: false, agenda: "Seg–Sáb · 10:00–19:00", carga: 3 },
  ];

  // ---------- Customers ----------
  // Auto-derive customers from tasks + add a few extra not yet with tasks
  const customerMap = {};
  tasks.forEach(t => {
    const c = customerMap[t.cliente] || { name: t.cliente, email: t.clienteEmail, tel: t.clienteTel, endereco: t.endereco, tarefas: 0, ativas: 0, totalGasto: 0, ultima: t.dataCriacao, status: "Ativo", since: "2024" };
    c.tarefas += 1;
    if (["Agendado", "Em andamento", "Não agendado", "Sem técnico", "Aguardando orçamento", "Nova solicitação"].includes(t.status)) c.ativas += 1;
    if (t.orcamento.status === "Aprovado") c.totalGasto += t.orcamento.valor;
    customerMap[t.cliente] = c;
  });
  const customers = Object.values(customerMap).sort((a, b) => b.totalGasto - a.totalGasto);
  // Add some without active tasks
  ["Cliente 02", "Cliente 30", "Cliente 31", "Cliente 32"].forEach((n, i) => {
    customers.push({
      name: n,
      email: n.toLowerCase().replace(" ", "") + "@exemplo.com",
      tel: `+55 11 9 ${9100 + i * 17}-${1000 + i * 13}`,
      endereco: { unidade: "Casa", logradouro: ["Rua Augusta, 1502","Av. Paulista, 2200","Rua Haddock Lobo, 800","Av. Rebouças, 3001"][i], cidade: "São Paulo", estado: "SP", cep: "01405-000" },
      tarefas: [3, 1, 5, 2][i],
      ativas: 0,
      totalGasto: [18500, 2200, 32400, 7800][i],
      ultima: ["2026-04-02", "2026-03-18", "2026-02-04", "2026-01-22"][i],
      status: i === 2 ? "VIP" : i === 1 ? "Inativo" : "Ativo",
      since: ["2023", "2025", "2022", "2024"][i],
    });
  });

  // quotes — carregados via API (App / QuotesPage)

  // Eventos extras do calendário
  const seedCalendarExtras = [
    { id: "TR-2850", title: "Polimento Mercedes AMG", cliente: "Cliente 30", servico: "Polimento e Vitrificação", tecnico: "Técnico 1", data: "2026-05-22", horario: "09:00", baia: 1, duracaoHoras: 3, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
    { id: "TR-2851", title: "Vitrificação Porsche 911", cliente: "Cliente 31", servico: "Proteção Cerâmica", tecnico: "Técnico 2", data: "2026-05-22", horario: "14:00", baia: 2, duracaoHoras: 2, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
    { id: "TR-2852", title: "PPF — Lamborghini Huracán", cliente: "Cliente 32", servico: "PPF — Película Protetora", tecnico: "Técnico 7", data: "2026-05-23", horario: "08:30", baia: 2, duracaoHoras: 4, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
    { id: "TR-2853", title: "Detalhamento Aston Martin", cliente: "Cliente 33", servico: "Detalhamento Exterior", tecnico: "Técnico 3", data: "2026-05-24", horario: "10:00", baia: 1, duracaoHoras: 2, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
    { id: "TR-2854", title: "Proteção cerâmica BMW M3", cliente: "Cliente 34", servico: "Proteção Cerâmica", tecnico: "Técnico 4", data: "2026-05-26", horario: "11:00", baia: 2, duracaoHoras: 1.5, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
    { id: "TR-2855", title: "Tratamento couro Range Rover", cliente: "Cliente 35", servico: "Tratamento de Couro", tecnico: "Técnico 5", data: "2026-05-27", horario: "15:30", baia: 1, duracaoHoras: 2, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
    { id: "TR-2856", title: "Detalhamento Ducati Streetfighter", cliente: "Cliente 36", servico: "Detalhamento Motos", tecnico: "Técnico 8", data: "2026-05-28", horario: "13:00", baia: 2, duracaoHoras: 2, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
    { id: "TR-2857", title: "Polimento Mustang GT", cliente: "Cliente 37", servico: "Polimento e Vitrificação", tecnico: "Técnico 1", data: "2026-05-29", horario: "09:30", baia: 1, duracaoHoras: 2.5, status: "Agendado", endereco: { unidade: "—", logradouro: "—", cidade: "São Paulo", estado: "SP", cep: "—" } },
  ];
  seedCalendarExtras.forEach((e) => {
    e.duracao = Math.round((e.duracaoHoras || 1.5) * 60);
    if (!e.servico) e.servico = serviceTypes[2];
  });

  // ---------- Estoque (capacidadeMaxima = teto do depósito; <20% = compra urgente) ----------
  const inventoryProducts = [
    { id: "INV-001", nome: "Shampoo pH neutro 5L", sku: "QUI-501", categoria: "Químicos", unidade: "L", quantidadeAtual: 3, capacidadeMaxima: 40, fornecedor: "DetailChem BR" },
    { id: "INV-002", nome: "Microfibra premium (pacote 10un)", sku: "ACE-201", categoria: "Acessórios", unidade: "pct", quantidadeAtual: 2, capacidadeMaxima: 30, fornecedor: "ProFiber" },
    { id: "INV-003", nome: "Cera cerâmica spray 500ml", sku: "QUI-880", categoria: "Químicos", unidade: "un", quantidadeAtual: 7, capacidadeMaxima: 48, fornecedor: "CarbonLab" },
    { id: "INV-004", nome: "PPF transparente 1,52m × 15m", sku: "PEL-102", categoria: "Películas", unidade: "rolo", quantidadeAtual: 1, capacidadeMaxima: 8, fornecedor: "ShieldFilm" },
    { id: "INV-005", nome: "Polidor corte — step 1", sku: "QUI-340", categoria: "Químicos", unidade: "L", quantidadeAtual: 4, capacidadeMaxima: 25, fornecedor: "DetailChem BR" },
    { id: "INV-006", nome: "Revelador cerâmico 1L", sku: "QUI-612", categoria: "Químicos", unidade: "L", quantidadeAtual: 2, capacidadeMaxima: 24, fornecedor: "CarbonLab" },
    { id: "INV-007", nome: "Desengraxante alcalino 20L", sku: "QUI-210", categoria: "Químicos", unidade: "L", quantidadeAtual: 38, capacidadeMaxima: 40, fornecedor: "DetailChem BR" },
    { id: "INV-008", nome: "Lixa orbital P3000 (caixa 50)", sku: "ACE-440", categoria: "Acessórios", unidade: "cx", quantidadeAtual: 12, capacidadeMaxima: 20, fornecedor: "Abrasivos SP" },
    { id: "INV-009", nome: "Couro hidratante 250ml", sku: "QUI-720", categoria: "Químicos", unidade: "un", quantidadeAtual: 22, capacidadeMaxima: 36, fornecedor: "LeatherCare" },
    { id: "INV-010", nome: "Kit PPF squeegee + faca", sku: "ACE-901", categoria: "Acessórios", unidade: "kit", quantidadeAtual: 14, capacidadeMaxima: 18, fornecedor: "ShieldFilm" },
    { id: "INV-011", nome: "Vitrificador Carbon Pro 50ml", sku: "QUI-991", categoria: "Químicos", unidade: "un", quantidadeAtual: 6, capacidadeMaxima: 32, fornecedor: "CarbonLab" },
    { id: "INV-012", nome: "Ósmose / spot remover 500ml", sku: "QUI-505", categoria: "Químicos", unidade: "un", quantidadeAtual: 9, capacidadeMaxima: 24, fornecedor: "DetailChem BR" },
  ];

  // ---------- Alerts ----------
  const alerts = [
    { kind: "danger", title: "Pagamento com falha", desc: "TR-2829 — Cliente 22 · 266,40 €", when: "há 32 min" },
    { kind: "success", title: "Pagamento recebido", desc: "TR-2832 — Cliente 04 · 576,00 €", when: "há 1 h" },
    { kind: "warn", title: "Conflito de agenda — Técnico 6", desc: "Tarefas TR-2839 e TR-2820 no mesmo horário", when: "há 2 h" },
    { kind: "neutral", title: "Tarefa cancelada", desc: "TR-2833 — Cliente 06", when: "ontem" },
  ];

  return {
    serviceTypes, estados, techNames,
    tasks, techs, alerts,
    inventoryProducts,
    customers, seedCalendarExtras,
    today,
  };
})();
