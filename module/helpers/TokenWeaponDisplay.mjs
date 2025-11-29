/**
 * Token Weapon Display
 * Muestra el icono del arma equipada sobre el token
 */
export default class TokenWeaponDisplay {
  
  /**
   * Initialize hooks
   */
  static init() {
    console.log('TokenWeaponDisplay | Initializing...');
    Hooks.on('refreshToken', this._onRefreshToken.bind(this));
    Hooks.on('canvasReady', this._onCanvasReady.bind(this));
    Hooks.on('updateItem', this._onUpdateItem.bind(this));
    Hooks.on('createToken', this._onCreateToken.bind(this));
    
    console.log('TokenWeaponDisplay | Hooks registered');
  }

  /**
   * Handle token creation
   */
  static _onCreateToken(tokenDocument, options, userId) {
    console.log('TokenWeaponDisplay | Token created:', tokenDocument.name);
    setTimeout(() => {
      const token = tokenDocument.object;
      if (token) this._onRefreshToken(token);
    }, 100);
  }

  /**
   * Handle canvas ready - refrescar todos los tokens
   */
  static _onCanvasReady() {
    console.log('TokenWeaponDisplay | Canvas ready, refreshing all tokens');
    
    // Refrescar todos los tokens después de un pequeño delay
    setTimeout(() => {
      const tokens = canvas.tokens?.placeables || [];
      console.log(`TokenWeaponDisplay | Found ${tokens.length} tokens to refresh`);
      tokens.forEach(token => {
        console.log(`TokenWeaponDisplay | Refreshing token: ${token.name}`);
        this._onRefreshToken(token);
      });
    }, 500);  // Delay más largo para asegurar que todo esté cargado
  }

  /**
   * Handle item update - refrescar token cuando cambia equipo
   */
  static _onUpdateItem(item, changes, options, userId) {
    if (item.type !== 'weapon') return;
    if (!item.parent) return;
    
    // Buscar token del actor
    const token = canvas.tokens?.placeables.find(t => t.actor?.id === item.parent.id);
    if (token) {
      this._onRefreshToken(token);
    }
  }

  /**
   * Handle token refresh to display weapon icon
   */
  static _onRefreshToken(token) {
    if (!token?.actor) return;
    if (token.actor.type !== 'character' && token.actor.type !== 'enemy') return;
    if (!token.mesh) return; // Token no está completamente inicializado

    // Limpiar icono anterior si existe
    this._clearWeaponIcon(token);

    // Obtener arma equipada
    const equippedWeapon = token.actor.items.find(i => 
      i.type === 'weapon' && i.system.equipped
    );

    if (!equippedWeapon) {
      console.log(`TokenWeaponDisplay | No equipped weapon for ${token.name}`);
      return;
    }

    console.log(`TokenWeaponDisplay | Creating icon for ${token.name} with weapon ${equippedWeapon.name} (${equippedWeapon.system.weaponType})`);

    // Crear y posicionar icono
    this._createWeaponIcon(token, equippedWeapon);
  }

  /**
   * Clear existing weapon icon
   */
  static _clearWeaponIcon(token) {
    if (token.weaponIconSprite) {
      token.weaponIconSprite.parent?.removeChild(token.weaponIconSprite);
      token.weaponIconSprite.destroy({ children: true });
      token.weaponIconSprite = null;
    }
  }

  /**
   * Create weapon icon overlay using PIXI Graphics
   */
  static _createWeaponIcon(token, weapon) {
    const weaponType = weapon.system.weaponType;
    const isMagic = ['anima', 'light', 'dark'].includes(weaponType?.toLowerCase());
    
    console.log(`TokenWeaponDisplay | Creating ${isMagic ? 'magic' : 'physical'} icon for ${weaponType}`);

    // Crear contenedor PIXI
    const container = new PIXI.Container();
    
    // Crear círculo de fondo
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.6);
    bg.drawCircle(0, 0, 14);
    bg.endFill();
    container.addChild(bg);
    
    // Obtener símbolo del arma
    const symbol = this._getWeaponSymbolText(weaponType, isMagic);
    const color = isMagic ? this._getWeaponColor(weaponType) : 0xFFFFFF;
    
    // Crear texto con el símbolo
    const text = new PIXI.Text(symbol, {
      fontFamily: 'Arial',
      fontSize: 16,
      fill: color,
      fontWeight: 'bold'
    });
    text.anchor.set(0.5);
    container.addChild(text);
    
    // Posicionar en esquina superior derecha del token
    container.position.set(token.w - 16, 16);
    container.zIndex = 1000;
    
    // Añadir al token
    token.addChild(container);
    token.weaponIconSprite = container;
    
    console.log(`TokenWeaponDisplay | Icon added to token ${token.name}`);
  }

  /**
   * Método público para refrescar todos los tokens manualmente
   */
  static refreshAll() {
    console.log('TokenWeaponDisplay | Manual refresh triggered');
    const tokens = canvas.tokens?.placeables || [];
    console.log(`TokenWeaponDisplay | Refreshing ${tokens.length} tokens`);
    tokens.forEach(token => {
      this._onRefreshToken(token);
    });
  }

  /**
   * Get weapon symbol as text (Unicode/Emoji)
   */
  static _getWeaponSymbolText(weaponType, isMagic) {
    if (isMagic) {
      return '📖';
    }
    
    const symbols = {
      sword: '⚔',
      lance: '➤',
      axe: '⚒',
      bow: '◉',
      staff: '✦'
    };
    return symbols[weaponType?.toLowerCase()] || '⚔';
  }

  /**
   * Get color for weapon type
   */
  static _getWeaponColor(weaponType) {
    const colors = {
      sword: 0xc0c0c0,    // Silver
      lance: 0x4169e1,    // Royal Blue
      axe: 0x228b22,      // Forest Green
      bow: 0x8b4513,      // Saddle Brown
      anima: 0x32cd32,    // Lime Green
      light: 0xffd700,    // Gold
      dark: 0x4b0082,     // Indigo
      staff: 0xff69b4     // Hot Pink
    };
    return colors[weaponType?.toLowerCase()] || 0xc0c0c0;
  }
}

// Hook para refrescar cuando el token se mueve
Hooks.on('updateToken', (tokenDocument, changes, options, userId) => {
  // Si cambió la posición, el icono se mueve automáticamente al estar en el token
  // Solo necesitamos refrescar si cambia el actor
  if (changes.actorId) {
    const token = tokenDocument.object;
    if (token) TokenWeaponDisplay._onRefreshToken(token);
  }
});
