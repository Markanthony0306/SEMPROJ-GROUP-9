import test from 'node:test'
import assert from 'node:assert/strict'
import { createFaceGestureSequence } from './faceLiveness.js'

function eyeAt(centerX, ratio) {
  return [
    { x: centerX - 2, y: 30 },
    { x: centerX - 1, y: 30 - ratio * 2 },
    { x: centerX + 1, y: 30 - ratio * 2 },
    { x: centerX + 2, y: 30 },
    { x: centerX + 1, y: 30 + ratio * 2 },
    { x: centerX - 1, y: 30 + ratio * 2 }
  ]
}

function landmarks(ratio) {
  return {
    getLeftEye: () => eyeAt(30, ratio),
    getRightEye: () => eyeAt(70, ratio),
    getNose: () =>
      Array.from({ length: 4 }, (_, index) => ({
        x: 50,
        y: index === 3 ? 50 : 45
      }))
  }
}

test('counts a blink when low-resolution landmarks show modest eye closure', () => {
  const sequence = createFaceGestureSequence(['blink', 'left', 'right'])
  const capture = () => ({ frame: 'frame' })

  sequence.observe(landmarks(0.15), capture)
  for (let blink = 0; blink < 3; blink += 1) {
    sequence.observe(landmarks(0.12), capture)
    sequence.observe(landmarks(0.15), capture)
  }

  assert.equal(sequence.blinks, 3)
  assert.equal(sequence.step, 'left')
  assert.equal(sequence.evidence.length, 7)
})
