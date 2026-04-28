# Database Backup & Restore Guide

Your FasTo RMS app now has automatic backup and restore functionality to protect user data during updates.

## How Backups Work

### Automatic Backups
- **Before each update installs**: The app creates an automatic backup of your database
- **Location**: `%APPDATA%/FasTo RMS/backups/` (Windows)
- **Naming**: `update-backup-<YYYY-MM-DDTHH-MM-SS>.sqlite`
- **Size**: ~1-5 MB depending on your data volume

### Safety Backup During Restore
- **When you restore**: A safety backup is created before restoring to protect current data
- **Naming**: `pre-restore-backup-<YYYY-MM-DDTHH-MM-SS>.sqlite`
- **Purpose**: If restore goes wrong, you can restore the safety backup

## Accessing Backups

### UI Method (Easiest)
1. In the app, look for **"View Backups"** button (appears when no updates pending)
2. Click to see all available backups with dates and sizes
3. Click **Restore** to restore a specific backup
4. Click **Delete** to remove a backup

### Manual Access
**Windows**: Press `Win + R`, type:
```
%APPDATA%\FasTo RMS\backups
```

**Mac**: 
```
~/Library/Application Support/FasTo RMS/backups/
```

**Linux**:
```
~/.config/FasTo RMS/backups/
```

## Restoring a Backup

### Using the App UI
1. Click **View Backups**
2. Find the backup you want to restore (sorted by date, newest first)
3. Click **Restore** 
4. Confirm the action (be sure!)
5. **Restart the application** for changes to take effect

### What Happens During Restore
1. Current database is backed up as `pre-restore-backup-*.sqlite` (safety net)
2. Selected backup is copied over the current database
3. You're prompted to restart the app
4. App restarts with the restored data

## Backup Locations & Filenames

```
C:\Users\<YourName>\AppData\Roaming\FasTo RMS\
├── db/
│   └── main.sqlite                    ← Current active database
├── backups/
│   ├── update-backup-2026-04-27T15-30-45.sqlite
│   ├── update-backup-2026-04-26T10-15-22.sqlite
│   ├── pre-restore-backup-2026-04-27T16-00-30.sqlite
│   └── ...more backups...
└── logs/
    └── app.log
```

## Backup Management

### Automatic Cleanup (Coming in future updates)
- Old backups are kept for 30 days by default
- You can manually delete backups via the UI

### Manual Deletion
1. Click **View Backups**
2. Click the **trash icon** next to a backup
3. Confirm deletion

**Warning**: Deleted backups cannot be recovered.

## Important Notes

✅ **Your data is safe:**
- App stores data separately from application files
- Updates only replace app code, not your database
- NSIS installer is configured to preserve user data (`deleteAppDataOnUninstall: false`)
- Database backups are created before every update

⚠️ **Backup Limitations:**
- Backups are stored on the same computer (recommended: manually copy to external drive for extra safety)
- Backups only include the database, not attachments or export files
- Size limit depends on available disk space

## Troubleshooting

### Backup Won't Restore
1. Check that sufficient disk space is available
2. Ensure the app isn't actively running during restore
3. Try the pre-restore backup if available
4. Check `%APPDATA%\FasTo RMS\logs\app.log` for error details

### Can't See Backups Folder
1. Enable viewing hidden files (AppData is hidden)
2. In File Explorer: **View → Hidden items** (Windows)
3. Or use path: `%APPDATA%\FasTo RMS\`

### Data Still Missing After Restore
- The restore backup shows the moment you initiated restore
- Use an older update-backup instead
- If nothing works, contact support with your logs from `%APPDATA%\FasTo RMS\logs\`

## Disaster Recovery

If you need to recover data:

1. **Stop using the app** (don't make new changes)
2. **Open backups folder**: `%APPDATA%\FasTo RMS\backups\`
3. **Choose the right backup**:
   - Latest `update-backup-*` or `pre-restore-backup-*`
   - Pick the date closest to when your data was good
4. **Manual restore**:
   - Stop the app completely
   - Delete current database: `%APPDATA%\FasTo RMS\db\main.sqlite`
   - Rename chosen backup to: `main.sqlite`
   - Restart the app
5. **Or use UI restore** (easier): Click View Backups → Restore

## Advanced: Export Backup to External Drive

To create extra safety backups:

1. Open File Explorer
2. Navigate to: `%APPDATA%\FasTo RMS\backups\`
3. Right-click backup file → Copy
4. Navigate to external drive / cloud storage
5. Right-click → Paste
6. Done! You now have an external backup

## Tips for Best Practices

1. **Keep multiple backups** - Don't delete old backups immediately
2. **Regular external backups** - Copy important backups to external storage monthly
3. **Monitor backup folder size** - Delete old backups if storage is low
4. **Update regularly** - Each update creates a new automatic backup
5. **Test restore occasionally** - Make sure restore works before you need it

---

For questions or issues, check logs at:
```
%APPDATA%\FasTo RMS\logs\app.log
```
