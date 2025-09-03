export interface Player {
  id: string;
  name: string;
  chips: number;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isActive: boolean;
  currentBet: number;
  totalBet: number;
  position: number;
}

export interface Room {
  id: string;
  name: string;
  password?: string;
  ownerId: string;
  ownerName: string;
  players: Player[];
  maxPlayers: number;
  bigBlind: number;
  smallBlind: number;
  startingChips: number;
  currentPot: number;
  currentRound: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  isActive: boolean;
  createdAt: Date;
  currentDealer: number;
  currentPlayer: number;
  communityCards: string[];
  roundBets: { [playerId: string]: number };
  lastAction: string;
}

export interface GameAction {
  type: 'fold' | 'call' | 'raise' | 'check' | 'all-in';
  playerId: string;
  amount?: number;
  timestamp: Date;
}

export interface HandResult {
  winnerId: string;
  winnerName: string;
  pot: number;
  hand: string;
  timestamp: Date;
}

export interface RoomSettings {
  bigBlind: number;
  smallBlind: number;
  startingChips: number;
  maxPlayers: number;
  hasPassword: boolean;
}
