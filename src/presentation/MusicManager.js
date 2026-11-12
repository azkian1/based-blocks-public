// MusicManager - Handles background music with crossfade
// Owner: Agent B (Presentation)

export class MusicManager {
  constructor(scene) {
    this.scene = scene;
    this.tracks = [];           // Array of track keys
    this.currentTrack = null;   // Currently playing Phaser sound
    this.fadingOutTrack = null; // Track being faded out (to ensure cleanup)
    this.currentIndex = -1;     // Index in tracks array
    this.volume = 0.05;         // Background music volume (was 0.10, original 0.3)
    this.crossfadeDuration = 5000; // 5 seconds fade (was 3000, original 2000)
    this.muted = false;
    this.isPlaying = false;
    this.isDestroyed = false;   // Prevent actions after destroy

    // Track active tweens to prevent memory leaks
    this.activeFadeInTween = null;
    this.activeFadeOutTween = null;
    this.activeStopTween = null;
  }

  // Load track references after PreloadScene
  loadTracks(trackKeys) {
    this.tracks = trackKeys.filter(key =>
      this.scene.cache.audio.exists(key)
    );
  }

  // Start playing random track
  play() {
    if (this.isDestroyed || this.tracks.length === 0 || this.isPlaying) return;
    this.isPlaying = true;
    this.playRandomTrack();
  }

  // Pick random track (not the same as current)
  playRandomTrack() {
    if (this.isDestroyed) return;

    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * this.tracks.length);
    } while (nextIndex === this.currentIndex && this.tracks.length > 1);

    this.currentIndex = nextIndex;
    const trackKey = this.tracks[nextIndex];

    // Clean up any existing track first
    if (this.currentTrack && !this.currentTrack.pendingRemove) {
      this.currentTrack.stop();
      this.currentTrack.destroy();
    }

    this.currentTrack = this.scene.sound.add(trackKey, {
      volume: 0,
      loop: false
    });

    // Ensure gain node is at 0 before playback starts
    // (WebView may return stale default 1.0 from gainNode.gain.value)
    this.currentTrack.volume = 0;
    this.currentTrack.play();
    console.log('[MusicManager] Playing:', trackKey, '| fade-in 5s to volume', this.volume);

    // Fade in smoothly — explicit from:0 prevents tween reading stale gain value
    if (this.activeFadeInTween) {
      this.activeFadeInTween.stop();
      this.activeFadeInTween = null;
    }
    this.activeFadeInTween = this.scene.tweens.add({
      targets: this.currentTrack,
      volume: { from: 0, to: this.muted ? 0 : this.volume },
      duration: this.crossfadeDuration,
      onComplete: () => { this.activeFadeInTween = null; }
    });

    this.currentTrack.once('complete', () => {
      if (!this.isDestroyed) {
        this.crossfadeToNext();
      }
    });
  }

  // Crossfade to next track
  crossfadeToNext() {
    if (!this.isPlaying || this.isDestroyed) return;

    const oldTrack = this.currentTrack;

    // Clean up previous fading track if still exists
    if (this.fadingOutTrack && !this.fadingOutTrack.pendingRemove) {
      this.fadingOutTrack.stop();
      this.fadingOutTrack.destroy();
      this.fadingOutTrack = null;
    }

    // Pick next random track
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * this.tracks.length);
    } while (nextIndex === this.currentIndex && this.tracks.length > 1);

    this.currentIndex = nextIndex;
    const trackKey = this.tracks[nextIndex];

    // Create new track, start at 0 volume
    this.currentTrack = this.scene.sound.add(trackKey, {
      volume: 0,
      loop: false
    });

    // Ensure gain node is at 0 before playback starts
    this.currentTrack.volume = 0;
    this.currentTrack.play();

    // Kill any previous fade-in tween
    if (this.activeFadeInTween) {
      this.activeFadeInTween.stop();
      this.activeFadeInTween = null;
    }

    // Fade in new track — explicit from:0 prevents tween reading stale gain value
    this.activeFadeInTween = this.scene.tweens.add({
      targets: this.currentTrack,
      volume: { from: 0, to: this.muted ? 0 : this.volume },
      duration: this.crossfadeDuration,
      onComplete: () => {
        this.activeFadeInTween = null;
      }
    });

    // Fade out old track
    if (oldTrack && !oldTrack.pendingRemove) {
      this.fadingOutTrack = oldTrack;

      // Kill any previous fade-out tween
      if (this.activeFadeOutTween) {
        this.activeFadeOutTween.stop();
        this.activeFadeOutTween = null;
      }

      this.activeFadeOutTween = this.scene.tweens.add({
        targets: oldTrack,
        volume: 0,
        duration: this.crossfadeDuration,
        onComplete: () => {
          if (oldTrack && !oldTrack.pendingRemove) {
            oldTrack.destroy();
          }
          if (this.fadingOutTrack === oldTrack) {
            this.fadingOutTrack = null;
          }
          this.activeFadeOutTween = null;
        }
      });
    }

    this.currentTrack.once('complete', () => {
      if (!this.isDestroyed) {
        this.crossfadeToNext();
      }
    });
  }

  // Stop music (with optional fade)
  stop(immediate = false) {
    this.isPlaying = false;

    if (immediate) {
      // Immediate stop - no fade
      this.stopImmediate();
      return;
    }

    if (this.currentTrack && !this.currentTrack.pendingRemove) {
      // Kill any previous stop tween
      if (this.activeStopTween) {
        this.activeStopTween.stop();
        this.activeStopTween = null;
      }

      this.activeStopTween = this.scene.tweens.add({
        targets: this.currentTrack,
        volume: 0,
        duration: 500,
        onComplete: () => {
          if (this.currentTrack && !this.currentTrack.pendingRemove) {
            this.currentTrack.destroy();
          }
          this.currentTrack = null;
          this.activeStopTween = null;
        }
      });
    }
  }

  // Immediate stop without fade (for scene transitions)
  stopImmediate() {
    this.isPlaying = false;

    // Stop tracked tweens
    if (this.activeFadeInTween) {
      this.activeFadeInTween.stop();
      this.activeFadeInTween = null;
    }
    if (this.activeFadeOutTween) {
      this.activeFadeOutTween.stop();
      this.activeFadeOutTween = null;
    }
    if (this.activeStopTween) {
      this.activeStopTween.stop();
      this.activeStopTween = null;
    }

    // Stop all tweens on our tracks (fallback)
    if (this.currentTrack) {
      this.scene.tweens.killTweensOf(this.currentTrack);
    }
    if (this.fadingOutTrack) {
      this.scene.tweens.killTweensOf(this.fadingOutTrack);
    }

    // Destroy current track
    if (this.currentTrack && !this.currentTrack.pendingRemove) {
      this.currentTrack.stop();
      this.currentTrack.destroy();
    }
    this.currentTrack = null;

    // Destroy fading out track
    if (this.fadingOutTrack && !this.fadingOutTrack.pendingRemove) {
      this.fadingOutTrack.stop();
      this.fadingOutTrack.destroy();
    }
    this.fadingOutTrack = null;
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.currentTrack && !this.muted) {
      this.currentTrack.volume = vol;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.currentTrack) {
      this.currentTrack.volume = muted ? 0 : this.volume;
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.stopImmediate();
  }
}
