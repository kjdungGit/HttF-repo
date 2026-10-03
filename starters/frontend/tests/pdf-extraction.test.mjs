import {extractTaxPdf} from './pdf-engine.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { confirmedRecord, decimalValue, templates } from '../src/utils/pdf/tax-extraction.mjs';
const fixture = name => readFileSync(new URL(`./fixtures/pdf/${name}`, import.meta.url));

test('filled English and Spanish 1040 produce identical keys despite a line moving to a different page', async () => {
  const english = await extractTaxPdf(fixture('1040-en.pdf'));
  const spanish = await extractTaxPdf(fixture('1040-es.pdf'));
  assert.deepEqual(english.fields, spanish.fields);
  assert.equal(english.fields.wages, '42000.25');
  assert.equal(english.fields.adjustments_to_income, '1000.00');
  assert.equal(english.fields.total_federal_withholding, '4500.50');
  assert.equal(english.evidence.adjustments_to_income.page, 1);
  assert.equal(spanish.evidence.adjustments_to_income.page, 2);
  assert.equal(spanish.language, 'es');
  assert.doesNotMatch(JSON.stringify(spanish), /999999999/); // no bank data in output
  assert.notEqual(english.sourceHash, templates.find(t => t.id === english.templateId).sourceHash);
});

test('translated Schedule 2 shifted widget IDs map to the same line key', async () => {
  const english = await extractTaxPdf(fixture('schedule2-en.pdf'));
  const spanish = await extractTaxPdf(fixture('schedule2-es.pdf'));
  assert.deepEqual(english.fields, spanish.fields);
  assert.equal(english.fields.line_4, '123.45');
  assert.notEqual(english.evidence.line_4.fieldName, spanish.evidence.line_4.fieldName);
});

test('blank mapped templates return no invented values', async () => {
  for (const template of templates.filter(t => t.fields.some(f => f.key))) {
    const result = await extractTaxPdf(readFileSync(new URL(`../../../${template.source}`, import.meta.url)));
    assert.ok(Object.values(result.fields).every(value => value === null), template.id);
  }
});

test('currency parsing preserves zero and rejects ambiguous separators and text', () => {
  assert.equal(decimalValue('0'), '0.00');
  assert.equal(decimalValue('$1,234.50'), '1234.50');
  assert.equal(decimalValue('(125.50)'), '-125.50');
  for (const value of ['', '1.234,50', '12,34', 'about 300', '1e6']) assert.equal(decimalValue(value), null);
});

test('confirmed records accept only mapped keys and preserve form identity', () => {
  const input = { confirmed: true, recordId: randomUUID(), templateId: 'f1040sp--2025', fields: { wages: '42000', total_federal_withholding: '4500.50', amount_owed: null } };
  const result = confirmedRecord(input);
  assert.equal(result.record.form_type, '1040');
  assert.equal(result.record.language, 'es');
  assert.equal(result.record.fields.wages, '42000.00');
  assert.equal(result.record.id, input.recordId);
  assert.throws(() => confirmedRecord({ ...input, confirmed: false }), error => error.code === 'REVIEW_REQUIRED');
  assert.throws(() => confirmedRecord({ ...input, fields: { role: 'admin' } }), error => error.code === 'INVALID_FIELDS');
  assert.throws(() => confirmedRecord({ ...input, fields: { wages: '1.234,50' } }), error => error.code === 'INVALID_FIELDS');
  assert.throws(() => confirmedRecord({ ...input, fields: { wages: null } }), error => error.code === 'EMPTY_FIELDS');
});

test('non-PDF inputs and unmapped forms fail without guessing', async () => {
  await assert.rejects(extractTaxPdf(Buffer.from('not a PDF')), error => error.code === 'INVALID_PDF');
  await assert.rejects(extractTaxPdf(readFileSync(new URL('../../../English Tax Forms/fw10.pdf', import.meta.url))), error => error.code === 'NO_REVIEWED_MAPPING');
});
