/**
 * Combat Calculator Helper
 * Handles all combat calculations including weapon triangle
 */

export class CombatCalculator {

  /**
   * Check if attacker has priority skills (e.g., Desperation, Vantage)
   * @param {Actor} actor - Actor to check
   * @returns {object} Combat-affecting skills
   */
  static checkCombatSkills(actor) {
    const skills = {
      // Orden de ataque
      hasDesperation: false,    // Ataca dos veces seguidas si puede hacer double
      hasVantage: false,        // Contraataca primero
      
      // Follow-ups (double attacks)
      hasQuickRiposte: false,   // Siempre hace follow-up al defender (contraataque doble)
      hasBraveWeapon: false,    // Arma que ataca 2 veces (cada ataque cuenta como uno)
      
      // Prevención
      preventsCounterattack: false, // Enemigo no puede contraatacar (ej: Windsweep)
      preventsFollowup: false,      // Enemigo no puede hacer follow-up
      
      // Garantía
      guaranteedFollowup: false     // Siempre hace follow-up sin importar velocidad
    };

    // Buscar skills en el actor
    const actorSkills = actor.items.filter(i => i.type === 'skill');
    for (const skill of actorSkills) {
      const skillName = skill.name.toLowerCase();
      if (skillName.includes('desperation')) skills.hasDesperation = true;
      if (skillName.includes('vantage') || skillName.includes('ventaja')) skills.hasVantage = true;
      if (skillName.includes('quick riposte') || skillName.includes('contracorta')) skills.hasQuickRiposte = true;
      if (skillName.includes('windsweep') || skillName.includes('sin contraataque')) skills.preventsCounterattack = true;
    }
    
    // Buscar arma equipada para efectos especiales
    const weapon = actor.items.find(i => i.type === 'weapon' && i.system.equipped);
    if (weapon) {
      const weaponName = weapon.name.toLowerCase();
      // Brave weapons (Valor, Brave Sword, etc.)
      if (weaponName.includes('brave') || weaponName.includes('valor')) {
        skills.hasBraveWeapon = true;
      }
    }

    return skills;
  }

  /**
   * Calculate weapon triangle advantage
   * Physical: sword > axe > lance > sword
   * Magic Level 1: light > dark > anima > light
   * Magic Level 2 (Anima): thunder > fire > wind > thunder
   * @param {string} attackerType - Weapon/magic type of attacker
   * @param {string} defenderType - Weapon/magic type of defender
   * @returns {object} {advantage: number, hitMod: number, damageMod: number}
   */
  static getWeaponTriangleAdvantage(attackerType, defenderType) {
    // Physical weapon triangle
    const physicalTriangle = {
      'sword': { beats: 'axe', losesTo: 'lance' },
      'lance': { beats: 'sword', losesTo: 'axe' },
      'axe': { beats: 'lance', losesTo: 'sword' }
    };

    // Magic triangle level 1 (main)
    const magicTriangle = {
      'light': { beats: 'dark', losesTo: 'anima' },
      'dark': { beats: 'anima', losesTo: 'light' },
      'anima': { beats: 'light', losesTo: 'dark' }
    };

    // Magic triangle level 2 (anima subtypes)
    const animaTriangle = {
      'thunder': { beats: 'fire', losesTo: 'wind' },
      'fire': { beats: 'wind', losesTo: 'thunder' },
      'wind': { beats: 'thunder', losesTo: 'fire' }
    };

    // Check physical triangle
    if (physicalTriangle[attackerType] && physicalTriangle[defenderType]) {
      if (physicalTriangle[attackerType].beats === defenderType) {
        return { advantage: 1, hitMod: 15, damageMod: 1 };
      }
      if (physicalTriangle[attackerType].losesTo === defenderType) {
        return { advantage: -1, hitMod: -15, damageMod: -1 };
      }
      return { advantage: 0, hitMod: 0, damageMod: 0 };
    }

    // Normalize anima subtypes to "anima" for level 1 comparison
    const normalizedAttacker = ['fire', 'thunder', 'wind'].includes(attackerType) ? 'anima' : attackerType;
    const normalizedDefender = ['fire', 'thunder', 'wind'].includes(defenderType) ? 'anima' : defenderType;

    // Check magic triangle level 1 (light/dark vs anima)
    if (magicTriangle[normalizedAttacker] && magicTriangle[normalizedDefender]) {
      // If both are anima subtypes, check level 2 triangle
      if (normalizedAttacker === 'anima' && normalizedDefender === 'anima' &&
          animaTriangle[attackerType] && animaTriangle[defenderType]) {
        if (animaTriangle[attackerType].beats === defenderType) {
          return { advantage: 1, hitMod: 10, damageMod: 1 };
        }
        if (animaTriangle[attackerType].losesTo === defenderType) {
          return { advantage: -1, hitMod: -10, damageMod: -1 };
        }
        return { advantage: 0, hitMod: 0, damageMod: 0 };
      }

      // Level 1 magic triangle
      if (magicTriangle[normalizedAttacker].beats === normalizedDefender) {
        return { advantage: 1, hitMod: 15, damageMod: 1 };
      }
      if (magicTriangle[normalizedAttacker].losesTo === normalizedDefender) {
        return { advantage: -1, hitMod: -15, damageMod: -1 };
      }
      return { advantage: 0, hitMod: 0, damageMod: 0 };
    }

    // No triangle advantage (physical vs magic, or invalid types)
    return { advantage: 0, hitMod: 0, damageMod: 0 };
  }

