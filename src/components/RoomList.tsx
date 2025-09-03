"use client";

import { DollarSign, Lock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Room } from "@/types/poker";
import { JoinRoomDialog } from "./JoinRoomDialog";

interface RoomListProps {
  rooms: Room[];
}

export function RoomList({ rooms }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
          <p className="text-white text-lg mb-4">
            Nenhuma sala ativa no momento
          </p>
          <p className="text-green-100">
            Seja o primeiro a criar uma sala e começar uma partida!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <Card
          key={room.id}
          className="bg-white/10 backdrop-blur-sm border-white/20"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">{room.name}</CardTitle>
              {room.password && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-500/20 text-yellow-200"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Privada
                </Badge>
              )}
            </div>
            <p className="text-green-100 text-sm">
              Criada por {room.ownerName}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Room Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center text-green-100">
                <Users className="w-4 h-4 mr-2" />
                {room.players.length}/{room.maxPlayers} jogadores
              </div>
              <div className="flex items-center text-green-100">
                <DollarSign className="w-4 h-4 mr-2" />
                Big: {room.bigBlind}
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-2">
              <p className="text-white text-sm font-medium">Jogadores:</p>
              <div className="space-y-1">
                {room.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-green-100">{player.name}</span>
                    <div className="flex items-center gap-2">
                      {player.isDealer && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-500/20 text-blue-200 border-blue-400"
                        >
                          Dealer
                        </Badge>
                      )}
                      {player.isBigBlind && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-red-500/20 text-red-200 border-red-400"
                        >
                          BB
                        </Badge>
                      )}
                      {player.isSmallBlind && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-orange-500/20 text-orange-200 border-orange-400"
                        >
                          SB
                        </Badge>
                      )}
                      <span className="text-white font-medium">
                        {player.chips}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Status */}
            <div className="pt-2 border-t border-white/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-100">Status:</span>
                <Badge
                  variant={room.isActive ? "default" : "secondary"}
                  className={
                    room.isActive
                      ? "bg-green-500/20 text-green-200"
                      : "bg-gray-500/20 text-gray-200"
                  }
                >
                  {room.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              {room.currentPot > 0 && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-green-100">Pot atual:</span>
                  <span className="text-white font-medium">
                    {room.currentPot}
                  </span>
                </div>
              )}
            </div>

            {/* Join Button */}
            <div className="pt-4">
              <JoinRoomDialog room={room}>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={room.players.length >= room.maxPlayers}
                >
                  {room.players.length >= room.maxPlayers
                    ? "Sala Cheia"
                    : "Entrar na Sala"}
                </Button>
              </JoinRoomDialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
