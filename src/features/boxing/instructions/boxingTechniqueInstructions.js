/**
 * BOXING TECHNIQUE INSTRUCTION LAYER (PART 37)
 * --------------------------------------------------------------
 * Statik öğretim talimatlarıdır; sensör/kamera gözlemi veya skor DEĞİLDİR.
 * Movement identity ve teknik sınıflandırma için BOXING_MOVES tek source-of-truth.
 * Generator/persisted blueprint alanı değildir.
 * --------------------------------------------------------------
 */
import {
  BOXING_FAMILIES,
  BOXING_FOOTWORK_DIRECTIONS,
  BOXING_FOOTWORK_INTEGRATION_PHASES,
  BOXING_MOVEMENT_TYPES,
  BOXING_SIDE_ROLES,
  BOXING_TARGETS,
  WORKOUT_BLOCK_TYPES,
} from '@/config/architecture';
import { BOXING_MOVES } from '@/features/boxing/library/boxingMoves';

export const BOXING_TECHNIQUE_INSTRUCTION_MODE = 'instruction_only';

const MOVE_BY_ID = new Map(BOXING_MOVES.map((move) => [move.id, move]));

function roleLabel(sideRole) {
  if (sideRole === BOXING_SIDE_ROLES.LEAD) return 'Lead';
  if (sideRole === BOXING_SIDE_ROLES.REAR) return 'Rear';
  return null;
}

function targetLabel(target) {
  if (target === BOXING_TARGETS.BODY) return 'gövde';
  if (target === BOXING_TARGETS.HEAD) return 'baş';
  return null;
}

function strikeTechniqueCue(move) {
  const role = roleLabel(move.sideRole);
  const target = targetLabel(move.target);
  if (!role || !target) return null;

  if (move.family === BOXING_FAMILIES.STRAIGHT) {
    return `${role} eli ${target} hedefe düz hatta uzat; omzu kontrollü öne getir ve eli aynı hatta gardına döndür.`;
  }
  if (move.family === BOXING_FAMILIES.HOOK) {
    return `${role} Hook'u ${target} hedefe kısa ve kontrollü yayda çıkar; dirsek-bilek hattını koru ve gövde dönüşünü abartma.`;
  }
  if (move.family === BOXING_FAMILIES.UPPERCUT) {
    return `${role} Uppercut'ı ${target} hedefe kısa dikey hatta çıkar; diz ve gövdeyi kontrollü kullan, yumruğu geniş savurma.`;
  }
  return null;
}

function defenseTechniqueCue(move) {
  const role = roleLabel(move.sideRole);
  if (!role) return null;

  if (move.family === BOXING_FAMILIES.SLIP) {
    return `${role} tarafa küçük merkez-hat kaçışı yap; hareketi belden koparmadan diz ve gövdeyle kontrollü uygula.`;
  }
  if (move.family === BOXING_FAMILIES.CATCH) {
    return `${role} gard tarafında gelen düz vuruşu küçük bir karşılama hareketiyle al; eli ileri uzatıp gardı açma.`;
  }
  return null;
}

function footworkTechniqueCue(move) {
  if (move.direction === BOXING_FOOTWORK_DIRECTIONS.FORWARD) {
    return 'Lead ayak adımı başlatsın; Rear ayak duruş mesafesini yeniden kursun.';
  }
  if (move.direction === BOXING_FOOTWORK_DIRECTIONS.BACKWARD) {
    return 'Rear ayak adımı başlatsın; Lead ayak duruş mesafesini yeniden kursun.';
  }
  if (move.direction === BOXING_FOOTWORK_DIRECTIONS.LATERAL_LEAD) {
    return 'Lead-side yöne Lead ayakla başla; Rear ayağı çaprazlamadan duruş mesafesine getir.';
  }
  if (move.direction === BOXING_FOOTWORK_DIRECTIONS.LATERAL_REAR) {
    return 'Rear-side yöne Rear ayakla başla; Lead ayağı çaprazlamadan duruş mesafesine getir.';
  }
  return null;
}

function techniqueCue(move) {
  if (move.movementType === BOXING_MOVEMENT_TYPES.STRIKE) return strikeTechniqueCue(move);
  if (move.movementType === BOXING_MOVEMENT_TYPES.DEFENSE) return defenseTechniqueCue(move);
  if (move.movementType === BOXING_MOVEMENT_TYPES.FOOTWORK) return footworkTechniqueCue(move);
  return null;
}

function guardReminder(move) {
  if (move.movementType === BOXING_MOVEMENT_TYPES.STRIKE) {
    return 'Vurmayan eli çene hattında tut; vuran eli gecikmeden gardına geri getir.';
  }
  if (move.movementType === BOXING_MOVEMENT_TYPES.DEFENSE) {
    return 'İki eli gard hattında tut; savunma sonrası nötr gard pozisyonuna dön.';
  }
  if (move.movementType === BOXING_MOVEMENT_TYPES.FOOTWORK) {
    return 'Adım boyunca elleri gard hattında tut; yer değiştirme sırasında kolları düşürme.';
  }
  return null;
}