  /**
   * Calculate hit chance
   * @param {Actor} attacker - Attacking actor
   * @param {Actor} defender - Defending actor
   * @param {Item} weapon - Weapon being used (optional)
   * @returns {number} Hit chance (0-100+)
   */
  static calculateHitChance(attacker, defender, weapon = null) {
    const attackerSystem = attacker.system;
    const defenderSystem = defender.system;

    // Base hit rate
    let hitRate = attackerSystem.derived.hit || 0;

    // Get weapon triangle modifier
    if (weapon) {
      const attackerWeapon = weapon.system.weaponType;
      const defenderWeapon = defender.items.find(i => i.type === 'weapon' && i.system.equipped);
      
      if (defenderWeapon) {
        const triangle = this.getWeaponTriangleAdvantage(attackerWeapon, defenderWeapon.system.weaponType);
        hitRate += triangle.hitMod;
      }
    }

    // Subtract defender avoid
    const avoid = defenderSystem.derived.avoid || 0;
    const finalHit = hitRate - avoid;

    return Math.max(0, Math.min(100, finalHit));
  }

  /**
   * Calculate damage
   * @param {Actor} attacker - Attacking actor
   * @param {Actor} defender - Defending actor
   * @param {Item} weapon - Weapon being used
   * @param {boolean} isCrit - Whether this is a critical hit
   * @returns {number} Damage dealt
   */
  static calculateDamage(attacker, defender, weapon, isCrit = false) {
    const attackerSystem = attacker.system;
    const defenderSystem = defender.system;
    const weaponSystem = weapon.system;

    // Determine if physical or magical
    const isMagical = ['tome', 'staff'].includes(weaponSystem.weaponType);
    
    // Base attack stat
    const attackStat = isMagical ? attackerSystem.stats.mag.value : attackerSystem.stats.str.value;
    
    // Base damage
    let damage = attackStat + weaponSystem.might;

    // Apply weapon triangle
    const defenderWeapon = defender.items.find(i => i.type === 'weapon' && i.system.equipped);
    if (defenderWeapon) {
      const triangle = this.getWeaponTriangleAdvantage(weaponSystem.weaponType, defenderWeapon.system.weaponType);
      damage += triangle.damageMod;
    }

    // Check for effectiveness
    if (weaponSystem.effective && weaponSystem.effective.length > 0) {
      const defenderClass = defender.items.find(i => i.type === 'class');
      if (defenderClass) {
        const classType = defenderClass.system.classType;
        if (weaponSystem.effective.includes(classType)) {
          damage = Math.floor(damage * 3); // Triple damage for effectiveness
        }
      }
    }

    // Subtract defense/resistance
    const defense = isMagical ? defenderSystem.stats.res.value : defenderSystem.stats.def.value;
    damage = Math.max(0, damage - defense);

    // Apply critical (x3 damage)
    if (isCrit) {
      damage = Math.floor(damage * 3);
    }

    return damage;
  }

