-- =========================================================
-- Gestion Stock TT — seed data for demo/testing
-- Run once, after the backend has started at least once
-- (so ddl-auto=update has created all the tables).
-- =========================================================

-- =========================================================
-- 1. REGIONS — the 24 governorates of Tunisia
-- =========================================================
INSERT INTO regions (nom, adresse, created_at, updated_at, created_by, updated_by) VALUES
('Tunis', 'Avenue Habib Bourguiba, Tunis', NOW(), NOW(), 'admin', 'admin'),
('Ariana', 'Avenue Habib Thameur, Ariana', NOW(), NOW(), 'admin', 'admin'),
('Ben Arous', 'Rue de la République, Ben Arous', NOW(), NOW(), 'admin', 'admin'),
('Manouba', 'Avenue de la Liberté, Manouba', NOW(), NOW(), 'admin', 'admin'),
('Nabeul', 'Avenue Habib Bourguiba, Nabeul', NOW(), NOW(), 'admin', 'admin'),
('Zaghouan', 'Rue de l''Indépendance, Zaghouan', NOW(), NOW(), 'admin', 'admin'),
('Bizerte', 'Avenue d''Afrique, Bizerte', NOW(), NOW(), 'admin', 'admin'),
('Béja', 'Avenue Habib Bourguiba, Béja', NOW(), NOW(), 'admin', 'admin'),
('Jendouba', 'Rue Farhat Hached, Jendouba', NOW(), NOW(), 'admin', 'admin'),
('Le Kef', 'Avenue Habib Bourguiba, Le Kef', NOW(), NOW(), 'admin', 'admin'),
('Siliana', 'Rue de la République, Siliana', NOW(), NOW(), 'admin', 'admin'),
('Sousse', 'Avenue Léopold Sédar Senghor, Sousse', NOW(), NOW(), 'admin', 'admin'),
('Monastir', 'Avenue Habib Bourguiba, Monastir', NOW(), NOW(), 'admin', 'admin'),
('Mahdia', 'Avenue Farhat Hached, Mahdia', NOW(), NOW(), 'admin', 'admin'),
('Sfax', 'Route de Tunis, Sfax', NOW(), NOW(), 'admin', 'admin'),
('Kairouan', 'Avenue de la République, Kairouan', NOW(), NOW(), 'admin', 'admin'),
('Kasserine', 'Avenue Habib Bourguiba, Kasserine', NOW(), NOW(), 'admin', 'admin'),
('Sidi Bouzid', 'Rue de l''Environnement, Sidi Bouzid', NOW(), NOW(), 'admin', 'admin'),
('Gabès', 'Avenue Farhat Hached, Gabès', NOW(), NOW(), 'admin', 'admin'),
('Médenine', 'Avenue Habib Bourguiba, Médenine', NOW(), NOW(), 'admin', 'admin'),
('Tataouine', 'Rue de l''Indépendance, Tataouine', NOW(), NOW(), 'admin', 'admin'),
('Gafsa', 'Avenue Taieb Mhiri, Gafsa', NOW(), NOW(), 'admin', 'admin'),
('Tozeur', 'Avenue Habib Bourguiba, Tozeur', NOW(), NOW(), 'admin', 'admin'),
('Kébili', 'Rue de la République, Kébili', NOW(), NOW(), 'admin', 'admin')
ON CONFLICT (nom) DO NOTHING;

-- =========================================================
-- 2. CATEGORIES
-- =========================================================
INSERT INTO categories (name, description, created_at, updated_at, created_by, updated_by) VALUES
('Téléphones', 'Postes téléphoniques fixes et mobiles professionnels', NOW(), NOW(), 'admin', 'admin'),
('Modems', 'Modems et routeurs ADSL/Fibre', NOW(), NOW(), 'admin', 'admin'),
('Câbles', 'Câbles réseau, téléphoniques et fibre optique', NOW(), NOW(), 'admin', 'admin'),
('Équipements réseau', 'Switchs, boîtiers de raccordement, antennes', NOW(), NOW(), 'admin', 'admin')
ON CONFLICT (name) DO NOTHING;

