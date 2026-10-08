import { triggerDecoy } from "../services/deception/deception.service.js";
export async function decoyController(req,res) {
    try { return res.status(200).json(await triggerDecoy({auth:req.auth,ipAddress:req.ip})); }
    catch (error) { console.error("Decoy error",error); return res.status(500).json({error:"Unable to process controlled resource"}); }
}
