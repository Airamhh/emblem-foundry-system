/**
 * Sistema de cálculo y visualización de rangos de movimiento para Emblem
 */
export class MovementRange {
  
  /**
   * Calcula las casillas alcanzables por un token basado en su movimiento
   * @param {Token} token - El token que se mueve
   * @param {number} movementPoints - Puntos de movimiento disponibles
   * @returns {Set<string>} Set de coordenadas "x,y" alcanzables
   */
  static calculateReachableTiles(token, movementPoints) {
    if (!canvas.grid || !token) return new Set();
    
    const reachable = new Set();
    const startPos = { x: token.document.x, y: token.document.y };
    const startGridPos = canvas.grid.getOffset(startPos);
    
    // BFS para encontrar todas las casillas alcanzables
    const queue = [{ pos: startGridPos, distance: 0 }];
    const visited = new Set([`${startGridPos.i},${startGridPos.j}`]);
    
    while (queue.length > 0) {
      const { pos, distance } = queue.shift();
      
      if (distance <= movementPoints) {
        reachable.add(`${pos.i},${pos.j}`);
        
        // Explorar vecinos (arriba, abajo, izquierda, derecha)
        const neighbors = this._getNeighbors(pos);
        
        for (const neighbor of neighbors) {
          const key = `${neighbor.i},${neighbor.j}`;
          if (!visited.has(key)) {
            visited.add(key);
            
            // Verificar si la casilla es válida (no colisiona)
            const neighborPixel = canvas.grid.getTopLeftPoint(neighbor);
            const canMove = !this._checkCollision(token, neighborPixel);
            
            if (canMove) {
              queue.push({ pos: neighbor, distance: distance + 1 });
            }
          }
        }
      }
    }
    
    return reachable;
  }
  
  /**
   * Obtiene los vecinos de una posición de grid
   * @private
   */
  static _getNeighbors(pos) {
    return [
      { i: pos.i, j: pos.j - 1 }, // Arriba
      { i: pos.i, j: pos.j + 1 }, // Abajo
      { i: pos.i - 1, j: pos.j }, // Izquierda
      { i: pos.i + 1, j: pos.j }  // Derecha
    ];
  }
  
  /**
   * Verifica si hay colisión en una posición
   * @private
   */
  static _checkCollision(token, destination) {
    // Verificar si hay otro token en esa posición
    const tokens = canvas.tokens.placeables;
    for (const other of tokens) {
      if (other.id === token.id) continue;
      
      const dx = Math.abs(other.document.x - destination.x);
      const dy = Math.abs(other.document.y - destination.y);
      
      if (dx < canvas.grid.size && dy < canvas.grid.size) {
        return true; // Hay colisión
      }
    }
    
    // Verificar paredes
    const collision = token.checkCollision(destination);
    return collision;
  }
  
  /**
   * Muestra el rango de movimiento en el grid
   * @param {Token} token - El token
   * @param {string} layerName - Nombre de la capa de highlight
   */
  static highlightMovementRange(token, layerName = "movement") {
    if (!token.actor) {
      console.warn("Token has no actor");
      return;
    }
    if (!token.actor.system?.stats?.mov) {
      console.warn("Actor has no movement stat");
      return;
    }
    
    const movementPoints = token.actor.system.stats.mov.value || token.actor.system.stats.mov;
    console.log(`Highlighting movement range: ${movementPoints} tiles for ${token.name}`);
    
    const reachableTiles = this.calculateReachableTiles(token, movementPoints);
    console.log(`Reachable tiles: ${reachableTiles.size}`);
    
    // Limpiar highlight anterior
    canvas.interface.grid.clearHighlightLayer(layerName);
    
    // Crear nueva capa si no existe
    if (!canvas.interface.grid.highlightLayers[layerName]) {
      canvas.interface.grid.addHighlightLayer(layerName);
    }
    
    // Highlight cada casilla alcanzable
    let highlightedCount = 0;
    
    for (const tileKey of reachableTiles) {
      const [i, j] = tileKey.split(',').map(Number);
      const point = canvas.grid.getTopLeftPoint({ i, j });
      
      // Usar el método correcto para Foundry v13
      canvas.interface.grid.highlightPosition(layerName, {
        x: point.x,
        y: point.y,
        color: 0x0080FF, // Azul para movimiento
        alpha: 0.3
      });
      highlightedCount++;
    }
    console.log(`Highlighted ${highlightedCount} blue tiles on layer ${layerName}`);
  }
  
  /**
   * Limpia el highlight de movimiento
   * @param {string} layerName - Nombre de la capa
   */
  static clearMovementRange(layerName = "movement") {
    if (canvas.interface.grid.highlightLayers[layerName]) {
      canvas.interface.grid.clearHighlightLayer(layerName);
    }
  }
}
