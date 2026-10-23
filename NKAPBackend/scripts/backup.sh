#!/bin/sh
# Sauvegarde de la base. Les identifiants viennent de l'environnement, pas du fichier.
# Restauration : mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME" < backup.sql
set -eu
stamp=$(date +%F-%H%M)
mysqldump \
  -h "${DB_HOST:-127.0.0.1}" \
  -P "${DB_PORT:-3306}" \
  -u "${DB_USER:?DB_USER requis}" \
  -p"${DB_PASSWORD:?DB_PASSWORD requis}" \
  "${DB_NAME:?DB_NAME requis}" \
  > "backup-${stamp}.sql"
echo "backup-${stamp}.sql"
