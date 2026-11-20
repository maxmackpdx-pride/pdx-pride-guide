import assert from 'node:assert/strict';

export const placeDialog = page => page.locator('.zay-card-stage.placez-stage .placez-native-dialog[aria-modal=true]:visible');

export async function checkPlaceStage(page) {
  const dialog = placeDialog(page);
  await dialog.waitFor();
  const frame = await dialog.evaluate(el => {
    const box = el.getBoundingClientRect();
    const stage = el.closest('.zay-card-stage');
    const bounds = stage.getBoundingClientRect();
    return {
      fixed: getComputedStyle(stage).position === 'fixed',
      portal: stage.parentElement === document.body,
      top: box.top, bottom: box.bottom, left: box.left, right: box.right,
      stageTop: bounds.top, stageBottom: bounds.bottom, width: innerWidth
    };
  });
  assert.ok(frame.fixed && frame.portal,'Placez opens in the viewport portal');
  assert.ok(Math.abs(frame.left-(frame.width-frame.right))<2,'expanded Placez is centered');
  assert.ok(frame.top>=frame.stageTop-1 && frame.bottom<=frame.stageBottom+1,'expanded Placez fits the available stage');
  if (frame.width<640) assert.ok(Math.abs(frame.left-10)<2,'expanded place keeps a ten-pixel mobile gutter');
  assert.ok(frame.right-frame.left>=Math.min(300,frame.width-24),'expanded place has usable width');
  const close = dialog.getByRole('button',{name:/^Close /});
  assert.ok(await close.isVisible(),'expanded Placez exposes a close control');
  return dialog;
}
