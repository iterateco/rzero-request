# rzero-request
Async request management for redux-zero

## Example
```javascript
// actions.js

import { request } from 'rzero-request'

export const todoActions = store => ({
  loadTodos: state => {
    return request(store, 'todos')(
      () => todosApi.query(),
      (state, todos) => {
        return { todos }
      }
    )
  }
})

// store.js

import createStore from 'redux-zero'

const initialState = {
  requests: {},
  todos: []
}

export default createStore(initialState)

// TodoList.jsx

import React, { Component } from 'react'
import { connect } from 'redux-zero/react'
import { selectRequest } from 'rzero-request'

@connect(state => {
  return {
    todosRequest: selectRequest(state, 'todos'),
    todos: state.todos
  }
}, todoActions)
export class TodoList extends Component {
  componentWillMount() {
    this.props.loadTodos()
  }

  render() {
    const { todosRequest, todos } = this.props

    if (todosRequest.pending) {
      return "Loading..."
    }

    if (todosRequest.rejected) {
      return todosRequest.error.message
    }

    if (todosRequest.resolved) {
      return (
        <div>
          <div>
          </div>
          <ul>
            {todos.map(todo => (
              <li>{todo.name}</li>
            ))}
          </ul>
        </div>
      )
    }
  }
}
```
