'use client';

import type { Room, Player } from '@/types/poker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  DollarSign, 
  Clock, 
  Users,
  Play,
  Trophy
} from 'lucide-react';

interface GameTableProps {
  room: Room;
  currentPlayer: Player;
}

export function GameTable({ room, currentPlayer }: GameTableProps) {
  const isOwner = room.ownerId === currentPlayer.id;
  const activePlayers = room.players.filter(p => p.isActive);

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-yellow-400 mr-2" />
                <span className="text-white font-semibold text-lg">{room.currentPot}</span>
              </div>
              <p className="text-green-100 text-sm">Pot Atual</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-white font-semibold text-lg">{activePlayers.length}</span>
              </div>
              <p className="text-green-100 text-sm">Jogadores Ativos</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-purple-400 mr-2" />
                <span className="text-white font-semibold text-lg capitalize">{room.currentRound}</span>
              </div>
              <p className="text-green-100 text-sm">Rodada Atual</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-orange-400 mr-2" />
                <span className="text-white font-semibold text-lg">{room.bigBlind}</span>
              </div>
              <p className="text-green-100 text-sm">Big Blind</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Poker Table Visualization */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-8">
          <div className="relative">
            {/* Table */}
            <div className="w-full h-96 bg-green-800 rounded-full border-8 border-yellow-600 flex items-center justify-center relative overflow-hidden">
              {/* Table felt pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-900 opacity-50"></div>
              
              {/* Center area for pot and community cards */}
              <div className="text-center z-10">
                {room.currentPot > 0 && (
                  <div className="mb-4">
                    <div className="bg-yellow-500 text-black font-bold text-lg px-4 py-2 rounded-full inline-block">
                      Pot: {room.currentPot}
                    </div>
                  </div>
                )}
                
                {/* Community Cards */}
                {room.communityCards.length > 0 && (
                  <div className="flex justify-center space-x-2 mb-4">
                    {room.communityCards.map((card) => (
                      <div key={card} className="w-12 h-16 bg-white rounded border-2 border-gray-800 flex items-center justify-center text-black font-bold text-sm">
                        {card}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Round indicator */}
                <div className="text-white font-semibold">
                  {room.currentRound === 'preflop' && 'Pré-flop'}
                  {room.currentRound === 'flop' && 'Flop'}
                  {room.currentRound === 'turn' && 'Turn'}
                  {room.currentRound === 'river' && 'River'}
                  {room.currentRound === 'showdown' && 'Showdown'}
                </div>
              </div>

              {/* Player positions around the table */}
              {room.players.map((player, index) => {
                const angle = (360 / room.players.length) * index;
                const radius = 120;
                const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
                const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
                
                return (
                  <div
                    key={player.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    <div className={`p-3 rounded-lg text-center min-w-[100px] ${
                      player.id === currentPlayer.id 
                        ? 'bg-blue-600 border-2 border-blue-400' 
                        : 'bg-gray-800 border border-gray-600'
                    }`}>
                      <div className="text-white font-medium text-sm mb-1">
                        {player.name}
                        {player.id === room.ownerId && (
                          <Crown className="w-3 h-3 text-yellow-400 inline ml-1" />
                        )}
                      </div>
                      <div className="text-green-300 text-xs mb-2">
                        {player.chips} fichas
                      </div>
                      
                      {/* Position badges */}
                      <div className="flex justify-center space-x-1">
                        {player.isDealer && (
                          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-200 border-blue-400">
                            D
                          </Badge>
                        )}
                        {player.isSmallBlind && (
                          <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-200 border-orange-400">
                            SB
                          </Badge>
                        )}
                        {player.isBigBlind && (
                          <Badge variant="outline" className="text-xs bg-red-500/20 text-red-200 border-red-400">
                            BB
                          </Badge>
                        )}
                      </div>
                      
                      {/* Current bet */}
                      {player.currentBet > 0 && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-200">
                            {player.currentBet}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Actions */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-white mb-4">
              {room.lastAction || 'Aguardando ação...'}
            </p>
            
            {isOwner && (
              <div className="flex justify-center space-x-4">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    // This will be handled by GameControls component
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Nova Mão
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