  /**
   * Calculate crit chance
   * @param {Actor} attacker - Attacking actor
   * @param {Actor} defender - Defending actor
   * @returns {number} Crit chance (0-100)
   */
  static calculateCritChance(attacker, defender) {
    const attackerSystem = attacker.system;
    const defenderSystem = defender.system;

    const critRate = attackerSystem.derived.crit || 0;
    const critAvoid = defenderSystem.derived.critAvoid || 0;

    const finalCrit = critRate - critAvoid;
    return Math.max(0, finalCrit);
  }

  /**
   * Check if attacker can double attack
   * @param {Actor} attacker - Attacking actor
   * @param {Actor} defender - Defending actor
   * @returns {boolean} True if attacker can double
   */
  static canDouble(attacker, defender) {
    const attackerAS = attacker.system.derived.attackSpeed || 0;
    const defenderAS = defender.system.derived.attackSpeed || 0;

    return (attackerAS - defenderAS) >= 4;
  }

  /**
   * Check if defender can counter-attack
   * @param {Token} attackerToken - Attacking token
   * @param {Token} defenderToken - Defending token
   * @param {Item} attackerWeapon - Weapon being used by attacker
   * @returns {boolean} True if defender can counter
   */
  static canCounter(attackerToken, defenderToken, attackerWeapon) {
    // Get defender's equipped weapon
    const defenderWeapon = defenderToken.actor.items.find(i => i.type === 'weapon' && i.system.equipped);
    
    if (!defenderWeapon) return false;

    // Check if defender weapon is broken
    if (defenderWeapon.system.broken) return false;

    // Calculate real distance between tokens
    const attackerPos = canvas.grid.getOffset({ x: attackerToken.document.x, y: attackerToken.document.y });
    const defenderPos = canvas.grid.getOffset({ x: defenderToken.document.x, y: defenderToken.document.y });
    const distance = Math.abs(attackerPos.i - defenderPos.i) + Math.abs(attackerPos.j - defenderPos.j);

    // Parse ranges (e.g., "1", "1-2", "2-3")
    const attackerRange = this.parseRange(attackerWeapon.system.range);
    const defenderRange = this.parseRange(defenderWeapon.system.range);

    console.log('Counter check:', defenderToken.name, 'weapon:', defenderWeapon.name, 'range:', defenderRange.min + '-' + defenderRange.max, 'distance:', distance);

    // Check if defender's range covers the distance
    return distance >= defenderRange.min && distance <= defenderRange.max;
  }

  /**
   * Parse weapon range string
   * @param {string} rangeStr - Range string like "1", "1-2", "2-3"
   * @returns {object} {min: number, max: number}
   */
  static parseRange(rangeStr) {
    if (rangeStr.includes('-')) {
      const parts = rangeStr.split('-');
      return { min: parseInt(parts[0]), max: parseInt(parts[1]) };
    } else {
      const val = parseInt(rangeStr);
      return { min: val, max: val };
    }
  }

