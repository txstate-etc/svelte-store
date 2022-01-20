/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { SafeStore } from '../src/index.js'

describe('safestore', () => {
  const teststore = new SafeStore({ deep: { value: 'here' }, hello: 'world' })

  it('store notifies subscribers when state is mutated', () => {
    let updatecount = 0
    const unsubscribe = teststore.subscribe(v => updatecount++)
    expect(updatecount).to.equal(1)
    teststore.update(v => { v.deep.value = 'there'; return v })
    expect(updatecount).to.equal(2)
    teststore.update(v => { v.deep.value = 'here'; return v })
    expect(updatecount).to.equal(3)
    unsubscribe()
  })
})
