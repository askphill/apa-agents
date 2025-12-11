# JavaScript Patterns

## Core Principles
- Vanilla JS with Web Components (Custom Elements)
- No jQuery
- ES Modules with `@theme/` imports

---

## Component Base Class
All custom elements extend `Component`.
Reference: `apa-base/assets/component.js:39-170`

### Key Features
- `refs` system for DOM references via `ref` attribute
- `requiredRefs` for validation
- Automatic MutationObserver for ref updates
- `connectedCallback`, `disconnectedCallback`, `updatedCallback`

---

## Defining a Custom Element
Reference: `apa-base/assets/product-card.js:19-455`

```js
export class ProductCard extends Component {
  requiredRefs = ['productCardLink'];

  connectedCallback() {
    super.connectedCallback();
    // setup
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // cleanup
  }
}

if (!customElements.get('product-card')) {
  customElements.define('product-card', ProductCard);
}
```

---

## Refs System
HTML: `ref="elementName"` or `ref="elements[]"` for arrays

Access: `this.refs.elementName`

Reference: `apa-base/assets/component.js:109-144`

---

## Declarative Event Handling
Use `on:{event}` attributes in HTML.

Syntax: `on:click="selector/methodName"` or `on:click="/methodName"`

Reference: `apa-base/assets/component.js:212-303`

Supported events: click, change, select, focus, blur, submit, input, keydown, keyup, toggle, pointerenter, pointerleave

---

## Theme Events
Custom events for cross-component communication.
Reference: `apa-base/assets/product-card.js:76-78`

Pattern:
```js
this.addEventListener(ThemeEvents.variantUpdate, this.#handleVariantUpdate);
```

---

## Imports
Use `@theme/` alias for theme assets.
Reference: `apa-base/assets/product-card.js:1-6`

---

## JSDoc Types
Use JSDoc for type annotations.
Reference: `apa-base/assets/product-card.js:8-18`

---

## Private Methods
Use `#` prefix for private class methods.
Reference: `apa-base/assets/product-card.js:46-49`

---

## Utilities
Import from `@theme/utilities`.
Reference: `apa-base/assets/product-card.js:4`
- `debounce`
- `isDesktopBreakpoint`
- `mediaQueryLarge`
- `requestYieldCallback`
- `requestIdleCallback`
