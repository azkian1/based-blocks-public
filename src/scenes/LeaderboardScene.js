import Phaser from 'phaser';
import { CONFIG, getLayout } from '../config.js';
import { StyleManager } from '../styles/StyleManager.js';
import { TabBar } from '../presentation/components/TabBar.js';
import { BackgroundDecorations } from '../presentation/components/BackgroundDecorations.js';
import { Records } from '../data/LocalRecords.js';

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super({ key: 'LeaderboardScene' }); }
  create() {
    const { width, height } = this.cameras.main;
    const layout = getLayout(width, height);
    const ui = StyleManager.getUIColors();
    this.cameras.main.setBackgroundColor(StyleManager.getColors().background);
    this.decorations = BackgroundDecorations.createAll(this);
    this.cameras.main.fadeIn(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);
    const text = (x, y, value, size, color = ui.textSecondary) => this.add.text(x, y, value, { fontFamily: CONFIG.FONTS.primary, fontSize: `${size}px`, color, resolution: 2 });
    text(layout.centerX, 50, 'YOUR RECORDS', 24, ui.titleColor).setOrigin(0.5);
    text(layout.centerX, 84, 'Top five games on this device', 11).setOrigin(0.5);
    const stats = Records.getStats();
    if (!stats.records.length) text(layout.centerX, layout.centerY, 'Play a game to set a record', 13).setOrigin(0.5);
    stats.records.forEach((record, index) => {
      const y = 145 + index * Math.min(55, (layout.tabBarY - 220) / 5);
      text(28, y, `${index + 1}.`, 18, ui.titleColor);
      text(65, y + 4, record.date, 12);
      text(width - 28, y, record.score.toLocaleString(), 18, ui.titleColor).setOrigin(1, 0);
    });
    text(layout.centerX, layout.tabBarY - 55, `BEST  ${stats.bestScore.toLocaleString()}`, 17, ui.titleColor).setOrigin(0.5);
    this.tabBar = new TabBar(this, 'leaderboard');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.tabBar.destroy();
      BackgroundDecorations.destroyAll(this.decorations);
    });
  }
}
