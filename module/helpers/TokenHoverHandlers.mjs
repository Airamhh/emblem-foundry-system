/**
 * Extensiones para Token que añaden comportamientos de hover para Emblem
 */

import { MovementRange } from './MovementRange.mjs';
import { AttackRange } from './AttackRange.mjs';

export class TokenHoverHandlers {
  
  /**
   * Inicializa los event handlers para tokens
   */
  static initialize() {
    console.log('TokenHoverHandlers initialized');
    
    // Escuchar eventos de control de token
    Hooks.on('controlToken', (token, controlled) => {
      console.log('controlToken hook fired:', token.name, 'controlled:', controlled);
      if (controlled) {
        this.onTokenSelected(token);
      } else {
        this.onTokenDeselected(token);
      }
    });
    
    // Eventos de hover
    Hooks.on('hoverToken', (token, hovered) => {
      if (hovered) {
        this.onTokenHoverIn(token);
      } else {
        this.onTokenHoverOut(token);
      }
    });
  }
  
  /**
   * Cuando el mouse entra sobre un token
   * @param {Token} token - El token
   */
  static onTokenHoverIn(token) {
    if (!token.actor) return;
    if (!token.actor.system?.stats) return;
    
    // Siempre mostrar el rango de ataque en hover para cualquier token
    console.log('Hover in:', token.name);
    AttackRange.highlightAttackRange(token, "hoverAttackRange");
  }
  
  /**
   * Cuando el mouse sale de un token
   * @param {Token} token - El token
   */
  static onTokenHoverOut(token) {
    // Limpiar highlight de ataque en hover
    console.log('Hover out:', token.name);
    AttackRange.clearAttackRange("hoverAttackRange");
  }
  
  /**
   * Cuando se selecciona un token
   * @param {Token} token - El token seleccionado
   */
  static onTokenSelected(token) {
    console.log('=== TOKEN SELECTED ===');
    console.log('Token:', token.name);
    console.log('Token ID:', token.id);
    console.log('Has actor?', !!token.actor);
    
    if (!token.actor) {
      console.warn("Token has no actor");
      return;
    }
    
    console.log('Actor system:', token.actor.system);
    console.log('Has stats?', !!token.actor.system?.stats);
    
    if (!token.actor.system?.stats) {
      console.warn("Actor has no stats");
      return;
    }
    
    console.log('Movement stat:', token.actor.system.stats.mov);
    
    // Mostrar solo rango de movimiento (azul) mientras está seleccionado
    console.log("✓ Calling highlightMovementRange...");
    MovementRange.highlightMovementRange(token, "selectedMovement");
    
    console.log("=== FINISHED HIGHLIGHTING ===");
  }
  
  /**
   * Cuando se deselecciona un token
   * @param {Token} token - El token deseleccionado
   */
  static onTokenDeselected(token) {
    // Limpiar highlight de movimiento
    MovementRange.clearMovementRange("selectedMovement");
  }
}
