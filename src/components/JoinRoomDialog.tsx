'use client';

import { useState } from 'react';
import { usePoker } from '@/contexts/PokerContext';
import type { Room } from '@/types/poker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface JoinRoomDialogProps {
  room: Room;
  children: React.ReactNode;
}

export function JoinRoomDialog({ room, children }: JoinRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { joinRoom } = usePoker();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Por favor, digite seu nome');
      return;
    }

    const success = joinRoom(
      room.id,
      playerName.trim(),
      room.password ? password : undefined
    );

    if (success) {
      setOpen(false);
      setPlayerName('');
      setPassword('');
      setError('');
      router.push('/room');
    } else {
      if (room.password && !password) {
        setError('Esta sala requer senha');
      } else if (room.password && password) {
        setError('Senha incorreta');
      } else if (room.players.some(p => p.name === playerName.trim())) {
        setError('Já existe um jogador com este nome na sala');
      } else {
        setError('Não foi possível entrar na sala');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Entrar na Sala</DialogTitle>
          <DialogDescription className="text-gray-300">
            {room.name} - {room.players.length}/{room.maxPlayers} jogadores
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Info */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Big Blind:</span>
              <span className="text-white font-medium">{room.bigBlind}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Small Blind:</span>
              <span className="text-white font-medium">{room.smallBlind}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Fichas Iniciais:</span>
              <span className="text-white font-medium">{room.startingChips}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Dono da Sala:</span>
              <span className="text-white font-medium">{room.ownerName}</span>
            </div>
          </div>

          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="playerName" className="text-white">
              Seu Nome *
            </Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Digite seu nome"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          {/* Password (if required) */}
          {room.password && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Senha da Sala *
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Current Players */}
          {room.players.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white">Jogadores na Sala:</Label>
              <div className="bg-gray-800 rounded-lg p-3 space-y-1">
                {room.players.map((player) => (
                  <div key={player.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{player.name}</span>
                    <span className="text-white font-medium">{player.chips} fichas</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={room.players.length >= room.maxPlayers}
            >
              {room.players.length >= room.maxPlayers ? 'Sala Cheia' : 'Entrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
