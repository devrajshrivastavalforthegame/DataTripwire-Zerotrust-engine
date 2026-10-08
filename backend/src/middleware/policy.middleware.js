export function requireProtectedAction(req,res,next) {
    const session = req.auth?.session;
    if (!session) return res.status(401).json({error:"Authentication required"});
    if (session.status === "quarantined") return res.status(403).json({error:"Session quarantined", code:"SESSION_QUARANTINED"});
    if (session.status === "restricted") return res.status(403).json({error:"Session restricted", code:"SESSION_RESTRICTED"});
    if (session.step_up_required && !session.step_up_verified_at) return res.status(403).json({error:"Step-up verification required", code:"STEP_UP_REQUIRED"});
    next();
}
