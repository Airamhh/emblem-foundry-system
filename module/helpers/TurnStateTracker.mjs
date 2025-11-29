/**
 * Sistema de tracking de estados de turno para Emblem
 * Gestiona los estados: moved, attacked, waiting
 */

export class TurnStateTracker {
  
  // Estados posibles
  static STATES = {
    READY: 'ready',        // Puede moverse y atacar
    MOVED: 'moved',        // Ya se movió, puede atacar
    ATTACKED: 'attacked',  // Ya atacó, puede moverse
    WAITING: 'waiting'     // Terminó su turno
  };
  
  /**
   * Inicializa el sistema de tracking
   */
  static initialize() {
    // Hook cuando cambia el turno
    Hooks.on('combatTurn', this.onTurnChange.bind(this));
    
    // Hook cuando se mueve un token
    Hooks.on('updateToken', this.onTokenMoved.bind(this));
    
    // Hook cuando se ejecuta un combate
    Hooks.on('EMBLEM.combatExecuted', this.onCombatExecuted.bind(this));
  }
  
  /**
   * Obtiene el estado actual de un token
   * @param {Token} token - El token
   * @returns {string} El estado actual
   */
  static getTokenState(token) {
    if (!token.document) return this.STATES.READY;
    
    return token.document.getFlag('emblem', 'turnState') || this.STATES.READY;
  }
  
  /**
   * Establece el estado de un token
   * @param {Token} token - El token
   * @param {string} state - El nuevo estado
   */
  static async setTokenState(token, state) {
    if (!Object.values(this.STATES).includes(state)) {
      console.error(`Invalid state: ${state}`);
      return;
    }
    
    await token.document.setFlag('emblem', 'turnState', state);
    
    // Actualizar visual del token
    this.updateTokenVisual(token, state);
  }
  
  /**
   * Actualiza el visual del token según su estado
   * @param {Token} token - El token
   * @param {string} state - El estado
   */
  static updateTokenVisual(token, state) {
    // Remover efectos visuales anteriores
    if (token._stateIndicator) {
      token.removeChild(token._stateIndicator);
      token._stateIndicator = null;
    }
    
    // Remover filtro de color anterior
    if (token._waitingFilter) {
      token.mesh.filters = token.mesh.filters?.filter(f => f !== token._waitingFilter) || [];
      token._waitingFilter = null;
    }
    
    // Aplicar efecto visual según el estado
    switch (state) {
      case this.STATES.READY:
        token.alpha = 1.0;
        break;
        
      case this.STATES.MOVED:
      case this.STATES.ATTACKED:
        token.alpha = 0.9;
        break;
        
      case this.STATES.WAITING:
        // Aplicar filtro gris semi-transparente
        const colorMatrix = new PIXI.filters.ColorMatrixFilter();
        colorMatrix.desaturate();
        colorMatrix.alpha = 0.6;
        
        // Añadir el filtro al mesh del token
        if (!token.mesh.filters) {
          token.mesh.filters = [];
        }
        token.mesh.filters.push(colorMatrix);
        token._waitingFilter = colorMatrix;
        
        // Añadir indicador de espera (tick)
        this._addStateIndicator(token, '✓', 0xFFFFFF);
        break;
    }
  }
  
  /**
   * Añade un indicador visual al token
   * @private
   */
  static _addStateIndicator(token, symbol, color) {
    const indicator = new PIXI.Text(symbol, {
      fontSize: 24,
      fill: color,
      fontWeight: 'bold'
    });
    
    indicator.anchor.set(0.5);
    indicator.x = token.w / 2;
    indicator.y = -10;
    
    token.addChild(indicator);
    token._stateIndicator = indicator;
  }
  
  /**
   * Marca un token como movido
   * @param {Token} token - El token
   */
  static async markAsMoved(token) {
    const currentState = this.getTokenState(token);
    
    if (currentState === this.STATES.READY) {
      await this.setTokenState(token, this.STATES.MOVED);
    } else if (currentState === this.STATES.ATTACKED) {
      await this.setTokenState(token, this.STATES.WAITING);
    }
  }
  
