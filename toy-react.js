
//元素结点包装盒子
class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type)
  }

  setAttribute(name, value) {
    this.root.setAttribute(name, value)
  }

  appendChild(component) {
    this.root.appendChild(component.root)
  }

}

//文本结点包装盒子
class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content)
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

  _renderToDOM(range) {

  }

  get root() {
    if(!this._root) {
      this._root = this.render().root
    }
    return this._root
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
  parentElement.appendChild(component.root)
} 