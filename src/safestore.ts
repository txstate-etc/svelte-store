import { Store } from './store.js'
import { clone } from './clone.js'

export class SafeStore<T> extends Store<T> {
  clone (value: T) {
    return clone(value)
  }
}
