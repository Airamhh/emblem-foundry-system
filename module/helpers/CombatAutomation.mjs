/**
 * Sistema de automatización de combate para Emblem
 * Gestiona la ejecución automática de combates con selección de objetivos
 */

import { AttackRange } from './AttackRange.mjs';
import { CombatPreviewApp } from '../applications/CombatPreviewApp.mjs';

export class CombatAutomation {
  
  static _attackMode = false;
  static _attackingToken = null;
  
  /**
   * Inicializa el sistema de automatización de combate
   */
  static initialize() {
    console.log('CombatAutomation initialized');
    
    // Hook para cuando se hace target (T) a un token
    Hooks.on('targetToken', (user, token, targeted) => {
      console.log('targetToken hook:', token.name, 'targeted:', targeted);
      
      if (!targeted) return;
      
      // Si hay un token controlado, verificar rango y abrir preview
      const controlled = canvas.tokens.controlled;
      console.log('Controlled tokens:', controlled.length);
      
      if (controlled.length === 1) {
        const attacker = controlled[0];
        const defender = token;
        
        console.log('Attacker:', attacker.name, 'Defender:', defender.name);
        
        // Verificar que ambos tengan actor
        if (!attacker.actor || !defender.actor) {
          console.log('✗ Missing actors:', attacker.actor, defender.actor);
          ui.notifications.warn('One or both tokens have no actor');
          defender.setTarget(false, { releaseOthers: true, groupSelection: false });
          return;
        }
        
        // Verificar que el atacante tenga un arma equipada
        const attackerWeapon = attacker.actor.items.find(i => i.type === 'weapon' && i.system.equipped);
        if (!attackerWeapon) {
          console.log('✗ Attacker has no weapon equipped');
          ui.notifications.warn(`${attacker.name} has no weapon equipped`);
          defender.setTarget(false, { releaseOthers: true, groupSelection: false });
          return;
        }
        
        console.log('Attacker weapon:', attackerWeapon.name, 'Range:', attackerWeapon.system.range);
        
        // Calcular distancia entre tokens (Manhattan distance)
        const attackerPos = canvas.grid.getOffset({ x: attacker.document.x, y: attacker.document.y });
        const defenderPos = canvas.grid.getOffset({ x: defender.document.x, y: defender.document.y });
        const distance = Math.abs(attackerPos.i - defenderPos.i) + Math.abs(attackerPos.j - defenderPos.j);
        
        console.log('Distance:', distance);
        console.log('Attacker position:', attackerPos);
        console.log('Defender position:', defenderPos);
        
        // Parsear rango del arma
        const weaponRange = attackerWeapon.system.range || '1';
        const [minRange, maxRange] = weaponRange.includes('-') 
          ? weaponRange.split('-').map(Number)
          : [parseInt(weaponRange), parseInt(weaponRange)];
        
        console.log('Weapon range:', minRange, '-', maxRange);
        
        // Verificar si el defensor está en rango
        if (distance < minRange || distance > maxRange) {
          console.log('✗ Target out of range');
          ui.notifications.warn(`${defender.name} is out of range (distance: ${distance}, weapon range: ${minRange}-${maxRange})`);
          defender.setTarget(false, { releaseOthers: true, groupSelection: false });
          return;
        }
        
        console.log('✓ Target in range, opening preview');
        CombatPreviewApp.show(attacker, defender);
        
        // Limpiar el target
        setTimeout(() => {
          defender.setTarget(false, { releaseOthers: true, groupSelection: false });
        }, 100);
      }
    });
    
    // Interceptar clicks en el canvas cuando está en modo ataque
    const originalOnClickLeft = Token.prototype._onClickLeft;
    Token.prototype._onClickLeft = function(event) {
      // Si estamos en modo ataque
      if (CombatAutomation._attackMode && CombatAutomation._attackingToken) {
        // Si hacen click en otro token que no sea el atacante
        if (this.id !== CombatAutomation._attackingToken.id) {
          console.log('Token left-clicked in attack mode:', this.name);
          CombatAutomation.onTargetSelected(this);
          return; // No ejecutar el click normal (no seleccionar)
        }
      }
      // Si no estamos en modo ataque, comportamiento normal
      return originalOnClickLeft.call(this, event);
    };
    
    // Listener para teclas
    document.addEventListener('keydown', this._onKeyDown.bind(this));
  }
  
