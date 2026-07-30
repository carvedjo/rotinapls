# RotinaPls
Plataforma de monitorização de rotinas e hábitos, com calendário visual e sistema de check-ins por cor.

## Funcionalidades

- **Autenticação** - registo e login protegidos (Supabase Auth)
- **Rotinas personalizadas** - cria rotinas com nome e cor à escolha
- **Calendário mensal** - marca dias em que cumpriste cada rotina, com navegação entre meses
- **Múltiplos check-ins por dia** - um dia pode ter várias rotinas marcadas em simultâneo
- **Temas** - modo claro, escuro e personalizado pelo utilizador.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, TypeScript)
- [Supabase](https://supabase.com/) (Postgres, Auth, Row Level Security)
- [Tailwind CSS](https://tailwindcss.com/)

## Correr localmente

Clona o repositório e instala as dependências:

```bash
git clone https://github.com/o-teu-user/rotinas-app.git
cd rotinas-app
npm install
```

Cria um ficheiro `.env.local` na raiz do projeto com as tuas credenciais do Supabase:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=a_tua_chave_publishable


Corre o servidor de desenvolvimento:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Notas

Projeto desenvolvido para ajudar a monitorizar tarefas pessoais. 

Atualizado consuante a necessidade.


## Licença

Projeto pessoal, todos os direitos reservados.