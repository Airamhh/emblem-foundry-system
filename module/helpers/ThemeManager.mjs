/**
 * Emblem System - Theme Manager
 * Handles theme switching between light and dark modes
 */

export class ThemeManager {
  static THEME_KEY = 'emblem-theme';
  static THEMES = {
    LIGHT: 'theme-light',
    DARK: 'theme-dark'
  };

  /**
   * Initialize theme system
   */
  static init() {
    console.log('Emblem | Initializing Theme Manager');
    
    // Load saved theme or detect system preference
    const savedTheme = this.getSavedTheme();
    const theme = savedTheme || this.detectSystemTheme();
    
    this.applyTheme(theme);
    this.addThemeSwitcher();
    
    // Listen for system theme changes
    this.watchSystemTheme();
  }

  /**
   * Get saved theme from storage
   */
  static getSavedTheme() {
    return localStorage.getItem(this.THEME_KEY);
  }

  /**
   * Save theme to storage
   */
  static saveTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
    console.log(`Emblem | Theme saved: ${theme}`);
  }

  /**
   * Detect system theme preference
   */
  static detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.THEMES.DARK;
    }
    return this.THEMES.LIGHT;
  }

  /**
   * Apply theme to all Emblem elements
   */
  static applyTheme(theme) {
    // Remove all theme classes
    document.querySelectorAll('.emblem').forEach(element => {
      element.classList.remove(this.THEMES.LIGHT, this.THEMES.DARK);
      element.classList.add(theme);
      element.setAttribute('data-theme', theme);
    });

    // Apply to body for global effects
    document.body.setAttribute('data-fe-theme', theme);
    
    console.log(`Emblem | Theme applied: ${theme}`);
  }

  /**
   * Toggle between light and dark themes
   */
  static toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === this.THEMES.LIGHT 
      ? this.THEMES.DARK 
      : this.THEMES.LIGHT;
    
    this.applyTheme(newTheme);
    this.saveTheme(newTheme);
    
    // Notification
    ui.notifications.info(game.i18n.format('EMBLEM.ThemeChanged', {
      theme: game.i18n.localize(`EMBLEM.Theme.${newTheme === this.THEMES.LIGHT ? 'Light' : 'Dark'}`)
    }));
  }

  /**
   * Get current theme
   */
  static getCurrentTheme() {
    const element = document.querySelector('.emblem');
    if (element?.classList.contains(this.THEMES.DARK)) {
      return this.THEMES.DARK;
    }
    return this.THEMES.LIGHT;
  }

  /**
   * Add theme switcher button to UI
   */
  static addThemeSwitcher() {
    // Remove existing switcher if any
    const existing = document.getElementById('fe-theme-switcher');
    if (existing) existing.remove();

    // Create switcher button
    const switcher = document.createElement('div');
    switcher.id = 'fe-theme-switcher';
    switcher.className = 'emblem theme-switcher';
    switcher.innerHTML = `
      <button class="theme-toggle-btn fe-button fe-button--icon" 
              title="${game.i18n.localize('EMBLEM.ToggleTheme')}">
        <i class="fas fa-sun icon-sun"></i>
        <i class="fas fa-moon icon-moon"></i>
      </button>
    `;

    // Add click handler
    const button = switcher.querySelector('.theme-toggle-btn');
    button.addEventListener('click', () => this.toggleTheme());

    // Add to body
    document.body.appendChild(switcher);
    
    console.log('Emblem | Theme switcher added to UI');
  }

  /**
   * Watch for system theme changes
   */
  static watchSystemTheme() {
    if (!window.matchMedia) return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    darkModeQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a theme
      const savedTheme = this.getSavedTheme();
      if (!savedTheme) {
        const newTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
        this.applyTheme(newTheme);
        console.log(`Emblem | Auto-switched to ${newTheme} based on system preference`);
      }
    });
  }

  /**
   * Add theme settings to Foundry settings
   */
  static registerSettings() {
    game.settings.register('emblem', 'theme', {
      name: game.i18n.localize('EMBLEM.Settings.Theme.Name'),
      hint: game.i18n.localize('EMBLEM.Settings.Theme.Hint'),
      scope: 'client',
      config: true,
      type: String,
      choices: {
        'auto': game.i18n.localize('EMBLEM.Theme.Auto'),
        [this.THEMES.LIGHT]: game.i18n.localize('EMBLEM.Theme.Light'),
        [this.THEMES.DARK]: game.i18n.localize('EMBLEM.Theme.Dark')
      },
      default: 'auto',
      onChange: value => {
        if (value === 'auto') {
          const systemTheme = this.detectSystemTheme();
          this.applyTheme(systemTheme);
          localStorage.removeItem(this.THEME_KEY);
        } else {
          this.applyTheme(value);
          this.saveTheme(value);
        }
      }
    });

    console.log('Emblem | Theme settings registered');
  }
}

// Initialize when DOM is ready
Hooks.once('ready', () => {
  ThemeManager.registerSettings();
  ThemeManager.init();
});

// Re-apply theme when sheets are rendered
Hooks.on('renderActorSheet', (app, html) => {
  const currentTheme = ThemeManager.getCurrentTheme();
  html.addClass(currentTheme);
});

Hooks.on('renderItemSheet', (app, html) => {
  const currentTheme = ThemeManager.getCurrentTheme();
  html.addClass(currentTheme);
});
