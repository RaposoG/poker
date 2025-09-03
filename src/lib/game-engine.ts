import type { Player, Room } from "@/types/poker";
import { prisma } from "./prisma";

export class GameEngine {
  private roomId: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  // Iniciar nova mão
  async startNewHand(): Promise<Room> {
    const room = await prisma.room.findUnique({
      where: { id: this.roomId },
      include: { players: true },
    });

    if (!room || room.players.length < 2) {
      throw new Error("Sala não encontrada ou jogadores insuficientes");
    }

    // Resetar estado da mão
    await prisma.room.update({
      where: { id: this.roomId },
      data: {
        currentPot: 0,
        currentRound: "preflop",
        communityCards: "[]",
        roundBets: "{}",
        lastAction: "Nova mão iniciada",
      },
    });

    // Resetar apostas dos jogadores
    await prisma.player.updateMany({
      where: { roomId: this.roomId },
      data: {
        currentBet: 0,
        totalBet: 0,
        isActive: true,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
      },
    });

    // Mover dealer button e definir blinds
    await this.moveDealerButton();
    await this.setBlinds();
    await this.collectBlinds();
    await this.setFirstToAct();

    return this.getRoomState();
  }

  // Mover o botão do dealer
  private async moveDealerButton(): Promise<void> {
    const players = await prisma.player.findMany({
      where: { roomId: this.roomId, isActive: true },
      orderBy: { position: "asc" },
    });

    if (players.length < 2) return;

    // Encontrar o dealer atual
    const currentDealer = players.find((p) => p.isDealer);
    const currentDealerIndex = currentDealer
      ? players.indexOf(currentDealer)
      : 0;
    const nextDealerIndex = (currentDealerIndex + 1) % players.length;

    // Atualizar dealer
    await prisma.player.update({
      where: { id: players[nextDealerIndex].id },
      data: { isDealer: true },
    });

    // Atualizar currentDealer na sala
    await prisma.room.update({
      where: { id: this.roomId },
      data: { currentDealer: nextDealerIndex },
    });
  }

  // Definir posições dos blinds
  private async setBlinds(): Promise<void> {
    const players = await prisma.player.findMany({
      where: { roomId: this.roomId, isActive: true },
      orderBy: { position: "asc" },
    });

    if (players.length < 2) return;

    const dealerIndex = players.findIndex((p) => p.isDealer);

    // Small blind é o próximo jogador após o dealer
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    await prisma.player.update({
      where: { id: players[smallBlindIndex].id },
      data: { isSmallBlind: true },
    });

    // Big blind é o próximo jogador após o small blind
    const bigBlindIndex = (dealerIndex + 2) % players.length;
    await prisma.player.update({
      where: { id: players[bigBlindIndex].id },
      data: { isBigBlind: true },
    });
  }

  // Coletar blinds
  private async collectBlinds(): Promise<void> {
    const room = await prisma.room.findUnique({
      where: { id: this.roomId },
    });

    if (!room) return;

    const smallBlindPlayer = await prisma.player.findFirst({
      where: { roomId: this.roomId, isSmallBlind: true },
    });

    const bigBlindPlayer = await prisma.player.findFirst({
      where: { roomId: this.roomId, isBigBlind: true },
    });

    let totalPot = 0;

    if (smallBlindPlayer) {
      const smallBlindAmount = Math.min(
        room.smallBlind,
        smallBlindPlayer.chips,
      );
      await prisma.player.update({
        where: { id: smallBlindPlayer.id },
        data: {
          chips: smallBlindPlayer.chips - smallBlindAmount,
          currentBet: smallBlindAmount,
          totalBet: smallBlindAmount,
        },
      });
      totalPot += smallBlindAmount;
    }

    if (bigBlindPlayer) {
      const bigBlindAmount = Math.min(room.bigBlind, bigBlindPlayer.chips);
      await prisma.player.update({
        where: { id: bigBlindPlayer.id },
        data: {
          chips: bigBlindPlayer.chips - bigBlindAmount,
          currentBet: bigBlindAmount,
          totalBet: bigBlindAmount,
        },
      });
      totalPot += bigBlindAmount;
    }

    // Atualizar pot da sala
    await prisma.room.update({
      where: { id: this.roomId },
      data: { currentPot: totalPot },
    });
  }

