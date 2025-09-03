import { type NextRequest, NextResponse } from "next/server";
import { GameEngine } from "@/lib/game-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    const gameEngine = new GameEngine(id);

    if (action === "start") {
      const roomState = await gameEngine.startNewHand();
      return NextResponse.json({ room: roomState });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao gerenciar mão:", error);
    return NextResponse.json(
      { error: "Erro ao gerenciar mão" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { winnerId, pot } = await request.json();

    if (!winnerId || !pot) {
      return NextResponse.json(
        { error: "winnerId e pot são obrigatórios" },
        { status: 400 },
      );
    }

    const gameEngine = new GameEngine(id);
    await gameEngine.declareWinner(winnerId, pot);

    const roomState = await gameEngine.getRoomState();
    return NextResponse.json({ room: roomState });
  } catch (error) {
    console.error("Erro ao declarar vencedor:", error);
    return NextResponse.json(
      { error: "Erro ao declarar vencedor" },
      { status: 500 },
    );
  }
}
