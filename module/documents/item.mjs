/**
 * Extend the base Item document for Emblem system
 */
export class EmblemItem extends Item {

  /**
   * Augment the basic item data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
  }

  /**
   * Prepare data that is specific to this Document type
   */
  prepareBaseData() {
    // Data modifications in this step occur before processing derived data
  }

  /**
   * Prepare data related to this Document itself
   */
  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;
    const flags = itemData.flags.emblem || {};

    // Make separate methods for each Item type
    this._prepareWeaponData(itemData);
    this._prepareClassData(itemData);
    this._prepareSkillData(itemData);
    this._prepareItemData(itemData);
  }

  /**
   * Prepare Weapon type specific data
   */
  _prepareWeaponData(itemData) {
    if (itemData.type !== 'weapon') return;

    const systemData = itemData.system;

    // Calculate remaining uses percentage
    if (systemData.usesMax > 0) {
      systemData.usesPercent = Math.round((systemData.uses / systemData.usesMax) * 100);
    } else {
      systemData.usesPercent = 100; // Infinite durability
    }

    // Determine if weapon is broken
    systemData.broken = systemData.uses <= 0 && systemData.usesMax > 0;
  }

  /**
   * Prepare Class type specific data
   */
  _prepareClassData(itemData) {
    if (itemData.type !== 'class') return;

    const systemData = itemData.system;
    // Class-specific calculations can go here
  }

  /**
   * Prepare Skill type specific data
   */
  _prepareSkillData(itemData) {
    if (itemData.type !== 'skill') return;

    const systemData = itemData.system;
    // Skill-specific calculations can go here
  }

  /**
   * Prepare Item (consumable) type specific data
   */
  _prepareItemData(itemData) {
    if (itemData.type !== 'item') return;

    const systemData = itemData.system;
    
    // Calculate remaining uses percentage
    if (systemData.usesMax > 0) {
      systemData.usesPercent = Math.round((systemData.uses / systemData.usesMax) * 100);
    }
  }

  /**
   * Override getRollData to provide data for roll formulas
   */
  getRollData() {
    const data = {...super.getRollData()};
    return data;
  }

  /**
   * Use this item (for consumables)
   */
  async use() {
    if (this.type !== 'item') {
      ui.notifications.warn("This item cannot be used.");
      return;
    }

    const systemData = this.system;

    // Check if item has uses remaining
    if (systemData.uses <= 0 && systemData.usesMax > 0) {
      ui.notifications.warn(`${this.name} has no uses remaining.`);
      return;
    }

    // Decrease uses
    if (systemData.usesMax > 0) {
      await this.update({
        "system.uses": Math.max(0, systemData.uses - 1)
      });
    }

    // Create chat message for item use
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `Uses ${this.name}!`
    });

    ui.notifications.info(`Used ${this.name}`);
  }
}
