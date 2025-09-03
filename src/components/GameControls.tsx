"use client";

import { Crown, DollarSign, Play, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePoker } from "@/contexts/PokerContext";
import type { GameAction, Player, Room } from "@/types/poker";

interface GameControlsProps {
  room: Room;
  currentPlayer: Player;
}

export function GameControls({ room, currentPlayer }: GameControlsProps) {
  const { startNewHand, executeAction, declareWinner } = usePoker();
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [winnerId, setWinnerId] = useState("");
  const [potAmount, setPotAmount] = useState(room.currentPot);

  const isOwner = room.ownerId === currentPlayer.id;
  const isCurrentPlayerTurn =
    room.players[room.currentPlayer]?.id === currentPlayer.id;
  const callAmount = Math.max(
    0,
    Math.max(...room.players.map((p) => p.currentBet)) -
      currentPlayer.currentBet,
  );
  const canCheck = callAmount === 0;

  const handleAction = (actionType: GameAction["type"], amount?: number) => {
    const action: GameAction = {
      type: actionType,
      playerId: currentPlayer.id,
      amount,
      timestamp: new Date(),
    };

    executeAction(action);
    setRaiseAmount(0);
  };

  const handleDeclareWinner = () => {
    if (winnerId && potAmount > 0) {
      declareWinner(winnerId, potAmount);
      setShowWinnerDialog(false);
      setWinnerId("");
      setPotAmount(room.currentPot);
    }
  };

  const activePlayers = room.players.filter((p) => p.isActive);

  return (
    <div className="space-y-4">
      {/* Owner Controls */}
      {isOwner && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-400" />
              Controles do Dono
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => startNewHand()}
              disabled={activePlayers.length < 2}
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Nova Mão
            </Button>

            <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={room.currentPot === 0}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Declarar Vencedor
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Declarar Vencedor
                  </DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Selecione o jogador vencedor e o valor do pot
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Jogador Vencedor</Label>
                    <select
                      value={winnerId}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                    >
                      <option value="">Selecione um jogador</option>
                      {room.players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Valor do Pot</Label>
                    <Input
                      type="number"
                      value={potAmount}
                      onChange={(e) =>
                        setPotAmount(parseInt(e.target.value) || 0)
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      min="0"
                      max={room.currentPot}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowWinnerDialog(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleDeclareWinner}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      disabled={!winnerId || potAmount <= 0}
                    >
                      Declarar Vencedor
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Player Actions */}
      {!isOwner && currentPlayer.isActive && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Suas Ações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isCurrentPlayerTurn ? (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-yellow-300 font-medium">Sua vez!</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAction("fold")}
                    className="border-red-500 text-red-300 hover:bg-red-500/20"
                  >
                    Desistir
                  </Button>

                  {canCheck ? (
                    <Button
                      onClick={() => handleAction("check")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Passar
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleAction("call", callAmount)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={callAmount > currentPlayer.chips}
                    >
                      Pagar {callAmount}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-sm">Aumentar para:</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      value={raiseAmount}
                      onChange={(e) =>
                        setRaiseAmount(parseInt(e.target.value) || 0)
                      }
                      className="bg-gray-800 border-gray-600 text-white"
                      min={callAmount + 1}
                      max={currentPlayer.chips}
                    />
                    <Button
                      onClick={() => handleAction("raise", raiseAmount)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      disabled={
                        raiseAmount <= callAmount ||
                        raiseAmount > currentPlayer.chips
                      }
                    >
                      Aumentar
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => handleAction("all-in")}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={currentPlayer.chips === 0}
                >
                  All-in ({currentPlayer.chips})
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300">Aguardando sua vez...</p>
                <p className="text-sm text-gray-400 mt-1">
                  Próximo: {room.players[room.currentPlayer]?.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Info */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Informações da Mesa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Big Blind:</span>
            <span className="text-white font-medium">{room.bigBlind}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Small Blind:</span>
            <span className="text-white font-medium">{room.smallBlind}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Fichas Iniciais:</span>
            <span className="text-white font-medium">{room.startingChips}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Pot Atual:</span>
            <span className="text-yellow-300 font-medium">
              {room.currentPot}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Rodada:</span>
            <span className="text-white font-medium capitalize">
              {room.currentRound}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
