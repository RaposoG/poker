'use client';

import type { Player } from '@/types/poker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, User } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <User className="w-5 h-5 mr-2" />
          Jogadores ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-3 rounded-lg border ${
              player.id === currentPlayerId
                ? 'bg-blue-600/20 border-blue-400'
                : 'bg-gray-800/50 border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{player.name}</span>
                {player.id === currentPlayerId && (
                  <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-200 border-blue-400">
                    Você
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold">{player.chips}</span>
              </div>
            </div>
            
            {/* Position badges */}
            <div className="flex flex-wrap gap-1">
              {player.isDealer && (
                <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-200 border-blue-400">
                  Dealer
                </Badge>
              )}
              {player.isSmallBlind && (
                <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-200 border-orange-400">
                  Small Blind
                </Badge>
              )}
              {player.isBigBlind && (
                <Badge variant="outline" className="text-xs bg-red-500/20 text-red-200 border-red-400">
                  Big Blind
                </Badge>
              )}
            </div>
            
            {/* Current bet */}
            {player.currentBet > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Aposta atual:</span>
                  <span className="text-yellow-300 font-medium">{player.currentBet}</span>
                </div>
              </div>
            )}
            
            {/* Total bet */}
            {player.totalBet > 0 && (
              <div className="mt-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Total apostado:</span>
                  <span className="text-yellow-300 font-medium">{player.totalBet}</span>
                </div>
              </div>
            )}
            
            {/* Status */}
            <div className="mt-2">
              <Badge 
                variant={player.isActive ? "default" : "secondary"}
                className={`text-xs ${
                  player.isActive 
                    ? "bg-green-500/20 text-green-200" 
                    : "bg-red-500/20 text-red-200"
                }`}
              >
                {player.isActive ? 'Ativo' : 'Fora da mão'}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
