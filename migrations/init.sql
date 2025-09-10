-- =====================================================
-- Script d'initialisation de la base de données
-- Gestion des réclamations - Université
-- =====================================================

-- Création de la base de données (à exécuter séparément)
-- CREATE DATABASE gestion_reclamation;

-- Connexion à la base de données
-- \c gestion_reclamation;

-- =====================================================
-- TABLE: roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE CHECK (code IN ('ADMIN', 'QA', 'STO', 'VIEWER')),
    label VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: departments
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLE: user_roles
-- =====================================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: user_departments
-- =====================================================
CREATE TABLE IF NOT EXISTS user_departments (
    user_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    PRIMARY KEY (user_id, department_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: tickets
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) NOT NULL UNIQUE,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('QUALITE', 'INCIDENT', 'OPERATIONNEL')),
    priorite VARCHAR(20) NOT NULL CHECK (priorite IN ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE')),
    statut VARCHAR(20) NOT NULL DEFAULT 'OUVERT' CHECK (statut IN ('OUVERT', 'EN_COURS', 'CLOTURE')),
    createur_id INTEGER NOT NULL,
    assigne_id INTEGER,
    departement_id INTEGER,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_cloture TIMESTAMP WITH TIME ZONE,
    temps_traitement_minutes INTEGER,
    FOREIGN KEY (createur_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigne_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (departement_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: ticket_assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS ticket_assignments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- =====================================================
-- TABLE: comments
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    auteur_id INTEGER NOT NULL,
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_internal BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (auteur_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: refresh_tokens
-- =====================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================

-- Index sur les emails (déjà unique)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index sur les statuts utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Index sur les dates de création
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Index sur les rôles utilisateurs
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Index sur les départements utilisateurs
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON user_departments(department_id);

-- Index sur les tickets
CREATE INDEX IF NOT EXISTS idx_tickets_reference ON tickets(reference);
CREATE INDEX IF NOT EXISTS idx_tickets_statut ON tickets(statut);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_priorite ON tickets(priorite);
CREATE INDEX IF NOT EXISTS idx_tickets_createur_id ON tickets(createur_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigne_id ON tickets(assigne_id);
CREATE INDEX IF NOT EXISTS idx_tickets_departement_id ON tickets(departement_id);
CREATE INDEX IF NOT EXISTS idx_tickets_date_creation ON tickets(date_creation);

-- Index sur les commentaires
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_auteur_id ON comments(auteur_id);

-- Index sur les logs d'audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Index sur les tokens de rafraîchissement
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- =====================================================
-- TRIGGERS pour mettre à jour updated_at automatiquement
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour les tables avec updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERTION des données initiales
-- =====================================================

-- Insertion des rôles
INSERT INTO roles (code, label) VALUES
    ('ADMIN', 'Administrateur système'),
    ('QA', 'Responsable qualité'),
    ('STO', 'Support technique et opérationnel'),
    ('VIEWER', 'Lecteur simple')
ON CONFLICT (code) DO NOTHING;

-- Insertion des départements par défaut
INSERT INTO departments (name, description) VALUES
    ('Informatique', 'Département des technologies de l''information'),
    ('Ressources Humaines', 'Département des ressources humaines'),
    ('Finances', 'Département financier et comptable'),
    ('Pédagogie', 'Département pédagogique'),
    ('Administration', 'Département administratif')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- VUES utiles pour les requêtes fréquentes
-- =====================================================

-- Vue des utilisateurs avec leurs rôles et départements
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.status,
    u.created_at,
    u.last_login_at,
    array_agg(DISTINCT r.code) as roles,
    array_agg(DISTINCT d.name) as departments
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_departments ud ON u.id = ud.user_id
LEFT JOIN departments d ON ud.department_id = d.id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.status, u.created_at, u.last_login_at;

-- Vue des tickets avec informations complètes
CREATE OR REPLACE VIEW tickets_with_details AS
SELECT 
    t.*,
    c.first_name as createur_first_name,
    c.last_name as createur_last_name,
    a.first_name as assigne_first_name,
    a.last_name as assigne_last_name,
    d.name as departement_name,
    COUNT(cm.id) as commentaires_count
FROM tickets t
LEFT JOIN users c ON t.createur_id = c.id
LEFT JOIN users a ON t.assigne_id = a.id
LEFT JOIN departments d ON t.departement_id = d.id
LEFT JOIN comments cm ON t.id = cm.ticket_id
GROUP BY t.id, c.first_name, c.last_name, a.first_name, a.last_name, d.name;

-- =====================================================
-- FIN du script
-- =====================================================
