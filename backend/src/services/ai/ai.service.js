const DEFAULT_TIMEOUT_MS = 2500;

export async function analyzeWithAI(payload, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const url = process.env.AI_SERVICE_URL || "http://ai-service:8000";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(`${url}/api/v1/analyze`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        if (!response.ok) throw new Error(`AI service returned ${response.status}`);
        return await response.json();
    } finally { clearTimeout(timer); }
}
