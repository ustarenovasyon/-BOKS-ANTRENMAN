/**
 * IDEMPOTENT STRENGTH TEMPLATE SEED
 * Validation-öncesi, stabil ID upsert. Tekrar çalışında count 16 kalır.
 */
import { strengthTemplateRepository } from '@/lib/localData/repositories/strengthTemplateRepository';
import { STRENGTH_TEMPLATES, validateStrengthTemplateLibrary } from './strengthTemplates';
import { nowIso } from '@/lib/localData/time';

export async function seedStrengthTemplates() {
  const validation = validateStrengthTemplateLibrary(STRENGTH_TEMPLATES);
  if (!validation.valid) {
    throw new Error(`Strength template library geçersiz: ${validation.error}`);
  }
  const now = nowIso();
  for (const template of STRENGTH_TEMPLATES) {
    const existing = await strengthTemplateRepository.getById(template.id);
    const record = {
      ...template,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await strengthTemplateRepository.save(record);
  }
  return { count: STRENGTH_TEMPLATES.length, warnings: validation.warnings || [] };
}