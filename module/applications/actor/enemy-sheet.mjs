/**
 * Enemy/NPC/Boss Sheet for Enemy-type Actors
 */
export default class EnemySheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["emblem", "sheet", "actor", "enemy"],
      width: 600,
      height: 700,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  get template() {
    return `systems/emblem/templates/actor/enemy-sheet.hbs`;
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
    context.items = this.actor.items.filter(i => i.type === 'item');

    // Get equipped weapon
    context.equippedWeapon = context.weapons.find(w => w.system.equipped);

    // Enrich description
    context.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description, {async: true});

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Item management
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.item-equip').click(this._onItemEquip.bind(this));
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
}
