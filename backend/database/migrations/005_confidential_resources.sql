BEGIN;

INSERT INTO resources (name, resource_type, sensitivity, description, active)
VALUES
  ('Office Credentials Vault', 'CREDENTIALS', 'RESTRICTED', 'Controlled demo resource representing confidential office credentials.', TRUE),
  ('Q4 Financial Report', 'DOCUMENT', 'CONFIDENTIAL', 'Confidential finance document for the demo.', TRUE),
  ('HR Records', 'DOCUMENT', 'RESTRICTED', 'Restricted personnel records for the demo.', TRUE)
ON CONFLICT (name) DO NOTHING;

COMMIT;
