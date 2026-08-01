# Plataforma do Plano Financeiro — CEDUP Hermann Hering

Plataforma didática para o Curso Técnico em Administração e Contabilidade:
professor(a) e equipes de alunos constroem, módulo a módulo, o plano
financeiro de um negócio (investimentos, capital de giro, custos, DRE e
indicadores de viabilidade), com análise gráfica e acompanhamento ao longo
do projeto.

O site é publicado automaticamente no GitHub Pages via GitHub Actions. Os
dados (turmas, equipes, lançamentos) ficam salvos no **Firestore**
(Firebase), gratuito, para que professor e alunos, em dispositivos
diferentes, vejam as mesmas informações.

## Passo a passo — configurar o Firebase (uma vez só)

1. Acesse **[console.firebase.google.com](https://console.firebase.google.com)** e faça login com uma conta Google.
2. Clique em **"Adicionar projeto"**, dê um nome (ex.: `plataforma-financeiro-cedup`) e conclua a criação. Não precisa ativar o Google Analytics.
3. No menu lateral, vá em **Build → Firestore Database** → **"Criar banco de dados"**.
   - Escolha uma localização (ex.: `southamerica-east1` para servidores no Brasil).
   - Selecione **"Iniciar no modo de teste"** (ou modo de produção — nesse caso, cole as regras da seção abaixo).
4. Ainda no console, clique no ícone de engrenagem ⚙️ → **"Configurações do projeto"**.
5. Na aba **"Geral"**, role até **"Seus aplicativos"** e clique no ícone **`</>`** (Web) para registrar um app.
   - Dê um apelido (ex.: `plataforma-web`) e clique em **"Registrar app"**.
6. A tela vai mostrar um bloco `firebaseConfig = { ... }`. Copie os 6 valores.
7. No repositório, abra **`src/firebaseConfig.js`** e cole os valores no lugar de `"COLE_AQUI"`.
8. Salve, faça commit e push. O GitHub Actions publica a versão nova automaticamente em alguns minutos (aba **Actions** do repositório).

### Regras do Firestore (recomendado após o modo de teste expirar)

O modo de teste do Firestore expira em 30 dias. Depois disso, vá em
**Firestore Database → Regras** e cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /kv/{document} {
      allow read, write: if true;
    }
  }
}
```

> **Nota sobre segurança:** essa regra libera leitura/escrita para qualquer
> pessoa que tenha a URL do site — adequado para uso didático interno, sem
> dados sensíveis. Se quiser mais controle (por exemplo, restringir a
> escrita), é possível evoluir para Firebase Authentication mais adiante.

## Passo a passo — publicar no GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em **"Build and deployment" → "Source"**, selecione **"GitHub Actions"** (não "Deploy from a branch").
3. Faça um push para a branch `main` (ou rode o workflow manualmente na aba **Actions → Build e Deploy no GitHub Pages → Run workflow**).
4. Aguarde o workflow terminar (ícone verde ✅ na aba Actions). O site fica disponível em:
   `https://profjorgerg-gif.github.io/Plataforma-Plano-Financeiro-CEDUP-Hermann-Hering/`

Se você renomear o repositório, atualize também a linha `base` em
`vite.config.js` para o novo nome.

## Rodar localmente (opcional, para testar antes de publicar)

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (geralmente `http://localhost:5173`).
Lembre-se de preencher `src/firebaseConfig.js` antes — sem isso, a
plataforma mostra uma tela pedindo a configuração.

## Estrutura do projeto

```
src/
  App.jsx              → toda a lógica e as telas da plataforma
  firebaseStorage.js   → conecta a plataforma ao Firestore (não precisa mexer)
  firebaseConfig.js    → suas chaves do Firebase (você preenche)
  main.jsx             → ponto de entrada React
.github/workflows/
  deploy.yml           → build + publicação automática no GitHub Pages
```

## Uso didático

- **Professor(a):** cria turmas (gera um código), acompanha as equipes em
  Gestão → Turmas/Usuários/Relatórios/Backup/Auditoria.
- **Aluno(a):** entra com o código da turma, forma a equipe, e preenche os
  13 módulos do plano financeiro em ordem, guiado pelo Manual do Aluno.
