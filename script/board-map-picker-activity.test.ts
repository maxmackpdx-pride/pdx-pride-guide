import assert from "node:assert/strict";
import test from "node:test";
import { acquireBoardMapPicker, isBoardMapPickerOpen, subscribeBoardMapPicker } from "../client/src/lib/boardMapPickerActivity";

test("covered map resumes only after its last picker closes, including repeated cleanup", () => {
  const states: boolean[] = [];
  const unsubscribe = subscribeBoardMapPicker(() => states.push(isBoardMapPickerOpen()));
  assert.equal(isBoardMapPickerOpen(), false);
  const closeFirst = acquireBoardMapPicker();
  assert.equal(isBoardMapPickerOpen(), true);
  const closeSecond = acquireBoardMapPicker();
  closeFirst();
  assert.equal(isBoardMapPickerOpen(), true);
  closeFirst();
  assert.equal(isBoardMapPickerOpen(), true);
  closeSecond();
  assert.equal(isBoardMapPickerOpen(), false);
  assert.deepEqual(states, [true, true, true, false]);
  unsubscribe();
  const closeRemount = acquireBoardMapPicker();
  closeRemount();
  assert.equal(states.length, 4);
  assert.equal(isBoardMapPickerOpen(), false);
});
