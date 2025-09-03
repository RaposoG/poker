import type { GameAction, HandResult, Player, Room } from "@/types/poker";

export class PokerGame {
  private room: Room;

  constructor(room: Room) {
    this.room = room;
  }

  // Criar nova sala
  static createRoom(
    name: string,
    ownerName: string,
    settings: {
      bigBlind: number;
      smallBlind: number;
      startingChips: number;
      maxPlayers: number;
      password?: string;
    },
  ): Room {
    const roomId = Math.random().toString(36).substr(2, 9);
    const ownerId = Math.random().toString(36).substr(2, 9);

    const owner: Player = {
      id: ownerId,
      name: ownerName,
      chips: settings.startingChips,
      isDealer: true,
      isSmallBlind: false,
      isBigBlind: false,
      isActive: true,
      currentBet: 0,
      totalBet: 0,
      position: 0,
    };

    return {
      id: roomId,
      name,
      password: settings.password,
      ownerId,
      ownerName,
      players: [owner],
      maxPlayers: settings.maxPlayers,
      bigBlind: settings.bigBlind,
      smallBlind: settings.smallBlind,
      startingChips: settings.startingChips,
      currentPot: 0,
      currentRound: "preflop",
      isActive: true,
      createdAt: new Date(),
      currentDealer: 0,
      currentPlayer: 0,
      communityCards: [],
      roundBets: {},
      lastAction: "Sala criada",
    };
  }

  // Adicionar jogador à sala
  addPlayer(playerName: string): Player | null {
    if (this.room.players.length >= this.room.maxPlayers) {
      return null;
    }

    const playerId = Math.random().toString(36).substr(2, 9);
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      chips: this.room.startingChips,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      isActive: true,
      currentBet: 0,
      totalBet: 0,
      position: this.room.players.length,
    };

