/**
 * Emblem Tabletop System
 * Entry Point - System Initialization
 */

// Import document classes
import { EmblemActor } from "./module/documents/actor.mjs";
import { EmblemItem } from "./module/documents/item.mjs";

// Import data models
import CharacterData from "./module/data/actor/character-data.mjs";
import EnemyData from "./module/data/actor/enemy-data.mjs";
import WeaponData from "./module/data/item/weapon-data.mjs";
import ClassData from "./module/data/item/class-data.mjs";
import SkillData from "./module/data/item/skill-data.mjs";
import ItemData from "./module/data/item/item-data.mjs";

// Import sheet applications
import CharacterSheet from "./module/applications/actor/character-sheet.mjs";
import EnemySheet from "./module/applications/actor/enemy-sheet.mjs";
import WeaponSheet from "./module/applications/item/weapon-sheet.mjs";
import ClassSheet from "./module/applications/item/class-sheet.mjs";
import SkillSheet from "./module/applications/item/skill-sheet.mjs";
import EmblemItemSheet from "./module/applications/item/item-sheet.mjs";

// Import tactical combat modules
import { MovementRange } from "./module/helpers/MovementRange.mjs";
import { AttackRange } from "./module/helpers/AttackRange.mjs";
import { TokenHoverHandlers } from "./module/helpers/TokenHoverHandlers.mjs";
import { CombatAutomation } from "./module/helpers/CombatAutomation.mjs";
import { CombatPreviewApp } from "./module/applications/CombatPreviewApp.mjs";
import { DurabilitySystem } from "./module/helpers/DurabilitySystem.mjs";
import { TurnStateTracker } from "./module/helpers/TurnStateTracker.mjs";
import TokenWeaponDisplay from "./module/helpers/TokenWeaponDisplay.mjs";
import { InteractiveCombat } from "./module/helpers/InteractiveCombat.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function() {
  console.log('Emblem | Initializing Emblem System v0.1.0-alpha');

  // Add custom constants to game global
  game.emblem = {
    EmblemActor,
    EmblemItem,
    MovementRange,
    AttackRange,
    TokenHoverHandlers,
    CombatAutomation,
    CombatPreviewApp,
    TokenWeaponDisplay,
    DurabilitySystem,
    TurnStateTracker,
    InteractiveCombat
  };
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('multiply', function(a, b) {
    return a * b;
  });

  Handlebars.registerHelper('divide', function(a, b) {
    return b !== 0 ? a / b : 0;
  });

  Handlebars.registerHelper('includes', function(array, value) {
    return Array.isArray(array) && array.includes(value);
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // Define custom Document classes
  CONFIG.Actor.documentClass = EmblemActor;
  CONFIG.Item.documentClass = EmblemItem;

  // Register Data Models for Actors
  CONFIG.Actor.dataModels = {
    character: CharacterData,
    enemy: EnemyData,
    npc: EnemyData,  // NPCs use same data model as enemies for now
    boss: EnemyData  // Bosses use same base, we'll extend later
  };

  // Register Data Models for Items
  CONFIG.Item.dataModels = {
    weapon: WeaponData,
    class: ClassData,
    skill: SkillData,
    item: ItemData
  };

  // Unregister default sheets
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  // Register sheet application classes
  Actors.registerSheet("emblem", CharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "EMBLEM.SheetClassCharacter"
  });

  Actors.registerSheet("emblem", EnemySheet, {
    types: ["enemy", "npc", "boss"],
    makeDefault: true,
    label: "EMBLEM.SheetClassEnemy"
  });

  // Register Item sheet application classes
  Items.registerSheet("emblem", WeaponSheet, {
    types: ["weapon"],
    makeDefault: true,
    label: "EMBLEM.SheetClassWeapon"
  });

  Items.registerSheet("emblem", ClassSheet, {
    types: ["class"],
    makeDefault: true,
    label: "EMBLEM.SheetClassClass"
  });

  Items.registerSheet("emblem", SkillSheet, {
    types: ["skill"],
    makeDefault: true,
    label: "EMBLEM.SheetClassSkill"
  });

  Items.registerSheet("emblem", EmblemItemSheet, {
    types: ["item"],
    makeDefault: true,
    label: "EMBLEM.SheetClassItem"
  });

  // Register game settings
  game.settings.register("emblem", "combatResolutionMode", {
    name: "Combat Resolution Mode",
    hint: "Automatic: Resolves all attacks instantly. Interactive: Requires clicking to resolve each attack step-by-step.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      "auto": "Automatic (Instant)",
      "interactive": "Interactive (Step-by-Step)"
    },
    default: "auto"
  });

  console.log('Emblem | Data models and sheets registered');
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function() {
  console.log('Emblem | System ready');
  
  // Initialize tactical combat systems
  console.log('Emblem | Initializing TokenHoverHandlers...');
  TokenHoverHandlers.initialize();
  
  console.log('Emblem | Initializing CombatAutomation...');
  CombatAutomation.initialize();
  
  console.log('Emblem | Initializing DurabilitySystem...');
  DurabilitySystem.initialize();
  
  console.log('Emblem | Initializing TurnStateTracker...');
  TurnStateTracker.initialize();
  
  console.log('Emblem | Initializing TokenWeaponDisplay...');
  TokenWeaponDisplay.init();
  
  console.log('Emblem | Initializing InteractiveCombat...');
  InteractiveCombat.initialize();
  
  console.log('Emblem | Tactical combat systems initialized');
  
  // Display welcome message
  ui.notifications.info("Emblem System loaded successfully!");
});

/* -------------------------------------------- */
/*  Token HUD Hook                              */
/* -------------------------------------------- */

Hooks.on('renderTokenHUD', (hud, html, data) => {
  TurnStateTracker.addWaitButton(hud, html, data);
});
