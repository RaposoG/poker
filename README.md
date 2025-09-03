# 🃏 Poker Manager

Sistema de gestão de fichas para partidas de poker Texas Hold'em. Ideal para jogar com amigos quando vocês têm as cartas físicas mas precisam de um sistema para gerenciar as fichas e a partida automaticamente.

## ✨ Funcionalidades

- **Criação de Salas**: Crie salas personalizadas com configurações específicas
- **Proteção por Senha**: Proteja suas salas com senha para jogar apenas com amigos
- **Gestão Automática de Fichas**: Sistema automático para gerenciar fichas, blinds e apostas
- **Interface Intuitiva**: Interface moderna e responsiva para uma experiência agradável
- **Controles do Dono**: O criador da sala tem controles especiais para gerenciar a partida
- **Declaração de Vencedor**: Sistema para o dono da sala declarar o vencedor e distribuir o pot

## 🚀 Como Usar

### 1. Criar uma Sala

1. Na página inicial, clique em "Criar Nova Sala"
2. Preencha os dados:
   - **Nome da Sala**: Nome identificador da sua mesa
   - **Seu Nome**: Seu nome como dono da sala
   - **Big Blind**: Valor do big blind (ex: 10)
   - **Fichas Iniciais**: Quantas fichas cada jogador começa (ex: 1000)
   - **Máximo de Jogadores**: Quantos jogadores podem entrar (2-10)
   - **Senha**: Opcional, para proteger a sala

### 2. Entrar em uma Sala

1. Na lista de salas, clique em "Entrar na Sala"
2. Digite seu nome
3. Se a sala tiver senha, digite a senha
4. Clique em "Entrar"

### 3. Gerenciar a Partida

#### Como Dono da Sala:
- **Iniciar Nova Mão**: Clique para começar uma nova mão
- **Declarar Vencedor**: Quando a mão terminar, selecione o vencedor e o valor do pot

#### Como Jogador:
- **Suas Ações**: Quando for sua vez, você pode:
  - **Desistir**: Sair da mão atual
  - **Passar**: Se não há apostas para pagar
  - **Pagar**: Pagar a aposta atual
  - **Aumentar**: Aumentar a aposta
  - **All-in**: Apostar todas as suas fichas

## 🎮 Como Funciona

1. **Configuração**: O dono da sala define os valores dos blinds e fichas iniciais
2. **Entrada**: Jogadores entram na sala com seus nomes
3. **Início da Mão**: O dono inicia uma nova mão
4. **Blinds Automáticos**: O sistema automaticamente define dealer, small blind e big blind
5. **Gestão de Apostas**: O sistema gerencia todas as apostas e o pot
6. **Declaração de Vencedor**: O dono declara quem ganhou e o valor do pot
7. **Distribuição**: O sistema automaticamente adiciona as fichas ao vencedor

## 🛠️ Tecnologias

- **Next.js 15**: Framework React para aplicações web
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS para estilização
- **Radix UI**: Componentes de interface acessíveis
- **Lucide React**: Ícones modernos

## 📦 Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd poker

# Instale as dependências
bun install

# Execute o servidor de desenvolvimento
bun run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🚀 Deploy

Para fazer deploy em produção:

```bash
# Build da aplicação
bun run build

# Iniciar servidor de produção
bun start
```

### Deploy no Vercel

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente se necessário
3. Deploy automático a cada push

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- 💻 Desktop
- 📱 Mobile
- 📱 Tablet

## 🎯 Casos de Uso

- **Jogos com Amigos**: Perfeito para jogar poker com amigos em casa
- **Torneios Casuais**: Organize torneios informais
- **Aprendizado**: Ideal para aprender as regras do poker
- **Gestão de Fichas**: Sistema confiável para gerenciar fichas sem erros

## 🔧 Configurações Recomendadas

### Para Iniciantes:
- Big Blind: 5-10
- Fichas Iniciais: 500-1000
- Máximo de Jogadores: 4-6

### Para Jogadores Experientes:
- Big Blind: 20-50
- Fichas Iniciais: 2000-5000
- Máximo de Jogadores: 6-8

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

---

**Divirta-se jogando poker! 🃏♠️♥️♦️♣️**
