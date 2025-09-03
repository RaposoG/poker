"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import { PokerGame } from "@/lib/poker-game";
import type { GameAction, HandResult, Player, Room } from "@/types/poker";

interface PokerState {
  rooms: Room[];
  currentRoom: Room | null;
  currentPlayer: Player | null;
  game: PokerGame | null;
}

type PokerAction =
  | { type: "CREATE_ROOM"; payload: Room }
  | { type: "JOIN_ROOM"; payload: { room: Room; player: Player } }
  | { type: "LEAVE_ROOM" }
  | { type: "UPDATE_ROOM"; payload: Room }
  | { type: "SET_CURRENT_PLAYER"; payload: Player }
  | { type: "LOAD_ROOMS"; payload: Room[] };

const initialState: PokerState = {
  rooms: [],
  currentRoom: null,
  currentPlayer: null,
  game: null,
};

function pokerReducer(state: PokerState, action: PokerAction): PokerState {
  switch (action.type) {
    case "CREATE_ROOM":
      return {
        ...state,
        rooms: [...state.rooms, action.payload],
        currentRoom: action.payload,
        game: new PokerGame(action.payload),
      };

    case "JOIN_ROOM":
      return {
        ...state,
        currentRoom: action.payload.room,
        currentPlayer: action.payload.player,
        game: new PokerGame(action.payload.room),
      };

    case "LEAVE_ROOM":
      return {
        ...state,
        currentRoom: null,
        currentPlayer: null,
        game: null,
      };

    case "UPDATE_ROOM":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.payload.id ? action.payload : room,
        ),
        currentRoom:
          state.currentRoom?.id === action.payload.id
            ? action.payload
            : state.currentRoom,
        game:
          state.currentRoom?.id === action.payload.id
            ? new PokerGame(action.payload)
            : state.game,
      };

    case "SET_CURRENT_PLAYER":
      return {
        ...state,
        currentPlayer: action.payload,
      };

    case "LOAD_ROOMS":
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
  createRoom: (
    name: string,
    ownerName: string,
    settings: {
      bigBlind: number;
      smallBlind: number;
      startingChips: number;
      maxPlayers: number;
      password?: string;
    },
  ) => void;
  joinRoom: (roomId: string, playerName: string, password?: string) => boolean;
  leaveRoom: () => void;
  addPlayer: (playerName: string) => Player | null;
  removePlayer: (playerId: string) => boolean;
  executeAction: (action: GameAction) => Promise<boolean>;
  declareWinner: (winnerId: string, pot: number) => Promise<HandResult | null>;
  startNewHand: () => Promise<void>;
  updateRoom: (room: Room) => void;
}

const PokerContext = createContext<PokerContextType | undefined>(undefined);

export function PokerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(pokerReducer, initialState);

  // Carregar salas do localStorage na inicialização
  useEffect(() => {
    const loadRooms = async () => {
      try {
        // Tentar carregar do localStorage primeiro
        const savedRooms = localStorage.getItem("poker-rooms");
        if (savedRooms) {
          const rooms = JSON.parse(savedRooms).map(
            (room: Room & { createdAt: string }) => ({
              ...room,
              createdAt: new Date(room.createdAt),
            }),
          );
          dispatch({ type: "LOAD_ROOMS", payload: rooms });
        }

        // Tentar carregar da API também
        const response = await fetch("/api/rooms");
        if (response.ok) {
          const data = await response.json();
          if (data.rooms && data.rooms.length > 0) {
            dispatch({ type: "LOAD_ROOMS", payload: data.rooms });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar salas:", error);
      }
    };

    loadRooms();
  }, []);

  // Salvar salas no localStorage sempre que houver mudanças
  useEffect(() => {
    if (state.rooms.length > 0) {
      localStorage.setItem("poker-rooms", JSON.stringify(state.rooms));
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
    },
  ) => {
    const room = PokerGame.createRoom(name, ownerName, settings);
    const owner = room.players[0]; // O criador é automaticamente o primeiro jogador
    dispatch({ type: "CREATE_ROOM", payload: room });
    dispatch({ type: "SET_CURRENT_PLAYER", payload: owner });
  };

  const joinRoom = (
    roomId: string,
    playerName: string,
    password?: string,
  ): boolean => {
    const room = state.rooms.find((r) => r.id === roomId);
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
    if (room.players.some((p) => p.name === playerName)) {
      return false;
    }

    const game = new PokerGame(room);
    const player = game.addPlayer(playerName);

    if (player) {
      const updatedRoom = game.getRoomState();
      dispatch({ type: "JOIN_ROOM", payload: { room: updatedRoom, player } });
      return true;
    }

    return false;
  };

  const leaveRoom = () => {
    if (state.currentRoom && state.currentPlayer) {
      const game = new PokerGame(state.currentRoom);
      game.removePlayer(state.currentPlayer.id);
      const updatedRoom = game.getRoomState();
      dispatch({ type: "UPDATE_ROOM", payload: updatedRoom });
    }
    dispatch({ type: "LEAVE_ROOM" });
  };

  const addPlayer = (playerName: string): Player | null => {
    if (!state.game) return null;

    const player = state.game.addPlayer(playerName);
    if (player) {
      const updatedRoom = state.game.getRoomState();
      dispatch({ type: "UPDATE_ROOM", payload: updatedRoom });
    }
    return player;
  };

  const removePlayer = (playerId: string): boolean => {
    if (!state.game) return false;

    const success = state.game.removePlayer(playerId);
    if (success) {
      const updatedRoom = state.game.getRoomState();
      dispatch({ type: "UPDATE_ROOM", payload: updatedRoom });
    }
    return success;
  };

  const executeAction = async (action: GameAction): Promise<boolean> => {
    if (!state.currentRoom) return false;

    try {
      const response = await fetch(
        `/api/rooms/${state.currentRoom.id}/actions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId: action.playerId,
            action: action.type,
            amount: action.amount,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: "UPDATE_ROOM", payload: data.room });
        return true;
      }
    } catch (error) {
      console.error("Erro ao executar ação:", error);
    }

    return false;
  };

  const declareWinner = async (
    winnerId: string,
    pot: number,
  ): Promise<HandResult | null> => {
    if (!state.currentRoom) return null;

    try {
      const response = await fetch(`/api/rooms/${state.currentRoom.id}/hand`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ winnerId, pot }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: "UPDATE_ROOM", payload: data.room });

        return {
          winnerId,
          winnerName:
            data.room.players.find((p: any) => p.id === winnerId)?.name ||
            "Desconhecido",
          pot,
          hand: "Declarado pelo dono da sala",
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error("Erro ao declarar vencedor:", error);
    }

    return null;
  };

  const startNewHand = async () => {
    if (!state.currentRoom) return;

    try {
      const response = await fetch(`/api/rooms/${state.currentRoom.id}/hand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "start" }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: "UPDATE_ROOM", payload: data.room });
      }
    } catch (error) {
      console.error("Erro ao iniciar nova mão:", error);
    }
  };

  const updateRoom = (room: Room) => {
    dispatch({ type: "UPDATE_ROOM", payload: room });
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
    throw new Error("usePoker deve ser usado dentro de um PokerProvider");
  }
  return context;
}
