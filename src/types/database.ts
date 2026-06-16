export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      runs: {
        Row: {
          id: string;
          user_id: string;
          distance_km: number;
          run_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
          activity_type: 'run' | 'bike';
        };
        Insert: {
          id?: string;
          user_id: string;
          distance_km: number;
          run_date?: string;
          notes?: string | null;
          created_at?: string;
          activity_type?: 'run' | 'bike';
        };
        Update: {
          distance_km?: number;
          run_date?: string;
          notes?: string | null;
          activity_type?: 'run' | 'bike';
        };
        Relationships: [
          {
            foreignKeyName: "runs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      global_stats: {
        Row: {
          id: number;
          total_goals: number;
          matches_played: number;
          last_goal_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          total_goals?: number;
          matches_played?: number;
          last_goal_at?: string | null;
          updated_at?: string;
        };
        Update: {
          total_goals?: number;
          matches_played?: number;
          last_goal_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          rank: number;
          user_id: string;
          name: string;
          avatar_url: string | null;
          km_run: number;
          percent_complete: number;
          wc_goal_target: number;
        };
        Relationships: [];
      };
      community_progress: {
        Row: {
          total_goals: number;
          matches_played: number;
          last_goal_at: string | null;
          updated_at: string;
          total_km_logged: number;
          total_km_required: number;
          community_percent_complete: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_leaderboard: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: Database["public"]["Views"]["leaderboard"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Run = Database["public"]["Tables"]["runs"]["Row"];
export type GlobalStats = Database["public"]["Tables"]["global_stats"]["Row"];
export type LeaderboardEntry = Database["public"]["Views"]["leaderboard"]["Row"];
export type CommunityProgress =
  Database["public"]["Views"]["community_progress"]["Row"];