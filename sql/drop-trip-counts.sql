-- Drop unused Kafka-fed daily rollup. Dashboards read ride-service trip_slot_counts.
-- Run on admin-service DB. Do not run on ride-service (that table is trip_slot_counts).
-- Indexes and unique constraint drop with the table. Safe to re-run.

DROP TABLE IF EXISTS trip_counts;
