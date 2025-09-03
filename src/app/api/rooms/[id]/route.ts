import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom, deleteRoom, formatRoomForFrontend } from '@/lib/room-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await getRoomById(id);
    
    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    const formattedRoom = formatRoomForFrontend(room);
    return NextResponse.json({ room: formattedRoom });
  } catch (error) {
    console.error('Erro ao buscar sala:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar sala' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomData = await request.json();
    
    const room = await updateRoom(id, roomData);
    
    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    const formattedRoom = formatRoomForFrontend(room);
    return NextResponse.json({ room: formattedRoom });
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar sala' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteRoom(id);
    
    return NextResponse.json({ message: 'Sala removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover sala:', error);
    return NextResponse.json(
      { error: 'Erro ao remover sala' },
      { status: 500 }
    );
  }
}
