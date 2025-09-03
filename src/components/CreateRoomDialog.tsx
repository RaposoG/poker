'use client';

import { useState } from 'react';
import { usePoker } from '@/contexts/PokerContext';
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
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';

interface CreateRoomDialogProps {
  children: React.ReactNode;
}

export function CreateRoomDialog({ children }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    roomName: '',
    ownerName: '',
    bigBlind: 10,
    startingChips: 1000,
    maxPlayers: 6,
    hasPassword: false,
    password: '',
  });
  const { createRoom } = usePoker();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomName.trim() || !formData.ownerName.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.hasPassword && !formData.password.trim()) {
      alert('Por favor, defina uma senha para a sala');
      return;
    }

    try {
      // Criar sala via API
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.roomName,
          ownerName: formData.ownerName,
          bigBlind: formData.bigBlind,
          smallBlind: Math.floor(formData.bigBlind / 2),
          startingChips: formData.startingChips,
          maxPlayers: formData.maxPlayers,
          password: formData.hasPassword ? formData.password : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Criar sala no contexto local
        createRoom(
          formData.roomName,
          formData.ownerName,
          {
            bigBlind: formData.bigBlind,
            smallBlind: Math.floor(formData.bigBlind / 2),
            startingChips: formData.startingChips,
            maxPlayers: formData.maxPlayers,
            password: formData.hasPassword ? formData.password : undefined,
          }
        );

        setOpen(false);
        setFormData({
          roomName: '',
          ownerName: '',
          bigBlind: 10,
          startingChips: 1000,
          maxPlayers: 6,
          hasPassword: false,
          password: '',
        });

        // Redirecionar para a sala criada
        router.push('/room');
      } else {
        alert('Erro ao criar sala. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      alert('Erro ao criar sala. Tente novamente.');
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Nova Sala</DialogTitle>
          <DialogDescription className="text-gray-300">
            Configure os parâmetros da sua sala de poker
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="roomName" className="text-white">
              Nome da Sala *
            </Label>
            <Input
              id="roomName"
              value={formData.roomName}
              onChange={(e) => handleInputChange('roomName', e.target.value)}
              placeholder="Ex: Mesa dos Amigos"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          {/* Owner Name */}
          <div className="space-y-2">
            <Label htmlFor="ownerName" className="text-white">
              Seu Nome *
            </Label>
            <Input
              id="ownerName"
              value={formData.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              placeholder="Ex: João"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          {/* Big Blind */}
          <div className="space-y-2">
            <Label htmlFor="bigBlind" className="text-white">
              Big Blind
            </Label>
            <Input
              id="bigBlind"
              type="number"
              min="1"
              value={formData.bigBlind}
              onChange={(e) => handleInputChange('bigBlind', parseInt(e.target.value) || 0)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <p className="text-gray-400 text-sm">
              Small Blind será automaticamente {Math.floor(formData.bigBlind / 2)}
            </p>
          </div>

          {/* Starting Chips */}
          <div className="space-y-2">
            <Label htmlFor="startingChips" className="text-white">
              Fichas Iniciais
            </Label>
            <Input
              id="startingChips"
              type="number"
              min="100"
              value={formData.startingChips}
              onChange={(e) => handleInputChange('startingChips', parseInt(e.target.value) || 0)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Max Players */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers" className="text-white">
              Máximo de Jogadores
            </Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              max="10"
              value={formData.maxPlayers}
              onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value) || 2)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Password Protection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasPassword"
                checked={formData.hasPassword}
                onCheckedChange={(checked) => handleInputChange('hasPassword', checked)}
              />
              <Label htmlFor="hasPassword" className="text-white">
                Proteger sala com senha
              </Label>
            </div>

            {formData.hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Digite a senha"
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            )}
          </div>

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
            >
              Criar Sala
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
