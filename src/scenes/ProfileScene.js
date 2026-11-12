import Phaser from 'phaser';
import { CONFIG, getLayout } from '../config.js';
import { StyleManager } from '../styles/StyleManager.js';
import { TabBar } from '../presentation/components/TabBar.js';
import { BackgroundDecorations } from '../presentation/components/BackgroundDecorations.js';
import { Records } from '../data/LocalRecords.js';

import { NeonFrame } from '../presentation/components/NeonFrame.js';
import { StreakManager } from '../data/StreakManager.js';

export class ProfileScene extends Phaser.Scene {
  constructor() { super({ key: 'ProfileScene' }); }
  create() {
    const { width, height } = this.cameras.main;
    const layout = getLayout(width, height);
    const colors = StyleManager.getColors();
    const ui = StyleManager.getUIColors();
    this.cameras.main.setBackgroundColor(colors.background);
    this.decorations = BackgroundDecorations.createAll(this);
    this.cameras.main.fadeIn(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);
    this.add.text(layout.centerX, 50, 'YOUR PROGRESS', { fontFamily: CONFIG.FONTS.primary, fontSize: '23px', color: ui.titleColor, fontStyle: 'bold', resolution: 2 }).setOrigin(0.5);
    const stats = Records.getStats();
    const streak = StreakManager.getStreak();
    const rows = [['BEST SCORE', stats.bestScore.toLocaleString()], ['GAMES PLAYED', stats.gamesPlayed.toLocaleString()], ['LINES CLEARED', stats.totalLines.toLocaleString()], ['DAILY STREAK', `${streak} ${streak === 1 ? 'DAY' : 'DAYS'}`]];
    const spacing = Math.min(85, (layout.tabBarY - 110) / rows.length);
    this.frames = rows.map(([label, value], index) => {
      const y = 105 + index * spacing;
      const frame = new NeonFrame(this, layout.centerX, y + 15, Math.min(width - 48, 340), spacing - 12, { filled: true, backgroundColor: colors.gridBackground, backgroundAlpha: 0.8 });
      this.add.text(layout.centerX, y, label, { fontFamily: CONFIG.FONTS.primary, fontSize: '11px', color: ui.textSecondary, resolution: 2 }).setOrigin(0.5);
      this.add.text(layout.centerX, y + 25, value, { fontFamily: CONFIG.FONTS.primary, fontSize: '22px', color: ui.titleColor, fontStyle: 'bold', resolution: 2 }).setOrigin(0.5);
      return frame;
    });
    this.add.text(layout.centerX, layout.tabBarY - 25, 'Saved on this device', { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: ui.textSecondary, resolution: 2 }).setOrigin(0.5);
    this.tabBar = new TabBar(this, 'profile');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.tabBar.destroy();
      this.frames.forEach(frame => frame.destroy());
      BackgroundDecorations.destroyAll(this.decorations);
    });
  }
}
