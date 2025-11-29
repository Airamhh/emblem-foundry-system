/**
 * Character Sheet for Character-type Actors
 */
export default class CharacterSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["emblem", "sheet", "actor", "character"],
      width: 720,
      height: 800,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  get template() {
    return `systems/emblem/templates/actor/character-sheet.hbs`;
  }

  /** @override */
  async getData() {
    const context = super.getData();
    
    // Add the actor's data to context
    context.system = this.actor.system;
    context.flags = this.actor.flags;

    // Prepare items
    context.weapons = this.actor.items.filter(i => i.type === 'weapon');
    context.skills = this.actor.items.filter(i => i.type === 'skill');
    context.classes = this.actor.items.filter(i => i.type === 'class');
    context.items = this.actor.items.filter(i => i.type === 'item');

    // Get equipped weapon
    context.equippedWeapon = context.weapons.find(w => w.system.equipped);

    // Calculate HP percentage for bar
    const hp = this.actor.system.stats.hp;
    context.hpPercent = Math.round((hp.value / hp.max) * 100);

    // Check if can level up (needs 100 exp)
    context.canLevelUp = (this.actor.system.experience >= 100);

    // Enrich biography
    context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.biography, {async: true});

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Rollable abilities
    html.find('.rollable').click(this._onRoll.bind(this));

    // Item management
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.item-equip').click(this._onItemEquip.bind(this));
    html.find('.item-use').click(this._onItemUse.bind(this));

    // Level up
    html.find('.level-up').click(this._onLevelUp.bind(this));
  }

  /**
   * Handle clickable rolls
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.rollType) {
      if (dataset.rollType === 'stat') {
        const stat = dataset.stat;
        const value = this.actor.system.stats[stat].value;
        
        const roll = await new Roll(`1d100`).evaluate();
        const success = roll.total <= value;

        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `${stat.toUpperCase()} Check: ${value} - ${success ? 'Success!' : 'Failure'}`,
          rollMode: game.settings.get('core', 'rollMode')
        });
      }
    }
  }

  /**
   * Handle creating a new Owned Item for the actor
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      system: {}
    };
    
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle editing an item
   */
  _onItemEdit(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item-table-row, .item");
    const item = this.actor.items.get(row.data("itemId"));
    if (item) {
      item.sheet.render(true);
    }
  }

  /**
   * Handle deleting an item
   */
  async _onItemDelete(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item-table-row, .item");
    const item = this.actor.items.get(row.data("itemId"));
    
    if (item) {
      await item.delete();
      row.slideUp(200, () => this.render(false));
    }
  }

  /**
   * Handle equipping/unequipping a weapon
   */
  async _onItemEquip(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item-table-row, .item");
    const item = this.actor.items.get(row.data("itemId"));
    
    if (item && item.type === 'weapon') {
      const isCurrentlyEquipped = item.system.equipped;
      const updates = [];
      
      // Unequip all other weapons first
      for (let weapon of this.actor.items.filter(i => i.type === 'weapon' && i.system.equipped && i.id !== item.id)) {
        updates.push({_id: weapon.id, 'system.equipped': false});
      }
      
      // Toggle equip this weapon
      updates.push({_id: item.id, 'system.equipped': !isCurrentlyEquipped});
      
      // Update all weapons at once to avoid multiple re-renders
      await this.actor.updateEmbeddedDocuments('Item', updates, {render: false});
      
      // Update UI manually without full re-render
      $(this.element).find('.item-table-row').removeClass('equipped');
      if (!isCurrentlyEquipped) {
        row.addClass('equipped');
        row.find('.item-equip i').removeClass('fa-circle').addClass('fa-check-circle');
      } else {
        row.find('.item-equip i').removeClass('fa-check-circle').addClass('fa-circle');
      }
      
      // Update other rows
      $(this.element).find('.item-table-row').not(row).each(function() {
        $(this).find('.item-equip i').removeClass('fa-check-circle').addClass('fa-circle');
      });
    }
  }

  /**
   * Handle using an item
   */
  async _onItemUse(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item-table-row, .item");
    const item = this.actor.items.get(row.data("itemId"));
    
    if (item && item.type === 'item') {
      await item.use();
    }
  }

  /**
   * Handle leveling up
   */
  async _onLevelUp(event) {
    event.preventDefault();
    
    const system = this.actor.system;
    const growthRates = system.growthRates;
    const stats = system.stats;
    
    // Roll for each stat
    const increases = {};
    const statNames = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];
    
    for (let stat of statNames) {
      const roll = Math.floor(Math.random() * 100) + 1;
      if (roll <= growthRates[stat]) {
        increases[stat] = 1;
      } else {
        increases[stat] = 0;
      }
    }
    
    // Apply increases
    const updates = {};
    for (let stat of statNames) {
      if (increases[stat] > 0) {
        const newValue = Math.min(stats[stat].value + increases[stat], stats[stat].max);
        updates[`system.stats.${stat}.value`] = newValue;
        
        // For HP, also increase max
        if (stat === 'hp') {
          updates[`system.stats.${stat}.max`] = newValue;
        }
      }
    }
    
    // Increase level
    updates['system.level'] = system.level + 1;
    updates['system.experience'] = 0;
    
    await this.actor.update(updates);
    
    // Create chat message showing growth
    const growthMessage = statNames
      .filter(s => increases[s] > 0)
      .map(s => `${s.toUpperCase()} +${increases[s]}`)
      .join(', ');
    
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<h3>Level Up!</h3><p>${this.actor.name} reached Level ${system.level + 1}!</p><p><strong>Stat Increases:</strong> ${growthMessage || 'None'}</p>`
    });
  }
}
