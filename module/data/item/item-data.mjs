/**
 * Data Model for Item-type Items (Consumables)
 * Extends TypeDataModel (Foundry v13)
 */
export default class ItemData extends foundry.abstract.TypeDataModel {
  
  /**
   * Define the schema for item data
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      // Item Type
      itemType: new fields.StringField({
        required: true,
        initial: "consumable",
        choices: ["consumable", "key", "treasure", "promotion"]
      }),

      // Uses
      uses: new fields.NumberField({
        required: true,
        initial: 1,
        integer: true,
        min: 0
      }),

      usesMax: new fields.NumberField({
        required: true,
        initial: 1,
        integer: true,
        min: 0
      }),

      // Effects
      effects: new fields.SchemaField({
        // Healing
        healHP: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0 }),
        healPercent: new fields.NumberField({ required: false, initial: 0, integer: true, min: 0, max: 100 }),
        
        // Stat Boosts (permanent)
        boostHP: new fields.NumberField({ required: false, initial: 0, integer: true }),
        boostStr: new fields.NumberField({ required: false, initial: 0, integer: true }),
        boostMag: new fields.NumberField({ required: false, initial: 0, integer: true }),
        boostSkl: new fields.NumberField({ required: false, initial: 0, integer: true }),
        boostSpd: new fields.NumberField({ required: false, initial: 0, integer: true }),
        boostLck: new fields.NumberField({ required: false, initial: 0, integer: true }),
        boostDef: new fields.NumberField({ required: false, initial: 0, integer: true }),
        boostRes: new fields.NumberField({ required: false, initial: 0, integer: true }),
        
        // Status Effects
        curePoison: new fields.BooleanField({ required: false, initial: false }),
        cureAll: new fields.BooleanField({ required: false, initial: false }),
        
        // Special
        revive: new fields.BooleanField({ required: false, initial: false })
      }),

      // Promotion-specific
      promotionClass: new fields.StringField({
        required: false,
        initial: "",
        blank: true
      }),

      // Value (for selling)
      value: new fields.NumberField({
        required: true,
        initial: 0,
        integer: true,
        min: 0
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
