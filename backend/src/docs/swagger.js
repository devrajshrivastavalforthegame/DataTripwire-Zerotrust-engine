import swaggerUi from "swagger-ui-express";
import fs from "node:fs";
const swaggerDocument = JSON.parse(fs.readFileSync(new URL("./openapi.yaml", import.meta.url), "utf8"));
export function setupSwagger(app) { app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument)); }
