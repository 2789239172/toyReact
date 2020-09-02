//使用Symbol来设置私有属性使其不易被访问到
const RENDER_TO_DOM = Symbol('render to dom')


//元素结点包装盒子
class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }

  setAttribute(name, value) {
    this.root.setAttribute(name, value)
  }

  appendChild(component) {
    let range = new Range()
    range.setStart(this.root, this.root.childNodes.length)
    range.setEnd(this.root, this.root.childNodes.length)
    component[RENDER_TO_DOM](range)
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

//文本结点包装盒子
class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
  }

  [RENDER_TO_DOM](range) {
    range.deleteContents()
    range.insertNode(this.root)
  }
}

// 自定义组件的祖类
export class Component {
  constructor() {
    this.props = Object.create(null) //不会有__proto__
    this.children = []
    this._root = null
  }

  setAttribute(name, value) {
    this.props[name] = value
  }

  appendChild(component) {
    this.children.push(component)
  }

  [RENDER_TO_DOM](range) {
    // this.render() => ElementWrapper
    this.render()[RENDER_TO_DOM](range)
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
      if (typeof item === 'string') {
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