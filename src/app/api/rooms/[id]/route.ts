import { NextRequest, NextResponse } from 'next/server';

// Simulando um banco de dados em memória
let rooms: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = rooms.find(r => r.id === id);
    
    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
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
    const roomIndex = rooms.findIndex(r => r.id === id);
    
    if (roomIndex === -1) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    rooms[roomIndex] = { ...rooms[roomIndex], ...roomData };
    
    return NextResponse.json({ room: rooms[roomIndex] });
  } catch (error) {
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
    const roomIndex = rooms.findIndex(r => r.id === id);
    
    if (roomIndex === -1) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    rooms.splice(roomIndex, 1);
    
    return NextResponse.json({ message: 'Sala removida com sucesso' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao remover sala' },
      { status: 500 }
    );
  }
}