  /**
   * Handler para teclas
   * @private
   */
  static _onKeyDown(event) {
    // Tecla 'X' para entrar en modo ataque
    if (event.key === 'x' || event.key === 'X') {
      const controlled = canvas.tokens.controlled;
      if (controlled.length === 1) {
        this.enterAttackMode(controlled[0]);
      }
    }
    
    // ESC para cancelar modo ataque
    if (event.key === 'Escape' && this._attackMode) {
      this.cancelAttackMode();
    }
  }
  
  /**
   * Entra en modo de ataque
   * @param {Token} token - El token que va a atacar
   */
  static enterAttackMode(token) {
    if (!token.actor) return;
    
    // Verificar que tiene un arma equipada
    const weapon = AttackRange.getEquippedWeapon(token.actor);
    if (!weapon) {
      ui.notifications.warn("No weapon equipped!");
      return;
    }
    
    // Verificar si ya hay un enemigo targeteado
    const targetedTokens = Array.from(game.user.targets);
    const enemyTarget = targetedTokens.find(t => 
      t.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE
    );
    
    if (enemyTarget) {
      // Si hay un enemigo targeteado, verificar si está en rango
      const enemies = AttackRange.getEnemiesInRange(token);
      const isInRange = enemies.some(e => e.id === enemyTarget.id);
      
      if (isInRange) {
        console.log(`Direct attack on targeted enemy: ${enemyTarget.name}`);
        CombatPreviewApp.show(token, enemyTarget);
        return;
      } else {
        ui.notifications.warn(`${enemyTarget.name} is out of attack range!`);
        return;
      }
    }
    
    // Si no hay target, entrar en modo ataque normal
    this._attackMode = true;
    this._attackingToken = token;
    
    // Mostrar rango de ataque
    AttackRange.highlightAttackRange(token, "attackMode");
    
    // Obtener enemigos en rango
    const enemies = AttackRange.getEnemiesInRange(token);
    
    if (enemies.length === 0) {
      ui.notifications.warn("No enemies in attack range!");
      this.cancelAttackMode();
      return;
    }
    
    // Resaltar enemigos alcanzables con círculos rojos
    for (const enemy of enemies) {
      const indicator = new PIXI.Graphics();
      indicator.lineStyle(3, 0xFF0000, 1);
      indicator.drawCircle(enemy.w / 2, enemy.h / 2, enemy.w / 2 + 5);
      enemy.addChild(indicator);
      enemy._attackIndicator = indicator;
    }
    
    ui.notifications.info(`Attack Mode: Click on a target to attack (ESC to cancel)`);
  }
  
  /**
   * Cancela el modo de ataque
   */
  static cancelAttackMode() {
    if (!this._attackMode) return;
    
    this._attackMode = false;
    
    // Limpiar highlights
    AttackRange.clearAttackRange("attackMode");
    
    // Limpiar indicadores de enemigos de TODOS los tokens
    const enemies = canvas.tokens.placeables.filter(t => 
      t.document.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE
    );
    for (const enemy of enemies) {
      if (enemy._attackIndicator) {
        enemy.removeChild(enemy._attackIndicator);
        enemy._attackIndicator = null;
      }
    }
    
    this._attackingToken = null;
    ui.notifications.info("Attack cancelled");
  }
  
  /**
   * Cuando se selecciona un objetivo
   * @param {Token} target - El token objetivo
   */
  static async onTargetSelected(target) {
    if (!this._attackMode || !this._attackingToken) return;
    
    // Guardar referencia antes de cancelar
    const attacker = this._attackingToken;
    
    // Salir del modo ataque primero
    this.cancelAttackMode();
    
    // Mostrar ventana de preview (sin verificar nada)
    console.log('Showing combat preview:', { attacker: attacker.name, target: target.name });
    CombatPreviewApp.show(attacker, target);
  }
  

}
