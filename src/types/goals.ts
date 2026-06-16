export interface WorldCupGame {
  _id: string;
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string;
  away_scorers: string;
  group: string;
  matchday: string;
  local_date: string;
  persian_date: string;
  stadium_id: string;
  finished: "TRUE" | "FALSE";
  time_elapsed: string;
  type: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
}

export interface WorldCupGamesResponse {
  games: WorldCupGame[];
}

export interface GoalsSyncResult {
  totalGoals: number;
  matchesPlayed: number;
  matchCount: number;
  lastUpdated: string;
  source: "live" | "cached";
  goalsIncreased?: boolean;
}

export interface DailyGoal {
  date: string; // normalized YYYY-MM-DD
  goals: number;
}
