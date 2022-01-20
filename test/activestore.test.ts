/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { ActiveStore } from '../src/index.js'

describe('activestore', () => {
  const teststore = new ActiveStore({ deep: { value: 'here' }, hello: 'world' })

  it('store notifies subscribers when updated, even when nothing changes', async () => {
    let updatecount = 0
    const unsubscribe = teststore.subscribe(v => updatecount++)
    expect(updatecount).to.equal(1)
    const unsubscribe2 = teststore.subscribe(v => updatecount++)
    expect(updatecount).to.equal(2)
    teststore.update(v => ({ ...v, anotherprop: 'test' }))
    expect(updatecount).to.equal(4)
    teststore.update(v => ({ ...v, anotherprop: 'test' }))
    expect(updatecount).to.equal(6)
    unsubscribe()
    unsubscribe2()
  })
})
