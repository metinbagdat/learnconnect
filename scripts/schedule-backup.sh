#!/bin/bash

# Automated Firestore Backup Scheduler
# Add this to cron for automatic backups
# Example: 0 2 * * * /path/to/schedule-backup.sh (runs daily at 2 AM)

# Load environment variables
source .env

# Run backup
node scripts/backup-firestore.js

# Upload to cloud storage (optional)
# Example with AWS S3:
# aws s3 cp backups/ s3://your-bucket/firestore-backups/ --recursive

# Keep only last 30 days of backups
find backups/ -type d -mtime +30 -exec rm -rf {} \;

echo "✅ Scheduled backup completed at $(date)"
