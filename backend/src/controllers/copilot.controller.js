import { analyzeWithAI } from "../services/ai/ai.service.js";

export async function analyzeCopilotRequest(req, res) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "A JSON analysis request is required" });
  }

  try {
    // Identity and session are always taken from verified backend authentication,
    // never from client-provided user_id/session_id fields.
    const payload = {
      ...body,
      user_id: req.auth.user.id,
      session_id: req.auth.session.id,
      context: {
        ...(body.context && typeof body.context === "object" && !Array.isArray(body.context) ? body.context : {}),
        role: req.auth.user.role,
        session_status: req.auth.session.status
      }
    };
    const analysis = await analyzeWithAI(payload);
    return res.json({ analysis });
  } catch (error) {
    console.error("Copilot analysis failed:", error);
    return res.status(502).json({ error: "AI analysis service is temporarily unavailable" });
  }
}
