# TODO - Gerenciador de Atletas de Futebol

## Configuração Inicial
- [x] Gerar logo customizado do aplicativo
- [x] Atualizar configurações de branding no app.config.ts
- [x] Configurar tema de cores personalizado

## Backend e Modelo de Dados
- [x] Definir schema do banco de dados para atletas
- [x] Definir schema para configurações de campos customizados
- [x] Criar migrations do banco de dados
- [x] Implementar funções de query no server/db.ts
- [x] Criar rotas tRPC para CRUD de atletas
- [x] Criar rotas tRPC para gerenciamento de campos

## Interface - Tela Principal
- [x] Criar componente AtletaCard para lista
- [x] Implementar tela principal com FlatList
- [x] Adicionar barra de busca funcional
- [x] Implementar pull-to-refresh
- [x] Adicionar FAB para novo atleta
- [x] Criar empty state quando lista vazia
- [ ] Adicionar indicador de filtros ativos

## Interface - Filtros
- [x] Criar tela de filtros como modal/sheet
- [x] Implementar filtros por posição
- [x] Implementar filtros por clube
- [x] Implementar filtros por idade (range)
- [x] Implementar filtros por altura (range)
- [x] Implementar filtros por pé
- [x] Implementar filtros por escala
- [x] Implementar filtros por valência
- [x] Adicionar contador de resultados
- [x] Implementar botão limpar filtros
- [ ] Implementar aplicação de filtros na lista

## Interface - Detalhes do Atleta
- [x] Criar tela de detalhes com todas informações
- [x] Adicionar botão editar no header
- [x] Adicionar botão excluir com confirmação
- [x] Tornar campo link clicável
- [x] Implementar navegação para edição

## Interface - Cadastro e Edição
- [x] Criar formulário de cadastro/edição
- [x] Implementar campo de texto para nome do atleta
- [x] Implementar seletor de posição principal
- [x] Implementar seletor de segunda posição
- [x] Implementar campo de texto para clube
- [x] Implementar date picker para data de nascimento
- [x] Implementar cálculo automático de idade
- [x] Implementar campo numérico para altura
- [x] Implementar seletor de pé preferencial
- [x] Implementar campo de texto para link
- [x] Implementar seletor de escala
- [x] Implementar seletor de valência
- [x] Adicionar validação de campos obrigatórios
- [x] Implementar botões cancelar e salvar
- [x] Adicionar feedback de sucesso/erro

## Gerenciamento de Colunas
- [x] Criar tela de configurações de campos
- [ ] Listar campos padrão com toggles
- [ ] Implementar ativação/desativação de campos
- [x] Criar modal para adicionar campo customizado
- [x] Implementar criação de campos customizados
- [ ] Atualizar formulários dinamicamente baseado em campos ativos
- [ ] Persistir configurações de campos

## Estado e Persistência
- [ ] Criar context para gerenciar lista de atletas
- [ ] Criar context para configurações de campos
- [ ] Implementar persistência com AsyncStorage
- [ ] Implementar carregamento inicial de dados
- [ ] Adicionar loading states

## Navegação
- [x] Configurar tabs (Lista, Configurações)
- [x] Adicionar ícones aos tabs
- [x] Configurar navegação entre telas
- [x] Implementar navegação com parâmetros

## Testes e Validação
- [ ] Testar cadastro de atletas
- [ ] Testar edição de atletas
- [ ] Testar exclusão de atletas
- [ ] Testar filtros combinados
- [ ] Testar busca por nome
- [ ] Testar adição de campos customizados
- [ ] Testar persistência de dados
- [x] Validar performance com muitos registros (1.503 atletas carregando corretamente)

## Finalização
- [x] Criar checkpoint final
- [ ] Preparar documentação de uso

## Atualização de Status
- Backend e modelo de dados implementados
- API tRPC criada e funcional
- Próximo passo: desenvolver interface mobile


## Importação de Dados
- [x] Analisar estrutura do CSV do usuário
- [x] Criar script de importação de dados
- [x] Mapear campos do CSV para campos do banco
- [x] Executar importação dos atletas (1.503 atletas importados com sucesso)
- [x] Validar dados importados (15 testes passando)

