/**
 * Interactive Combat System
 * Handles step-by-step combat resolution with roll buttons
 */

export class InteractiveCombat {
  
  /**
   * Initialize the interactive combat system
   */
  static initialize() {
    console.log('InteractiveCombat | Initializing...');
    
    // Hook para manejar clicks en botones de roll
    Hooks.on('renderChatMessage', this._onRenderChatMessage.bind(this));
    
    console.log('InteractiveCombat | Initialized');
  }

  /**
   * Handle chat message render to attach button listeners
   */
  static _onRenderChatMessage(message, html, data) {
    // Buscar botones de roll
    const rollButtons = html.find('.fe-roll-button');
    
    rollButtons.on('click', async (event) => {
      event.preventDefault();
      const button = $(event.currentTarget);
      const roundIndex = parseInt(button.data('round-index'));
      const messageId = button.data('message-id');
      
      await this._handleRollClick(messageId, roundIndex);
    });
  }

  /**
   * Handle roll button click
   */
  static async _handleRollClick(messageId, roundIndex) {
    const message = game.messages.get(messageId);
    if (!message) {
      ui.notifications.error('Combat message not found!');
      return;
    }

    // Obtener datos del combate
    const combatData = message.getFlag('emblem', 'interactiveCombat');
    if (!combatData) {
      ui.notifications.error('Combat data not found!');
      return;
    }

    const round = combatData.rounds[roundIndex];
    if (!round || round.resolved) {
      ui.notifications.warn('This round has already been resolved!');
      return;
    }

    // Reproducir sonido de dado
    AudioHelper.play({ src: 'sounds/dice.wav', volume: 0.8, autoplay: true, loop: false }, true);

    // Actualizar HP del defensor ANTES del ataque con rounds previos
    let defenderHPBefore = round.defenderHPBefore;
    
    // Ejecutar la tirada
    const result = await this._executeRound(round, combatData);
    
    // Actualizar HP del defensor DESPUÉS del ataque
    result.defenderHPBefore = defenderHPBefore;
    
    // Actualizar los datos del round
    combatData.rounds[roundIndex] = { ...round, ...result, resolved: true };
    
    // Actualizar HP en rounds siguientes
    const damageTaken = result.defenderHPBefore - result.defenderHPAfter;
    for (let i = roundIndex + 1; i < combatData.rounds.length; i++) {
      const nextRound = combatData.rounds[i];
      // Si el siguiente round ataca al mismo defensor
      if (nextRound.defender === round.defender) {
        nextRound.defenderHPBefore = result.defenderHPAfter;
      }
    }
    
    // Actualizar HP final en los datos del combatiente
    const defenderKey = round.attacker === combatData.attacker.name ? 'defender' : 'attacker';
    combatData[defenderKey].hpEnd = result.defenderHPAfter;
    
    // Calcular cambio total de HP
    const hpChange = result.defenderHPBefore - result.defenderHPAfter;
    if (!combatData[defenderKey].hpChange) {
      combatData[defenderKey].hpChange = 0;
    }
    combatData[defenderKey].hpChange -= hpChange;

    // Incrementar usos de arma gastados - se gasta un uso independientemente de si pega o no
    const attackerKey = round.attacker === combatData.attacker.name ? 'attacker' : 'defender';
    console.log(`InteractiveCombat | Round ${roundIndex}: Attacker is ${round.attacker}, attackerKey is ${attackerKey}`);
    if (combatData[attackerKey].weaponId) {
      const oldUses = combatData[attackerKey].weaponUsesUsed || 0;
      combatData[attackerKey].weaponUsesUsed = oldUses + 1;
      console.log(`InteractiveCombat | ${attackerKey} weapon uses: ${oldUses} -> ${combatData[attackerKey].weaponUsesUsed}`);
    }

    // Verificar si todos los rounds están resueltos
    combatData.allResolved = combatData.rounds.every(r => r.resolved);

    // Si todo está resuelto, aplicar cambios a los actores
    if (combatData.allResolved) {
      await this._applyFinalResults(combatData);
    }

    // Actualizar el mensaje
    await message.setFlag('emblem', 'interactiveCombat', combatData);
    
    // Re-renderizar el mensaje
    await this._updateChatMessage(message, combatData);
  }