    this.room.players.push(newPlayer);
    this.room.lastAction = `${playerName} entrou na sala`;
    return newPlayer;
  }

  // Remover jogador da sala
  removePlayer(playerId: string): boolean {
    const playerIndex = this.room.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return false;

    const player = this.room.players[playerIndex];
    this.room.players.splice(playerIndex, 1);

    // Reorganizar posições
    this.room.players.forEach((p, index) => {
      p.position = index;
    });

    this.room.lastAction = `${player.name} saiu da sala`;
    return true;
  }

  // Iniciar nova mão
  startNewHand(): void {
    if (this.room.players.length < 2) return;

    // Resetar estado da mão
    this.room.currentPot = 0;
    this.room.currentRound = "preflop";
    this.room.communityCards = [];
    this.room.roundBets = {};

    // Resetar apostas dos jogadores
    this.room.players.forEach((player) => {
      player.currentBet = 0;
      player.totalBet = 0;
      player.isActive = true;
    });

    // Mover o botão do dealer para a próxima posição
    this.moveDealerButton();

    // Definir blinds
    this.setBlinds();

    // Coletar blinds
    this.collectBlinds();

    // Definir primeiro jogador a agir (próximo ao big blind)
    this.setFirstToAct();

    this.room.lastAction = "Nova mão iniciada";
  }

  // Mover o botão do dealer
  private moveDealerButton(): void {
    const activePlayers = this.room.players.filter((p) => p.isActive);
    if (activePlayers.length < 2) return;

    // Encontrar o dealer atual
    const currentDealerIndex = activePlayers.findIndex((p) => p.isDealer);
    const nextDealerIndex = (currentDealerIndex + 1) % activePlayers.length;

    // Resetar todos os blinds
    this.room.players.forEach((player) => {
      player.isDealer = false;
      player.isSmallBlind = false;
      player.isBigBlind = false;
    });

    // Definir novo dealer
    activePlayers[nextDealerIndex].isDealer = true;
    this.room.currentDealer = nextDealerIndex;
  }

  // Definir posições dos blinds
  private setBlinds(): void {
    const activePlayers = this.room.players.filter((p) => p.isActive);
    if (activePlayers.length < 2) return;

    const dealerIndex = activePlayers.findIndex((p) => p.isDealer);
    
    // Small blind é o próximo jogador após o dealer
    const smallBlindIndex = (dealerIndex + 1) % activePlayers.length;
    activePlayers[smallBlindIndex].isSmallBlind = true;

    // Big blind é o próximo jogador após o small blind
    const bigBlindIndex = (dealerIndex + 2) % activePlayers.length;
    activePlayers[bigBlindIndex].isBigBlind = true;
  }

  // Definir primeiro jogador a agir
  private setFirstToAct(): void {
    const activePlayers = this.room.players.filter((p) => p.isActive);
    if (activePlayers.length < 2) return;

    const bigBlindIndex = activePlayers.findIndex((p) => p.isBigBlind);
    
    // Em heads-up (2 jogadores), o small blind age primeiro
    if (activePlayers.length === 2) {
      const smallBlindIndex = activePlayers.findIndex((p) => p.isSmallBlind);
      this.room.currentPlayer = smallBlindIndex;
    } else {
      // Com 3+ jogadores, o primeiro jogador após o big blind age primeiro
      this.room.currentPlayer = (bigBlindIndex + 1) % activePlayers.length;
    }
  }

  // Coletar blinds
  private collectBlinds(): void {
    const smallBlindPlayer = this.room.players.find((p) => p.isSmallBlind);
    const bigBlindPlayer = this.room.players.find((p) => p.isBigBlind);

    if (smallBlindPlayer) {
      const smallBlindAmount = Math.min(
        this.room.smallBlind,
        smallBlindPlayer.chips,
      );
      smallBlindPlayer.chips -= smallBlindAmount;
      smallBlindPlayer.currentBet = smallBlindAmount;
      smallBlindPlayer.totalBet = smallBlindAmount;
      this.room.currentPot += smallBlindAmount;
      this.room.roundBets[smallBlindPlayer.id] = smallBlindAmount;
    }

    if (bigBlindPlayer) {
      const bigBlindAmount = Math.min(this.room.bigBlind, bigBlindPlayer.chips);
      bigBlindPlayer.chips -= bigBlindAmount;
      bigBlindPlayer.currentBet = bigBlindAmount;
      bigBlindPlayer.totalBet = bigBlindAmount;
      this.room.currentPot += bigBlindAmount;
      this.room.roundBets[bigBlindPlayer.id] = bigBlindAmount;
    }
  }

  // Executar ação do jogador
  executeAction(action: GameAction): boolean {
    const player = this.room.players.find((p) => p.id === action.playerId);
    if (!player || !player.isActive) return false;

    // Verificar se é a vez do jogador
    const activePlayers = this.room.players.filter((p) => p.isActive);
    const currentPlayerIndex = activePlayers.findIndex((p) => p.id === action.playerId);
    if (currentPlayerIndex !== this.room.currentPlayer) return false;

    switch (action.type) {
      case "fold":
        player.isActive = false;
        this.room.lastAction = `${player.name} desistiu`;
        break;

      case "call": {
        const callAmount = this.getCallAmount(player);
        if (callAmount > player.chips) return false;

        player.chips -= callAmount;
        player.currentBet += callAmount;
        player.totalBet += callAmount;
        this.room.currentPot += callAmount;
        this.room.roundBets[player.id] =
          (this.room.roundBets[player.id] || 0) + callAmount;
        this.room.lastAction = `${player.name} pagou ${callAmount}`;
        break;
      }

      case "raise":
        if (!action.amount || action.amount > player.chips) return false;

        player.chips -= action.amount;
        player.currentBet += action.amount;
        player.totalBet += action.amount;
        this.room.currentPot += action.amount;
        this.room.roundBets[player.id] =
          (this.room.roundBets[player.id] || 0) + action.amount;
        this.room.lastAction = `${player.name} aumentou para ${action.amount}`;
        break;

      case "check":
        this.room.lastAction = `${player.name} passou`;
        break;

      case "all-in": {
        const allInAmount = player.chips;
        player.chips = 0;
        player.currentBet += allInAmount;
        player.totalBet += allInAmount;
        this.room.currentPot += allInAmount;
        this.room.roundBets[player.id] =
          (this.room.roundBets[player.id] || 0) + allInAmount;
        this.room.lastAction = `${player.name} foi all-in com ${allInAmount}`;
        break;
      }
    }

    // Mover para o próximo jogador
    this.moveToNextPlayer();

    return true;
  }

  // Mover para o próximo jogador
  private moveToNextPlayer(): void {
    const activePlayers = this.room.players.filter((p) => p.isActive);
    if (activePlayers.length <= 1) return;

    this.room.currentPlayer = (this.room.currentPlayer + 1) % activePlayers.length;
  }

  // Verificar se a rodada de apostas terminou
  checkRoundComplete(): boolean {
    const activePlayers = this.room.players.filter((p) => p.isActive);
    if (activePlayers.length <= 1) return true;

    // Verificar se todos os jogadores ativos apostaram a mesma quantia
    const maxBet = Math.max(...activePlayers.map((p) => p.currentBet));
    const allBetsEqual = activePlayers.every((p) => p.currentBet === maxBet);

    return allBetsEqual;
  }

  // Avançar para a próxima rodada
  advanceToNextRound(): void {
    switch (this.room.currentRound) {
      case "preflop":
        this.room.currentRound = "flop";
        this.room.communityCards = ["🂡", "🂢", "🂣"]; // Simular cartas do flop
        break;
      case "flop":
        this.room.currentRound = "turn";
        this.room.communityCards.push("🂤"); // Adicionar carta do turn
        break;
      case "turn":
        this.room.currentRound = "river";
        this.room.communityCards.push("🂥"); // Adicionar carta do river
        break;
      case "river":
        this.room.currentRound = "showdown";
        break;
    }

    // Resetar apostas da rodada
    this.room.players.forEach((player) => {
      player.currentBet = 0;
    });
    this.room.roundBets = {};

    // Definir primeiro jogador a agir na nova rodada
    this.setFirstToActInRound();
  }

  // Definir primeiro jogador a agir na rodada
  private setFirstToActInRound(): void {
    const activePlayers = this.room.players.filter((p) => p.isActive);
    if (activePlayers.length < 2) return;

    const dealerIndex = activePlayers.findIndex((p) => p.isDealer);
    
    // Em todas as rodadas após o preflop, o small blind age primeiro
    if (this.room.currentRound !== "preflop") {
      const smallBlindIndex = activePlayers.findIndex((p) => p.isSmallBlind);
      this.room.currentPlayer = smallBlindIndex;
    } else {
      // No preflop, usar a lógica já implementada
      this.setFirstToAct();
    }
  }

  // Calcular valor para call
  private getCallAmount(player: Player): number {
    const maxBet = Math.max(...this.room.players.map((p) => p.currentBet));
    return Math.max(0, maxBet - player.currentBet);
  }

  // Declarar vencedor da mão
  declareWinner(winnerId: string, pot: number): HandResult | null {
    const winner = this.room.players.find((p) => p.id === winnerId);
    if (!winner) return null;

    winner.chips += pot;
    this.room.currentPot = 0;

    const result: HandResult = {
      winnerId: winner.id,
      winnerName: winner.name,
      pot,
      hand: "Declarado pelo dono da sala",
      timestamp: new Date(),
    };

    this.room.lastAction = `${winner.name} ganhou ${pot} fichas`;
    return result;
  }

  // Obter estado atual da sala
  getRoomState(): Room {
    return { ...this.room };
  }

  // Verificar se é dono da sala
  isOwner(playerId: string): boolean {
    return this.room.ownerId === playerId;
  }

  // Obter jogadores ativos
  getActivePlayers(): Player[] {
    return this.room.players.filter((p) => p.isActive);
  }

  // Obter próximo jogador
  getNextPlayer(): Player | null {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) return null;

    const currentIndex = activePlayers.findIndex(
      (p) => p.id === this.room.players[this.room.currentPlayer]?.id,
    );
    const nextIndex = (currentIndex + 1) % activePlayers.length;

    return activePlayers[nextIndex];
  }
}
