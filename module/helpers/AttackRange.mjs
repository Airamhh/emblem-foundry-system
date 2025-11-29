/**
 * Sistema de cálculo y visualización de rangos de ataque para Emblem
 */
export class AttackRange {
  
  /**
   * Debug helper - muestra info de todos los tokens en escena
   */
  static debugTokens() {
    console.log('=== DEBUG: ALL TOKENS ===');
    const tokens = canvas.tokens.placeables;
    console.log(`Total tokens: ${tokens.length}`);
    
    for (const token of tokens) {
      console.log(`\n${token.name}:`);
      console.log(`  ID: ${token.id}`);
      console.log(`  Disposition: ${token.document.disposition} (${this._getDispositionName(token.document.disposition)})`);
      console.log(`  Position: ${token.document.x}, ${token.document.y}`);
      console.log(`  Grid: ${JSON.stringify(canvas.grid.getOffset({ x: token.document.x, y: token.document.y }))}`);
      
      if (token.actor) {
        const weapon = this.getEquippedWeapon(token.actor);
        if (weapon) {
          console.log(`  Weapon: ${weapon.name}`);
          console.log(`    Range: ${weapon.system.minRange || 1} - ${weapon.system.maxRange || 1}`);
          console.log(`    Equipped: ${weapon.system.equipped}`);
        } else {
          console.log(`  No weapon equipped`);
        }
      }
    }
  }
  
  /**
   * Helper para obtener nombre de disposition
   */
  static _getDispositionName(disp) {
    if (disp === CONST.TOKEN_DISPOSITIONS.FRIENDLY) return 'FRIENDLY';
    if (disp === CONST.TOKEN_DISPOSITIONS.HOSTILE) return 'HOSTILE';
    if (disp === CONST.TOKEN_DISPOSITIONS.NEUTRAL) return 'NEUTRAL';
    return 'UNKNOWN';
  }
  
  /**
   * Obtiene el arma equipada de un actor
   * @param {Actor} actor - El actor
   * @returns {Item|null} El arma equipada o null
   */
  static getEquippedWeapon(actor) {
    if (!actor) return null;
    
    const weapons = actor.items.filter(item => 
      item.type === 'weapon' && item.system.equipped === true
    );
    
    return weapons.length > 0 ? weapons[0] : null;
  }
  
  /**
   * Calcula las casillas desde las que se puede atacar
   * @param {Token} token - El token atacante
   * @returns {Set<string>} Set de coordenadas "x,y" desde donde puede atacar
   */
  static calculateAttackableTiles(token) {
    if (!token.actor) return new Set();
    
    const weapon = this.getEquippedWeapon(token.actor);
    if (!weapon) return new Set();
    
    // Parsear rango del arma (e.g., "1", "1-2", "2-3")
    const weaponRange = weapon.system.range || '1';
    const [minRange, maxRange] = weaponRange.includes('-') 
      ? weaponRange.split('-').map(Number)
      : [parseInt(weaponRange), parseInt(weaponRange)];
    
    const attackable = new Set();
    const tokenPos = canvas.grid.getOffset({ x: token.document.x, y: token.document.y });
    
    // Calcular todas las casillas en el rango del arma
    for (let di = -maxRange; di <= maxRange; di++) {
      for (let dj = -maxRange; dj <= maxRange; dj++) {
        const distance = Math.abs(di) + Math.abs(dj); // Distancia Manhattan
        
        if (distance >= minRange && distance <= maxRange) {
          const targetPos = { i: tokenPos.i + di, j: tokenPos.j + dj };
          attackable.add(`${targetPos.i},${targetPos.j}`);
        }
      }
    }
    
    return attackable;
  }
  
  /**
   * Obtiene todos los enemigos en rango de ataque
   * @param {Token} token - El token atacante
   * @returns {Token[]} Array de tokens enemigos en rango
   */
  static getEnemiesInRange(token) {
    console.log('=== GET ENEMIES IN RANGE ===');
    console.log('Attacker:', token.name, 'Disposition:', token.document.disposition);
    
    if (!token.actor) {
      console.log('No actor found');
      return [];
    }
    
    const weapon = this.getEquippedWeapon(token.actor);
    if (!weapon) {
      console.log('No weapon equipped');
      return [];
    }
    
    // Parsear rango del arma (e.g., "1", "1-2", "2-3")
    const weaponRange = weapon.system.range || '1';
    const [minRange, maxRange] = weaponRange.includes('-') 
      ? weaponRange.split('-').map(Number)
      : [parseInt(weaponRange), parseInt(weaponRange)];
    
    console.log('Weapon:', weapon.name, 'Range:', weaponRange, 'Parsed:', minRange, '-', maxRange);
    
    const tokenPos = canvas.grid.getOffset({ x: token.document.x, y: token.document.y });
    console.log('Token position:', tokenPos);
    
    const enemies = [];
    const allTokens = canvas.tokens.placeables;
    console.log(`Checking ${allTokens.length} tokens on canvas`);
    
    for (const otherToken of allTokens) {
      if (otherToken.id === token.id) continue;
      
      console.log(`Checking token: ${otherToken.name}, Disposition: ${otherToken.document.disposition}`);
      
      // Verificar si es enemigo
      const isEnemy = this._isEnemy(token, otherToken);
      console.log(`  Is enemy? ${isEnemy}`);
      
      if (!isEnemy) continue;
      
      // Calcular distancia Manhattan
      const otherPos = canvas.grid.getOffset({ 
        x: otherToken.document.x, 
        y: otherToken.document.y 
      });
      
      const distance = Math.abs(tokenPos.i - otherPos.i) + Math.abs(tokenPos.j - otherPos.j);
      console.log(`  Position: ${otherPos.i},${otherPos.j}, Distance: ${distance}, Range: ${minRange}-${maxRange}`);
      
      // Verificar si está en rango
      if (distance >= minRange && distance <= maxRange) {
        enemies.push(otherToken);
        console.log(`  ✓ Enemy in range: ${otherToken.name} at distance ${distance}`);
      } else {
        console.log(`  ✗ Out of range`);
      }
    }
    
    console.log(`Total enemies in range: ${enemies.length}`);
    return enemies;
  }
  
