import { type NextRequest, NextResponse } from "next/server";
import { GameEngine } from "@/lib/game-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { playerId, action, amount } = await request.json();

    if (!playerId || !action) {
      return NextResponse.json(
        { error: "playerId e action são obrigatórios" },
        { status: 400 },
      );
    }

    const gameEngine = new GameEngine(id);
    const success = await gameEngine.executeAction(playerId, action, amount);

    if (!success) {
      return NextResponse.json(
        { error: "Ação inválida ou não é a vez do jogador" },
        { status: 400 },
      );
    }

    const roomState = await gameEngine.getRoomState();
    return NextResponse.json({ room: roomState });
  } catch (error) {
    console.error("Erro ao executar ação:", error);
    return NextResponse.json(
      { error: "Erro ao executar ação" },
      { status: 500 },
    );
  }
}
