# FarmUP Admin - Painel Web Administrativo

<p align="center">
  <img src="public/assets/logo.png" alt="FarmUP Admin Logo" height="120" />
</p>

## Sobre o Projeto

O FarmUP Admin é um painel web administrativo desenvolvido para gerenciar, acompanhar e alimentar dados do aplicativo mobile FarmUP. Esta plataforma permite que administradores de redes de farmácias monitorem indicadores de desempenho, gerenciem planos de ação, validem evidências de execução e administrem usuários e configurações específicas de cada farmácia.

## Principais Funcionalidades

### 1. Gestão de Farmácias (White Label)
- Cadastro completo das farmácias da rede
- Personalização visual (logo, cores primárias/secundárias)
- Definição de metas padrão por KPI para cada farmácia

### 2. Indicadores e Relações
- Cadastro e gerenciamento de indicadores de desempenho
- Definição de relações causais entre indicadores
- Visualização interativa em grafo das relações entre indicadores
- Acompanhamento de métricas por loja

### 3. Planos de Ação
- Criação e atribuição de planos de ação
- Associação entre indicadores e ações recomendadas
- Definição de etapas, produtos relacionados e prazos
- Monitoramento da execução dos planos

### 4. Validação de Evidências
- Revisão das fotos de execução enviadas pelo app
- Interface para aprovação ou rejeição com feedback
- Visualização de metadata (localização, usuário, data)
- Histórico de validações

### 5. Gestão de Usuários
- Cadastro de usuários com diferentes níveis de acesso
- Atribuição de farmácias específicas por usuário
- Redefinição de senhas e gerenciamento de status

### 6. Dashboard de Acompanhamento
- Visão consolidada dos principais KPIs
- Gráficos de evolução de indicadores
- Alertas de desvios e pendências
- Visão comparativa entre unidades

## Requisitos Técnicos

- Node.js 16+
- NPM ou Yarn
- Projeto Firebase configurado

## Tecnologias Utilizadas

- **Frontend:** Next.js, TypeScript, Material UI
- **Autenticação:** Firebase Authentication
- **Banco de Dados:** Firestore
- **Storage:** Firebase Storage
- **Gráficos:** Recharts, D3.js, React Force Graph
- **Editor de Texto:** TinyMCE

## Passo a Passo para Configuração Local

### 1. Preparar o Ambiente Firebase

Antes de começar o projeto, você precisa configurar um projeto no Firebase:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome para o projeto (ex: "farmup-admin")
4. Siga as instruções para criar o projeto
5. Habilite os serviços necessários:
   - Authentication (ative o provedor de e-mail/senha)
   - Firestore Database
   - Storage

### 2. Obter as Credenciais do Firebase

1. No console do Firebase, vá para configurações do projeto (ícone de engrenagem)
2. Selecione "Configurações do Projeto"
3. Na aba "Geral", role até "Seus aplicativos" e clique em "Web" (ícone `</>`)
4. Registre o app com um apelido (ex: "farmup-admin-web")
5. Copie o objeto de configuração que aparecerá (contém apiKey, authDomain, etc.)

### 3. Clonar o Repositório e Instalar Dependências

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/farmup-admin.git
cd farmup-admin

# Instalar dependências
npm install
# ou com Yarn
yarn install

4. Configurar Variáveis de Ambiente
Crie um arquivo .env.local na raiz do projeto com as credenciais do Firebase:

NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=seu-measurement-id

5. Configurar o Banco de Dados Firestore

No console do Firebase, vá para "Firestore Database"
Crie as seguintes coleções:

users
pharmacies
indicators
relations
actionPlans
evidences


Configure regras de segurança básicas:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

6. Criar Usuário Administrador Inicial

No console do Firebase, vá para "Authentication"
Clique em "Add User"
Insira um e-mail e senha para o administrador inicial
Em seguida, vá para "Firestore Database"
Crie um documento na coleção users com os seguintes campos:

uid: [o UID do usuário que você criou]
name: "Administrador"
email: [o e-mail que você usou]
role: "admin"
status: "active"
createdAt: [timestamp atual]

Estrutura do Projeto
farmup-admin/
├── public/
│   └── assets/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── forms/
│   │   └── dashboard/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── index.tsx (dashboard)
│   │   ├── login.tsx
│   │   ├── farmacies/
│   │   ├── indicators/
│   │   ├── action-plans/
│   │   ├── evidences/
│   │   └── users/
│   ├── services/
│   │   ├── api/
│   │   └── firebase/
│   ├── styles/
│   ├── types/
│   └── utils/
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json