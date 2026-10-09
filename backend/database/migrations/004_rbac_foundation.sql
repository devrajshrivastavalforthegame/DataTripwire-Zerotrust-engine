-- DataTripwire
-- Migration 004: RBAC foundation
-- Adds role-based access, responsibilities and protected resources.
-- Does not modify the existing AI contract or risk-engine schema.

BEGIN;

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    system_role BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_permissions_resource_action
        UNIQUE (resource, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS responsibilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_responsibilities (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    responsibility_id UUID NOT NULL REFERENCES responsibilities(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, responsibility_id),

    CONSTRAINT chk_user_responsibility_scope
        CHECK (scope IN ('OWN', 'ASSIGNED', 'TEAM', 'ORGANIZATION'))
);

CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL UNIQUE,
    resource_type VARCHAR(100) NOT NULL,
    sensitivity VARCHAR(50) NOT NULL DEFAULT 'INTERNAL',
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_resource_sensitivity
        CHECK (
            sensitivity IN (
                'PUBLIC',
                'INTERNAL',
                'CONFIDENTIAL',
                'RESTRICTED'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user
    ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role
    ON user_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role
    ON role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission
    ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_user_responsibilities_user
    ON user_responsibilities(user_id);

CREATE INDEX IF NOT EXISTS idx_user_responsibilities_responsibility
    ON user_responsibilities(responsibility_id);

CREATE INDEX IF NOT EXISTS idx_resources_type
    ON resources(resource_type);

CREATE INDEX IF NOT EXISTS idx_resources_sensitivity
    ON resources(sensitivity);

CREATE INDEX IF NOT EXISTS idx_resources_owner
    ON resources(owner_user_id);

-- ============================================================
-- ROLES
-- ============================================================

INSERT INTO roles (name, slug, description)
VALUES
    ('Employee', 'employee', 'Standard WorkShepher employee access'),
    ('Manager', 'manager', 'Business manager with team and approval responsibilities'),
    ('Security Analyst', 'security_analyst', 'Security monitoring and investigation access'),
    ('Security Manager', 'security_manager', 'Security administration, response and policy management'),
    ('System Admin', 'system_admin', 'Full system administration access')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PERMISSIONS
-- ============================================================

INSERT INTO permissions (resource, action, description)
VALUES
    -- WorkShepher
    ('tasks', 'read', 'View tasks'),
    ('tasks', 'create', 'Create tasks'),
    ('tasks', 'update', 'Update tasks'),

    ('projects', 'read', 'View projects'),
    ('projects', 'create', 'Create projects'),
    ('projects', 'update', 'Update projects'),

    ('documents', 'read', 'View documents'),
    ('documents', 'create', 'Create documents'),
    ('documents', 'update', 'Update documents'),
    ('documents', 'delete', 'Delete documents'),
    ('documents', 'download', 'Download documents'),

    ('reports', 'read', 'View reports'),
    ('reports', 'export', 'Export reports'),

    ('approvals', 'read', 'View approvals'),
    ('approvals', 'approve', 'Approve requests'),
    ('approvals', 'reject', 'Reject requests'),

    ('team', 'read', 'View team information'),
    ('team', 'manage', 'Manage team information'),

    ('overview', 'read', 'View security dashboard overview'),

    -- DataTripwire Security Console
    ('users', 'read', 'View security users'),
    ('users', 'manage', 'Manage security users'),

    ('sessions', 'read', 'View sessions'),
    ('sessions', 'restrict', 'Restrict sessions'),
    ('sessions', 'quarantine', 'Quarantine sessions'),
    ('sessions', 'release', 'Release sessions'),

    ('resources', 'read', 'View protected resources'),
    ('resources', 'manage', 'Manage protected resources'),

    ('incidents', 'read', 'View security incidents'),
    ('incidents', 'investigate', 'Investigate security incidents'),
    ('incidents', 'resolve', 'Resolve security incidents'),

    ('policies', 'read', 'View security policies'),
    ('policies', 'manage', 'Manage security policies'),

    ('rbac', 'read', 'View RBAC configuration'),
    ('rbac', 'manage', 'Manage roles and permissions'),

    ('audit', 'read', 'View security audit logs'),

    ('baseline', 'read', 'View behavior baselines'),
    ('baseline', 'manage', 'Manage behavior baselines'),

    ('deception', 'trigger', 'Trigger authorized deception controls'),

    ('response', 'read', 'View adaptive responses'),
    ('response', 'manage', 'Manage adaptive responses'),

    ('copilot', 'read', 'View AI security copilot information'),

    ('health', 'read', 'View security system health')

ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================
-- RESPONSIBILITIES
-- ============================================================

INSERT INTO responsibilities (name, description)
VALUES
    ('Finance', 'Financial operations and financial reporting'),
    ('HR', 'Human resources operations and personnel records'),
    ('Engineering', 'Engineering and technical project responsibilities'),
    ('Design', 'Design and product design responsibilities'),
    ('Operations', 'Operational and administrative responsibilities'),
    ('Security', 'Security monitoring and security operations')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- EMPLOYEE PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'employee'
AND (
    (p.resource = 'tasks' AND p.action IN ('read', 'create', 'update'))
 OR (p.resource = 'projects' AND p.action = 'read')
 OR (p.resource = 'documents' AND p.action IN ('read', 'create', 'update', 'download'))
 OR (p.resource = 'reports' AND p.action = 'read')
 OR (p.resource = 'approvals' AND p.action = 'read')
 OR (p.resource = 'team' AND p.action = 'read')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- MANAGER PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'manager'
AND (
    (p.resource = 'tasks' AND p.action IN ('read', 'create', 'update'))
 OR (p.resource = 'projects' AND p.action IN ('read', 'create', 'update'))
 OR (p.resource = 'documents' AND p.action IN ('read', 'create', 'update', 'download'))
 OR (p.resource = 'reports' AND p.action IN ('read', 'export'))
 OR (p.resource = 'approvals' AND p.action IN ('read', 'approve', 'reject'))
 OR (p.resource = 'team' AND p.action IN ('read', 'manage'))
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECURITY ANALYST PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'security_analyst'
AND (
    (p.resource = 'users' AND p.action = 'read')
 OR (p.resource = 'sessions' AND p.action = 'read')
 OR (p.resource = 'resources' AND p.action = 'read')
 OR (p.resource = 'incidents' AND p.action IN ('read', 'investigate'))
 OR (p.resource = 'policies' AND p.action = 'read')
 OR (p.resource = 'rbac' AND p.action = 'read')
 OR (p.resource = 'audit' AND p.action = 'read')
 OR (p.resource = 'baseline' AND p.action = 'read')
 OR (p.resource = 'response' AND p.action = 'read')
 OR (p.resource = 'copilot' AND p.action = 'read')
 OR (p.resource = 'health' AND p.action = 'read')
 OR (p.resource = 'overview' AND p.action = 'read')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SECURITY MANAGER PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'security_manager'
AND (
    p.resource IN (
        'users',
        'sessions',
        'resources',
        'incidents',
        'policies',
        'rbac',
        'baseline',
        'response'
    )
 OR (p.resource = 'audit' AND p.action = 'read')
 OR (p.resource = 'deception' AND p.action = 'trigger')
 OR (p.resource = 'copilot' AND p.action = 'read')
 OR (p.resource = 'health' AND p.action = 'read')
 OR (p.resource = 'overview' AND p.action = 'read')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SYSTEM ADMIN = ALL PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'system_admin'
ON CONFLICT DO NOTHING;

-- ============================================================
-- EXISTING USERS → RBAC
-- ============================================================

INSERT INTO user_roles (user_id, role_id)
SELECT
    u.id,
    r.id
FROM users u
JOIN roles r
    ON r.slug = LOWER(u.role)
WHERE u.role IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
