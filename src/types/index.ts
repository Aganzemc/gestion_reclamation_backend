// =====================================================
// Types TypeScript pour le backend
// Gestion des réclamations - Université
// =====================================================

// =====================================================
// Types de base
// =====================================================

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  email_verified: boolean;
  password_reset_token?: string;
  password_reset_expires?: Date;
}

export interface UserWithRoles extends Omit<User, 'password_hash'> {
  roles: string[];
  departments: string[];
}

export interface UserCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  roles?: number[];
  departments?: number[];
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  status?: UserStatus;
  email_verified?: boolean;
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

// =====================================================
// Types pour les rôles
// =====================================================

export interface Role {
  id: number;
  code: string;
  label: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  user_id: number;
  role_id: number;
  assigned_at: Date;
  assigned_by?: number;
}

// =====================================================
// Types pour les départements
// =====================================================

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserDepartment {
  user_id: number;
  department_id: number;
  assigned_at: Date;
  assigned_by?: number;
}

// =====================================================
// Types pour les tickets
// =====================================================

export interface Ticket {
  id: number;
  reference: string;
  titre: string;
  description: string;
  type: TicketType;
  priorite: TicketPriority;
  statut: TicketStatus;
  createur_id: number;
  assigne_id?: number;
  departement_id?: number;
  date_creation: Date;
  date_modification: Date;
  date_cloture?: Date;
  temps_traitement_minutes?: number;
}

export interface TicketWithDetails extends Ticket {
  createur_first_name: string;
  createur_last_name: string;
  assigne_first_name?: string;
  assigne_last_name?: string;
  departement_name?: string;
  commentaires_count: number;
}

export interface TicketCreate {
  titre: string;
  description: string;
  type: TicketType;
  priorite: TicketPriority;
  departement_id?: number;
  assigne_id?: number;
}

export interface TicketUpdate {
  titre?: string;
  description?: string;
  type?: TicketType;
  priorite?: TicketPriority;
  statut?: TicketStatus;
  assigne_id?: number;
  departement_id?: number;
  date_cloture?: Date;
  temps_traitement_minutes?: number;
}

export enum TicketType {
  QUALITE = 'QUALITE',
  INCIDENT = 'INCIDENT',
  OPERATIONNEL = 'OPERATIONNEL'
}

export enum TicketPriority {
  BASSE = 'BASSE',
  MOYENNE = 'MOYENNE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE'
}

export enum TicketStatus {
  OUVERT = 'OUVERT',
  EN_COURS = 'EN_COURS',
  CLOTURE = 'CLOTURE'
}

// =====================================================
// Types pour les commentaires
// =====================================================

export interface Comment {
  id: number;
  ticket_id: number;
  auteur_id: number;
  contenu: string;
  date_creation: Date;
  date_modification: Date;
  is_internal: boolean;
}

export interface CommentCreate {
  contenu: string;
  is_internal?: boolean;
}

export interface CommentUpdate {
  contenu: string;
}

// =====================================================
// Types pour l'authentification
// =====================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserWithRoles;
  expires_in: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

export interface JwtPayload {
  user_id: number;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// =====================================================
// Types pour la pagination
// =====================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// =====================================================
// Types pour les filtres
// =====================================================

export interface UserFilters {
  status?: UserStatus;
  roles?: string[];
  departments?: string[];
  search?: string;
}

export interface TicketFilters {
  statut?: TicketStatus;
  type?: TicketType;
  priorite?: TicketPriority;
  createur_id?: number;
  assigne_id?: number;
  departement_id?: number;
  date_debut?: Date;
  date_fin?: Date;
  search?: string;
}

// =====================================================
// Types pour les logs d'audit
// =====================================================

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  table_name?: string;
  record_id?: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// =====================================================
// Types pour les réponses API
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

// =====================================================
// Types pour les permissions
// =====================================================

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}

// =====================================================
// Types pour les statistiques et KPIs
// =====================================================

export interface KPIData {
  total_tickets: number;
  tickets_ouverts: number;
  tickets_en_cours: number;
  tickets_clotures: number;
  temps_traitement_moyen: number;
  repartition_par_type: Array<{
    type: string;
    count: number;
  }>;
  repartition_par_priorite: Array<{
    priorite: string;
    count: number;
  }>;
  tickets_par_agent: Array<{
    agent: string;
    count: number;
  }>;
  tendance_mensuelle: Array<{
    mois: string;
    tickets: number;
  }>;
}

// =====================================================
// Types pour la configuration
// =====================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface JwtConfig {
  secret: string;
  refresh_secret: string;
  expires_in: string;
  refresh_expires_in: string;
}

export interface AppConfig {
  port: number;
  node_env: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  bcrypt_rounds: number;
  rate_limit: {
    window_ms: number;
    max_requests: number;
  };
}
