# svelte-store
Support library offering several new types of store compatible with the basic svelte readable/writable stores.
<br />

## General Interfaces
Our basic interfaces cover what type of access to the value we want our different subscribers to have:
```mermaid
classDiagram
direction LR
  class UsableSubject {
    <<interface>>
    subscribe(observer: (value: T) => void) => () => void
  }
  link UsableSubject "https://github.com/txstate-etc/svelte-store/blob/main/src/activestore.ts#:~:text=export%20interface%20UsableSubject" "To Source"

  WriteableSubject~T~ --|> UsableSubject~T~ : extends
  class WriteableSubject {
    <<interface>>
    update(updater: (value: T) => T) => void
  }
  link WriteableSubject "https://github.com/txstate-etc/svelte-store/blob/main/src/activestore.ts#:~:text=export%20interface%20WritableSubject" "To Source"

  SetableSubject~T~ --|> WriteableSubject~T~ : extends
  class SetableSubject {
     <<interface>>
     set(value: T) => void
  }
  link SetableSubject "https://github.com/txstate-etc/svelte-store/blob/main/src/activestore.ts#:~:text=export%20interface%20SettableSubject" "To Source"
  
  class Writeable~T~ {<<svelte store>>}
  link Writeable "https://svelte.dev/docs#run-time-svelte-store" "Svelte Writeable Store"
  
  class DerivedStoreOptions {
    <<interface>>
    debounce?: number|boolean
  }
  link DerivedStoreOptions "https://github.com/txstate-etc/svelte-store/blob/main/src/derivedstore.ts#:~:text=export%20interface%20DerivedStoreOptions" "To Source"
```
<br />

## New Store Classes
Due to the sub-property mutability limitations of the native Svelte Stores a solution was desired that would allow flexibility for more deeply nested value states. In addition there are situations where callbacks are desired on value updates regardless of the value actually changing.

- `ActiveStore` - actively calls subscribers back regardless of whether the update to value was a change or not.
- `Store` - extends `ActiveStore` overriding its `equal` to do a `deepEqual`. Note that this not only returns back to the traditional callback handling on equality but also adds a deeper checking for equality so that any potential sub-states, or object properties, will trigger callbacks instead of just the parent state being evaluated.
- `ConvertedStore` - allows a traditional Svelte Store to be passed in its constructor to return a reference to a new `Store` object with its `set` overrided to handle the differences between this Store framework and the traditional Svelte Store framework. A [`convertStore`](https://github.com/txstate-etc/svelte-store/blob/main/src/convertedstore.ts#:~:text=export%20function%20convertStore) factory function is also exported.
- `SubStore` - Creates a store that will represent a part of a larger store. Updates to the parent store will propagate to SubStores as appropriate and updates to SubStores will propagate back up to parent stores. This is handled by default through the use of dot-prop strings (Example: `{ deep: { value: 'here' }, hello: 'World'}` could refer to that `value` prop as 'deep.value'), OR custom `getter` and `setter` functions could be provided to the [`subStore`](https://github.com/txstate-etc/svelte-store/blob/main/src/substore.ts#:~:text=export%20function%20subStore) factory functions that can provide custom handling of the getting and setting propagation. Note that cloning of `SubStore`s will protect from mutability unless the parent store is an instance of a `SafeStore` with `clone` overridden for its own purposes that do not protect from mutability.
- `SafeStore` - as an extention of `Store`, and unlike `ActiveStore`, this does deep equality checks before notifying subscribers. It additionally actually clones data on its `clone` operation so that it's safe against subscriber mutations. Costs more CPU cycles but also results in fewer notifications to subscribers.
- `DerivedStore` - watches one or more parent stores for changes. For each change it runs a function to derive a new state from the parent state(s). Subscribers will only be notified if the derived state has changed (checks deep equality). Note that cloning of `DerivedStore`s will try to revert to `SafeStore`'s handling of the `clone` except for when the parent store is an extention of `SafeStore` to possibly override `SafeStore`'s clone for its own purposes. On construction an optional `debounce` timer can be applied to the `DerivedStore` `set` operations with a numerical number of milliseconds or a boolean true evaluating to the next timeout cycle. A set of [`derivedStore`](https://github.com/txstate-etc/svelte-store/blob/main/src/derivedstore.ts#:~:text=%7D-,export%20function%20derivedStore,-%3CParentType%2C) factory functions are also exported.

```mermaid
classDiagram
  class Writeable~T~ {<<svelte store>>}
  link Writeable "https://svelte.dev/docs#run-time-svelte-store" "Svelte Writeable Store"

  ActiveStore~T~ --|> Writeable~T~ : implements
  class ActiveStore  {
    constructor(value: T)
    protected value!: T
    protected subscribers: Map< string, run: function >
    protected sourcesInitialized: 0
    clone(value: T) => value
    equal(a: T, b: T) => false
    set(value: T)
    update(updater: (value: T) => T)
    subscribe(run: (s: T) => any)
    clearSubscribers()
    protected registerSource(subscribe: () => () => void) => unsubscribe: () => void
    protected unregisterSources()
  }
  link ActiveStore "https://github.com/txstate-etc/svelte-store/blob/main/src/activestore.ts#:~:text=export%20class%20ActiveStore" "To Source"

  direction BT

  Store~T~ --|> ActiveStore~T~ : extends
  class Store  {
    overrides equal(a: T, b: T) => deepEqual(a,b)
  }
  link Store "https://github.com/txstate-etc/svelte-store/blob/main/src/store.ts#:~:text=export%20class%20Store" "To Source"

  ConvertedStore~T~ --|> Store~T~ : extends
  class ConvertedStore  {
    overrides constructor (value: UsableSubject~T~)
    overrides set (value: T)
  }
  link ConvertedStore "https://github.com/txstate-etc/svelte-store/blob/main/src/convertedstore.ts#:~:text=export%20class%20ConvertedStore" "To Source"
  
  SafeStore~T~ --|> Store~T~ : extends
  class SafeStore  {
    overrides clone(value: T) => clone(value)
  }
  link SafeStore "https://github.com/txstate-etc/svelte-store/blob/main/src/safestore.ts#:~:text=export%20class%20SafeStore" "To Source"

  SubStore~SubType, ParentType=any~ --|> Store~SubType~ : extends
  class SubStore  {
    protected parentStore: WritableSubject~ParentType~
    protected setter: (value: SubType, state: ParentType) => ParentType
    overrides set(value: T)
    overrides constructor(\nstore: WirteableSubject~ParentType~,\ngetter: keyof ParentType|string|(value: ParentType) => SubType,\nsetter?: (value: SubType, state: ParentType) => ParentType\n)
  }
  link SubStore "https://github.com/txstate-etc/svelte-store/blob/main/src/substore.ts#:~:text=export%20class%20SubStore" "To Source"

  DerivedStore~DerivedType, ParentType=any~ --|> SafeStore~DerivedType~ : extends
  class DerivedStore  {
    protected sourcesInitialized = 0
    overrides constructor(\nstore: UsableSubject~ParentType~ | UsableSubject~any~[],\ngetter: string |((value: any) => DerivedType) | ((values: any[]) => DerivedType),\noptions?: DerivedStoreOptions\n)
  }
  link DerivedStore "https://github.com/txstate-etc/svelte-store/blob/main/src/derivedstore.ts#:~:text=export%20class%20DerivedStore" "To Source"
```


