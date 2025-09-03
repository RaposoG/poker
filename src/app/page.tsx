'use client';

import { usePoker } from '@/contexts/PokerContext';
import { RoomList } from '@/components/RoomList';
import { CreateRoomDialog } from '@/components/CreateRoomDialog';
import { Button } from '@/components/ui/button';
import { Plus, Users, Lock } from 'lucide-react';

export default function Home() {
  const { state } = usePoker();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🃏 Poker Manager
          </h1>
          <p className="text-green-100 text-lg">
            Sistema de gestão de fichas para partidas de Texas Hold'em
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white font-semibold text-lg">{state.rooms.length}</p>
            <p className="text-green-100 text-sm">Salas Ativas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white font-semibold text-lg">
              {state.rooms.reduce((total, room) => total + room.players.length, 0)}
            </p>
            <p className="text-green-100 text-sm">Jogadores Online</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <Lock className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white font-semibold text-lg">
              {state.rooms.filter(room => room.password).length}
            </p>
            <p className="text-green-100 text-sm">Salas Privadas</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center mb-8">
          <CreateRoomDialog>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-5 h-5 mr-2" />
              Criar Nova Sala
            </Button>
          </CreateRoomDialog>
        </div>

        {/* Room List */}
        <RoomList rooms={state.rooms} />
      </div>
    </div>
  );
}