  /**
   * Execute a single round (roll and calculate damage)
   */
  static async _executeRound(round, combatData) {
    // Tirar d100 para hit
    const hitRoll = new Roll('1d100');
    await hitRoll.evaluate();
    const hitValue = hitRoll.total;

    const didHit = hitValue <= round.hitChance;
    
    let isCrit = false;
    let damage = 0;
    
    if (didHit) {
      // Verificar crítico
      const critRoll = new Roll('1d100');
      await critRoll.evaluate();
      isCrit = critRoll.total <= (round.critChance || 0);
      
      // Calcular daño
      damage = isCrit ? round.damage * 3 : round.damage;
    }

    const defenderHPAfter = Math.max(0, round.defenderHPBefore - damage);

    return {
      hitRoll: hitValue,
      hitRollObject: hitRoll,
      didHit,
      isCrit,
      damage,
      defenderHPBefore: round.defenderHPBefore,
      defenderHPAfter
    };
  }

  /**
   * Apply final HP changes to actors
   */
  static async _applyFinalResults(combatData) {
    console.log('InteractiveCombat | Applying final results');
    
    // Buscar tokens en la escena
    const scene = game.scenes.get(combatData.sceneId);
    if (!scene) {
      console.error('InteractiveCombat | Scene not found');
      return;
    }

    const attackerToken = scene.tokens.get(combatData.attackerTokenId);
    const defenderToken = scene.tokens.get(combatData.defenderTokenId);

    if (!attackerToken || !defenderToken) {
      console.error('InteractiveCombat | Tokens not found');
      return;
    }

    // Obtener actores desde los tokens (importante para tokens sintéticos)
    const attackerActor = attackerToken.actor;
    const defenderActor = defenderToken.actor;

    if (!attackerActor || !defenderActor) {
      console.error('InteractiveCombat | Could not find actors');
      return;
    }

    // Actualizar HP directamente en el actor del token
    await attackerActor.update({
      'system.stats.hp.value': combatData.attacker.hpEnd
    });

    await defenderActor.update({
      'system.stats.hp.value': combatData.defender.hpEnd
    });

    // Actualizar durabilidad de armas usando updateEmbeddedDocuments en el actor del token
    if (combatData.attacker.weaponId && combatData.attacker.weaponUsesUsed) {
      const attackerWeapon = attackerActor.items.get(combatData.attacker.weaponId);
      if (attackerWeapon) {
        console.log(`InteractiveCombat | Attacker weapon: ${attackerWeapon.name}, Current uses: ${attackerWeapon.system.uses}, Uses used: ${combatData.attacker.weaponUsesUsed}`);
        const newUses = Math.max(0, attackerWeapon.system.uses - combatData.attacker.weaponUsesUsed);
        console.log(`InteractiveCombat | New uses: ${newUses}`);
        
        await attackerActor.updateEmbeddedDocuments('Item', [
          { _id: combatData.attacker.weaponId, 'system.uses': newUses }
        ]);
      }
    }

    if (combatData.defender.weaponId && combatData.defender.weaponUsesUsed) {
      const defenderWeapon = defenderActor.items.get(combatData.defender.weaponId);
      if (defenderWeapon) {
        console.log(`InteractiveCombat | Defender weapon: ${defenderWeapon.name}, Current uses: ${defenderWeapon.system.uses}, Uses used: ${combatData.defender.weaponUsesUsed}`);
        const newUses = Math.max(0, defenderWeapon.system.uses - combatData.defender.weaponUsesUsed);
        
        await defenderActor.updateEmbeddedDocuments('Item', [
          { _id: combatData.defender.weaponId, 'system.uses': newUses }
        ]);
      }
    }

    ui.notifications.info('Combat resolved!');
  }

  /**
   * Update chat message with new combat data
   */
  static async _updateChatMessage(message, combatData) {
    // Renderizar template
    const html = await renderTemplate(
      'systems/emblem/templates/chat/interactive-combat.hbs',
      {
        ...combatData,
        messageId: message.id
      }
    );

    await message.update({ content: html });
  }



