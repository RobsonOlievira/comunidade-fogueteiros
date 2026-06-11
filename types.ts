export interface Channel {
  id: string
  titulo: string
  descricao: string
}

export interface ChannelItem {
  id: string
  title: string
  desc: string
}

export interface Message {
  id: string
  author: string
  avatar: string
  avatarColor: string
  badge: string
  text: string
  time: string
  perfilId?: string
}

export interface Perfil {
  id: string
  nome: string
  apelido?: string
  bio?: string
  avatar_url?: string
  cor_avatar: string
  cracha: string
  nivel: number
  xp: number
  tech_stack: string[]
  cargo: string
  criado_em: string
  atualizado_em: string
  origem?: string
  app_b_id?: string
  vinculado_app_b?: boolean
  pro?: boolean
}

export interface Voto {
  id: string
  perfil_id: string
  alvo_id: string
  tipo_alvo: 'thread' | 'comentario'
  valor: 1 | -1
}

export interface Conquista {
  id: string
  nome: string
  descricao: string
  icone: string
  tipo: string
  requisito: number
  ordem: number
  criado_em: string
}

export interface PerfilConquista {
  id: string
  perfil_id: string
  conquista_id: string
  criado_em: string
}

export interface Notificacao {
  id: string
  perfil_id: string
  tipo: string
  titulo: string
  conteudo: string
  lida: boolean
  link: string
  criado_em: string
}

export interface Thread {
  id: string
  titulo: string
  conteudo: string
  autor: string
  avatar: string
  cor_avatar: string
  perfil_id?: string
  upvotes: number
  num_comentarios: number
  tags: string[]
  criado_em: string
}

export interface Comentario {
  id: string
  thread_id: string
  perfil_id?: string
  autor: string
  avatar: string
  cor_avatar: string
  conteudo: string
  upvotes: number
  criado_em: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  avatarColor: string
  badge: string
  bio: string
  techStack: string[]
  level: number
  xp: number
  xpToNext: number
}
