import {createElement, Component, render} from './toy-react'
class MyComponent extends Component{
  constructor() {
    super()
    this.state = {
      message: 'Hello world',
      name: 'miku'
    }
  }
  render() {
    return <div>
      <h2>my component</h2>
      <div>{this.state.message}</div>
      <div>{this.state.name}</div>
      {this.children}
    </div>
  } 
}

render(<MyComponent id="app" class="xxx">
  <div>sss</div>
  <div>ss</div>
</MyComponent>, document.body)