-- =========================================================
-- 3. PRODUCTS
-- =========================================================
INSERT INTO products (code, name, description, unit_price, date_introduction, date_fin, minimum_quantity, category_id, created_at, updated_at, created_by, updated_by)
SELECT * FROM (VALUES
    ('TEL-001', 'Téléphone fixe Alcatel T06', 'Poste téléphonique filaire standard', 45.00, CURRENT_DATE - INTERVAL '400 days', NULL::date, 15, (SELECT id FROM categories WHERE name = 'Téléphones'), NOW(), NOW(), 'admin', 'admin'),
    ('TEL-002', 'Téléphone IP Yealink T31', 'Poste téléphonique IP pour VoIP', 89.90, CURRENT_DATE - INTERVAL '300 days', NULL::date, 10, (SELECT id FROM categories WHERE name = 'Téléphones'), NOW(), NOW(), 'admin', 'admin'),
    ('MOD-001', 'Modem TP-Link Archer VR400', 'Modem routeur ADSL2+/VDSL sans fil', 120.00, CURRENT_DATE - INTERVAL '350 days', NULL::date, 10, (SELECT id FROM categories WHERE name = 'Modems'), NOW(), NOW(), 'admin', 'admin'),
    ('MOD-002', 'Modem Huawei HG8245', 'Modem fibre optique GPON', 150.00, CURRENT_DATE - INTERVAL '250 days', NULL::date, 8, (SELECT id FROM categories WHERE name = 'Modems'), NOW(), NOW(), 'admin', 'admin'),
    ('CAB-001', 'Câble réseau Cat6 (10m)', 'Câble Ethernet catégorie 6 blindé', 8.50, CURRENT_DATE - INTERVAL '500 days', NULL::date, 40, (SELECT id FROM categories WHERE name = 'Câbles'), NOW(), NOW(), 'admin', 'admin'),
    ('CAB-002', 'Câble fibre optique (50m)', 'Câble fibre optique monomode', 65.00, CURRENT_DATE - INTERVAL '200 days', NULL::date, 12, (SELECT id FROM categories WHERE name = 'Câbles'), NOW(), NOW(), 'admin', 'admin'),
    ('SWI-001', 'Switch Cisco 24 ports', 'Commutateur réseau 24 ports Gigabit', 340.00, CURRENT_DATE - INTERVAL '180 days', NULL::date, 5, (SELECT id FROM categories WHERE name = 'Équipements réseau'), NOW(), NOW(), 'admin', 'admin'),
    ('BR-001', 'Boîtier de raccordement optique', 'Boîtier de terminaison fibre 12 ports', 55.00, CURRENT_DATE - INTERVAL '150 days', NULL::date, 10, (SELECT id FROM categories WHERE name = 'Équipements réseau'), NOW(), NOW(), 'admin', 'admin'),
    ('ANT-001', 'Antenne parabolique 4G', 'Antenne directionnelle 4G/LTE extérieure', 95.00, CURRENT_DATE - INTERVAL '120 days', NULL::date, 8, (SELECT id FROM categories WHERE name = 'Équipements réseau'), NOW(), NOW(), 'admin', 'admin'),
    ('MOD-003', 'Modem 3G/4G portable', 'Modem USB mobile, gamme discontinuée', 40.00, CURRENT_DATE - INTERVAL '600 days', CURRENT_DATE - INTERVAL '30 days', 5, (SELECT id FROM categories WHERE name = 'Modems'), NOW(), NOW(), 'admin', 'admin')
) AS v(code, name, description, unit_price, date_introduction, date_fin, minimum_quantity, category_id, created_at, updated_at, created_by, updated_by)
ON CONFLICT (code) DO NOTHING;

-- =========================================================
-- 4. USERS
-- Same password for everyone here: Admin@123
-- (bcrypt hash below — reuse from earlier in this project)
-- Set your own real test email so OTP actually reaches you.
-- =========================================================
INSERT INTO users (username, password, email, role, region_id, created_at, updated_at, created_by, updated_by)
SELECT * FROM (VALUES
    ('resp_sfax', '$2b$10$PDQQSvJA9gEAZiOMIMcs5uHkRjDtsMrDy5LrNC/jUbn3T9vmggepC', 'mekkioussama69@gmail.com', 'RESPONSABLE_REGION', (SELECT id FROM regions WHERE nom = 'Sfax'), NOW(), NOW(), 'admin', 'admin'),
    ('resp_sousse', '$2b$10$PDQQSvJA9gEAZiOMIMcs5uHkRjDtsMrDy5LrNC/jUbn3T9vmggepC', 'mekkioussama69@gmail.com', 'RESPONSABLE_REGION', (SELECT id FROM regions WHERE nom = 'Sousse'), NOW(), NOW(), 'admin', 'admin'),
    ('resp_bizerte', '$2b$10$PDQQSvJA9gEAZiOMIMcs5uHkRjDtsMrDy5LrNC/jUbn3T9vmggepC', 'mekkioussama69@gmail.com', 'RESPONSABLE_REGION', (SELECT id FROM regions WHERE nom = 'Bizerte'), NOW(), NOW(), 'admin', 'admin')
) AS v(username, password, email, role, region_id, created_at, updated_at, created_by, updated_by)
ON CONFLICT (username) DO NOTHING;

