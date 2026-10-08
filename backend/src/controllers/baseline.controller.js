import { calculateUserBaseline, getUserBaseline } from "../services/baseline/baseline.service.js";
export async function rebuildBaseline(req,res) {
    try {
        const baseline = await calculateUserBaseline(req.auth.user.id);
        if (!baseline) return res.status(404).json({error:"No eligible behavior data available for baseline"});
        return res.json({baseline});
    } catch (error) { console.error(error); return res.status(500).json({error:"Unable to rebuild baseline"}); }
}
export async function getBaseline(req,res) {
    try {
        const baseline = await getUserBaseline(req.auth.user.id);
        if (!baseline) return res.status(404).json({error:"Baseline not found"});
        return res.json({baseline});
    } catch (error) { return res.status(500).json({error:"Unable to retrieve baseline"}); }
}