  /**
   * Generate combat preview data
   * @param {Token} attackerToken - Attacking token
   * @param {Token} defenderToken - Defending token
   * @returns {object} Combat preview data
   */
  static generateCombatPreview(attackerToken, defenderToken) {
    const attacker = attackerToken.actor;
    const defender = defenderToken.actor;
    const attackerWeapon = attacker.items.find(i => i.type === 'weapon' && i.system.equipped);
    const defenderWeapon = defender.items.find(i => i.type === 'weapon' && i.system.equipped);

    if (!attackerWeapon) {
      return { error: "Attacker has no weapon equipped" };
    }

    const preview = {
      attacker: {
        name: attacker.name,
        weapon: attackerWeapon.name,
        hp: attacker.system.stats.hp.value,
        damage: this.calculateDamage(attacker, defender, attackerWeapon),
        hit: this.calculateHitChance(attacker, defender, attackerWeapon),
        crit: this.calculateCritChance(attacker, defender),
        canDouble: this.canDouble(attacker, defender)
      },
      defender: {
        name: defender.name,
        weapon: defenderWeapon ? defenderWeapon.name : "None",
        hp: defender.system.stats.hp.value,
        canCounter: this.canCounter(attackerToken, defenderToken, attackerWeapon)
      }
    };

    // Calculate defender counter stats if they can counter
    if (preview.defender.canCounter && defenderWeapon) {
      preview.defender.damage = this.calculateDamage(defender, attacker, defenderWeapon);
      preview.defender.hit = this.calculateHitChance(defender, attacker, defenderWeapon);
      preview.defender.crit = this.calculateCritChance(defender, attacker);
      preview.defender.canDouble = this.canDouble(defender, attacker);
    }

    // Check weapon triangle
    if (defenderWeapon) {
      const triangle = this.getWeaponTriangleAdvantage(
        attackerWeapon.system.weaponType, 
        defenderWeapon.system.weaponType
      );
      preview.weaponTriangle = triangle.advantage;
    }

    return preview;
  }

  /**
   * Build combat sequence considering skills
   * @param {Actor} attacker - Initiating attacker
   * @param {Actor} defender - Defender
   * @param {Token} attackerToken - Attacker token
   * @param {Token} defenderToken - Defender token
   * @returns {Array} Array of combat actions in order
   */
  static _buildCombatSequence(attacker, defender, attackerToken, defenderToken) {
    const attackerWeapon = attacker.items.find(i => i.type === 'weapon' && i.system.equipped);
    const defenderWeapon = defender.items.find(i => i.type === 'weapon' && i.system.equipped);
    
    const attackerSkills = this.checkCombatSkills(attacker);
    const defenderSkills = this.checkCombatSkills(defender);
    
    // Verificar si el defensor puede contraatacar
    let defenderCanCounter = this.canCounter(attackerToken, defenderToken, attackerWeapon) && defenderWeapon;
    
    // Prevención de contraataque (ej: Windsweep)
    if (attackerSkills.preventsCounterattack) {
      defenderCanCounter = false;
    }
    
    // Verificar si pueden hacer follow-up (double attack)
    const attackerCanDouble = attackerSkills.guaranteedFollowup || this.canDouble(attacker, defender);
    
    // REGLA BASE: Defensor NO hace double al contraatacar
    // EXCEPCIÓN: Quick Riposte permite al defensor hacer follow-up
    const defenderCanDouble = defenderSkills.hasQuickRiposte && this.canDouble(defender, attacker);
    
    const sequence = [];
    
    // === Paso 1: Determinar orden inicial ===
    
    // Vantage: Defender ataca primero
    const defenderAttacksFirst = defenderCanCounter && defenderSkills.hasVantage;
    
    if (defenderAttacksFirst) {
      // Contraataque adelantado (Vantage)
      sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'counter' });
      
