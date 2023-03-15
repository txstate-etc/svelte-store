/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { derivedStore, SafeStore, subStore } from '../src/index.js'

describe('safestore', () => {
  it('store notifies subscribers when state is mutated', () => {
    const teststore = new SafeStore({ deep: { value: 'here' }, hello: 'world' })
    let updatecount = 0
    const unsubscribe = teststore.subscribe(v => updatecount++)
    expect(updatecount).to.equal(1)
    teststore.update(v => { v.deep.value = 'there'; return v })
    expect(updatecount).to.equal(2)
    teststore.update(v => { v.deep.value = 'here'; return v })
    expect(updatecount).to.equal(3)
    unsubscribe()
  })

  it('should notify derived stores when it changes', async () => {
    const teststore = new SafeStore({ deep: { value: 'here' }, hello: 'world' })
    const deepvalue = derivedStore(teststore, 'deep')
    let updatecount = 0
    const unsubscribe = deepvalue.subscribe(v => updatecount++)
    expect(updatecount).to.equal(1)
    teststore.update(v => {
      v.deep.value = 'there'
      return v
    })
    expect(updatecount).to.equal(2)
    unsubscribe()
  })

  it('should be able to have two substores that update each other with mutating updates', async () => {
    const teststore = new SafeStore({ deep: { value: 'here' }, hello: 'world' })
    const deepsub1 = subStore(teststore, 'deep')
    const deepsub2 = subStore(teststore, 'deep')
    let v1: any
    let v2: any
    const unsub1 = deepsub1.subscribe(v => { v1 = v })
    const unsub2 = deepsub2.subscribe(v => { v2 = v })
    deepsub1.update(v => {
      v.value = 'blah'
      return v
    })
    expect((teststore as any).value).to.deep.equal({ deep: { value: 'blah' }, hello: 'world' })
    expect(v1).to.deep.equal({ value: 'blah' })
    expect(v2).to.deep.equal({ value: 'blah' })
    unsub1()
    unsub2()
  })
})