-- Backfill email on any existing users that don't have one yet (e.g. your original admin/resp_tunis)
UPDATE users SET email = 'your.test.email@gmail.com' WHERE email IS NULL;

-- =========================================================
-- 5. STOCK CENTRAL — starting inventory at the warehouse
-- =========================================================
INSERT INTO stock_central (product_id, quantity, quantity_defective, created_at, updated_at, created_by, updated_by)
SELECT p.id, sc.qty, sc.def, NOW(), NOW(), 'admin', 'admin'
FROM (VALUES
    ('TEL-001', 180, 3),
    ('TEL-002', 95, 0),
    ('MOD-001', 220, 5),
    ('MOD-002', 60, 2),
    ('CAB-001', 400, 0),
    ('CAB-002', 75, 1),
    ('SWI-001', 30, 0),
    ('BR-001', 85, 0),
    ('ANT-001', 42, 1),
    ('MOD-003', 12, 0)
) AS sc(code, qty, def)
JOIN products p ON p.code = sc.code
ON CONFLICT (product_id) DO NOTHING;

-- =========================================================
-- 6. REGIONAL STOCK — a realistic spread across a subset of regions
-- =========================================================
INSERT INTO stocks (product_id, region_id, quantity, quantity_defective, created_at, updated_at, created_by, updated_by)
SELECT p.id, r.id, s.qty, s.def, NOW(), NOW(), 'admin', 'admin'
FROM (VALUES
    ('Tunis',    'TEL-001', 25, 0), ('Tunis',    'MOD-001', 40, 1), ('Tunis',    'CAB-001', 60, 0), ('Tunis',    'SWI-001', 6, 0),
    ('Sfax',     'TEL-001', 18, 0), ('Sfax',     'MOD-001', 5,  0), ('Sfax',     'CAB-001', 35, 0), ('Sfax',     'ANT-001', 4, 0),
    ('Sousse',   'TEL-002', 14, 0), ('Sousse',   'MOD-002', 9,  0), ('Sousse',   'CAB-002', 8,  0),
    ('Bizerte',  'TEL-001', 3,  0), ('Bizerte',  'MOD-001', 2,  0), ('Bizerte',  'BR-001',  6, 0),
    ('Nabeul',   'MOD-001', 22, 0), ('Nabeul',   'CAB-001', 30, 0),
    ('Gabès',    'TEL-001', 9,  0), ('Gabès',    'ANT-001', 3,  0)
) AS s(region_name, code, qty, def)
JOIN products p ON p.code = s.code
JOIN regions r ON r.nom = s.region_name
ON CONFLICT (product_id, region_id) DO NOTHING;