  // Definir primeiro jogador a agir
  private async setFirstToAct(): Promise<void> {
    const players = await prisma.player.findMany({
      where: { roomId: this.roomId, isActive: true },
      orderBy: { position: "asc" },
    });

    if (players.length < 2) return;

    const bigBlindIndex = players.findIndex((p) => p.isBigBlind);

    // Em heads-up (2 jogadores), o small blind age primeiro
    if (players.length === 2) {
      const smallBlindIndex = players.findIndex((p) => p.isSmallBlind);
      await prisma.room.update({
        where: { id: this.roomId },
        data: { currentPlayer: smallBlindIndex },
      });
    } else {
      // Com 3+ jogadores, o primeiro jogador após o big blind age primeiro
      const firstToActIndex = (bigBlindIndex + 1) % players.length;
      await prisma.room.update({
        where: { id: this.roomId },
        data: { currentPlayer: firstToActIndex },
      });
    }
  }

  // Executar ação do jogador
  async executeAction(
    playerId: string,
    actionType: string,
    amount?: number,
  ): Promise<boolean> {
    const player = await prisma.player.findFirst({
      where: { id: playerId, roomId: this.roomId, isActive: true },
    });

    if (!player) return false;

    const room = await prisma.room.findUnique({
      where: { id: this.roomId },
    });

    if (!room) return false;

    // Verificar se é a vez do jogador
    const players = await prisma.player.findMany({
      where: { roomId: this.roomId, isActive: true },
      orderBy: { position: "asc" },
    });

    const currentPlayerIndex = players.findIndex((p) => p.id === playerId);
    if (currentPlayerIndex !== room.currentPlayer) return false;

    let success = false;
    let actionMessage = "";

    switch (actionType) {
      case "fold":
        await prisma.player.update({
          where: { id: playerId },
          data: { isActive: false },
        });
        actionMessage = `${player.name} desistiu`;
        success = true;
        break;

      case "call": {
        const callAmount = this.getCallAmount(players, player);
        if (callAmount <= player.chips) {
          await prisma.player.update({
            where: { id: playerId },
            data: {
              chips: player.chips - callAmount,
              currentBet: player.currentBet + callAmount,
              totalBet: player.totalBet + callAmount,
            },
          });
          await prisma.room.update({
            where: { id: this.roomId },
            data: { currentPot: room.currentPot + callAmount },
          });
          actionMessage = `${player.name} pagou ${callAmount}`;
          success = true;
        }
        break;
      }

      case "raise":
        if (amount && amount > player.currentBet && amount <= player.chips) {
          await prisma.player.update({
            where: { id: playerId },
            data: {
              chips: player.chips - amount,
              currentBet: player.currentBet + amount,
              totalBet: player.totalBet + amount,
            },
          });
          await prisma.room.update({
            where: { id: this.roomId },
            data: { currentPot: room.currentPot + amount },
          });
          actionMessage = `${player.name} aumentou para ${amount}`;
          success = true;
        }
        break;

      case "check":
        actionMessage = `${player.name} passou`;
        success = true;
        break;

      case "all-in": {
        const allInAmount = player.chips;
        if (allInAmount > 0) {
          await prisma.player.update({
            where: { id: playerId },
            data: {
              chips: 0,
              currentBet: player.currentBet + allInAmount,
              totalBet: player.totalBet + allInAmount,
            },
          });
          await prisma.room.update({
            where: { id: this.roomId },
            data: { currentPot: room.currentPot + allInAmount },
          });
          actionMessage = `${player.name} foi all-in com ${allInAmount}`;
          success = true;
        }
        break;
      }
    }

    if (success) {
      // Registrar ação
      await prisma.gameAction.create({
        data: {
          type: actionType,
          amount,
          playerId,
          roomId: this.roomId,
        },
      });

      // Atualizar última ação
      await prisma.room.update({
        where: { id: this.roomId },
        data: { lastAction: actionMessage },
      });

      // Mover para o próximo jogador
      await this.moveToNextPlayer();

      // Verificar se a rodada terminou
      if (await this.checkRoundComplete()) {
        await this.advanceToNextRound();
      }
    }

    return success;
  }

  // Mover para o próximo jogador
  private async moveToNextPlayer(): Promise<void> {
    const players = await prisma.player.findMany({
      where: { roomId: this.roomId, isActive: true },
      orderBy: { position: "asc" },
    });

    if (players.length <= 1) return;

    const room = await prisma.room.findUnique({
      where: { id: this.roomId },
    });

    if (!room) return;

    const nextPlayerIndex = (room.currentPlayer + 1) % players.length;
    await prisma.room.update({
      where: { id: this.roomId },
      data: { currentPlayer: nextPlayerIndex },
    });
  }

  // Verificar se a rodada terminou
  private async checkRoundComplete(): Promise<boolean> {
    const players = await prisma.player.findMany({
      where: { roomId: this.roomId, isActive: true },
    });

    if (players.length <= 1) return true;

    // Verificar se todos os jogadores ativos apostaram a mesma quantia
    const maxBet = Math.max(...players.map((p) => p.currentBet));
    const allBetsEqual = players.every((p) => p.currentBet === maxBet);

    return allBetsEqual;
  }

