/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { ActiveStore, derivedStore, subStore } from '../src/index.js'

describe('activestore', () => {
  it('store notifies subscribers when updated, even when nothing changes', async () => {
    const teststore = new ActiveStore({ deep: { value: 'here' }, hello: 'world' })
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

  it('should notify derived stores when it changes', async () => {
    const teststore = new ActiveStore({ deep: { value: 'here' }, hello: 'world' })
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
    const teststore = new ActiveStore({ deep: { value: 'here' }, hello: 'world' })
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
  it('should be able to have two substores that update each other with mutating sets', async () => {
    const teststore = new ActiveStore({ deep: { value: 'here' }, hello: 'world' })
    const deepsub1 = subStore(teststore, 'deep')
    const deepsub2 = subStore(teststore, 'deep')
    let v1: any
    let v2: any
    const unsub1 = deepsub1.subscribe(v => { v1 = v })
    const unsub2 = deepsub2.subscribe(v => { v2 = v })
    v1.value = 'blah'
    deepsub1.set(v1)
    expect((teststore as any).value).to.deep.equal({ deep: { value: 'blah' }, hello: 'world' })
    expect(v1).to.deep.equal({ value: 'blah' })
    expect(v2).to.deep.equal({ value: 'blah' })
    unsub1()
    unsub2()
  })
})