      // Primer ataque del iniciador
      sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'attack' });
      
      // Brave Weapon: Segundo ataque inmediato
      if (attackerSkills.hasBraveWeapon) {
        sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'brave' });
      }
      
      // Follow-up del defensor (solo con Quick Riposte)
      if (defenderCanDouble) {
        sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'double' });
      }
      
      // Follow-up del atacante
      if (attackerCanDouble) {
        sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'double' });
      }
      
    } else if (attackerSkills.hasDesperation && attackerCanDouble) {
      // Desperation: Todos los ataques del iniciador van seguidos
      sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'attack' });
      
      if (attackerSkills.hasBraveWeapon) {
        sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'brave' });
      }
      
      sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'double' });
      
      // Contraataques después
      if (defenderCanCounter) {
        sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'counter' });
        
        if (defenderSkills.hasBraveWeapon) {
          sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'brave' });
        }
        
        if (defenderCanDouble) {
          sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'double' });
        }
      }
      
    } else {
      // === Secuencia Normal ===
      
      // Primer ataque del iniciador
      sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'attack' });
      
      // Brave Weapon: Ataque inmediato
      if (attackerSkills.hasBraveWeapon) {
        sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'brave' });
      }
      
      // Contraataque
      if (defenderCanCounter) {
        sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'counter' });
        
        // Brave Weapon del defensor
        if (defenderSkills.hasBraveWeapon) {
          sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'brave' });
        }
      }
      
      // Follow-up del atacante
      if (attackerCanDouble && !defenderSkills.preventsFollowup) {
        sequence.push({ actor: attacker, target: defender, weapon: attackerWeapon, type: 'double' });
      }
      
      // Follow-up del defensor (solo con Quick Riposte)
      if (defenderCanDouble && !attackerSkills.preventsFollowup) {
        sequence.push({ actor: defender, target: attacker, weapon: defenderWeapon, type: 'double' });
      }
    }
    
    return sequence;
  }

  /**
   * Execute a full combat round
   * @param {Token} attackerToken - Attacking token
   * @param {Token} defenderToken - Defending token
   * @returns {object} Combat result
   */
  static async executeCombat(attackerToken, defenderToken) {
    const attacker = attackerToken.actor;
    const defender = defenderToken.actor;
    const attackerWeapon = attacker.items.find(i => i.type === 'weapon' && i.system.equipped);
    
    if (!attackerWeapon) {
      ui.notifications.error("Attacker has no weapon equipped!");
      return { error: "No weapon" };
    }

    // Guardar usos de armas ANTES del combate
    const defenderWeapon = defender.items.find(i => i.type === 'weapon' && i.system.equipped);
    
    // Guardar uses ANTES (system.uses es NumberField directo, no .value)
    const attackerUsesBefore = attackerWeapon?.system?.uses ?? null;
    const attackerMaxUses = attackerWeapon?.system?.usesMax ?? null;
    const defenderUsesBefore = defenderWeapon?.system?.uses ?? null;
    const defenderMaxUses = defenderWeapon?.system?.usesMax ?? null;
    
    const result = {
      rounds: [],
      attackerHPStart: attacker.system.stats.hp.value,
      defenderHPStart: defender.system.stats.hp.value,
      attackerHPEnd: attacker.system.stats.hp.value,
      defenderHPEnd: defender.system.stats.hp.value,
      attackerToken: attackerToken,
      defenderToken: defenderToken,
      attackerWeaponName: attackerWeapon?.name,
      defenderWeaponName: defenderWeapon?.name,
      attackerUsesBefore: attackerUsesBefore,
      attackerMaxUses: attackerMaxUses,
      defenderUsesBefore: defenderUsesBefore,
      defenderMaxUses: defenderMaxUses
    };

    // Construir secuencia de combate
    const sequence = this._buildCombatSequence(attacker, defender, attackerToken, defenderToken);
    
    // Ejecutar cada acción en secuencia
    for (const action of sequence) {
      const round = await this._executeAttack(action.actor, action.target, action.weapon);
      round.attackerHPBefore = result.attackerHPEnd;
      round.defenderHPBefore = result.defenderHPEnd;
      round.roundType = action.type;
      
      // Aplicar daño al objetivo correcto
      if (action.actor === attacker) {
        result.defenderHPEnd -= round.damage;
      } else {
        result.attackerHPEnd -= round.damage;
      }
      
      round.attackerHPAfter = result.attackerHPEnd;
      round.defenderHPAfter = result.defenderHPEnd;
      result.rounds.push(round);
      
      // Check if someone is defeated
      if (result.defenderHPEnd <= 0) {
        result.defenderHPEnd = 0;
        result.winner = attacker.name;
        break;
      }
      if (result.attackerHPEnd <= 0) {
        result.attackerHPEnd = 0;
        result.winner = defender.name;
        break;
      }
    }

    await this._applyCombatResults(attacker, defender, result);
    
    // Emitir Hook para que DurabilitySystem y otros sistemas puedan reaccionar
    // Nota: attackerWeapon ya está declarado al inicio, defenderWeapon puede ser undefined
    const defenderWeaponForHook = defender.items.find(i => i.type === 'weapon' && i.system.equipped);
    
    Hooks.callAll('EMBLEM.combatExecuted', {
      attacker,
      defender,
      attackerWeapon,
      defenderWeapon: defenderWeaponForHook,
      results: {
        attackerDoubled: this.canDouble(attacker, defender),
        defenderDoubled: this.canDouble(defender, attacker),
        defenderCountered: this.canCounter(attackerToken, defenderToken, attackerWeapon) && defenderWeaponForHook
      }
    });
    
    return result;
  }

  /**
   * Execute a single attack
   */
  static async _executeAttack(attacker, defender, weapon) {
    const hitChance = this.calculateHitChance(attacker, defender, weapon);
    
    // Crear Roll de Foundry para el hit check
    const hitRoll = await new Roll("1d100").evaluate();
    const hitValue = hitRoll.total;
    const didHit = hitValue <= hitChance;

    let damage = 0;
    let isCrit = false;
    let critRoll = null;

    if (didHit) {
      const critChance = this.calculateCritChance(attacker, defender);
      critRoll = await new Roll("1d100").evaluate();
      const critValue = critRoll.total;
      isCrit = critValue <= critChance;

      damage = this.calculateDamage(attacker, defender, weapon, isCrit);
    }

    // Determinar disposición del atacante de este round
    const attackerDisposition = attacker.token?.disposition ?? attacker.prototypeToken?.disposition ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL;
    const dispositionClass = (() => {
      switch(attackerDisposition) {
        case CONST.TOKEN_DISPOSITIONS.FRIENDLY: return 'friendly';
        case CONST.TOKEN_DISPOSITIONS.NEUTRAL: return 'neutral';
        case CONST.TOKEN_DISPOSITIONS.HOSTILE: return 'hostile';
        case CONST.TOKEN_DISPOSITIONS.SECRET: return 'secret';
        default: return 'neutral';
      }
    })();
    
    return {
      attacker: attacker.name,
      attackerImg: attacker.token?.texture?.src || attacker.prototypeToken?.texture?.src || attacker.img,
      defender: defender.name,
      defenderImg: defender.token?.texture?.src || defender.prototypeToken?.texture?.src || defender.img,
      disposition: dispositionClass,
      weapon: weapon.name,
      weaponUses: weapon.system?.uses,
      weaponUsesAfter: weapon.system?.uses ? weapon.system.uses - 1 : null,
      weaponMaxUses: weapon.system?.usesMax,
      hitRoll: hitValue,
      hitRollObject: hitRoll,
      critRoll: critRoll,
      hitChance,
      didHit,
      isCrit,
      damage
    };
  }

  /**
   * Apply combat results (damage, weapon uses, exp)
   */
  static async _applyCombatResults(attacker, defender, result) {
    // Apply HP changes
    await attacker.update({ 'system.stats.hp.value': Math.max(0, result.attackerHPEnd) });
    await defender.update({ 'system.stats.hp.value': Math.max(0, result.defenderHPEnd) });

    // Nota: La durabilidad de armas ahora la maneja DurabilitySystem via Hook 'EMBLEM.combatExecuted'

    // Create chat message with results
    await this._createCombatMessage(result);
  }

  /**
   * Create combat result chat message
   */
  static async _createCombatMessage(result) {
    // Calcular daño total que cada combatiente RECIBIÓ (para mostrar -X dmg)
    const attackerDamageTaken = result.attackerHPStart - result.attackerHPEnd;
    const defenderDamageTaken = result.defenderHPStart - result.defenderHPEnd;

    // Calcular usos gastados (contar ataques del atacante y defensor)
    const attackerAttacks = result.rounds.filter(r => r.attacker === result.rounds[0].attacker).length;
    const defenderAttacks = result.rounds.filter(r => r.attacker === result.rounds[0].defender).length;
    
    // Obtener usos ACTUALES (después del combate y aplicación de durabilidad)
    const attackerActor = result.attackerToken?.actor;
    const defenderActor = result.defenderToken?.actor;
    const attackerWeapon = attackerActor?.items.find(i => i.type === 'weapon' && i.system.equipped);
    const defenderWeapon = defenderActor?.items.find(i => i.type === 'weapon' && i.system.equipped);
    
    const attackerUsesNow = attackerWeapon?.system?.uses ?? null;
    const defenderUsesNow = defenderWeapon?.system?.uses ?? null;
    
    // Obtener disposiciones de los tokens
    const attackerDisposition = result.attackerToken?.document?.disposition ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL;
    const defenderDisposition = result.defenderToken?.document?.disposition ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL;
    
    // Helper para convertir disposition a clase
    const getDispositionClass = (disposition) => {
      switch(disposition) {
        case CONST.TOKEN_DISPOSITIONS.FRIENDLY: return 'friendly';
        case CONST.TOKEN_DISPOSITIONS.NEUTRAL: return 'neutral';
        case CONST.TOKEN_DISPOSITIONS.HOSTILE: return 'hostile';
        case CONST.TOKEN_DISPOSITIONS.SECRET: return 'secret';
        default: return 'neutral';
      }
    };
    
    // Preparar datos para el template
    const templateData = {
      attacker: { 
        name: result.rounds[0].attacker,
        img: result.attackerToken?.document?.texture?.src || result.attackerToken?.actor?.img,
        disposition: getDispositionClass(attackerDisposition),
        weapon: result.attackerWeaponName,
        weaponUsesAfter: attackerUsesNow,
        weaponMaxUses: result.attackerMaxUses,
        weaponUsesUsed: attackerAttacks > 0 ? attackerAttacks : null
      },
      defender: { 
        name: result.rounds[0].defender,
        img: result.defenderToken?.document?.texture?.src || result.defenderToken?.actor?.img,
        disposition: getDispositionClass(defenderDisposition),
        weapon: result.defenderWeaponName,
        weaponUsesAfter: defenderUsesNow,
        weaponMaxUses: result.defenderMaxUses,
        weaponUsesUsed: defenderAttacks > 0 ? defenderAttacks : null
      },
    };
    
    console.log('=== Combat Message Template Data ===');
    console.log('Attacker weapon:', templateData.attacker.weapon);
    console.log('Attacker uses after:', templateData.attacker.weaponUsesAfter);
    console.log('Attacker max uses:', templateData.attacker.weaponMaxUses);
    console.log('Attacker uses used:', templateData.attacker.weaponUsesUsed);
    console.log('Defender weapon:', templateData.defender.weapon);
    console.log('Defender uses after:', templateData.defender.weaponUsesAfter);
    console.log('Defender max uses:', templateData.defender.weaponMaxUses);
    console.log('Defender uses used:', templateData.defender.weaponUsesUsed);
    
    const finalTemplateData = {
      ...templateData,
      rounds: result.rounds,
      attackerHPStart: result.attackerHPStart,
      attackerHPEnd: result.attackerHPEnd,
      defenderHPStart: result.defenderHPStart,
      defenderHPEnd: result.defenderHPEnd,
      attackerDamageTaken: attackerDamageTaken > 0 ? attackerDamageTaken : null,
      defenderDamageTaken: defenderDamageTaken > 0 ? defenderDamageTaken : null,
      winner: result.winner
    };

    // Renderizar template
    const content = await renderTemplate(
      "systems/emblem/templates/chat/combat-result.hbs",
      finalTemplateData
    );

    // Crear rolls para el mensaje (para que suenen los dados)
    const rolls = [];
    for (const round of result.rounds) {
      if (round.hitRollObject) {
        rolls.push(round.hitRollObject);
      }
      if (round.critRoll) {
        rolls.push(round.critRoll);
      }
    }

    // Crear mensaje de chat con rolls
    await ChatMessage.create({
      content: content,
      speaker: { alias: "Combat System" },
      rolls: rolls,
      sound: rolls.length > 0 ? CONFIG.sounds.dice : null,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL
    });
  }
}