  /**
   * Marca un token como atacado
   * @param {Token} token - El token
   */
  static async markAsAttacked(token) {
    const currentState = this.getTokenState(token);
    
    if (currentState === this.STATES.READY) {
      await this.setTokenState(token, this.STATES.ATTACKED);
    } else if (currentState === this.STATES.MOVED) {
      await this.setTokenState(token, this.STATES.WAITING);
    }
  }
  
  /**
   * Marca un token como esperando (termina su turno)
   * @param {Token} token - El token
   */
  static async markAsWaiting(token) {
    await this.setTokenState(token, this.STATES.WAITING);
  }
  
  /**
   * Verifica si un token puede moverse
   * @param {Token} token - El token
   * @returns {boolean} True si puede moverse
   */
  static canMove(token) {
    const state = this.getTokenState(token);
    return state === this.STATES.READY || state === this.STATES.ATTACKED;
  }
  
  /**
   * Verifica si un token puede atacar
   * @param {Token} token - El token
   * @returns {boolean} True si puede atacar
   */
  static canAttack(token) {
    const state = this.getTokenState(token);
    return state === this.STATES.READY || state === this.STATES.MOVED;
  }
  
  /**
   * Resetea el estado de un token al inicio de su turno
   * @param {Token} token - El token
   */
  static async resetTokenState(token) {
    await this.setTokenState(token, this.STATES.READY);
  }
  
  /**
   * Resetea todos los tokens de un combatant
   * @param {Combat} combat - El combate
   */
  static async resetAllTokens(combat) {
    if (!combat) return;
    
    for (const combatant of combat.combatants) {
      const token = combatant.token?.object;
      if (token) {
        await this.resetTokenState(token);
      }
    }
  }
  
  /**
   * Handler cuando cambia el turno en combate
   * @param {Combat} combat - El combate
   * @param {Object} updateData - Datos de la actualización
   */
  static async onTurnChange(combat, updateData) {
    // Resetear el estado del combatiente actual
    const currentCombatant = combat.combatant;
    if (currentCombatant?.token?.object) {
      await this.resetTokenState(currentCombatant.token.object);
    }
  }
  
  /**
   * Handler cuando se mueve un token
   * @param {TokenDocument} document - El documento del token
   * @param {Object} change - Los cambios
   * @param {Object} options - Opciones
   */
  static async onTokenMoved(document, change, options) {
    // Solo procesar si cambió la posición
    if (!change.x && !change.y) return;
    
    const token = document.object;
    if (!token) return;
    
    // Marcar como movido
    await this.markAsMoved(token);
  }
  
  /**
   * Handler cuando se ejecuta un combate
   * @param {Object} combatData - Datos del combate
   */
  static async onCombatExecuted(combatData) {
    const { attacker } = combatData;
    
    // Marcar al atacante como atacado
    const attackerToken = canvas.tokens.placeables.find(t => t.actor?.id === attacker.id);
    if (attackerToken) {
      await this.markAsAttacked(attackerToken);
    }
  }
  
  /**
   * Añade botón de "Wait" al HUD del token
   * @param {TokenHUD} hud - El HUD
   * @param {jQuery} html - El HTML
   * @param {Object} data - Los datos
   */
  static addWaitButton(hud, html, data) {
    const token = canvas.tokens.get(data._id);
    const currentState = this.getTokenState(token);
    const isWaiting = currentState === this.STATES.WAITING;
    
    const waitButton = $(`
      <div class="control-icon wait ${isWaiting ? 'active' : ''}" title="${isWaiting ? 'Resume (W)' : 'Wait (W)'}">
        <i class="fas ${isWaiting ? 'fa-play' : 'fa-hourglass-half'}"></i>
      </div>
    `);
    
    waitButton.click(async () => {
      const token = canvas.tokens.get(data._id);
      if (token) {
        const state = this.getTokenState(token);
        if (state === this.STATES.WAITING) {
          // Si está esperando, quitarle el estado
          await this.resetTokenState(token);
          ui.notifications.info(`${token.name} is ready again!`);
        } else {
          // Si no está esperando, marcarlo como esperando
          await this.markAsWaiting(token);
        }
      }
    });
    
    // Soportar tanto HTMLElement como jQuery
    const $html = html instanceof jQuery ? html : $(html);
    const col = $html.find('.col.right');
    col.append(waitButton);
  }
}
