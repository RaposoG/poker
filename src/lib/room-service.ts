import type { Player, Room } from "@/types/poker";
import { prisma } from "./prisma";

export async function createRoom(
  name: string,
  ownerId: string,
  settings: {
    bigBlind: number;
    smallBlind: number;
    startingChips: number;
    maxPlayers: number;
    password?: string;
  },
) {
  // Criar a sala
  const room = await prisma.room.create({
    data: {
      name,
      ownerId,
      password: settings.password,
      maxPlayers: settings.maxPlayers,
      bigBlind: settings.bigBlind,
      smallBlind: settings.smallBlind,
      startingChips: settings.startingChips,
    },
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

  // Criar o jogador dono da sala
  await prisma.player.create({
    data: {
      name: room.owner.name,
      chips: settings.startingChips,
      isDealer: true,
      roomId: room.id,
      userId: ownerId,
      position: 0,
    },
  });

  // Retornar a sala com o jogador criado
  return prisma.room.findUnique({
    where: { id: room.id },
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
}

export async function getRooms() {
  return prisma.room.findMany({
    where: { isActive: true },
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
    orderBy: { createdAt: "desc" },
  });
}

export async function getRoomById(id: string) {
  return prisma.room.findUnique({
    where: { id },
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
}

export async function updateRoom(id: string, data: any) {
  // Filtrar apenas os campos que podem ser atualizados
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.password !== undefined) updateData.password = data.password;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.maxPlayers !== undefined) updateData.maxPlayers = data.maxPlayers;
  if (data.bigBlind !== undefined) updateData.bigBlind = data.bigBlind;
  if (data.smallBlind !== undefined) updateData.smallBlind = data.smallBlind;
  if (data.startingChips !== undefined)
    updateData.startingChips = data.startingChips;
  if (data.currentPot !== undefined) updateData.currentPot = data.currentPot;
  if (data.currentRound !== undefined)
    updateData.currentRound = data.currentRound;
  if (data.currentDealer !== undefined)
    updateData.currentDealer = data.currentDealer;
  if (data.currentPlayer !== undefined)
    updateData.currentPlayer = data.currentPlayer;
  if (data.communityCards !== undefined)
    updateData.communityCards = JSON.stringify(data.communityCards);
  if (data.roundBets !== undefined)
    updateData.roundBets = JSON.stringify(data.roundBets);
  if (data.lastAction !== undefined) updateData.lastAction = data.lastAction;

  return prisma.room.update({
    where: { id },
    data: updateData,
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
}

export async function deleteRoom(id: string) {
  return prisma.room.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function addPlayerToRoom(
  roomId: string,
  playerName: string,
  userId?: string,
) {
  // Verificar se a sala existe e tem espaço
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });

  if (!room) {
    throw new Error("Sala não encontrada");
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error("Sala cheia");
  }

  // Verificar se o jogador já está na sala
  const existingPlayer = room.players.find((p) => p.name === playerName);
  if (existingPlayer) {
    throw new Error("Já existe um jogador com este nome na sala");
  }

  // Criar o jogador
  return prisma.player.create({
    data: {
      name: playerName,
      chips: room.startingChips,
      roomId,
      userId,
      position: room.players.length,
    },
  });
}

export async function removePlayerFromRoom(roomId: string, playerId: string) {
  return prisma.player.delete({
    where: { id: playerId },
  });
}

export async function updatePlayer(
  roomId: string,
  playerId: string,
  data: Partial<Player>,
) {
  return prisma.player.update({
    where: { id: playerId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function createGameAction(
  roomId: string,
  playerId: string,
  type: string,
  amount?: number,
) {
  return prisma.gameAction.create({
    data: {
      type,
      amount,
      roomId,
      playerId,
    },
  });
}

export async function createHandResult(
  roomId: string,
  winnerId: string,
  winnerName: string,
  pot: number,
  hand: string,
) {
  return prisma.handResult.create({
    data: {
      roomId,
      winnerId,
      winnerName,
      pot,
      hand,
    },
  });
}

// Função para converter dados do Prisma para o formato esperado pelo frontend
export function formatRoomForFrontend(room: any): Room {
  return {
    id: room.id,
    name: room.name,
    password: room.password,
    ownerId: room.ownerId,
    ownerName: room.owner.name,
    players: room.players.map((player: any) => ({
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
