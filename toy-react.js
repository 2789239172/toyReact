//使用Symbol来设置私有属性使其不易被访问到
const RENDER_TO_DOM = Symbol('render to dom')


// 自定义组件的祖类
export class Component {
  constructor() {
    this.props = Object.create(null) //不会有__proto__
    this.children = []
    this._root = null
    this._range = null
  }

  setAttribute(name, value) {
    this.props[name] = value
  }

  appendChild(component) {
    this.children.push(component)
  }

  [RENDER_TO_DOM](range) {
    this._range = range

    // this.render() => createElement() => ElementWrapper....
    this.render()[RENDER_TO_DOM](range)
  }

  rerender() {
    /*
      全空的range如果有相邻的range会被相邻的吞并
      下次插入时会被后边的range包含进去
      此时需要保证range时不空的
    * */

    let oldRange = this._range

    let range = new Range()
    range.setStart(oldRange.startContainer, oldRange.startOffset)
    range.setEnd(oldRange.startContainer, oldRange.startOffset)
    this[RENDER_TO_DOM](range)

    oldRange.setStart(range.endContainer, range.endOffset)
    oldRange.deleteContents()
  }

  setState(newState) {
    if (typeof this.state !== 'object' || this.state === null) {
      this.state = newState
      this.rerender()
      return
    }

    //合并
    let merge = (oldState, newState) => {
      for (let key in newState) {
        if (oldState[key] === null || typeof oldState[key] !== 'object') {
          oldState[key] = newState[key]
        } else {
          merge(oldState[key], newState[key])
        }
      }
    }
    merge(this.state, newState)
    this.rerender()
  }

  get vdom() {
    return this.render().vdom
  }

  get vchildren() {
    return this.children.map(child => child.vdom)
  }

}

//元素结点包装盒子
class ElementWrapper extends Component {
  constructor(type) {
    super(type)
    this.type = type
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents()

    let root = document.createElement(this.type)

    // 设置props
    for (let name in this.props) {
      let value = this.props[name]
      let ref = /^on([\s\S]+)$/
      if (ref.test(name)) {
        root.addEventListener(RegExp.$1.toLowerCase(), value)
      } else {
        if (name === 'className') {
          root.setAttribute('class', value)
        } else {
          root.setAttribute(name, value)
        }
      }
    }

    //插入child
    for (const child of this.children) {
      let childRange = new Range()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }

    range.insertNode(root)
  }

  get vdom() {
    return this
  }
}

//文本结点包装盒子
class TextWrapper extends Component {
  constructor(content) {
    super(content)
    this.type = '#text',
      this.content = content
    this.root = document.createTextNode(content)
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
  get vdom() {
    return this
  }
}


//实现React.createElement解析函数
export function createElement(type, attributes, ...children) {
  let e

  if (typeof type === 'string') {
    e = new ElementWrapper(type)
  } else {
    e = new type
  }

  if (attributes) {
    for (let key in attributes) {
      e.setAttribute(key, attributes[key])
    }
  }

  let insertChildren = children => {
    for (const item of children) {
      if (item === null) {
        continue
      }
      if (typeof item === 'string' || typeof item === 'number') {
        item = new TextWrapper(item)
      }

      if (typeof item === 'object' && item instanceof Array) {
        insertChildren(item)
      } else {
        e.appendChild(item)
      }
    }
  }

  if (children) {
    insertChildren(children)
  }

  return e
}

// 挂载到页面
export function render(component, parentElement) {
  let range = new Range()
  range.setStart(parentElement, 0)
  range.setEnd(parentElement, parentElement.childNodes.length)
  component[RENDER_TO_DOM](range)
}

/**
 * createElement => MyComponent (ElementWrapper (TextWrapper) )
 * render => MyComponent insertTo Body
*/