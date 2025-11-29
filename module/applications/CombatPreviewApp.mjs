/**
 * Ventana de previsualizaci贸n de combate para Emblem
 * Muestra las estad铆sticas de combate antes de ejecutarlo
 */

import { CombatCalculator } from '../helpers/combat-calculator.mjs';

export class CombatPreviewApp extends Application {
  
  constructor(attacker, defender, options = {}) {
    super(options);
    
    console.log('CombatPreviewApp constructor received:', { 
      attacker: attacker?.name, 
      attackerType: attacker?.constructor?.name,
      defender: defender?.name,
      defenderType: defender?.constructor?.name
    });
    
    // Guardar tokens y actores
    this.attackerToken = attacker;
    this.defenderToken = defender;
    this.attacker = attacker?.actor || attacker;
    this.defender = defender?.actor || defender;
    
    console.log('After extraction:', {
      attackerName: this.attacker?.name,
      attackerSystem: !!this.attacker?.system,
      attackerResources: !!this.attacker?.system?.resources,
      defenderName: this.defender?.name,
      defenderSystem: !!this.defender?.system
    });
    
    if (!this.attacker || !this.defender) {
      console.error('CombatPreviewApp requires valid actors', { attacker, defender });
      throw new Error('Invalid actors provided to CombatPreviewApp');
    }
    
    if (!this.attacker.system || !this.defender.system) {
      console.error('Actors missing system data', { 
        attackerSystem: this.attacker.system,
        defenderSystem: this.defender.system
      });
      throw new Error('Invalid actor system data');
    }
    
    this.attackerWeapon = null;
    this.defenderWeapon = null;
    this.combatStats = null;
    this._calculateCombatStats();
  }
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "combat-preview",
      classes: ["emblem", "combat-preview"],
      title: "Combat Preview",
      template: "systems/emblem/templates/apps/combat-preview.hbs",
      width: 500,
      height: "auto",
      resizable: true
    });
  }
  
  /**
   * Calcula las estadísticas de combate
   * @private
   */
  _calculateCombatStats() {
    // Obtener armas equipadas
    const attackerWeapons = this.attacker.items.filter(i => 
      i.type === 'weapon' && i.system.equipped === true
    );
    this.attackerWeapon = attackerWeapons[0] || null;
    
    const defenderWeapons = this.defender.items.filter(i => 
      i.type === 'weapon' && i.system.equipped === true
    );
    this.defenderWeapon = defenderWeapons[0] || null;
    
    if (!this.attackerWeapon) {
      ui.notifications.warn("El atacante no tiene un arma equipada");
      return;
    }
    
    // Calcular estadísticas usando CombatCalculator
    this.combatStats = {
      // Atacante
      attackerHit: CombatCalculator.calculateHitChance(
        this.attacker, 
        this.defender, 
        this.attackerWeapon
      ),
      attackerDamage: CombatCalculator.calculateDamage(
        this.attacker, 
        this.defender, 
        this.attackerWeapon
      ),
      attackerCrit: CombatCalculator.calculateCritChance(
        this.attacker, 
        this.defender
      ),
      attackerDoubles: CombatCalculator.canDouble(
        this.attacker, 
        this.defender
      ),
      
      // Defensor (si puede contraatacar)
      defenderCanCounter: this.defenderWeapon && 
                         CombatCalculator.canCounter(
                           this.attackerToken,
                           this.defenderToken,
                           this.attackerWeapon
                         ),
      defenderHit: 0,
      defenderDamage: 0,
      defenderCrit: 0,
      defenderDoubles: false
    };
    
    // Calcular stats del defensor si puede contraatacar
    if (this.combatStats.defenderCanCounter) {
      this.combatStats.defenderHit = CombatCalculator.calculateHitChance(
        this.defender, 
        this.attacker, 
        this.defenderWeapon
      );
      this.combatStats.defenderDamage = CombatCalculator.calculateDamage(
        this.defender, 
        this.attacker, 
        this.defenderWeapon
      );
      this.combatStats.defenderCrit = CombatCalculator.calculateCritChance(
        this.defender, 
        this.attacker
      );
      this.combatStats.defenderDoubles = CombatCalculator.canDouble(
        this.defender, 
        this.attacker
      );
    }
  }
  
  getData() {
    // Calcular HP proyectado después del combate
    const attackerTotalDamage = this.combatStats.attackerDoubles ? 
      this.combatStats.attackerDamage * 2 : this.combatStats.attackerDamage;
    const defenderTotalDamage = this.combatStats.defenderDoubles ? 
      this.combatStats.defenderDamage * 2 : this.combatStats.defenderDamage;
    
    const defenderProjectedHP = Math.max(0, this.defender.system.stats.hp.value - attackerTotalDamage);
    const attackerProjectedHP = this.combatStats.defenderCanCounter ? 
      Math.max(0, this.attacker.system.stats.hp.value - defenderTotalDamage) : this.attacker.system.stats.hp.value;
    
    // Obtener disposiciones de los tokens
    const attackerDisposition = this.attackerToken?.document?.disposition ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL;
    const defenderDisposition = this.defenderToken?.document?.disposition ?? CONST.TOKEN_DISPOSITIONS.NEUTRAL;
    
    // Obtener tipos de arma
    const attackerWeaponType = this.attackerWeapon?.system?.weaponType || 'sword';
    const defenderWeaponType = this.defenderWeapon?.system?.weaponType || 'sword';

    // Calcular ventaja
    const advantage = this._calculateWeaponAdvantage(attackerWeaponType, defenderWeaponType);
    
    // Determinar si es magia
    const attackerIsMagic = ['anima', 'light', 'dark'].includes(attackerWeaponType.toLowerCase());
    const defenderIsMagic = ['anima', 'light', 'dark'].includes(defenderWeaponType.toLowerCase());
    
    return {
      attacker: {
        name: this.attacker.name,
        img: this.attackerToken?.document.texture.src || this.attacker.img,
        disposition: this._getDispositionClass(attackerDisposition),
        hp: this.attacker.system.stats.hp.value,
        maxHp: this.attacker.system.stats.hp.max,
        projectedHP: attackerProjectedHP,
        hpPercent: Math.round((this.attacker.system.stats.hp.value / this.attacker.system.stats.hp.max) * 100),
        projectedHPPercent: Math.round((attackerProjectedHP / this.attacker.system.stats.hp.max) * 100),
        weapon: this.attackerWeapon?.name || "None",
        weaponType: attackerWeaponType,
        weaponIcon: this._getWeaponIcon(attackerWeaponType),
        isMagic: attackerIsMagic,
        weaponUses: this.attackerWeapon?.system?.uses?.value,
        weaponMaxUses: this.attackerWeapon?.system?.uses?.max,
        hit: this.combatStats.attackerHit,
        damage: this.combatStats.attackerDamage,
        crit: this.combatStats.attackerCrit,
        doubles: this.combatStats.attackerDoubles,
        hasAdvantage: advantage === 1
      },
      defender: {
        name: this.defender.name,
        img: this.defenderToken?.document.texture.src || this.defender.img,
        disposition: this._getDispositionClass(defenderDisposition),
        hp: this.defender.system.stats.hp.value,
        maxHp: this.defender.system.stats.hp.max,
        projectedHP: defenderProjectedHP,
        hpPercent: Math.round((this.defender.system.stats.hp.value / this.defender.system.stats.hp.max) * 100),
        projectedHPPercent: Math.round((defenderProjectedHP / this.defender.system.stats.hp.max) * 100),
        weapon: this.defenderWeapon?.name || "None",
        weaponType: defenderWeaponType,
        weaponIcon: this._getWeaponIcon(defenderWeaponType),
        isMagic: defenderIsMagic,
        weaponUses: this.defenderWeapon?.system?.uses?.value,
        weaponMaxUses: this.defenderWeapon?.system?.uses?.max,
        canCounter: this.combatStats.defenderCanCounter,
        hit: this.combatStats.defenderHit,
        damage: this.combatStats.defenderDamage,
        crit: this.combatStats.defenderCrit,
        doubles: this.combatStats.defenderDoubles,
        hasAdvantage: advantage === -1
      }
    };
  }
  
  /**
   * Convertir disposition de Foundry a clase CSS
   * @private
   */
  _getDispositionClass(disposition) {
    switch(disposition) {
      case CONST.TOKEN_DISPOSITIONS.FRIENDLY: return 'friendly';
      case CONST.TOKEN_DISPOSITIONS.NEUTRAL: return 'neutral';
      case CONST.TOKEN_DISPOSITIONS.HOSTILE: return 'hostile';
      case CONST.TOKEN_DISPOSITIONS.SECRET: return 'secret';
      default: return 'neutral';
    }
  }

  /**
   * Obtener icono de arma basado en el tipo (Font Awesome Free)
   * @private
   */
  _getWeaponIcon(weaponType) {
    const icons = {
      sword: 'fa-sword',
      lance: 'fa-location-arrow',  // Alternative for spear
      axe: 'fa-axe',
      bow: 'fa-bullseye',          // Alternative for bow
      anima: 'fa-wind',
      light: 'fa-sun',
      dark: 'fa-moon',
      staff: 'fa-wand-magic-sparkles'
    };
    return icons[weaponType?.toLowerCase()] || 'fa-sword';
  }

  /**
   * Calcular ventaja del triángulo de armas
   * @private
   */
  _calculateWeaponAdvantage(attackerType, defenderType) {
    const physical = {
      sword: 'axe',
      axe: 'lance',
      lance: 'sword'
    };
    
    const magic = {
      anima: 'light',
      light: 'dark',
      dark: 'anima'
    };

    const attacker = attackerType?.toLowerCase();
    const defender = defenderType?.toLowerCase();

    // Physical triangle
    if (physical[attacker] === defender) return 1; // advantage
    if (physical[defender] === attacker) return -1; // disadvantage

    // Magic triangle
    if (magic[attacker] === defender) return 1; // advantage
    if (magic[defender] === attacker) return -1; // disadvantage

    return 0; // neutral
  }
  
  activateListeners(html) {
    super.activateListeners(html);
    
    // Botón de confirmar
    html.find('.confirm-combat').click(this._onConfirmCombat.bind(this));
    
    // Botón de cancelar
    html.find('.cancel-combat').click(this._onCancelCombat.bind(this));
  }
  
  /**
   * Confirmar y ejecutar el combate
   * @private
   */
  async _onConfirmCombat(event) {
    event.preventDefault();
    
    // Verificar modo de combate
    const combatMode = game.settings.get('emblem', 'combatResolutionMode') || 'auto';
    
    if (combatMode === 'interactive') {
      // Modo interactivo - usar InteractiveCombat
      const { InteractiveCombat } = game.emblem;
      await InteractiveCombat.startCombat(
        this.attackerToken,
        this.defenderToken,
        this.attackerWeapon,
        this.defenderWeapon
      );
    } else {
      // Modo automático - usar CombatCalculator original
      await CombatCalculator.executeCombat(
        this.attackerToken,
        this.defenderToken
      );
    }
    
    this.close();
  }
  
  /**
   * Cancelar el combate
   * @private
   */
  _onCancelCombat(event) {
    event.preventDefault();
    this.close();
  }
  
  /**
   * Muestra la ventana de preview para un combate
   * @param {Token} attacker - Token atacante
   * @param {Token} defender - Token defensor
   * @returns {CombatPreviewApp} La aplicación creada
   */
  static show(attacker, defender) {
    console.log('=== CombatPreviewApp.show called ===');
    console.log('Attacker:', {
      name: attacker?.name,
      type: attacker?.constructor?.name,
      hasActor: !!attacker?.actor,
      hasDocument: !!attacker?.document
    });
    console.log('Defender:', {
      name: defender?.name,
      type: defender?.constructor?.name,
      hasActor: !!defender?.actor,
      hasDocument: !!defender?.document
    });
    
    try {
      const app = new CombatPreviewApp(attacker, defender);
      app.render(true);
      console.log('CombatPreviewApp rendered successfully');
      return app;
    } catch(error) {
      console.error('Error creating CombatPreviewApp:', error);
      ui.notifications.error(`Failed to open combat preview: ${error.message}`);
      throw error;
    }
  }
}
