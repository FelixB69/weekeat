// Types miroir du schéma Supabase — régénérer via `npm run db:types`
// lorsque le schéma évolue.

export type PlatCategorie =
  | "viande"
  | "poisson"
  | "vegetarien"
  | "vegan"
  | "soupe"
  | "pates"
  | "autre";

export type IngredientUnite =
  | "g"
  | "kg"
  | "ml"
  | "L"
  | "piece"
  | "cas"
  | "cac"
  | "autre";

export type PlanningMode = "midi_soir" | "midi" | "soir";

export type JourSemaine =
  | "lundi"
  | "mardi"
  | "mercredi"
  | "jeudi"
  | "vendredi"
  | "samedi"
  | "dimanche";

export type MomentRepas = "midi" | "soir";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      plats: {
        Row: {
          id: string;
          user_id: string;
          nom: string;
          temps_cuisson: number | null;
          categorie: PlatCategorie;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nom: string;
          temps_cuisson?: number | null;
          categorie?: PlatCategorie;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nom?: string;
          temps_cuisson?: number | null;
          categorie?: PlatCategorie;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          plat_id: string;
          nom: string;
          quantite: number | null;
          unite: IngredientUnite;
        };
        Insert: {
          id?: string;
          plat_id: string;
          nom: string;
          quantite?: number | null;
          unite?: IngredientUnite;
        };
        Update: {
          id?: string;
          plat_id?: string;
          nom?: string;
          quantite?: number | null;
          unite?: IngredientUnite;
        };
        Relationships: [];
      };
      plannings: {
        Row: {
          id: string;
          user_id: string;
          semaine_debut: string;
          mode: PlanningMode;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          semaine_debut: string;
          mode?: PlanningMode;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          semaine_debut?: string;
          mode?: PlanningMode;
          created_at?: string;
        };
        Relationships: [];
      };
      planning_repas: {
        Row: {
          id: string;
          planning_id: string;
          plat_id: string | null;
          jour: JourSemaine;
          moment: MomentRepas;
          verrouille: boolean;
        };
        Insert: {
          id?: string;
          planning_id: string;
          plat_id?: string | null;
          jour: JourSemaine;
          moment: MomentRepas;
          verrouille?: boolean;
        };
        Update: {
          id?: string;
          planning_id?: string;
          plat_id?: string | null;
          jour?: JourSemaine;
          moment?: MomentRepas;
          verrouille?: boolean;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
    Enums: {
      plat_categorie: PlatCategorie;
      ingredient_unite: IngredientUnite;
      planning_mode: PlanningMode;
      jour_semaine: JourSemaine;
      moment_repas: MomentRepas;
    };
  };
};

export type Plat = Database["public"]["Tables"]["plats"]["Row"];
export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];
export type Planning = Database["public"]["Tables"]["plannings"]["Row"];
export type PlanningRepas = Database["public"]["Tables"]["planning_repas"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface PlatWithIngredients extends Plat {
  ingredients: Ingredient[];
}

export interface PlanningRepasWithPlat extends PlanningRepas {
  plat: PlatWithIngredients | null;
}

export interface PlanningComplet extends Planning {
  repas: PlanningRepasWithPlat[];
}
