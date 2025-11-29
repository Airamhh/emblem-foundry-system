/**
 * Data Model for Enemy/NPC/Boss-type Actors
 * Extends TypeDataModel (Foundry v13)
 */
export default class EnemyData extends foundry.abstract.TypeDataModel {
  
  /**
   * Define the schema for enemy data
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      // Basic Info
      level: new fields.NumberField({
        required: true,
        initial: 1,
        integer: true,
        min: 1,
        max: 30
      }),

      // Description
      description: new fields.HTMLField({
        required: false,
        blank: true
      }),

      // Stats (simpler than character, no max values)
      stats: new fields.SchemaField({
        hp: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 1 })
        }),
        str: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        mag: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        skl: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        spd: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        lck: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        def: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 3, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        res: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 20, integer: true, min: 0 })
        }),
        mov: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 5, integer: true, min: 0 }),
          max: new fields.NumberField({ required: true, initial: 15, integer: true, min: 0 })
        })
      }),

      // AI behavior (for enemies)
      behavior: new fields.StringField({
        required: true,
        initial: "aggressive",
        choices: ["aggressive", "defensive", "support", "stationary", "custom"]
      }),

      // Boss-specific flags
      isBoss: new fields.BooleanField({
        required: true,
        initial: false
      }),

      // Derived stats (calculated in prepareDerivedData)
      derived: new fields.SchemaField({
        hit: new fields.NumberField({ required: false, initial: 0, integer: true }),
        avoid: new fields.NumberField({ required: false, initial: 0, integer: true }),
        crit: new fields.NumberField({ required: false, initial: 0, integer: true }),
        critAvoid: new fields.NumberField({ required: false, initial: 0, integer: true }),
        attackSpeed: new fields.NumberField({ required: false, initial: 0, integer: true }),
        attack: new fields.NumberField({ required: false, initial: 0, integer: true })
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
    // Derived data is calculated in actor.mjs
  }
}
