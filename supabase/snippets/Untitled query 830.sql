SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  reltuples AS row_count,
  pg_size_pretty(
    CASE
      WHEN reltuples > 0 THEN pg_relation_size(relid) / CAST(reltuples AS bigint)
      ELSE 0
    END
  ) AS average_row_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