  // Avançar para a próxima rodada
  private async advanceToNextRound(): Promise<void> {
    const room = await prisma.room.findUnique({
      where: { id: this.roomId },
    });

    if (!room) return;

    let nextRound = room.currentRound;
    let communityCards = JSON.parse(room.communityCards);

    switch (room.currentRound) {
      case "preflop":
        nextRound = "flop";
        communityCards = ["🂡", "🂢", "🂣"]; // Simular cartas do flop
        break;
      case "flop":
        nextRound = "turn";
        communityCards.push("🂤"); // Adicionar carta do turn
        break;
      case "turn":
        nextRound = "river";
        communityCards.push("🂥"); // Adicionar carta do river
        break;
      case "river":
        nextRound = "showdown";
        break;
    }

    // Resetar apostas da rodada
    await prisma.player.updateMany({
      where: { roomId: this.roomId },
      data: { currentBet: 0 },
    });

    // Atualizar sala
    await prisma.room.update({
      where: { id: this.roomId },
      data: {
        currentRound: nextRound,
        communityCards: JSON.stringify(communityCards),
        roundBets: "{}",
      },
    });

    // Definir primeiro jogador a agir na nova rodada
    if (nextRound !== "showdown") {
      await this.setFirstToActInRound();
    }
  }

  // Definir primeiro jogador a agir na rodada
  private async setFirstToActInRound(): Promise<void> {
    const players = await prisma.player.findMany({
      where: { roomId: this.roomId, isActive: true },
      orderBy: { position: "asc" },
    });

    if (players.length < 2) return;

    const room = await prisma.room.findUnique({
      where: { id: this.roomId },
    });

    if (!room) return;

    // Em todas as rodadas após o preflop, o small blind age primeiro
    if (room.currentRound !== "preflop") {
      const smallBlindIndex = players.findIndex((p) => p.isSmallBlind);
      await prisma.room.update({
        where: { id: this.roomId },
        data: { currentPlayer: smallBlindIndex },
      });
    } else {
      // No preflop, usar a lógica já implementada
      await this.setFirstToAct();
    }
  }

  // Calcular valor para call
  private getCallAmount(players: any[], player: any): number {
    const maxBet = Math.max(...players.map((p) => p.currentBet));
    return Math.max(0, maxBet - player.currentBet);
  }

  // Declarar vencedor da mão
  async declareWinner(winnerId: string, pot: number): Promise<void> {
    const winner = await prisma.player.findFirst({
      where: { id: winnerId, roomId: this.roomId },
    });

    if (!winner) return;

    // Adicionar fichas ao vencedor
    await prisma.player.update({
      where: { id: winnerId },
      data: { chips: winner.chips + pot },
    });

    // Registrar resultado da mão
    await prisma.handResult.create({
      data: {
        roomId: this.roomId,
        winnerId: winner.id,
        winnerName: winner.name,
        pot,
        hand: "Declarado pelo dono da sala",
      },
    });

    // Resetar pot
    await prisma.room.update({
      where: { id: this.roomId },
      data: {
        currentPot: 0,
        lastAction: `${winner.name} ganhou ${pot} fichas`,
      },
    });
  }

  // Obter estado atual da sala
  async getRoomState(): Promise<Room> {
    const room = await prisma.room.findUnique({
      where: { id: this.roomId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        players: true,
      },
    });

    if (!room) {
      throw new Error("Sala não encontrada");
    }

    return {
      id: room.id,
      name: room.name,
      password: room.password || undefined,
      ownerId: room.ownerId,
      ownerName: room.owner.name,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        chips: player.chips,
        isDealer: player.isDealer,
        isSmallBlind: player.isSmallBlind,
        isBigBlind: player.isBigBlind,
        isActive: player.isActive,
        currentBet: player.currentBet,
        totalBet: player.totalBet,
        position: player.position,
      })),
      maxPlayers: room.maxPlayers,
      bigBlind: room.bigBlind,
      smallBlind: room.smallBlind,
      startingChips: room.startingChips,
      currentPot: room.currentPot,
      currentRound: room.currentRound as
        | "preflop"
        | "flop"
        | "turn"
        | "river"
        | "showdown",
      isActive: room.isActive,
      createdAt: room.createdAt,
      currentDealer: room.currentDealer,
      currentPlayer: room.currentPlayer,
      communityCards: JSON.parse(room.communityCards),
      roundBets: JSON.parse(room.roundBets),
      lastAction: room.lastAction,
    };
  }
}
