import { query } from "../config/database.js";

export async function getRBAC(req,res){
  const [roles,permissions,assignments,responsibilities,rolePermissions,users] = await Promise.all([
    query(`SELECT id,name,slug,description,system_role FROM roles ORDER BY name`),
    query(`SELECT id,resource,action,description FROM permissions ORDER BY resource,action`),
    query(`SELECT ur.user_id,u.username,u.email,r.id AS role_id,r.name AS role_name,r.slug AS role_slug
            FROM user_roles ur JOIN users u ON u.id=ur.user_id JOIN roles r ON r.id=ur.role_id
            ORDER BY r.name,u.username`),
    query(`SELECT id,name,description FROM responsibilities ORDER BY name`),
    query(`SELECT rp.role_id,p.id AS permission_id,p.resource,p.action FROM role_permissions rp JOIN permissions p ON p.id=rp.permission_id`),
    query(`SELECT id,username,email,role FROM users ORDER BY username`)
  ]);
  return res.json({roles:roles.rows,permissions:permissions.rows,rolePermissions:rolePermissions.rows,assignments:assignments.rows,responsibilities:responsibilities.rows,users:users.rows});
}

export async function toggleRolePermission(req,res){
  const {roleId,permissionId}=req.params;
  const exists=await query(`SELECT 1 FROM role_permissions WHERE role_id=$1 AND permission_id=$2`,[roleId,permissionId]);
  if(exists.rowCount){
    await query(`DELETE FROM role_permissions WHERE role_id=$1 AND permission_id=$2`,[roleId,permissionId]);
    return res.json({granted:false});
  }
  await query(`INSERT INTO role_permissions(role_id,permission_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[roleId,permissionId]);
  return res.json({granted:true});
}

export async function assignRole(req,res){
  const {userId,roleId}=req.body||{};
  if(!userId||!roleId) return res.status(400).json({error:"userId and roleId are required"});
  await query(`INSERT INTO user_roles(user_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[userId,roleId]);
  return res.json({assigned:true});
}

export async function removeRole(req,res){
  const {userId,roleId}=req.body||{};
  if(!userId||!roleId) return res.status(400).json({error:"userId and roleId are required"});
  await query(`DELETE FROM user_roles WHERE user_id=$1 AND role_id=$2`,[userId,roleId]);
  return res.json({assigned:false});
}
