import { expect } from 'chai'
import { get, writable } from 'svelte/store'
import { Store, subStore, convertStore, SafeStore, derivedStore } from '../src/index.js'

describe('deepstore', () => {
  const teststore = new Store({ deep: { value: 'here' }, hello: 'world' })

  it('store notifies subscribers when updated, but not when nothing changes', async () => {
    let updatecount = 0
    const unsubscribe = teststore.subscribe(v => updatecount++)
    expect(updatecount).to.equal(1)
    const unsubscribe2 = teststore.subscribe(v => updatecount++)
    expect(updatecount).to.equal(2)
    teststore.update(v => ({ ...v, anotherprop: 'test' }))
    expect(updatecount).to.equal(4)
    teststore.update(v => ({ ...v, anotherprop: 'test' }))
    expect(updatecount).to.equal(4)
    unsubscribe()
    unsubscribe2()
  })

  it('convertstore can stay in sync with a writable', async () => {
    const store = writable(0)
    const syncstore = convertStore(store)
    store.set(5)
    expect(get(store)).to.equal(5)
    expect(get(syncstore)).to.equal(5)
    syncstore.set(20)
    expect(get(store)).to.equal(20)
    expect(get(syncstore)).to.equal(20)
  })

  it('derivedstore can stay in sync with one parent store', async () => {
    const derivedstore = derivedStore(teststore, v => v.deep.value)
    teststore.update(v => ({ ...v, deep: { ...v.deep, value: 'there' } }))
    expect(get(derivedstore)).to.equal('there')
    teststore.update(v => ({ ...v, deep: { ...v.deep, value: 'here' } }))
    expect(get(derivedstore)).to.equal('here')
  })

  it('derivedstore can stay in sync with two parent stores', async () => {
    const a = new Store(1)
    const b = new Store(1)
    const sumstore = derivedStore([a, b], ([va, vb]) => va + vb)
    expect(get(sumstore)).to.equal(2)
    a.set(4)
    expect(get(sumstore)).to.equal(5)
    b.set(4)
    expect(get(sumstore)).to.equal(8)
  })

  it('derivedstore can stay in sync with two parent stores where state is an object', async () => {
    const a = new Store({ deep: 1 })
    const b = new Store({ deep: 1 })
    const sumstore = derivedStore([a, b], ([va, vb]) => va.deep + vb.deep)
    expect(get(sumstore)).to.equal(2)
    a.set({ deep: 4 })
    expect(get(sumstore)).to.equal(5)
    b.set({ deep: 4 })
    expect(get(sumstore)).to.equal(8)
  })

  it('derivedstore can stay in sync with two parent writables where state is an object', async () => {
    const a = writable({ deep: 2 })
    const b = writable({ deep: 1 })
    const sumstore = derivedStore([a, b], ([va, vb]) => va.deep + vb.deep)
    expect(get(sumstore)).to.equal(3)
    a.set({ deep: 4 })
    expect(get(sumstore)).to.equal(5)
    b.update(v => { v.deep = 4; return v })
    expect(get(sumstore)).to.equal(8)
  })

  it('derivedstore works with two parents and a longterm subscriber', async () => {
    const a = writable({ deep: 2 })
    const b = writable({ deep: 1 })
    const sumstore = derivedStore([a, b], ([va, vb]) => va.deep + vb.deep)
    let run = 0
    const unsubscribe = sumstore.subscribe(sum => {
      if (++run === 1) expect(sum).to.equal(3)
      else if (run === 2) expect(sum).to.equal(5)
      else expect(sum).to.equal(8)
    })
    a.set({ deep: 4 })
    b.update(v => { v.deep = 4; return v })
    unsubscribe()
  })

  it('substore should stay in sync with parent', async () => {
    const substore = subStore(teststore, 'deep.value')

    expect(get(substore)).to.equal('here')
    substore.set('there')
    expect(get(substore)).to.equal('there')
    expect(get(teststore).deep.value).to.equal('there')

    teststore.update(v => ({ ...v, deep: { value: 'here' } }))
    expect(get(substore)).to.equal('here')
    expect(get(teststore).deep.value).to.equal('here')
  })

  it('safestore should be safe against mutations', async () => {
    const safestore = new SafeStore({ hello: 'there' })
    let count = 0
    const unsubscribe = safestore.subscribe(v => {
      count++
      if (count === 1) expect(v.hello).to.equal('there')
      else expect(v.hello).to.equal('friend')
    })
    safestore.update(v => { v.hello = 'friend'; return v })
    expect(count).to.be.greaterThan(1)
    unsubscribe()
  })
})
