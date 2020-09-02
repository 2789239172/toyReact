//使用Symbol来设置私有属性使其不易被访问到
const RENDER_TO_DOM = Symbol('render to dom')
function replaceContent(range, node) {
  range.insertNode(node)
  range.setStartAfter(node) //将范围的起点设置在 node 之后
  range.deleteContents()

  range.setStartBefore(node) //将范围的起点设置在 node 之前
  range.setEndAfter(node) //将范围的终点设置在 node 之前
}

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
    this._vdom = this.vdom
    this._vdom[RENDER_TO_DOM](range)
  }

  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false
      }
      for (const name in newNode.props) {
        if (newNode.props[name] !== oldNode.props[name]) {
          return false
        }
      }
      if (Object.keys(oldNode.props).length !== Object.keys(newNode.props).length) {
        return false
      }

      if (newNode.type === '#text') {
        if (newNode.content !== oldNode.content) {
          return false
        }
      }
      return true
    }
    let update = (oldNode, newNode) => {
      //type, props, children 
      //#text content 
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range)
        return
      }
      newNode._range = oldNode._range
      let newChildren = newNode.vchildren
      let oldChildren = oldNode.vchildren

      if (!newChildren || !newChildren.length) {
        return
      }

      let tailRange = oldChildren[oldChildren.length - 1]._range

      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i]
        let oldChild = oldChildren[i]
        if (i < oldChildren.length) {
          update(oldChild, newChild)
        } else {
          let range = document.createRange()
          range.setStart(tailRange.endContainer, tailRange.endOffset)
          range.setEnd(tailRange.endContainer, tailRange.endOffset)
          newChild[RENDER_TO_DOM](range)
          tailRange = range
        }
      }
    }
    let vdom = this.vdom
    update(this._vdom, vdom)
    this._vdom = vdom
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
    this.update()
  }

  get vdom() {
    return this.render().vdom
  }

}

//元素结点包装盒子
class ElementWrapper extends Component {
  constructor(type) {
    super(type)
    this.type = type
    this._range = null
  }

  [RENDER_TO_DOM](range) {
    this._range = range
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
    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom)
    }

    //插入child
    for (const child of this.vchildren) {
      let childRange = new Range()
      childRange.setStart(root, root.childNodes.length)
      childRange.setEnd(root, root.childNodes.length)
      child[RENDER_TO_DOM](childRange)
    }
    replaceContent(range, root)
  }

  get vdom() {
    this.vchildren = this.children.map(child => child.vdom)
    return this
  }
}

//文本结点包装盒子
class TextWrapper extends Component {
  constructor(content) {
    super(content)
    this.type = '#text',
      this.content = content
  }

  [RENDER_TO_DOM](range) {
    this._range = range
    let root = document.createTextNode(this.content)

    replaceContent(range, root)
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