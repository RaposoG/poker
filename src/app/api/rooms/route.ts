import { NextRequest, NextResponse } from 'next/server';
import { getRooms, createRoom, formatRoomForFrontend } from '@/lib/room-service';

export async function GET() {
  try {
    const rooms = await getRooms();
    const formattedRooms = rooms.map(formatRoomForFrontend);
    
    return NextResponse.json({ rooms: formattedRooms });
  } catch (error) {
    console.error('Erro ao buscar salas:', error);
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
    if (!roomData.name || !roomData.ownerId) {
      return NextResponse.json(
        { error: 'Nome da sala e ID do dono são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar nova sala
    const room = await createRoom(
      roomData.name,
      roomData.ownerId,
      {
        bigBlind: roomData.bigBlind || 10,
        smallBlind: roomData.smallBlind || 5,
        startingChips: roomData.startingChips || 1000,
        maxPlayers: roomData.maxPlayers || 6,
        password: roomData.password,
      }
    );

    if (!room) {
      return NextResponse.json(
        { error: 'Erro ao criar sala' },
        { status: 500 }
      );
    }

    const formattedRoom = formatRoomForFrontend(room);
    
    return NextResponse.json({ room: formattedRoom }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sala' },
      { status: 500 }
    );
  }
}
