# Niloofar Music

Music is local-first. On Android, **Scan phone** reads audio entries from the device media store; **Import files** copies selected audio into Niloofar's private documents directory. On iOS, use import. A missing device file stays visible as unavailable until a rescan; excluding a phone song never deletes the original.

The library searches song title, artist, album, filename and playlist name. The media-store scan does not provide artist or album fields, so use a song's **Edit details** action to add them; the Artists and Albums tabs only show songs with those details. Edits are stored in SQLite and do not change the original audio file.

The player saves the active song and a coarse listening position for restoration. **Continue listening** resumes a song from that saved position; selecting it elsewhere starts it from the beginning. Progress is persisted roughly every 15 seconds, on pause, seeking and app-background transitions, not on every UI tick. App restart restores the last library song paused; it never auto-plays.

You can attach a user-owned, timestamped `.lrc` file from Now Playing. Lyrics are stored privately in SQLite and are not downloaded or scraped. The UI displays the current line and nearby lines. Playback speed is adjustable from Now Playing.

Background playback and OS media controls require a new native build after the `expo-audio` config-plugin change. In the app's own controls, the queue can advance, reorder, play next, shuffle upcoming songs, and repeat one/all. Reordering is disabled while shuffle is on; turning shuffle off restores the remaining songs' original order. The current Expo `AudioPlayer` lock-screen API exposes media metadata and play/pause/seek controls, but does not expose a queue next/previous callback; those OS buttons are not claimed here. No sleep timer is exposed because a JavaScript timeout cannot guarantee a stop while the app is suspended in the background.

Device checks to perform after installing a fresh build: scan phone audio; import and remove a file; search and sort; edit artist/album; play across navigation; pause/resume after restart; seek; try each speed; attach/remove an `.lrc` file; lock the screen and use notification controls; leave playback in the background for several minutes. The Android build should be run in the user's separate terminal with their existing low-memory build setup.
