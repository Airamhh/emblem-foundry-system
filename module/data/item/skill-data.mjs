/**
 * Data Model for Skill-type Items
 * Extends TypeDataModel (Foundry v13)
 */
export default class SkillData extends foundry.abstract.TypeDataModel {
  
  /**
   * Define the schema for skill data
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      // Skill Type
      skillType: new fields.StringField({
        required: true,
        initial: "passive",
        choices: ["passive", "trigger", "command", "support"]
      }),

      // Activation Chance (for trigger skills)
      activationChance: new fields.NumberField({
        required: false,
        initial: 0,
        integer: true,
        min: 0,
        max: 100
      }),

      // Activation Formula (e.g., "Skill%", "Skill/2%")
      activationFormula: new fields.StringField({
        required: false,
        initial: "",
        blank: true
      }),

      // Effects
      effects: new fields.SchemaField({
        // Stat modifiers
        hitMod: new fields.NumberField({ required: false, initial: 0, integer: true }),
        avoidMod: new fields.NumberField({ required: false, initial: 0, integer: true }),
        critMod: new fields.NumberField({ required: false, initial: 0, integer: true }),
        damageMod: new fields.NumberField({ required: false, initial: 0, integer: true }),
        
        // Special effects
        ignoreDefense: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0, max: 100 }),
        ignoreResistance: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0, max: 100 }),
        
        // HP effects
        healPercent: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0, max: 100 }),
        damagePercent: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0, max: 100 }),
        
        // Multi-hit
        multiHit: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0, max: 5 }),
        multiHitPowerMod: new fields.NumberField({ required: false, initial: 100, integer: true })
      }),

      // Conditions (when skill can activate)
      conditions: new fields.SchemaField({
        hpThreshold: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0, max: 100 }),
        hpAbove: new fields.BooleanField({ required: false, initial: true }),
        
        attackingOnly: new fields.BooleanField({ required: false, initial: false }),
        defendingOnly: new fields.BooleanField({ required: false, initial: false }),
        
        adjacentAlly: new fields.BooleanField({ required: false, initial: false }),
        adjacentEnemy: new fields.BooleanField({ required: false, initial: false })
      }),

      // Description
      description: new fields.HTMLField({
        required: false,
        blank: true
      })
    };
  }

  /**
   * Prepare base data before derived data
   */
  prepareBaseData() {
    // Any base data preparation
  }

  /**
   * Prepare derived data
   */
  prepareDerivedData() {
    // Derived data is calculated in item.mjs
  }
}
