/**
 * Extend the base Actor document for Emblem system
 */
export class EmblemActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
  }

  /**
   * Pre-update hook to validate and clamp stats
   */
  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed, options, user);
    
    // Validate and clamp stat values to their max
    if (changed.system?.stats) {
      const stats = changed.system.stats;
      
      for (let [statName, statData] of Object.entries(stats)) {
        // Si se está actualizando el value, validar contra el max
        if (statData?.value !== undefined) {
          const currentMax = statData.max ?? this.system.stats[statName]?.max;
          
          if (currentMax !== undefined && statData.value > currentMax) {
            console.warn(`emblem | Clamping ${statName} value from ${statData.value} to max ${currentMax}`);
            statData.value = currentMax;
          }
        }
      }
    }
  }

  /**
   * Prepare data that is specific to this Document type
   */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * Prepare data related to this Document itself, after embedded documents
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.emblem || {};

    // Make separate methods for each Actor type
    this._prepareCharacterData(actorData);
    this._prepareEnemyData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const systemData = actorData.system;
    
    // Calculate derived stats
    this._calculateDerivedStats(systemData);
  }

  /**
   * Prepare Enemy/NPC/Boss type specific data
   */
  _prepareEnemyData(actorData) {
    if (!['enemy', 'npc', 'boss'].includes(actorData.type)) return;

    const systemData = actorData.system;
    
    // Calculate derived stats
    this._calculateDerivedStats(systemData);
  }

  /**
   * Calculate derived statistics for combat
   */
  _calculateDerivedStats(systemData) {
    // Get equipped weapon
    const weapon = this._getEquippedWeapon();
    
    // Calculate Hit Rate: Skl * 2 + Lck / 2 + Weapon Hit
    systemData.derived = systemData.derived || {};
    systemData.derived.hit = Math.floor(
      systemData.stats.skl.value * 2 + 
      systemData.stats.lck.value / 2 + 
      (weapon ? weapon.system.hit : 0)
    );

    // Calculate Avoid: Spd * 2 + Lck
    systemData.derived.avoid = Math.floor(
      systemData.stats.spd.value * 2 + 
      systemData.stats.lck.value
    );

    // Calculate Crit Rate: Skl / 2 + Weapon Crit
    systemData.derived.crit = Math.floor(
      systemData.stats.skl.value / 2 + 
      (weapon ? weapon.system.crit : 0)
    );

    // Calculate Crit Avoid: Lck
    systemData.derived.critAvoid = systemData.stats.lck.value;

    // Calculate Attack Speed: Spd - max(0, Weapon Weight - Str/Mag)
    if (weapon) {
      const effectiveStat = weapon.system.weaponType === 'tome' || weapon.system.weaponType === 'staff' 
        ? systemData.stats.mag.value 
        : systemData.stats.str.value;
      
      const weightPenalty = Math.max(0, weapon.system.weight - effectiveStat);
      systemData.derived.attackSpeed = systemData.stats.spd.value - weightPenalty;
    } else {
      systemData.derived.attackSpeed = systemData.stats.spd.value;
    }

    // Calculate Attack Power
    if (weapon) {
      const baseStat = weapon.system.weaponType === 'tome' || weapon.system.weaponType === 'staff'
        ? systemData.stats.mag.value
        : systemData.stats.str.value;
      
      systemData.derived.attack = baseStat + weapon.system.might;
    } else {
      systemData.derived.attack = 0;
    }
  }

  /**
   * Get the currently equipped weapon
   */
  _getEquippedWeapon() {
    return this.items.find(item => item.type === 'weapon' && item.system.equipped);
  }

  /**
   * Override getRollData to provide data for roll formulas
   */
  getRollData() {
    const data = {...super.getRollData()};

    // Add derived stats to roll data
    if (this.system.derived) {
      data.hit = this.system.derived.hit;
      data.avoid = this.system.derived.avoid;
      data.crit = this.system.derived.crit;
      data.attack = this.system.derived.attack;
    }

    return data;
  }

  /**
   * Override token creation to set default disposition and bar attribute
   */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    
    // Set default prototypeToken settings
    const updates = {};
    
    // Set disposition based on actor type
    if (this.type === 'character') {
      updates['prototypeToken.disposition'] = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
    } else if (this.type === 'enemy' || this.type === 'boss') {
      updates['prototypeToken.disposition'] = CONST.TOKEN_DISPOSITIONS.HOSTILE;
    } else if (this.type === 'npc') {
      updates['prototypeToken.disposition'] = CONST.TOKEN_DISPOSITIONS.NEUTRAL;
    }
    
    // Set default bar attribute to HP
    updates['prototypeToken.bar1.attribute'] = 'stats.hp';
    
    this.updateSource(updates);
  }
}
