/**
 * Sistema de gestión automática de durabilidad de armas para Emblem
 */

export class DurabilitySystem {
  
  /**
   * Inicializa el sistema de durabilidad
   */
  static initialize() {
    // Hook después de que se ejecute un combate
    Hooks.on('EMBLEM.combatExecuted', this.onCombatExecuted.bind(this));
  }
  
  /**
   * Consume usos de un arma
   * @param {Actor} actor - El actor que usa el arma
   * @param {Item} weapon - El arma a consumir
   * @param {number} usesConsumed - Número de usos consumidos (default 1)
   * @returns {Promise<boolean>} True si el arma se consumió correctamente
   */
  static async consumeWeaponUse(actor, weapon, usesConsumed = 1) {
    if (!weapon || weapon.type !== 'weapon') return false;
    
    const currentUses = weapon.system.uses;
    const maxUses = weapon.system.usesMax;
    
    // Si el arma tiene usos infinitos
    if (maxUses === 0) return true;
    
    const newUses = Math.max(0, currentUses - usesConsumed);
    
    // Actualizar usos del arma
    await weapon.update({ 'system.uses': newUses });
    
    // Notificar al usuario
    const message = `${weapon.name} uses: ${newUses}/${maxUses}`;
    ui.notifications.info(message);
    
    // Si el arma se rompió
    if (newUses === 0) {
      this.onWeaponBroken(actor, weapon);
    }
    
    return true;
  }
  
  /**
   * Cuando un arma se rompe
   * @param {Actor} actor - El actor dueño del arma
   * @param {Item} weapon - El arma rota
   */
  static async onWeaponBroken(actor, weapon) {
    // Notificación especial
    ui.notifications.warn(`${weapon.name} is broken!`);
    
    // Mensaje en el chat
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="emblem weapon-broken">
        <h3><i class="fas fa-exclamation-triangle"></i> Weapon Broken!</h3>
        <p><strong>${weapon.name}</strong> has broken and can no longer be used.</p>
      </div>`,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    
    // Desequipar el arma automáticamente
    await weapon.update({ 'system.equipped': false });
    
    // Opcional: eliminar el arma del inventario
    // await weapon.delete();
  }
  
  /**
   * Restaura usos de un arma (para items como Vulneraries)
   * @param {Actor} actor - El actor
   * @param {Item} weapon - El arma a reparar
   * @param {number} usesRestored - Usos a restaurar
   */
  static async repairWeapon(actor, weapon, usesRestored) {
    if (!weapon || weapon.type !== 'weapon') return false;
    
    const currentUses = weapon.system.uses;
    const maxUses = weapon.system.usesMax;
    
    const newUses = Math.min(maxUses, currentUses + usesRestored);
    
    await weapon.update({ 'system.uses': newUses });
    
    ui.notifications.info(`${weapon.name} repaired! Uses: ${newUses}/${maxUses}`);
    
    return true;
  }
  
  /**
   * Handler cuando se ejecuta un combate
   * @param {Object} combatData - Datos del combate
   */
  static async onCombatExecuted(combatData) {
    const { attacker, defender, attackerWeapon, defenderWeapon, results } = combatData;
    
    // Consumir uso del arma del atacante
    if (attackerWeapon) {
      let attackerUses = 1;
      // Si el atacante hizo doble ataque, consume 2 usos
      if (results.attackerDoubled) {
        attackerUses = 2;
      }
      await this.consumeWeaponUse(attacker, attackerWeapon, attackerUses);
    }
    
    // Consumir uso del arma del defensor (si contraatacó)
    if (defenderWeapon && results.defenderCountered) {
      let defenderUses = 1;
      // Si el defensor hizo doble ataque en el contraataque
      if (results.defenderDoubled) {
        defenderUses = 2;
      }
      await this.consumeWeaponUse(defender, defenderWeapon, defenderUses);
    }
  }
  
  /**
   * Verifica si un arma puede ser usada
   * @param {Item} weapon - El arma a verificar
   * @returns {boolean} True si el arma tiene usos disponibles
   */
  static canUseWeapon(weapon) {
    if (!weapon || weapon.type !== 'weapon') return false;
    
    // Usos infinitos
    if (weapon.system.usesMax === 0) return true;
    
    // Tiene usos disponibles
    return weapon.system.uses > 0;
  }
  
  /**
   * Obtiene todas las armas usables de un actor
   * @param {Actor} actor - El actor
   * @returns {Item[]} Array de armas usables
   */
  static getUsableWeapons(actor) {
    if (!actor) return [];
    
    return actor.items.filter(item => 
      item.type === 'weapon' && this.canUseWeapon(item)
    );
  }
}