## Correções de UI
- [ ] Adicionar botão de login visível na tela principal quando usuário não está autenticado

## Correções de Autenticação
- [ ] Corrigir rota de login para funcionar no mobile

## Correções Urgentes - Autenticação Web
- [ ] Corrigir callback OAuth para funcionar na versão web
- [ ] Implementar autenticação funcional para acesso aos dados


## Melhorias de UI/UX - Dashboard
- [x] Corrigir tela de detalhes para mostrar todas as informações do atleta (data nascimento, idade, altura)
- [x] Redesenhar dashboard com interface sofisticada e moderna
- [x] Adicionar cards com informações destacadas
- [x] Melhorar visual da tela de detalhes com layout mais profissional
- [x] Adicionar ícones e cores para melhor visualização

## Valências - Melhorias
- [x] Exibir campo "Valências" na tela de detalhes do atleta (sempre visível, mesmo vazio, com placeholder "Sem descrição")
- [x] Garantir campo de texto multilinha no formulário de edição para Valências (até 500+ caracteres)
- [x] Remover limite de 100 caracteres no router tRPC para o campo valencia (agora 1000)

## Correção Data de Nascimento
- [x] Alterar campo de data de nascimento no formulário para aceitar formato dd/mm/aa
- [x] Alterar exibição da data de nascimento na tela de detalhes para formato dd/mm/aa
- [x] Converter entre formato dd/mm/aa (UI) e ISO (banco) corretamente

## Filtros na Página Inicial
- [x] Adicionar filtro por posição na lista de atletas
- [x] Adicionar filtro por clube na lista de atletas
- [x] Adicionar filtro por faixa de idade na lista de atletas
- [x] Interface de filtros com botões/chips expansíveis

## Relatório PDF
- [x] Criar endpoint no servidor para gerar PDF com dados de atletas
- [x] Adicionar botão "Gerar Relatório" na tela principal
- [x] Gerar PDF com os atletas filtrados (respeitar filtros de posição, clube, idade e busca)
- [x] Incluir resumo, tabela e fichas individuais no PDF
- [x] Permitir compartilhar/baixar o PDF gerado

## Auto-preenchimento via Ogol
- [x] Criar endpoint no servidor para extrair dados de atleta do Ogol (scraping)
- [x] Mapear campos do Ogol para campos do app (nome, posição, data nasc., altura, pé, clube)
- [x] Adicionar botão "Preencher do Ogol" no formulário de cadastro/edição
- [x] Preencher automaticamente os campos disponíveis e deixar vazios os que não existem
- [x] Testar com múltiplos atletas para garantir consistência (19 testes passando)

## Confirmação antes de Gerar Relatório
- [x] Adicionar modal de confirmação antes de gerar o PDF
- [x] Mostrar resumo dos filtros aplicados no modal
- [x] Mostrar quantidade de atletas que serão incluídos no relatório
- [x] Botões "Cancelar" e "Gerar Relatório" no modal

## Bug: Auto-preenchimento Ogol não funciona
- [x] Investigar falha no scraping do Ogol (proteção Cloudflare bloqueia fetch direto)
- [x] Implementar solução alternativa que funcione no celular (WebView oculta)
- [x] Testar com links reais de atletas do Ogol (19 testes passando)


## Ogol Web - Fallback para Web
- [x] Implementar fallback para web: abre Ogol em nova aba
- [x] Manter WebView no celular (funciona perfeitamente)
- [x] Testar na web e celular

## Bug: Extração Ogol não captura posição, clube e naturalidade
- [x] Investigar por que regex não captura posição, clube e naturalidade no WebView
- [x] Analisar HTML real renderizado no WebView vs fetch direto
- [x] Corrigir padrões de extração para funcionar com HTML renderizado

## Foto de Atleta na Web
- [x] Verificar se upload de foto está implementado
- [x] Implementar upload de foto funcional na web (input file) e celular (ImagePicker)
- [x] Criar rota uploadFoto no servidor com base64 + S3 storage
- [x] Invalidar cache após upload para atualizar galeria e foto do atleta
