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

    // Definir blinds
    this.setBlinds();

    // Coletar blinds
    this.collectBlinds();

    this.room.lastAction = "Nova mão iniciada";
  }

  // Definir posições dos blinds
  private setBlinds(): void {
    const activePlayers = this.room.players.filter((p) => p.isActive);
    if (activePlayers.length < 2) return;

    // Resetar blinds
    this.room.players.forEach((player) => {
      player.isDealer = false;
      player.isSmallBlind = false;
      player.isBigBlind = false;
    });

    // Definir dealer (posição 0)
    activePlayers[0].isDealer = true;
    this.room.currentDealer = 0;

    // Definir small blind (próxima posição)
    if (activePlayers.length > 1) {
      activePlayers[1].isSmallBlind = true;
    }

    // Definir big blind (próxima posição)
    if (activePlayers.length > 2) {
      activePlayers[2].isBigBlind = true;
      this.room.currentPlayer = 2;
    } else {
      activePlayers[1].isBigBlind = true;
      this.room.currentPlayer = 1;
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

    return true;
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