  /**
   * Start an interactive combat
   */
  static async startCombat(attackerToken, defenderToken, attackerWeapon, defenderWeapon) {
    console.log('InteractiveCombat | Starting combat');

    const attacker = attackerToken.actor;
    const defender = defenderToken.actor;

    // Import CombatCalculator
    const { CombatCalculator } = await import('./combat-calculator.mjs');

    // Build combat sequence (devuelve array directo)
    const attacks = CombatCalculator._buildCombatSequence(
      attacker, defender, attackerToken, defenderToken
    );

    // Preparar rounds sin resolver - mantener HP actualizado
    let currentAttackerHP = attacker.system.stats.hp.value;
    let currentDefenderHP = defender.system.stats.hp.value;

    const rounds = attacks.map((attack, index) => {
      const isAttacker = attack.actor === attacker;
      const currentAttacker = isAttacker ? attacker : defender;
      const currentDefender = isAttacker ? defender : attacker;
      const currentWeapon = isAttacker ? attackerWeapon : defenderWeapon;
      const currentAttackerToken = isAttacker ? attackerToken : defenderToken;
      const currentDefenderToken = isAttacker ? defenderToken : attackerToken;

      // Calcular stats para este ataque
      const hit = CombatCalculator.calculateHitChance(currentAttacker, currentDefender, currentWeapon);
      const damage = CombatCalculator.calculateDamage(currentAttacker, currentDefender, currentWeapon);
      const crit = CombatCalculator.calculateCritChance(currentAttacker, currentDefender);

      // HP actual del defensor ANTES de este ataque
      const defenderHP = isAttacker ? currentDefenderHP : currentAttackerHP;

      return {
        attacker: currentAttacker.name,
        attackerImg: currentAttackerToken.document.texture.src,
        defender: currentDefender.name,
        defenderImg: currentDefenderToken.document.texture.src,
        weapon: currentWeapon.name,
        hitChance: hit,
        damage: damage,
        critChance: crit,
        defenderHPBefore: defenderHP,
        defenderHPAfter: defenderHP, // Se actualizará al resolver
        roundType: attack.type,
        disposition: this._getDispositionClass(currentAttackerToken.document.disposition),
        resolved: false,
        isAttackerAttacking: isAttacker // Para saber qué HP actualizar
      };
    });

    // Preparar datos del combate
    const combatData = {
      attackerActorId: attacker.id,
      defenderActorId: defender.id,
      attackerTokenId: attackerToken.id,
      defenderTokenId: defenderToken.id,
      sceneId: attackerToken.scene.id,
      attacker: {
        name: attacker.name,
        img: attackerToken.document.texture.src,
        disposition: this._getDispositionClass(attackerToken.document.disposition),
        hpStart: attacker.system.stats.hp.value,
        hpEnd: attacker.system.stats.hp.value,
        hpChange: 0,
        weapon: attackerWeapon?.name,
        weaponId: attackerWeapon?.id,
        weaponUsesAfter: attackerWeapon?.system?.uses,
        weaponMaxUses: attackerWeapon?.system?.usesMax,
        weaponUsesUsed: 0
      },
      defender: {
        name: defender.name,
        img: defenderToken.document.texture.src,
        disposition: this._getDispositionClass(defenderToken.document.disposition),
        hpStart: defender.system.stats.hp.value,
        hpEnd: defender.system.stats.hp.value,
        hpChange: 0,
        weapon: defenderWeapon?.name,
        weaponId: defenderWeapon?.id,
        weaponUsesAfter: defenderWeapon?.system?.uses,
        weaponMaxUses: defenderWeapon?.system?.usesMax,
        weaponUsesUsed: 0
      },
      rounds,
      allResolved: false
    };

    // Crear mensaje inicial
    const html = await renderTemplate(
      'systems/emblem/templates/chat/interactive-combat.hbs',
      combatData
    );

    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ token: attackerToken }),
      content: html,
      flags: {
        'emblem': {
          interactiveCombat: combatData
        }
      }
    };

    const message = await ChatMessage.create(chatData);
    
    // Añadir messageId a los datos y re-renderizar
    combatData.messageId = message.id;
    await message.setFlag('emblem', 'interactiveCombat', combatData);
    
    // Re-renderizar con messageId incluido
    await this._updateChatMessage(message, combatData);

    return message;
  }

  /**
   * Get disposition CSS class
   */
  static _getDispositionClass(disposition) {
    switch(disposition) {
      case CONST.TOKEN_DISPOSITIONS.FRIENDLY: return 'friendly';
      case CONST.TOKEN_DISPOSITIONS.NEUTRAL: return 'neutral';
      case CONST.TOKEN_DISPOSITIONS.HOSTILE: return 'hostile';
      case CONST.TOKEN_DISPOSITIONS.SECRET: return 'secret';
      default: return 'neutral';
    }
  }
}
