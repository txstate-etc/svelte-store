import { clone } from 'txstate-utils'
import { Store } from './store.js'

export class SafeStore<T> extends Store<T> {
  clone (value: T) {
    return clone(value)
  }
}
