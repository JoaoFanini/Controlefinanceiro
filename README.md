# Finanças — dinheiro & rotina

App de controle financeiro pessoal + hábitos e hobbies, em React (hooks) com gráficos em SVG puro. Login por email e senha (Supabase Auth). Cada usuário tem os próprios dados, isolados por Row Level Security na tabela `financas_dados`.

- Visão geral com saldo, receitas/despesas e sparklines
- Lançamentos à vista e compras no cartão com parcelamento automático
- Cartões com limite, cor e timeline de parcelas
- Histórico por mês
- Hábitos & Hobbies por dia da semana (reinicia toda segunda)
- Dicas financeiras

```bash
npm install
npm run dev
```

## Login e dados

- Autenticação: Supabase Auth (email + senha, confirmação por email e recuperação de senha).
- Dados: uma linha por usuário em `public.financas_dados` (`user_id`, `dados jsonb`), com RLS — cada pessoa só lê e grava a própria linha.
- Configuração opcional por variáveis de ambiente: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
