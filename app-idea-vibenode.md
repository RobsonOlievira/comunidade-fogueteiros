# Ideia de Aplicativo: VibeNode

## Descrição
Uma plataforma de comunidade híbrida (fórum assíncrono + chat em tempo real) projetada para 'vibe coders', web designers e criadores focados em IA. O VibeNode resolve a fragmentação e o ritmo frenético das novidades em inteligência artificial, oferecendo um espaço curado pela comunidade onde o senso coletivo filtra o que realmente importa. É um hub para compartilhar prompts, testar novos modelos em conjunto e debater arquiteturas modernas de software.

## Funcionalidades Principais
- Fóruns temáticos em estilo Reddit (Threads) com suporte avançado a Markdown, blocos de código com syntax highlighting e sistema de Upvote/Downvote.
- 'Labs' em tempo real: Salas de bate-papo estilo Discord para hackathons instantâneos, testes de novos modelos LLM e discussões ao vivo.
- Resumo Automático de Threads por IA (TL;DR): Para debates técnicos longos, a plataforma gera resumos automáticos para quem chegou atrasado na discussão.
- Perfil 'Tech Stack & Prompt Toolkit': Os usuários podem exibir em seus perfis quais ferramentas de IA utilizam e compartilhar seus prompts públicos mais bem-sucedidos.
- Moderação assistida por IA que categoriza automaticamente as postagens (ex: GPT-4, Midjourney, UI/UX, Cursor) e evita spam.
- Sistema de reputação gamificado focado na utilidade técnica (ex: 'Código Útil', 'Prompt Inovador') ao invés de métricas de vaidade.

---

# Plano de Ação

## Arquitetura Escalável
A arquitetura recomendada é Serverless Full-Stack. Frontend: Next.js (App Router) para Server-Side Rendering (SSR) otimizado para SEO e performance, utilizando React Server Components. Estilização: Tailwind CSS integrado com Shadcn UI para componentes acessíveis e rápidos de construir. Backend/Database: Supabase (PostgreSQL) atuando como Backend-as-a-Service, gerenciando autenticação, banco de dados relacional e WebSockets (Realtime) nativos para os chats. Integração de IA: Vercel AI SDK para interagir de forma fluida e em streaming com modelos da OpenAI ou Anthropic para os resumos e moderação.

## Diretrizes de UI/UX
Design focado em desenvolvedores e criadores (Developer-First/Cyber-Minimalism). Dark Mode nativo (padrão) com paleta de cores de alto contraste (fundos em tons de grafite/preto com acentos em cores neon vibrantes como roxo, verde-limão ou azul-ciano para botões de ação). A interface deve ser ultra-limpa, inspirada em ferramentas como Linear, Vercel e Raycast. Micro-interações sutis, tipografia monoespaçada (ex: JetBrains Mono ou Fira Code) para títulos técnicos ou tags, e uma hierarquia visual de leitura de código muito clara.

## Passo a Passo
1. 1. Estruturação inicial do projeto: Inicializar Next.js com Tailwind CSS e adicionar Shadcn UI para padronização de botões, modais e inputs.
2. 2. Configuração de Banco e Autenticação: Configurar projeto no Supabase, criar tabelas principais (users, posts, comments, channels, messages) com Row Level Security (RLS) e habilitar login social (GitHub, Google).
3. 3. Construção do Core Asíncrono (Fórum): Desenvolver o feed principal com paginação, criação de posts com editor Markdown e sistema de upvotes usando Server Actions do Next.js.
4. 4. Construção do Core Síncrono (Labs/Chat): Implementar as salas de chat utilizando os canais de Realtime do Supabase para atualização de mensagens sem refresh.
5. 5. Integração de IA: Adicionar o Vercel AI SDK. Criar um endpoint que lê os comentários de uma thread longa e gera um resumo 'TL;DR' na interface do usuário.
6. 6. Gamificação e Perfis: Desenvolver a página de perfil do usuário, exibindo seu 'Stack' de ferramentas e sistema de pontos com base em upvotes recebidos.
7. 7. Deploy e Testes: Fazer deploy na Vercel, otimizar cache, garantir responsividade mobile-first e realizar testes de carga no Supabase Realtime.

---

# Prompt para IA (Copie e cole na sua IDE ou Google AI Studio)

```
Você é um Engenheiro de Software Sênior especialista em Next.js (App Router), Tailwind CSS, Shadcn UI e Supabase. Seu objetivo é criar o 'VibeNode', uma comunidade online estilo Reddit/Discord voltada para 'vibe coders', programadores e criadores de IA. A interface deve ser minimalista, inspirada no design da Linear, com foco em Dark Mode, alta performance e tipografia limpa.

STACK TÉCNICO:
- Next.js 14+ (App Router, Server Components e Server Actions)
- Tailwind CSS e Shadcn UI (Lucide Icons)
- Supabase (Auth, PostgreSQL e Realtime)
- Vercel AI SDK
- Zustand (se necessário gerenciamento de estado global no client)
- React Markdown para renderizar blocos de código

REGRAS DE ARQUITETURA:
1. Separe rigorosamente a lógica de acesso a dados (Supabase) dos componentes de UI.
2. Priorize o uso de Server Components (RSC) para listagens, leitura de posts e SEO. Use Client Components ('use client') apenas para interatividade (formulários de comentários, botões de upvote, chat em tempo real).
3. O banco de dados Supabase deve usar RLS (Row Level Security) rigoroso.
4. Código deve ser modular, tipado (TypeScript) e limpo, focado em alta manutenibilidade.

PASSO A PASSO PARA A GERAÇÃO DE CÓDIGO (Aborde uma fase por vez e pergunte antes de prosseguir):

FASE 1: SETUP E BANCO DE DADOS
- Crie a estrutura de pastas do Next.js.
- Forneça o schema SQL completo do Supabase com as seguintes tabelas: `users_profiles`, `threads` (posts do fórum), `thread_comments`, `channels` (salas de chat) e `messages` (mensagens do chat). Inclua policies RLS.
- Configure a integração do cliente Supabase no Next.js.

FASE 2: AUTENTICAÇÃO E LAYOUT CORE
- Crie uma tela de login moderna com autenticação OAuth (GitHub) via Supabase.
- Desenvolva o layout principal com uma Sidebar fixa à esquerda (listando tópicos do fórum e salas de chat) e a área de conteúdo central.
- Configure o tema padrão Dark Mode do Tailwind e importe as fontes.

FASE 3: FEED E THREADS (Estilo Reddit)
- Crie a página inicial que lista as `threads` ordenadas por upvotes e data.
- Crie a página individual da Thread (`/thread/[id]`) com suporte à leitura de Markdown e código nativo.
- Implemente os Server Actions para criar nova thread, comentar e dar upvote/downvote.

FASE 4: LABS / CHAT EM TEMPO REAL (Estilo Discord)
- Crie a interface de chat na rota `/labs/[channel_id]`.
- Implemente a subscrição ao Supabase Realtime para que novas `messages` apareçam instantaneamente para todos na sala sem precisar de refresh.

FASE 5: INTEGRAÇÃO COM IA (O Diferencial)
- Implemente um botão 'Resumir Discussão' na página da Thread.
- Crie uma API Route utilizando Vercel AI SDK que recebe o array de comentários da Thread, envia para um LLM (ex: modelo OpenAI ou Claude configurado) e retorna um resumo em texto por streaming para o frontend.

Inicie detalhando a Fase 1: Escreva os comandos de setup necessários, a estrutura de pastas e o código SQL completo do schema do Supabase para eu executar. Aguarde minha confirmação para gerar o código do Next.js.
```
