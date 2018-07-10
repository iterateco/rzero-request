export function request(store, ...args) {
  let options

  // Resolve options argument.
  if (args.length > 1 && String(args[args.length - 1]) === '[object Object]') {
    options = args.pop()
  }

  const key = args.join('/')
  const { ttl = 0 } = options || {}

  return async (requestFunc, handler) => {
    const state = store.getState()
    const request = state.requests[key] || {}

    // Proceed if enough time has elapsed since the last resolved request.
    if (ttl && request.resolved && Date.now() - request.ts <= ttl) return

    // Create pending request and update store.
    const pendingRequest = { pending: true }
    store.setState(setRequest(state, key, pendingRequest))

    // Execute request.
    try {
      let update = await requestFunc()
      let state = store.getState()

      // Exit if the request was modified.
      if (pendingRequest !== state.requests[key]) return

      if (handler) {
        try {
          update = await handler(state, update)
          state = store.getState()
        } catch (error) {
          console.error(error)
          throw error
        }
      }

      // Only return state update if the request was modified.
      if (pendingRequest !== state.requests[key]) {
        return update
      }

      return {
        ...update,
        ...setRequest(state, key, { resolved: true, ts: Date.now() })
      }
    } catch (error) {
      const state = store.getState()

      // Ensure the request was not modified.
      if (pendingRequest === state.requests[key]) {
        return setRequest(state, key, { rejected: true, error })
      }
    }
  }
}

var requestKeyCounter = 0

export function bindRequestKey(action, key = `#${++requestKeyCounter}`) {
  const wrapper = (state, ...args) => action(state, key, ...args)

  if (action.name) {
    Object.defineProperty(wrapper, 'name', { value: `${action.name} ${key}` })
  }

  wrapper.bound = action
  wrapper.key = key

  return wrapper
}

export function abortRequest(state, ...keys) {
  const key = resolveKey(keys)
  const request = state.requests[key] || {}

  if (request.pending) {
    return deleteRequest(state, key)
  }
}

export function deleteRequest(state, ...keys) {
  const requests = { ...state.requests }
  delete requests[resolveKey(keys)]
  return { requests }
}

export function selectRequest(state, ...keys) {
  return state.requests[resolveKey(keys)]
}

export function assertResolved(state, ...keys) {
  const request = selectRequest(state, ...keys)

  if (!request) {
    throw new Error("Request not found")
  }

  if (request.rejected) {
    throw request.error || new Error("Request rejected")
  }
}

function resolveKey(keys) {
  return keys.join('/')
}

function setRequest(state, key, request) {
  return {
    requests: { ...state.requests, [key]: request }
  }
}
