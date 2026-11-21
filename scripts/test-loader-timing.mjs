import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLoaderTimer, LOADER_DURATION_MS } from '../src/utils/loaderTiming.js'

function fakeClock() {
  let time = 0
  let nextId = 0
  const tasks = new Map()
  const clock = {
    now: () => time,
    schedule(callback, delay) {
      const id = nextId++
      tasks.set(id, { callback, at: time + delay })
      return id
    },
    cancel: (id) => tasks.delete(id),
    advance(milliseconds) {
      const end = time + milliseconds
      for (;;) {
        const next = [...tasks.entries()].sort((a, b) => a[1].at - b[1].at)[0]
        if (!next || next[1].at > end) break
        time = next[1].at
        tasks.delete(next[0])
        next[1].callback()
      }
      time = end
    }
  }
  return clock
}

test('the shared loader completes at exactly 1000 ms, once', () => {
  assert.equal(LOADER_DURATION_MS, 1000)
  const clock = fakeClock()
  const completions = []
  const timer = createLoaderTimer(() => completions.push(clock.now()), clock)
  timer.start()
  timer.start()
  clock.advance(999)
  assert.deepEqual(completions, [])
  clock.advance(1)
  assert.deepEqual(completions, [1000])
  timer.start()
  clock.advance(1000)
  assert.deepEqual(completions, [1000])
})

test('StrictMode cleanup and resume preserve the original one-second deadline', () => {
  const clock = fakeClock()
  const completions = []
  const timer = createLoaderTimer(() => completions.push(clock.now()), clock)
  timer.start()
  clock.advance(200)
  timer.stop()
  timer.start()
  clock.advance(799)
  assert.deepEqual(completions, [])
  clock.advance(1)
  assert.deepEqual(completions, [1000])
})

test('unmounting cancels the pending completion', () => {
  const clock = fakeClock()
  let completions = 0
  const timer = createLoaderTimer(() => completions++, clock)
  timer.start()
  clock.advance(250)
  timer.stop()
  clock.advance(2000)
  assert.equal(completions, 0)
})
