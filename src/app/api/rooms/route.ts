import { NextRequest, NextResponse } from 'next/server';
import type { Room } from '@/types/poker';

// Simulando um banco de dados em memória (em produção, use um banco real)
let rooms: Room[] = [];

export async function GET() {
  try {
    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar salas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const roomData = await request.json();
    
    // Validar dados da sala
    if (!roomData.name || !roomData.ownerName) {
      return NextResponse.json(
        { error: 'Nome da sala e nome do dono são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar nova sala
    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
      name: roomData.name,
      password: roomData.password,
      ownerId: Math.random().toString(36).substr(2, 9),
      ownerName: roomData.ownerName,
      players: [{
        id: Math.random().toString(36).substr(2, 9),
        name: roomData.ownerName,
        chips: roomData.startingChips || 1000,
        isDealer: true,
        isSmallBlind: false,
        isBigBlind: false,
        isActive: true,
        currentBet: 0,
        totalBet: 0,
        position: 0,
      }],
      maxPlayers: roomData.maxPlayers || 6,
      bigBlind: roomData.bigBlind || 10,
      smallBlind: roomData.smallBlind || 5,
      startingChips: roomData.startingChips || 1000,
      currentPot: 0,
      currentRound: 'preflop',
      isActive: true,
      createdAt: new Date(),
      currentDealer: 0,
      currentPlayer: 0,
      communityCards: [],
      roundBets: {},
      lastAction: 'Sala criada',
    };

    rooms.push(newRoom);
    
    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar sala' },
      { status: 500 }
    );
  }
}
