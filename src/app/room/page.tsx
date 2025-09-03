'use client';

import { usePoker } from '@/contexts/PokerContext';
import { GameTable } from '@/components/GameTable';
import { PlayerList } from '@/components/PlayerList';
import { GameControls } from '@/components/GameControls';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RoomPage() {
  const { state, leaveRoom } = usePoker();
  const router = useRouter();

  useEffect(() => {
    if (!state.currentRoom || !state.currentPlayer) {
      router.push('/');
    }
  }, [state.currentRoom, state.currentPlayer, router]);

  if (!state.currentRoom || !state.currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Redirecionando...</p>
        </div>
      </div>
    );
  }

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeaveRoom}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-white text-xl font-bold">{state.currentRoom.name}</h1>
                <p className="text-green-100 text-sm">
                  {state.currentRoom.players.length}/{state.currentRoom.maxPlayers} jogadores
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-medium">{state.currentPlayer.name}</p>
                <p className="text-green-100 text-sm">{state.currentPlayer.chips} fichas</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Table - Takes up 3 columns on large screens */}
          <div className="lg:col-span-3">
            <GameTable room={state.currentRoom} currentPlayer={state.currentPlayer} />
          </div>

          {/* Sidebar - Takes up 1 column on large screens */}
          <div className="space-y-6">
            {/* Player List */}
            <PlayerList 
              players={state.currentRoom.players} 
              currentPlayerId={state.currentPlayer.id}
            />

            {/* Game Controls */}
            <GameControls 
              room={state.currentRoom}
              currentPlayer={state.currentPlayer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