-- =========================================================
-- 7. COMMANDES — order history (mostly delivered, one overdue, one in progress)
-- =========================================================
INSERT INTO commandes (product_id, fournisseur, quantity, status, date_commande, date_livraison_prevue, date_livraison_reelle, created_at, updated_at, created_by, updated_by)
SELECT p.id, c.fournisseur, c.qty, c.status, c.date_cmd, c.date_prevue, c.date_reelle, NOW(), NOW(), 'admin', 'admin'
FROM (VALUES
    ('TEL-001', 'Alcatel-Lucent Tunisie', 100, 'LIVREE', CURRENT_DATE - INTERVAL '80 days', CURRENT_DATE - INTERVAL '65 days', CURRENT_DATE - INTERVAL '63 days'),
    ('MOD-001', 'TP-Link Distribution TN', 150, 'LIVREE', CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE - INTERVAL '55 days', CURRENT_DATE - INTERVAL '54 days'),
    ('CAB-001', 'CableCo Tunisie', 300, 'LIVREE', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '44 days'),
    ('SWI-001', 'Cisco Partner Tunisie', 20, 'LIVREE', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '20 days'),
    ('MOD-002', 'Huawei Tunisie', 40, 'EN_COURS', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', NULL),
    ('ANT-001', 'Fournisseur générique', 25, 'EN_COURS', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '3 days', NULL)
) AS c(code, fournisseur, qty, status, date_cmd, date_prevue, date_reelle)
JOIN products p ON p.code = c.code;

-- =========================================================
-- 8. MOUVEMENTS — spread over ~45 days for chart/report/rupture-prediction data
-- =========================================================
INSERT INTO mouvements (type, product_id, region_source_id, region_destination_id, quantity, date, created_at, updated_at, created_by, updated_by)
SELECT m.type, p.id, rs.id, rd.id, m.qty, m.mdate, NOW(), NOW(), 'admin', 'admin'
FROM (VALUES
    -- ENTREE : réceptions manuelles au Stock Central
    ('ENTREE', 'TEL-001', NULL, NULL, 100, CURRENT_DATE - INTERVAL '63 days'),
    ('ENTREE', 'MOD-001', NULL, NULL, 150, CURRENT_DATE - INTERVAL '54 days'),
    ('ENTREE', 'CAB-001', NULL, NULL, 300, CURRENT_DATE - INTERVAL '44 days'),

    -- SORTIE : consommation régionale (alimente les prévisions de rupture)
    ('SORTIE', 'TEL-001', 'Tunis',   NULL, 5, CURRENT_DATE - INTERVAL '2 days'),
    ('SORTIE', 'TEL-001', 'Tunis',   NULL, 4, CURRENT_DATE - INTERVAL '5 days'),
    ('SORTIE', 'TEL-001', 'Tunis',   NULL, 6, CURRENT_DATE - INTERVAL '9 days'),
    ('SORTIE', 'TEL-001', 'Tunis',   NULL, 3, CURRENT_DATE - INTERVAL '14 days'),
    ('SORTIE', 'TEL-001', 'Tunis',   NULL, 5, CURRENT_DATE - INTERVAL '20 days'),
    ('SORTIE', 'MOD-001', 'Sfax',    NULL, 2, CURRENT_DATE - INTERVAL '3 days'),
    ('SORTIE', 'MOD-001', 'Sfax',    NULL, 3, CURRENT_DATE - INTERVAL '10 days'),
    ('SORTIE', 'MOD-001', 'Sfax',    NULL, 2, CURRENT_DATE - INTERVAL '18 days'),
    ('SORTIE', 'CAB-001', 'Nabeul',  NULL, 8, CURRENT_DATE - INTERVAL '4 days'),
    ('SORTIE', 'CAB-001', 'Nabeul',  NULL, 6, CURRENT_DATE - INTERVAL '12 days'),
    ('SORTIE', 'TEL-002', 'Sousse',  NULL, 3, CURRENT_DATE - INTERVAL '6 days'),
    ('SORTIE', 'TEL-002', 'Sousse',  NULL, 2, CURRENT_DATE - INTERVAL '15 days'),

    -- TRANSFERT entre régions
    ('TRANSFERT', 'TEL-001', 'Tunis',  'Bizerte', 5, CURRENT_DATE - INTERVAL '30 days'),
    ('TRANSFERT', 'MOD-001', 'Nabeul', 'Bizerte', 3, CURRENT_DATE - INTERVAL '25 days'),
    ('TRANSFERT', 'CAB-001', 'Tunis',  'Sfax',    10, CURRENT_DATE - INTERVAL '35 days')
) AS m(type, code, region_source_name, region_destination_name, qty, mdate)
JOIN products p ON p.code = m.code
LEFT JOIN regions rs ON rs.nom = m.region_source_name
LEFT JOIN regions rd ON rd.nom = m.region_destination_name;

-- =========================================================
-- 9. DEMANDES — mixed statuses
-- =========================================================
INSERT INTO demandes (product_id, region_id, demandeur_id, quantity, fulfilled_quantity, status, date_creation, date_traitement, created_at, updated_at, created_by, updated_by)
SELECT p.id, r.id, u.id, d.qty, d.fulfilled, d.status, d.date_cre, d.date_trait, NOW(), NOW(), u.username, u.username
FROM (VALUES
    ('TEL-001', 'Tunis',   'resp_tunis',   20, 20, 'APPROUVEE',                CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '24 days'),
    ('MOD-001', 'Sfax',    'resp_sfax',    15, 15, 'APPROUVEE',                CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '19 days'),
    ('CAB-001', 'Nabeul',  'resp_sousse',  50, 30, 'PARTIELLEMENT_APPROUVEE',  CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '14 days'),
    ('TEL-002', 'Sousse',  'resp_sousse',  10, NULL, 'REJETEE',                CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '9 days'),
    ('MOD-002', 'Bizerte', 'resp_bizerte', 8,  NULL, 'EN_ATTENTE',             CURRENT_DATE - INTERVAL '2 days', NULL),
    ('SWI-001', 'Sfax',    'resp_sfax',    4,  NULL, 'EN_ATTENTE',             CURRENT_DATE - INTERVAL '1 days', NULL)
) AS d(code, region_name, username, qty, fulfilled, status, date_cre, date_trait)
JOIN products p ON p.code = d.code
JOIN regions r ON r.nom = d.region_name
JOIN users u ON u.username = d.username;

-- =========================================================
-- 10. RETOURS — includes one defective, to exercise the Maintenance flow
-- =========================================================
INSERT INTO retours (product_id, region_id, demandeur_id, quantity, defective, fulfilled_quantity, status, date_creation, date_traitement, created_at, updated_at, created_by, updated_by)
SELECT p.id, r.id, u.id, ret.qty, ret.defective, ret.fulfilled, ret.status, ret.date_cre, ret.date_trait, NOW(), NOW(), u.username, u.username
FROM (VALUES
    ('MOD-001', 'Tunis', 'resp_tunis', 3, true, NULL, 'EN_ATTENTE', CURRENT_DATE - INTERVAL '1 days', NULL),
    ('CAB-001', 'Sfax',  'resp_sfax',  10, false, 10, 'APPROUVEE', CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE - INTERVAL '17 days')
) AS ret(code, region_name, username, qty, defective, fulfilled, status, date_cre, date_trait)
JOIN products p ON p.code = ret.code
JOIN regions r ON r.nom = ret.region_name
JOIN users u ON u.username = ret.username;

-- =========================================================
-- 11. MAINTENANCE — one standalone Central-reported case, ready to resolve
-- (the pending defective Retour above will create its own region-level
-- case automatically once you approve it in the app — good live test
-- of the bug fix from earlier in this project)
-- =========================================================
INSERT INTO maintenances (product_id, region_id, quantity, status, resolution, date_signalement, date_resolution, created_at, updated_at, created_by, updated_by)
SELECT p.id, NULL, 4, 'SIGNALEE', NULL, CURRENT_DATE - INTERVAL '3 days', NULL, NOW(), NOW(), 'admin', 'admin'
FROM products p WHERE p.code = 'TEL-002';

-- =========================================================
-- 12. AJUSTEMENTS — manual stock corrections with a reason
-- =========================================================
INSERT INTO ajustements (product_id, region_id, quantity, motif, created_at, updated_at, created_by, updated_by)
SELECT p.id, r.id, a.qty, a.motif, NOW(), NOW(), 'admin', 'admin'
FROM (VALUES
    ('TEL-001', 'Tunis', -2, 'Inventaire physique : 2 unités manquantes constatées lors du comptage mensuel'),
    ('CAB-001', 'Nabeul', 5, 'Correction : quantité initiale sous-évaluée lors de la première saisie')
) AS a(code, region_name, qty, motif)
JOIN products p ON p.code = a.code
JOIN regions r ON r.nom = a.region_name;

-- =========================================================
-- 13. NOTIFICATIONS — a few for the admin account, so the bell isn't empty
-- =========================================================
INSERT INTO notifications (user_id, message, is_read, created_at)
SELECT u.id, n.message, n.is_read, n.created
FROM (VALUES
    ('Nouvelle demande de 8 unités de Modem Huawei HG8245 par resp_bizerte (Bizerte)', false, NOW() - INTERVAL '2 days'),
    ('Panne signalée : 4 unités de Téléphone IP Yealink T31 à Stock Central.', false, NOW() - INTERVAL '3 days'),
    ('Commande livrée : 20 unités de Switch Cisco 24 ports (fournisseur : Cisco Partner Tunisie).', true, NOW() - INTERVAL '20 days')
) AS n(message, is_read, created)
CROSS JOIN (SELECT id FROM users WHERE username = 'admin') u;