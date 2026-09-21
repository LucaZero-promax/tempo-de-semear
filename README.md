# Tempo de Semear

Base do portal público e painel operacional do programa Tempo de Semear em Itapecuru Mirim - MA.

## Executar

1. Instale Node.js 20+.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local` e informe `DATABASE_URL` e `AUTH_SECRET`.
4. Execute `sql/schema.sql` no Neon.
5. Rode `npm run dev`.

Para criar o administrador temporário de desenvolvimento, configure `DATABASE_URL` e execute `npm run admin:seed`. O usuário padrão criado pelo script é `admin.teste@itapecurumirim.ma.gov.br`, com senha temporária `Semear@2026!`. Troque a senha em produção usando `ADMIN_PASSWORD` e remova ou desabilite esse usuário após os testes.

A consulta pública está em `/`. A área de gestores está em `/login` e é protegida pelo middleware. Para criar o primeiro usuário, gere um hash com `bcryptjs` em um script administrativo e insira-o na tabela `usuarios`; senhas nunca devem ser armazenadas em texto puro.

## Rotas principais

- `POST /api/consulta`: consulta minimizada por CPF validado.
- `POST /api/auth/login`: autenticação com cookie JWT HTTP-only.
- `POST /api/auth/logout`: encerra a sessão.
- `/painel`: dashboard protegido para operação.
