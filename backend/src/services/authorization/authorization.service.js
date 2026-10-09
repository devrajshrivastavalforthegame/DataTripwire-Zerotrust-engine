import pool from "../../config/database.js";

const normalize = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export async function getUserAuthorization(userId) {
  const rolesResult = await pool.query(
    `
    SELECT DISTINCT
      r.id,
      r.name,
      r.slug,
      r.system_role
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
    ORDER BY r.name
    `,
    [userId]
  );

  const permissionsResult = await pool.query(
    `
    SELECT DISTINCT
      p.resource,
      p.action
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = $1
    ORDER BY p.resource, p.action
    `,
    [userId]
  );

  const responsibilitiesResult = await pool.query(
    `
    SELECT
      r.id,
      r.name,
      r.description,
      ur.scope,
      ur.active
    FROM user_responsibilities ur
    JOIN responsibilities r
      ON r.id = ur.responsibility_id
    WHERE ur.user_id = $1
      AND ur.active = TRUE
    ORDER BY r.name
    `,
    [userId]
  );

  return {
    roles: rolesResult.rows,
    permissions: permissionsResult.rows,
    responsibilities: responsibilitiesResult.rows
  };
}

export async function hasPermission(userId, resource, action) {
  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN role_permissions rp
        ON rp.role_id = ur.role_id
      JOIN permissions p
        ON p.id = rp.permission_id
      WHERE ur.user_id = $1
        AND LOWER(p.resource) = LOWER($2)
        AND LOWER(p.action) = LOWER($3)
    ) AS allowed
    `,
    [userId, resource, action]
  );

  return result.rows[0]?.allowed === true;
}

export async function getResource(resourceId) {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      resource_type,
      sensitivity,
      owner_user_id,
      description,
      active
    FROM resources
    WHERE id = $1
    `,
    [resourceId]
  );

  return result.rows[0] || null;
}

export async function hasResponsibility(
  userId,
  responsibility,
  requiredScope = null
) {
  if (!responsibility) {
    return false;
  }

  // A grant at a broader scope includes narrower resources, never the reverse.
  // These values must stay aligned with chk_user_responsibility_scope in migration 004.
  const scopeGrants = {
    OWN: ["OWN", "ASSIGNED", "TEAM", "ORGANIZATION"],
    ASSIGNED: ["ASSIGNED", "TEAM", "ORGANIZATION"],
    TEAM: ["TEAM", "ORGANIZATION"],
    ORGANIZATION: ["ORGANIZATION"]
  };

  const values = [userId, responsibility];
  let scopeClause = "";

  if (requiredScope !== null && requiredScope !== undefined) {
    const acceptedGrantScopes = scopeGrants[String(requiredScope).trim().toUpperCase()];
    if (!acceptedGrantScopes) {
      return false;
    }

    values.push(acceptedGrantScopes);
    scopeClause = "AND ur.scope = ANY($3::text[])";
  }

  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM user_responsibilities ur
      JOIN responsibilities r
        ON r.id = ur.responsibility_id
      WHERE ur.user_id = $1
        AND LOWER(r.name) = LOWER($2)
        AND ur.active = TRUE
        ${scopeClause}
    ) AS allowed
    `,
    values
  );

  return result.rows[0]?.allowed === true;
}

/**
 * Context-aware authorization.
 *
 * RBAC answers:
 *   "Can this role perform this action?"
 *
 * Context authorization answers:
 *   "Can this user perform this action here and now?"
 */
export async function authorizeContext({
  userId,
  resource,
  action,
  responsibility = null,
  scope = null,
  resourceId = null,
  session = null,
  task = null
}) {
  const normalizedResource = normalize(resource);
  const normalizedAction = normalize(action);

  const allowedByRole = await hasPermission(
    userId,
    normalizedResource,
    normalizedAction
  );

  if (!allowedByRole) {
    return {
      allowed: false,
      reason: "MISSING_PERMISSION",
      requiredPermission: `${normalizedResource}:${normalizedAction}`,
      riskRelevant: true
    };
  }

  if (responsibility) {
    const responsibilityAllowed = await hasResponsibility(
      userId,
      responsibility,
      scope
    );

    if (!responsibilityAllowed) {
      return {
        allowed: false,
        reason: "RESPONSIBILITY_MISMATCH",
        requiredPermission: `${normalizedResource}:${normalizedAction}`,
        riskRelevant: true
      };
    }
  }

  let protectedResource = null;

  if (resourceId) {
    protectedResource = await getResource(resourceId);

    if (!protectedResource) {
      return {
        allowed: false,
        reason: "RESOURCE_NOT_FOUND",
        requiredPermission: `${normalizedResource}:${normalizedAction}`,
        riskRelevant: false
      };
    }

    if (!protectedResource.active) {
      return {
        allowed: false,
        reason: "RESOURCE_INACTIVE",
        requiredPermission: `${normalizedResource}:${normalizedAction}`,
        riskRelevant: true
      };
    }

    if (
      protectedResource.resource_type &&
      normalize(protectedResource.resource_type) !== normalizedResource
    ) {
      return {
        allowed: false,
        reason: "RESOURCE_TYPE_MISMATCH",
        requiredPermission: `${normalizedResource}:${normalizedAction}`,
        riskRelevant: true
      };
    }
  }

  if (session) {
    if (
      session.status === "quarantined" ||
      session.status === "restricted"
    ) {
      return {
        allowed: false,
        reason: "SESSION_RESTRICTED",
        requiredPermission: `${normalizedResource}:${normalizedAction}`,
        riskRelevant: true
      };
    }

    if (session.step_up_required && !session.step_up_verified_at) {
      return {
        allowed: false,
        reason: "STEP_UP_REQUIRED",
        requiredPermission: `${normalizedResource}:${normalizedAction}`,
        riskRelevant: true
      };
    }
  }

  return {
    allowed: true,
    reason: "AUTHORIZED",
    requiredPermission: `${normalizedResource}:${normalizedAction}`,
    riskRelevant: false,
    context: {
      responsibility,
      task,
      scope,
      resourceId
    },
    resource: protectedResource
  };
}
