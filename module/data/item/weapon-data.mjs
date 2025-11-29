/**
 * Data Model for Weapon-type Items
 * Extends TypeDataModel (Foundry v13)
 */
export default class WeaponData extends foundry.abstract.TypeDataModel {
  
  /**
   * Define the schema for weapon data
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      // Weapon Type
      weaponType: new fields.StringField({
        required: true,
        initial: "sword",
        choices: ["sword", "lance", "axe", "bow", "tome", "staff", "dragonstone", "beast"]
      }),

      // Weapon Stats
      might: new fields.NumberField({
        required: true,
        initial: 5,
        integer: true,
        min: 0,
        max: 30
      }),

      hit: new fields.NumberField({
        required: true,
        initial: 80,
        integer: true,
        min: 0,
        max: 100
      }),

      crit: new fields.NumberField({
        required: true,
        initial: 0,
        integer: true,
        min: 0,
        max: 50
      }),

      weight: new fields.NumberField({
        required: true,
        initial: 5,
        integer: true,
        min: 0,
        max: 20
      }),

      // Range (e.g., "1", "1-2", "2-3")
      range: new fields.StringField({
        required: true,
        initial: "1",
        blank: false
      }),

      // Durability
      uses: new fields.NumberField({
        required: true,
        initial: 45,
        integer: true,
        min: 0
      }),

      usesMax: new fields.NumberField({
        required: true,
        initial: 45,
        integer: true,
        min: 0
      }),

      // Weapon Rank Required
      rank: new fields.StringField({
        required: true,
        initial: "E",
        choices: ["E", "D", "C", "B", "A", "S", "Prf"]
      }),

      // Special Properties
      effective: new fields.ArrayField(
        new fields.StringField({
          choices: ["cavalry", "flying", "armored", "dragon", "monster"]
        }),
        { required: false, initial: [] }
      ),

      // Magic type (for tomes)
      magicType: new fields.StringField({
        required: false,
        initial: "anima",
        choices: ["anima", "light", "dark", "fire", "thunder", "wind", "ice"]
      }),

      // Equipment status
      equipped: new fields.BooleanField({
        required: true,
        initial: false
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
