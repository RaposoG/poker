'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import type { Room, Player, GameAction, HandResult } from '@/types/poker';
import { PokerGame } from '@/lib/poker-game';

interface PokerState {
  rooms: Room[];
  currentRoom: Room | null;
  currentPlayer: Player | null;
  game: PokerGame | null;
}

type PokerAction =
  | { type: 'CREATE_ROOM'; payload: Room }
  | { type: 'JOIN_ROOM'; payload: { room: Room; player: Player } }
  | { type: 'LEAVE_ROOM' }
  | { type: 'UPDATE_ROOM'; payload: Room }
  | { type: 'SET_CURRENT_PLAYER'; payload: Player }
  | { type: 'LOAD_ROOMS'; payload: Room[] };

const initialState: PokerState = {
  rooms: [],
  currentRoom: null,
  currentPlayer: null,
  game: null,
};

function pokerReducer(state: PokerState, action: PokerAction): PokerState {
  switch (action.type) {
    case 'CREATE_ROOM':
      return {
        ...state,
        rooms: [...state.rooms, action.payload],
        currentRoom: action.payload,
        game: new PokerGame(action.payload),
      };

    case 'JOIN_ROOM':
      return {
        ...state,
        currentRoom: action.payload.room,
        currentPlayer: action.payload.player,
        game: new PokerGame(action.payload.room),
      };

    case 'LEAVE_ROOM':
      return {
        ...state,
        currentRoom: null,
        currentPlayer: null,
        game: null,
      };

    case 'UPDATE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map(room => 
          room.id === action.payload.id ? action.payload : room
        ),
        currentRoom: state.currentRoom?.id === action.payload.id ? action.payload : state.currentRoom,
        game: state.currentRoom?.id === action.payload.id ? new PokerGame(action.payload) : state.game,
      };

    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayer: action.payload,
      };

    case 'LOAD_ROOMS':
      return {
        ...state,
        rooms: action.payload,
      };

    default:
      return state;
  }
}

interface PokerContextType {
  state: PokerState;
  createRoom: (name: string, ownerName: string, settings: {
    bigBlind: number;
    smallBlind: number;
    startingChips: number;
    maxPlayers: number;
    password?: string;
  }) => void;
  joinRoom: (roomId: string, playerName: string, password?: string) => boolean;
  leaveRoom: () => void;
  addPlayer: (playerName: string) => Player | null;
  removePlayer: (playerId: string) => boolean;
  executeAction: (action: GameAction) => boolean;
  declareWinner: (winnerId: string, pot: number) => HandResult | null;
  startNewHand: () => void;
  updateRoom: (room: Room) => void;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

export function PokerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pokerReducer, initialState);

  // Carregar salas do localStorage na inicialização
  useEffect(() => {
    const savedRooms = localStorage.getItem('poker-rooms');
    if (savedRooms) {
      try {
        const rooms = JSON.parse(savedRooms).map((room: Room & { createdAt: string }) => ({
          ...room,
          createdAt: new Date(room.createdAt),
        }));
        dispatch({ type: 'LOAD_ROOMS', payload: rooms });
      } catch (error) {
        console.error('Erro ao carregar salas:', error);
      }
    }
  }, []);

  // Salvar salas no localStorage sempre que houver mudanças
  useEffect(() => {
    if (state.rooms.length > 0) {
      localStorage.setItem('poker-rooms', JSON.stringify(state.rooms));
    }
  }, [state.rooms]);

  const createRoom = (
    name: string,
    ownerName: string,
    settings: {
      bigBlind: number;
      smallBlind: number;
      startingChips: number;
      maxPlayers: number;
      password?: string;
    }
  ) => {
    const room = PokerGame.createRoom(name, ownerName, settings);
    const owner = room.players[0]; // O criador é automaticamente o primeiro jogador
    dispatch({ type: 'CREATE_ROOM', payload: room });
    dispatch({ type: 'SET_CURRENT_PLAYER', payload: owner });
  };

  const joinRoom = (roomId: string, playerName: string, password?: string): boolean => {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return false;

    // Verificar senha se necessário
    if (room.password && room.password !== password) {
      return false;
    }

    // Verificar se já está cheia
    if (room.players.length >= room.maxPlayers) {
      return false;
    }

    // Verificar se o jogador já está na sala
    if (room.players.some(p => p.name === playerName)) {
      return false;
    }

    const game = new PokerGame(room);
    const player = game.addPlayer(playerName);
    
    if (player) {
      const updatedRoom = game.getRoomState();
      dispatch({ type: 'JOIN_ROOM', payload: { room: updatedRoom, player } });
      return true;
    }

    return false;
  };

  const leaveRoom = () => {
    if (state.currentRoom && state.currentPlayer) {
      const game = new PokerGame(state.currentRoom);
      game.removePlayer(state.currentPlayer.id);
      const updatedRoom = game.getRoomState();
      dispatch({ type: 'UPDATE_ROOM', payload: updatedRoom });
    }
    dispatch({ type: 'LEAVE_ROOM' });
  };

  const addPlayer = (playerName: string): Player | null => {
    if (!state.game) return null;
    
    const player = state.game.addPlayer(playerName);
    if (player) {
      const updatedRoom = state.game.getRoomState();
      dispatch({ type: 'UPDATE_ROOM', payload: updatedRoom });
    }
    return player;
  };

  const removePlayer = (playerId: string): boolean => {
    if (!state.game) return false;
    
    const success = state.game.removePlayer(playerId);
    if (success) {
      const updatedRoom = state.game.getRoomState();
      dispatch({ type: 'UPDATE_ROOM', payload: updatedRoom });
    }
    return success;
  };

  const executeAction = (action: GameAction): boolean => {
    if (!state.game) return false;
    
    const success = state.game.executeAction(action);
    if (success) {
      const updatedRoom = state.game.getRoomState();
      dispatch({ type: 'UPDATE_ROOM', payload: updatedRoom });
    }
    return success;
  };

  const declareWinner = (winnerId: string, pot: number): HandResult | null => {
    if (!state.game) return null;
    
    const result = state.game.declareWinner(winnerId, pot);
    if (result) {
      const updatedRoom = state.game.getRoomState();
      dispatch({ type: 'UPDATE_ROOM', payload: updatedRoom });
    }
    return result;
  };

  const startNewHand = () => {
    if (!state.game) return;
    
    state.game.startNewHand();
    const updatedRoom = state.game.getRoomState();
    dispatch({ type: 'UPDATE_ROOM', payload: updatedRoom });
  };

  const updateRoom = (room: Room) => {
    dispatch({ type: 'UPDATE_ROOM', payload: room });
  };

  return (
    <PokerContext.Provider
      value={{
        state,
        createRoom,
        joinRoom,
        leaveRoom,
        addPlayer,
        removePlayer,
        executeAction,
        declareWinner,
        startNewHand,
        updateRoom,
      }}
    >
      {children}
    </PokerContext.Provider>
  );
}

export function usePoker() {
  const context = useContext(PokerContext);
  if (context === undefined) {
    throw new Error('usePoker deve ser usado dentro de um PokerProvider');
  }
  return context;
}
