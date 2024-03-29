import { clone, get, set } from 'txstate-utils'
import { Store } from './store.js'
import { type WritableSubject } from './activestore.js'
import { SafeStore } from './safestore.js'
type ObjectOrArray = Record<string, any> | Array<any> | null | undefined

/**
 * Create a store that represents a part of a larger store. Updates to the parent store will propagate
 * down to the SubStore as appropriate, and updates to the SubStore will propagate
 * back up to the parent store. This requires both a getter and setter function to handle each
 * direction. The setter is given the new SubStore state and the existing parent store state and
 * should return a new state for the parent store.
 *
 * Alternatively, a dot-prop string can be provided and both the getter and setter will be automatically
 * generated. For example, a parent store containing state { deep: { value: 'here' }, hello: 'world' }
 * could be used with the getter string "deep.value". The SubStore's initial state would be "here", and
 * updating it to "there" would update the parent store state to { deep: { value: 'there' }, hello: 'world' }
 */
export class SubStore<SubType, ParentType extends ObjectOrArray = ObjectOrArray> extends Store<SubType> {
  protected parentStore: WritableSubject<ParentType>
  protected setter: (value: SubType, state: ParentType) => ParentType

  constructor (store: WritableSubject<ParentType>, getter: keyof ParentType | string | ((value: ParentType) => SubType), setter?: (value: SubType, state: ParentType) => ParentType) {
    super({} as any)
    if (!(store instanceof SafeStore)) this.clone = clone
    if (typeof getter === 'string') {
      const accessor = getter
      getter = parentValue => get(parentValue, accessor)
      setter = (newValue, parentValue) => set(parentValue, accessor, newValue)
    }
    this.parentStore = store
    this.setter = setter!
    this.registerSource(() => store.subscribe(v => {
      super.set((getter as any)(v))
    }))
  }

  set (value: SubType) {
    this.parentStore.update(parentValue => { return this.setter(value, parentValue) })
  }
}

export function subStore <SubType, ParentType extends ObjectOrArray, A extends keyof ParentType> (store: WritableSubject<ParentType>, accessor: A): SubStore<ParentType[A], ParentType>
export function subStore <SubType, ParentType extends ObjectOrArray = ObjectOrArray> (store: WritableSubject<ParentType>, accessor: string): SubStore<SubType, ParentType>
export function subStore <SubType, ParentType extends ObjectOrArray> (store: WritableSubject<ParentType>, getter: (value: ParentType) => SubType, setter: (value: SubType, state: ParentType) => ParentType): SubStore<SubType, ParentType>
export function subStore <SubType, ParentType extends ObjectOrArray = ObjectOrArray> (store: WritableSubject<ParentType>, getter: keyof ParentType | string | ((value: ParentType) => SubType), setter?: (value: SubType, state: ParentType) => ParentType) {
  return new SubStore(store, getter, setter)
}
