import {createElement, Component, render} from './toy-react'
class MyComponent extends Component{
  constructor() {
    super()
    this.state = {
      count: 0
    }
  }
  render() {
    return <div>
      <h2>my component</h2>
      <div>count: {this.state.count}</div>
      <div>
        <button onClick={() => {this.setState({count: this.state.count + 1})}}>add</button>
      </div>
    </div>
  } 
}

render(<MyComponent id="app" class="xxx"></MyComponent>, document.body)