function balanceReminder(move) {
  if (move.movementType === BOXING_MOVEMENT_TYPES.STRIKE) {
    return 'Ağırlığı kontrollü aktar; vuruş sonunda iki ayakla duruş genişliğini koru.';
  }
  if (move.movementType === BOXING_MOVEMENT_TYPES.DEFENSE) {
    return 'Baş hareketini küçük tut; ayak tabanlarını ve duruş tabanını koru.';
  }
  if (move.movementType === BOXING_MOVEMENT_TYPES.FOOTWORK) {
    return 'Ayakları çaprazlama; adım sonunda duruş genişliğini ve taban dengesini yeniden kur.';
  }
  return null;
}

function repetitionObjective(move) {
  if (move.movementType === BOXING_MOVEMENT_TYPES.STRIKE) {
    return 'Aynı vuruş hattını, kontrollü hızı ve gard dönüşünü her tekrarda koru.';
  }
  if (move.movementType === BOXING_MOVEMENT_TYPES.DEFENSE) {
    return 'Küçük savunma hareketini ve nötr garda dönüşü kontrollü tekrar et.';
  }
  if (move.movementType === BOXING_MOVEMENT_TYPES.FOOTWORK) {
    return 'Sessiz ve kontrollü adım uygula; her tekrar sonunda duruşu yeniden kur.';
  }
  return null;
}

/**
 * Unknown/inactive/unapproved movement -> null (fail-safe).
 * Result instruction-only semantics taşır; observed score/accuracy alanı yoktur.
 */
export function getBoxingTechniqueInstruction(moveId) {
  const move = MOVE_BY_ID.get(moveId);
  if (!move || move.approved !== true || move.active !== true) return null;

  const instruction = {
    movementId: move.id,
    canonicalName: move.canonicalName,
    mode: BOXING_TECHNIQUE_INSTRUCTION_MODE,
    techniqueCue: techniqueCue(move),
    guardReminder: guardReminder(move),
    balanceReminder: balanceReminder(move),
    repetitionObjective: repetitionObjective(move),
  };

  if (!instruction.techniqueCue || !instruction.guardReminder || !instruction.balanceReminder || !instruction.repetitionObjective) {
    return null;
  }
  return Object.freeze(instruction);
}

function instructionStep(movementId, phase) {
  const instruction = getBoxingTechniqueInstruction(movementId);
  return instruction ? Object.freeze({ phase, instruction }) : null;
}

/**
 * Workout block'tan future Workout/Preview katmanının tüketebileceği öğretim sırası.
 * Source block mutate edilmez; punch moveCount yeniden hesaplanmaz/değiştirilmez.
 */
export function buildWorkoutBlockInstructionSequence(block) {
  if (!block || typeof block !== 'object') return [];
  const steps = [];

  if (block.type === WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE) {
    const step = instructionStep(block.footworkMoveId, 'isolated_technique');
    return step ? Object.freeze([step]) : Object.freeze([]);
  }

  if (block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK) {
    const actions = Array.isArray(block.footworkPrescription?.actions)
      ? block.footworkPrescription.actions
      : [];

    for (const action of actions.filter((item) => item?.phase === BOXING_FOOTWORK_INTEGRATION_PHASES.BEFORE_COMBO)) {
      const step = instructionStep(action.movementId, BOXING_FOOTWORK_INTEGRATION_PHASES.BEFORE_COMBO);
      if (step) steps.push(step);
    }
    for (const movementId of Array.isArray(block.moveIds) ? block.moveIds : []) {
      const step = instructionStep(movementId, 'combo');
      if (step) steps.push(step);
    }
    for (const action of actions.filter((item) => item?.phase === BOXING_FOOTWORK_INTEGRATION_PHASES.AFTER_COMBO)) {
      const step = instructionStep(action.movementId, BOXING_FOOTWORK_INTEGRATION_PHASES.AFTER_COMBO);
      if (step) steps.push(step);
    }
    return Object.freeze(steps);
  }

  if (block.type === WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK) {
    const defense = instructionStep(block.defenseMoveId, 'defense');
    if (defense) steps.push(defense);
    for (const movementId of Array.isArray(block.counterMoveIds) ? block.counterMoveIds : []) {
      const step = instructionStep(movementId, 'counter');
      if (step) steps.push(step);
    }
    return Object.freeze(steps);
  }

  return Object.freeze([]);
}

export function validateTechniqueInstructionCoverage() {
  const activeMoves = BOXING_MOVES.filter((move) => move.approved === true && move.active === true);
  const missing = [];
  for (const move of activeMoves) {
    if (!getBoxingTechniqueInstruction(move.id)) missing.push(move.id);
  }
  return {
    valid: missing.length === 0,
    activeMoveCount: activeMoves.length,
    coveredMoveCount: activeMoves.length - missing.length,
    missing: Object.freeze(missing),
  };
}