  /**
   * Verifica si dos tokens son enemigos
   * @private
   */
  static _isEnemy(token1, token2) {
    // En Emblem, típicamente:
    // - Player tokens (FRIENDLY = 1) vs Enemy tokens (HOSTILE = -1)
    const disp1 = token1.document.disposition;
    const disp2 = token2.document.disposition;
    
    console.log(`Checking if enemies: ${token1.name} (${disp1}) vs ${token2.name} (${disp2})`);
    console.log(`CONST values: FRIENDLY=${CONST.TOKEN_DISPOSITIONS.FRIENDLY}, HOSTILE=${CONST.TOKEN_DISPOSITIONS.HOSTILE}, NEUTRAL=${CONST.TOKEN_DISPOSITIONS.NEUTRAL}`);
    
    // FRIENDLY (1) es enemigo de HOSTILE (-1)
    // NEUTRAL (0) puede ser considerado enemigo de ambos
    const result = (disp1 === CONST.TOKEN_DISPOSITIONS.FRIENDLY && disp2 === CONST.TOKEN_DISPOSITIONS.HOSTILE) ||
           (disp1 === CONST.TOKEN_DISPOSITIONS.HOSTILE && disp2 === CONST.TOKEN_DISPOSITIONS.FRIENDLY);
    
    console.log(`Result: ${result}`);;
    return result;
  }
  
  /**
   * Muestra el rango de ataque en el grid
   * @param {Token} token - El token
   * @param {string} layerName - Nombre de la capa de highlight
   */
  static highlightAttackRange(token, layerName = "attack") {
    console.log('=== HIGHLIGHTING ATTACK RANGE ===');
    console.log('Token:', token.name);
    console.log('Token position:', { x: token.document.x, y: token.document.y });
    
    const weapon = this.getEquippedWeapon(token.actor);
    if (weapon) {
      const weaponRange = weapon.system.range || '1';
      console.log('Weapon:', weapon.name, 'Range:', weaponRange);
    }
    
    const attackableTiles = this.calculateAttackableTiles(token);
    console.log(`Total attackable tiles: ${attackableTiles.size}`);
    
    // Limpiar highlight anterior
    canvas.interface.grid.clearHighlightLayer(layerName);
    
    // Crear nueva capa si no existe
    if (!canvas.interface.grid.highlightLayers[layerName]) {
      canvas.interface.grid.addHighlightLayer(layerName);
    }
    
    // Highlight cada casilla atacable
    let highlightedCount = 0;
    for (const tileKey of attackableTiles) {
      const [i, j] = tileKey.split(',').map(Number);
      const point = canvas.grid.getTopLeftPoint({ i, j });
      
      canvas.interface.grid.highlightPosition(layerName, {
        x: point.x,
        y: point.y,
        color: 0xFF0000, // Rojo para ataque
        alpha: 0.3,
        border: 0xCC0000
      });
      highlightedCount++;
    }
    console.log(`Successfully highlighted ${highlightedCount} attack tiles`);
  }
  
  /**
   * Muestra el rango combinado de movimiento + ataque
   * @param {Token} token - El token
   */
  static highlightMovementAndAttackRange(token) {
    if (!token.actor) return;
    if (!token.actor.system?.stats?.mov) return;
    
    const weapon = this.getEquippedWeapon(token.actor);
    if (!weapon) return;
    
    const movementPoints = token.actor.system.stats.mov.value || token.actor.system.stats.mov;
    const weaponRange = weapon.system.maxRange || 1;
    const totalRange = movementPoints + weaponRange;
    
    const layerName = "movementAttack";
    canvas.interface.grid.clearHighlightLayer(layerName);
    
    if (!canvas.interface.grid.highlightLayers[layerName]) {
      canvas.interface.grid.addHighlightLayer(layerName);
    }
    
    // Calcular casillas alcanzables después de moverse
    const tokenPos = canvas.grid.getOffset({ x: token.document.x, y: token.document.y });
    
    for (let di = -totalRange; di <= totalRange; di++) {
      for (let dj = -totalRange; dj <= totalRange; dj++) {
        const distance = Math.abs(di) + Math.abs(dj);
        
        if (distance > 0 && distance <= totalRange) {
          const targetPos = { i: tokenPos.i + di, j: tokenPos.j + dj };
          const point = canvas.grid.getTopLeftPoint(targetPos);
          
          canvas.interface.grid.highlightPosition(layerName, {
            x: point.x,
            y: point.y,
            color: 0xFF8000, // Naranja para rango total
            alpha: 0.2,
            border: 0xCC6600
          });
        }
      }
    }
  }
  
  /**
   * Limpia el highlight de ataque
   * @param {string} layerName - Nombre de la capa
   */
  static clearAttackRange(layerName = "attack") {
    if (canvas.interface.grid.highlightLayers[layerName]) {
      canvas.interface.grid.clearHighlightLayer(layerName);
    }
  }
}
