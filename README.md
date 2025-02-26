# Pantheon Camp Timer

A simple, elegant timer application designed for Pantheon: Rise of the Fallen, EverQuest, and similar MMORPGs where tracking mob respawn times is essential for efficient camping.

**Live Demo:** [https://cowfieldtechguy.github.io/pantheon-timer/](https://cowfieldtechguy.github.io/pantheon-timer/)

![Pantheon Camp Timer Screenshot](https://i.imgur.com/yourscreenshot.png)

## Features

- **Mob Respawn Tracking**: Monitor multiple mobs with precise countdown timers
- **Respawn Window Calculation**: Accounts for variance in spawn times (±minutes)
- **Visual Progress Bars**: See at a glance how close a mob is to respawning
- **Sound Notifications**: Audio alerts when mobs are about to spawn or have spawned
- **Desktop Notifications**: System notifications for important spawn events
- **Data Persistence**: All timers and settings are saved locally in your browser
- **Dark Theme**: Easy on the eyes during those long gaming sessions
- **Import/Export**: Share your timer configurations with guildmates

## How to Use

### Adding a New Mob Timer

1. Enter the mob's name
2. Specify the camp location (optional)
3. Set the respawn time in minutes
4. Set the variance (±minutes) if the spawn window is variable
5. Add optional notes (drops, strategies, etc.)
6. Click "Add Mob Timer"

### Timer Management

- **Reset Timer**: Click the refresh icon after killing a mob to reset its timer
- **Toggle Notifications**: Click the bell icon to enable/disable notifications for specific mobs
- **Remove Timer**: Click the trash icon to delete a timer
- **Filter View**: Toggle between "Active Timers" and "All Mobs"

### Progress Bar Color Codes

- **Purple/Blue**: Normal progress, not close to spawning yet
- **Yellow**: Approaching spawn window
- **Green**: Mob has spawned

### Settings Panel

Access the settings by clicking the ⚙️ gear icon in the top right corner.

- **Notification Timing**: Set how many minutes before spawn you want to be notified
- **Export/Import**: Save or load timer configurations
- **Clear All**: Remove all timers (with confirmation)

### Sound Controls

- Click the sound icon in the top right to toggle sound notifications on/off

## Tips for Optimal Use

- **Browser Permissions**: Allow desktop notifications when prompted for the best experience
- **Keep Tab Active**: Some browsers may throttle timers in inactive tabs
- **Share Configurations**: Use the Export feature to share timer setups with your party
- **Regular Backups**: Export your timer configurations periodically as a backup

## Privacy

This application runs entirely in your browser. All data is stored locally on your device using browser localStorage. No data is sent to any server.

## Technical Details

This app is built with:
- React
- Local Storage API
- Web Notifications API
- Web Audio API

## Contributing

This project is open source. Feel free to fork it, modify it, and make it your own!

## Credits

Developed by CowFieldTechGuy with assistance from Claude.

## License

MIT License - Use, modify, and share freely!