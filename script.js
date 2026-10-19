/**
 * SISTEMA DE GERENCIAMENTO DE EQUIPAMENTOS
 * Boas práticas aplicadas: Separação de responsabilidades, funções puras, 
 * estado persistido via LocalStorage e manipulação limpa do DOM.
 */

// --- ESTADO DA APLICAÇÃO ---
let equipamentos = JSON.parse(localStorage.getItem('equipamentos_db')) || [];
let filtroStatusAtual = 'todos';

// --- ELEMENTOS DO DOM ---
const form = document.getElementById('form-equipamento');
const inputId = document.getElementById('equipamento-id');
const inputNome = document.getElementById('nome');
const inputPatrimonio = document.getElementById('patrimonio');
const selectCategoria = document.getElementById('categoria');
const inputResponsavel = document.getElementById('responsavel');

const inputBusca = document.getElementById('input-busca');
const botoesFiltro = document.querySelectorAll('.btn-filter');
const tabelaCorpo = document.getElementById('tabela-equipamentos');
const msgVazio = document.getElementById('msg-vazio');

const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');
const formTitle = document.getElementById('form-title');

// Indicadores
const totalQtd = document.getElementById('total-qtd');
const disponivelQtd = document.getElementById('disponivel-qtd');
const emprestadoQtd = document.getElementById('emprestado-qtd');

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
  renderizarSistema();
  configurarEventos();
});

// --- CONFIGURAÇÃO DE EVENTOS ---
function configurarEventos() {
  form.addEventListener('submit', salvarEquipamento);
  btnCancelar.addEventListener('click', limparFormulario);
  inputBusca.addEventListener('input', renderizarTabela);

  botoesFiltro.forEach(btn => {
    btn.addEventListener('click', (e) => {
      botoesFiltro.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      filtroStatusAtual = e.target.getAttribute('data-filter');
      renderizarTabela();
    });
  });
}

// --- SALVAR / EDITAR (CREATE & UPDATE) ---
function salvarEquipamento(e) {
  e.preventDefault();

  const id = inputId.value;
  const nome = inputNome.value.trim();
  const patrimonio = inputPatrimonio.value.trim();
  const categoria = selectCategoria.value;
  const responsavel = inputResponsavel.value.trim();

  // Validação para evitar patrimônio duplicado
  const patrimonioExistente = equipamentos.some(eq => eq.patrimonio === patrimonio && eq.id !== id);
  if (patrimonioExistente) {
    alert('Atenção: Já existe um equipamento cadastrado com este Nº de Patrimônio!');
    return;
  }

  if (id) {
    // Atualização
    equipamentos = equipamentos.map(eq => {
      if (eq.id === id) {
        return { ...eq, nome, patrimonio, categoria, responsavel };
      }
      return eq;
    });
  } else {
    // Novo Cadastro
    const novoEquipamento = {
      id: Date.now().toString(),
      nome,
      patrimonio,
      categoria,
      responsavel: responsavel || 'N/A',
      status: responsavel ? 'Emprestado' : 'Disponível'
    };
    equipamentos.push(novoEquipamento);
  }

  salvarStorage();
  limparFormulario();
  renderizarSistema();
}

// --- ALTERAR STATUS DE DISPONIBILIDADE (UPDATE STATUS) ---
function alternarStatus(id) {
  equipamentos = equipamentos.map(eq => {
    if (eq.id === id) {
      const novoStatus = eq.status === 'Disponível' ? 'Emprestado' : 'Disponível';
      let novoResponsavel = eq.responsavel;

      if (novoStatus === 'Emprestado' && (eq.responsavel === 'N/A' || !eq.responsavel)) {
        const resp = prompt('Informe o nome do responsável pelo empréstimo:');
        novoResponsavel = resp && resp.trim() !== '' ? resp.trim() : 'Não informado';
      } else if (novoStatus === 'Disponível') {
        novoResponsavel = 'N/A';
      }

      return { ...eq, status: novoStatus, responsavel: novoResponsavel };
    }
    return eq;
  });

  salvarStorage();
  renderizarSistema();
}

// --- PREPARAR EDIÇÃO ---
function prepararEdicao(id) {
  const eq = equipamentos.find(item => item.id === id);
  if (!eq) return;

  inputId.value = eq.id;
  inputNome.value = eq.nome;
  inputPatrimonio.value = eq.patrimonio;
  selectCategoria.value = eq.categoria;
  inputResponsavel.value = eq.responsavel === 'N/A' ? '' : eq.responsavel;

  formTitle.textContent = 'Editar Equipamento';
  btnSalvar.textContent = 'Atualizar';
  btnCancelar.classList.remove('hidden');
}

// --- EXCLUIR REGISTRO (DELETE) ---
function excluirEquipamento(id) {
  if (confirm('Tem certeza de que deseja excluir este equipamento?')) {
    equipamentos = equipamentos.filter(eq => eq.id !== id);
    salvarStorage();
    renderizarSistema();
  }
}

// --- RENDERIZAÇÃO DA TABELA E FILTROS (READ & SEARCH) ---
function renderizarTabela() {
  const termoBusca = inputBusca.value.toLowerCase();

  const equipamentosFiltrados = equipamentos.filter(eq => {
    const combinaFiltroStatus = filtroStatusAtual === 'todos' || eq.status === filtroStatusAtual;
    const combinaBusca = eq.nome.toLowerCase().includes(termoBusca) || 
                         eq.patrimonio.toLowerCase().includes(termoBusca);
    return combinaFiltroStatus && combinaBusca;
  });

  tabelaCorpo.innerHTML = '';

  if (equipamentosFiltrados.length === 0) {
    msgVazio.classList.remove('hidden');
  } else {
    msgVazio.classList.add('hidden');
    equipamentosFiltrados.forEach(eq => {
      const tr = document.createElement('tr');

      const isDisponivel = eq.status === 'Disponível';
      const badgeClass = isDisponivel ? 'badge-disponivel' : 'badge-emprestado';

      tr.innerHTML = `
        <td><strong>${eq.patrimonio}</strong></td>
        <td>${eq.nome}</td>
        <td>${eq.categoria}</td>
        <td><span class="badge ${badgeClass}">${eq.status}</span></td>
        <td>${eq.responsavel}</td>
        <td class="action-btns">
          <button class="btn btn-warning" onclick="alternarStatus('${eq.id}')">
            ${isDisponivel ? 'Emprestar' : 'Devolver'}
          </button>
          <button class="btn btn-secondary" onclick="prepararEdicao('${eq.id}')">Editar</button>
          <button class="btn btn-danger" onclick="excluirEquipamento('${eq.id}')">Excluir</button>
        </td>
      `;
      tabelaCorpo.appendChild(tr);
    });
  }
}

// --- ATUALIZAR INDICADORES (DASHBOARD) ---
function atualizarDashboard() {
  const total = equipamentos.length;
  const disponiveis = equipamentos.filter(e => e.status === 'Disponível').length;
  const emprestados = equipamentos.filter(e => e.status === 'Emprestado').length;

  totalQtd.textContent = total;
  disponivelQtd.textContent = disponiveis;
  emprestadoQtd.textContent = emprestados;
}

// --- FUNÇÕES AUXILIARES ---
function renderizarSistema() {
  renderizarTabela();
  atualizarDashboard();
}

function limparFormulario() {
  inputId.value = '';
  form.reset();
  formTitle.textContent = 'Cadastrar Novo Equipamento';
  btnSalvar.textContent = 'Salvar Equipamento';
  btnCancelar.classList.add('hidden');
}

function salvarStorage() {
  localStorage.setItem('equipamentos_db', JSON.stringify(equipamentos));
}